"""
Delinea to Vault Migration Tool
Author: Dominic M. Hoang
Version: 1.0

Migrates secrets from Delinea Secret Server to HashiCorp Vault
with dry-run support, field mapping, and detailed reporting.
"""

import os
import sys
import json
import logging
from typing import Dict, List, Optional, Any
from datetime import datetime
from dataclasses import dataclass, field, asdict

import click
from rich.console import Console
from rich.table import Table
from rich.panel import Panel
from rich.progress import Progress, SpinnerColumn, TextColumn, BarColumn, TaskProgressColumn

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)
console = Console()


# ============================================================================
# Data Classes
# ============================================================================

@dataclass
class MigrationResult:
    """Result of a single secret migration"""
    source_id: int
    source_name: str
    target_path: str
    success: bool
    error: Optional[str] = None
    source_fields: List[str] = field(default_factory=list)
    mapped_fields: Dict[str, str] = field(default_factory=dict)
    timestamp: datetime = field(default_factory=datetime.now)


@dataclass
class MigrationReport:
    """Summary report for migration batch"""
    total_secrets: int = 0
    successful: int = 0
    failed: int = 0
    results: List[MigrationResult] = field(default_factory=list)
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    dry_run: bool = False

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for JSON export"""
        return {
            "summary": {
                "total_secrets": self.total_secrets,
                "successful": self.successful,
                "failed": self.failed,
                "success_rate": f"{(self.successful / self.total_secrets * 100):.1f}%" if self.total_secrets > 0 else "N/A",
                "dry_run": self.dry_run
            },
            "timing": {
                "start_time": self.start_time.isoformat() if self.start_time else None,
                "end_time": self.end_time.isoformat() if self.end_time else None,
                "duration_seconds": (self.end_time - self.start_time).total_seconds() if self.start_time and self.end_time else None
            },
            "results": [
                {
                    "source_id": r.source_id,
                    "source_name": r.source_name,
                    "target_path": r.target_path,
                    "success": r.success,
                    "error": r.error,
                    "mapped_fields": r.mapped_fields,
                    "timestamp": r.timestamp.isoformat()
                }
                for r in self.results
            ]
        }


# ============================================================================
# Default Field Mappings (Delinea -> Vault)
# ============================================================================

DEFAULT_FIELD_MAPPINGS = {
    # Standard Delinea fields to Vault keys
    "Password": "password",
    "Username": "username",
    "Machine": "host",
    "Server": "server",
    "Database": "database",
    "URL": "url",
    "Endpoint URL": "endpoint",
    "API Key": "api_key",
    "API Secret": "api_secret",
    "Client ID": "client_id",
    "Client Secret": "client_secret",
    "Private Key": "private_key",
    "Notes": "notes",
    "Domain": "domain",
    "Port": "port"
}

# Path recommendations based on Delinea template names
PATH_RECOMMENDATIONS = {
    "Windows Account": "secret/windows",
    "Unix Account (SSH)": "secret/linux",
    "Database (SQL Server)": "secret/database",
    "Web Password": "secret/web",
    "API Key": "secret/api"
}


# ============================================================================
# Migration Class
# ============================================================================

class DelineaToVaultMigrator:
    """
    Migrates secrets from Delinea Secret Server to HashiCorp Vault

    Features:
    - Dry-run mode for safe testing
    - Configurable field mapping
    - Automatic path recommendation
    - Progress tracking
    - Detailed JSON reports
    """

    def __init__(
        self,
        vault_client=None,
        delinea_client=None,
        field_mappings: Optional[Dict[str, str]] = None,
        mock_mode: bool = True
    ):
        """
        Initialize migrator

        Args:
            vault_client: Vault client instance
            delinea_client: Delinea client instance
            field_mappings: Custom field mappings
            mock_mode: Use mock mode for Delinea
        """
        self.mock_mode = mock_mode
        self.field_mappings = {**DEFAULT_FIELD_MAPPINGS, **(field_mappings or {})}

        self._vault_client = vault_client
        self._delinea_client = delinea_client

    @property
    def vault(self):
        """Get or create Vault client"""
        if self._vault_client is None:
            from vault_client import VaultPAMClient
            self._vault_client = VaultPAMClient()
        return self._vault_client

    @property
    def delinea(self):
        """Get or create Delinea client"""
        if self._delinea_client is None:
            from delinea_client import DelineaSecretServerClient
            self._delinea_client = DelineaSecretServerClient(mock_mode=self.mock_mode)
        return self._delinea_client

    def recommend_path(self, template_name: str, secret_name: str) -> str:
        """
        Recommend Vault path based on Delinea template and name

        Args:
            template_name: Delinea template name
            secret_name: Secret name

        Returns:
            Recommended Vault path
        """
        base_path = PATH_RECOMMENDATIONS.get(template_name, "secret/imported")
        safe_name = secret_name.lower().replace(" ", "-").replace("\\", "-")
        return f"{base_path}/{safe_name}"

    def map_fields(self, delinea_fields: Dict[str, str]) -> Dict[str, str]:
        """
        Map Delinea fields to Vault format

        Args:
            delinea_fields: Source Delinea fields

        Returns:
            Mapped fields for Vault
        """
        mapped = {}

        for delinea_key, value in delinea_fields.items():
            if delinea_key in self.field_mappings:
                vault_key = self.field_mappings[delinea_key]
            else:
                # Convert to snake_case for Vault
                vault_key = delinea_key.lower().replace(" ", "_").replace("-", "_")

            mapped[vault_key] = value

        return mapped

    def migrate_secret(
        self,
        secret_id: int,
        vault_path: Optional[str] = None,
        dry_run: bool = True
    ) -> MigrationResult:
        """
        Migrate a single secret from Delinea to Vault

        Args:
            secret_id: Delinea secret ID
            vault_path: Target Vault path (auto-generated if None)
            dry_run: If True, don't create in Vault

        Returns:
            MigrationResult with details
        """
        try:
            # Get secret from Delinea
            secret = self.delinea.get_secret(secret_id)

            # Extract field values
            delinea_fields = {f.field_name: f.value for f in secret.fields}

            # Determine target path
            target_path = vault_path or self.recommend_path(
                secret.template_name,
                secret.name
            )

            # Map fields
            mapped_fields = self.map_fields(delinea_fields)

            # Create in Vault (unless dry run)
            if not dry_run:
                self.vault.create_secret(target_path, mapped_fields)

            return MigrationResult(
                source_id=secret_id,
                source_name=secret.name,
                target_path=target_path,
                success=True,
                source_fields=list(delinea_fields.keys()),
                mapped_fields=mapped_fields
            )

        except Exception as e:
            logger.error(f"Migration failed for secret {secret_id}: {e}")
            return MigrationResult(
                source_id=secret_id,
                source_name=f"Secret {secret_id}",
                target_path=vault_path or "unknown",
                success=False,
                error=str(e)
            )

    def migrate_folder(
        self,
        folder_id: int,
        vault_base_path: str = "secret/imported",
        dry_run: bool = True,
        progress_callback=None
    ) -> MigrationReport:
        """
        Migrate all secrets from a Delinea folder

        Args:
            folder_id: Delinea folder ID
            vault_base_path: Base path in Vault
            dry_run: If True, don't create secrets
            progress_callback: Optional callback for progress

        Returns:
            MigrationReport with all results
        """
        # Get all secrets in folder
        secrets = self.delinea.search_secrets(folder_id=folder_id)

        report = MigrationReport(
            total_secrets=len(secrets),
            dry_run=dry_run,
            start_time=datetime.now()
        )

        for i, secret in enumerate(secrets):
            vault_path = f"{vault_base_path}/{secret.name.lower().replace(' ', '-')}"

            result = self.migrate_secret(
                secret_id=secret.id,
                vault_path=vault_path,
                dry_run=dry_run
            )

            report.results.append(result)

            if result.success:
                report.successful += 1
            else:
                report.failed += 1

            if progress_callback:
                progress_callback(i + 1, len(secrets), result)

        report.end_time = datetime.now()
        return report

    def migrate_batch(
        self,
        secret_ids: List[int],
        vault_base_path: str = "secret/imported",
        dry_run: bool = True,
        progress_callback=None
    ) -> MigrationReport:
        """
        Migrate multiple secrets by ID

        Args:
            secret_ids: List of Delinea secret IDs
            vault_base_path: Base path in Vault
            dry_run: If True, don't create secrets
            progress_callback: Optional callback

        Returns:
            MigrationReport
        """
        report = MigrationReport(
            total_secrets=len(secret_ids),
            dry_run=dry_run,
            start_time=datetime.now()
        )

        for i, secret_id in enumerate(secret_ids):
            result = self.migrate_secret(
                secret_id=secret_id,
                dry_run=dry_run
            )

            report.results.append(result)

            if result.success:
                report.successful += 1
            else:
                report.failed += 1

            if progress_callback:
                progress_callback(i + 1, len(secret_ids), result)

        report.end_time = datetime.now()
        return report

    def generate_report(
        self,
        report: MigrationReport,
        output_path: str
    ) -> None:
        """Save migration report to JSON file"""
        with open(output_path, "w") as f:
            json.dump(report.to_dict(), f, indent=2)
        logger.info(f"Report saved to {output_path}")


# ============================================================================
# CLI Interface
# ============================================================================

@click.group()
@click.option("--mock/--no-mock", default=True, help="Use mock mode for Delinea")
@click.pass_context
def cli(ctx, mock):
    """Delinea to Vault Migration Tool"""
    ctx.ensure_object(dict)
    ctx.obj["mock_mode"] = mock


@cli.command()
@click.argument("secret_id", type=int)
@click.option("--path", "-p", help="Target Vault path (auto-generated if omitted)")
@click.option("--dry-run/--execute", default=True, help="Dry run mode")
@click.option("--output", "-o", help="Output report file (JSON)")
@click.pass_context
def migrate(ctx, secret_id, path, dry_run, output):
    """Migrate a single secret from Delinea to Vault"""
    migrator = DelineaToVaultMigrator(mock_mode=ctx.obj["mock_mode"])

    mode_text = "[yellow]DRY RUN[/yellow]" if dry_run else "[red]EXECUTE[/red]"
    console.print(Panel.fit(
        f"[bold]Delinea to Vault Migration[/bold]\n\n"
        f"Source Secret ID: {secret_id}\n"
        f"Target Path: {path or 'Auto-generated'}\n"
        f"Mode: {mode_text}",
        border_style="cyan"
    ))

    with Progress(
        SpinnerColumn(),
        TextColumn("[progress.description]{task.description}"),
        console=console
    ) as progress:
        progress.add_task("Migrating...", total=None)

        result = migrator.migrate_secret(
            secret_id=secret_id,
            vault_path=path,
            dry_run=dry_run
        )

    if result.success:
        console.print(f"\n[green]Migration successful![/green]")

        table = Table(title="Migration Details", show_header=True)
        table.add_column("Property", style="cyan")
        table.add_column("Value", style="green")

        table.add_row("Source ID", str(result.source_id))
        table.add_row("Source Name", result.source_name)
        table.add_row("Target Path", result.target_path)
        table.add_row("Fields Migrated", str(len(result.mapped_fields)))

        console.print(table)

        if result.mapped_fields:
            console.print("\n[bold]Field Mapping:[/bold]")
            for vault_key, value in result.mapped_fields.items():
                masked = "********" if any(p in vault_key for p in ["password", "secret", "key", "private"]) else value[:50]
                console.print(f"  {vault_key}: {masked}")

    else:
        console.print(f"\n[red]Migration failed: {result.error}[/red]")

    if output:
        report = MigrationReport(
            total_secrets=1,
            successful=1 if result.success else 0,
            failed=0 if result.success else 1,
            results=[result],
            dry_run=dry_run,
            start_time=datetime.now(),
            end_time=datetime.now()
        )
        migrator.generate_report(report, output)
        console.print(f"\n[dim]Report saved to {output}[/dim]")


@cli.command("folder")
@click.argument("folder_id", type=int)
@click.option("--base-path", "-b", default="secret/imported", help="Base Vault path")
@click.option("--dry-run/--execute", default=True, help="Dry run mode")
@click.option("--output", "-o", help="Output report file (JSON)")
@click.pass_context
def migrate_folder(ctx, folder_id, base_path, dry_run, output):
    """Migrate all secrets from a Delinea folder"""
    migrator = DelineaToVaultMigrator(mock_mode=ctx.obj["mock_mode"])

    mode_text = "[yellow]DRY RUN[/yellow]" if dry_run else "[red]EXECUTE[/red]"
    console.print(Panel.fit(
        f"[bold]Folder Migration: Delinea to Vault[/bold]\n\n"
        f"Source Folder ID: {folder_id}\n"
        f"Target Base Path: {base_path}\n"
        f"Mode: {mode_text}",
        border_style="cyan"
    ))

    with Progress(
        SpinnerColumn(),
        TextColumn("[progress.description]{task.description}"),
        BarColumn(),
        TaskProgressColumn(),
        console=console
    ) as progress:
        task = progress.add_task("Migrating secrets...", total=100)

        def update_progress(current, total, result):
            pct = (current / total) * 100
            status = "[green]OK[/green]" if result.success else "[red]FAIL[/red]"
            progress.update(task, completed=pct, description=f"{result.source_name} {status}")

        report = migrator.migrate_folder(
            folder_id=folder_id,
            vault_base_path=base_path,
            dry_run=dry_run,
            progress_callback=update_progress
        )

    console.print(f"\n[bold]Migration Summary[/bold]")
    console.print(f"  Total: {report.total_secrets}")
    console.print(f"  [green]Successful: {report.successful}[/green]")
    console.print(f"  [red]Failed: {report.failed}[/red]")

    if report.failed > 0:
        console.print("\n[red]Failed migrations:[/red]")
        for r in report.results:
            if not r.success:
                console.print(f"  - {r.source_name}: {r.error}")

    if output:
        migrator.generate_report(report, output)
        console.print(f"\n[dim]Report saved to {output}[/dim]")


@cli.command("batch")
@click.argument("secret_ids", nargs=-1, type=int)
@click.option("--base-path", "-b", default="secret/imported", help="Base Vault path")
@click.option("--dry-run/--execute", default=True, help="Dry run mode")
@click.option("--output", "-o", help="Output report file (JSON)")
@click.pass_context
def batch_migrate(ctx, secret_ids, base_path, dry_run, output):
    """Migrate multiple secrets by ID"""
    if not secret_ids:
        console.print("[red]No secret IDs provided[/red]")
        return

    migrator = DelineaToVaultMigrator(mock_mode=ctx.obj["mock_mode"])

    mode_text = "[yellow]DRY RUN[/yellow]" if dry_run else "[red]EXECUTE[/red]"
    console.print(Panel.fit(
        f"[bold]Batch Migration: Delinea to Vault[/bold]\n\n"
        f"Secrets: {len(secret_ids)}\n"
        f"Target Base Path: {base_path}\n"
        f"Mode: {mode_text}",
        border_style="cyan"
    ))

    with Progress(
        SpinnerColumn(),
        TextColumn("[progress.description]{task.description}"),
        BarColumn(),
        TaskProgressColumn(),
        console=console
    ) as progress:
        task = progress.add_task("Migrating...", total=len(secret_ids))

        def update_progress(current, total, result):
            status = "[green]OK[/green]" if result.success else "[red]FAIL[/red]"
            progress.update(task, advance=1, description=f"{result.source_name} {status}")

        report = migrator.migrate_batch(
            secret_ids=list(secret_ids),
            vault_base_path=base_path,
            dry_run=dry_run,
            progress_callback=update_progress
        )

    console.print(f"\n[bold]Migration Summary[/bold]")
    console.print(f"  Total: {report.total_secrets}")
    console.print(f"  [green]Successful: {report.successful}[/green]")
    console.print(f"  [red]Failed: {report.failed}[/red]")

    if output:
        migrator.generate_report(report, output)
        console.print(f"\n[dim]Report saved to {output}[/dim]")


@cli.command()
@click.pass_context
def demo(ctx):
    """Run migration demo with mock data"""
    console.print(Panel.fit(
        "[bold cyan]Delinea to Vault Migration Demo[/bold cyan]\n\n"
        "Demonstrates migration capabilities using mock Delinea data.",
        border_style="cyan"
    ))

    migrator = DelineaToVaultMigrator(mock_mode=True)

    console.print("\n[bold]1. Path Recommendation[/bold]")
    templates = [
        ("Windows Account", "dc01-admin"),
        ("Unix Account (SSH)", "web-server-root"),
        ("Database (SQL Server)", "prod-db-sa"),
        ("API Key", "stripe-api")
    ]
    for template, name in templates:
        path = migrator.recommend_path(template, name)
        console.print(f"   {template} '{name}' -> {path}")

    console.print("\n[bold]2. Field Mapping[/bold]")
    delinea_fields = {
        "Username": "admin",
        "Password": "secret123",
        "Machine": "server.example.com",
        "Notes": "Production server"
    }
    mapped = migrator.map_fields(delinea_fields)
    console.print(f"   Delinea: {list(delinea_fields.keys())}")
    console.print(f"   Vault:   {list(mapped.keys())}")

    console.print("\n[bold]3. Dry Run Migration[/bold]")
    result = migrator.migrate_secret(secret_id=1, dry_run=True)
    if result.success:
        console.print(f"   Source: {result.source_name} (ID: {result.source_id})")
        console.print(f"   Target: {result.target_path}")
        console.print(f"   Fields: {len(result.mapped_fields)}")

    console.print("\n[green]Demo complete![/green]")


if __name__ == "__main__":
    cli()
