"""
Vault to Delinea Migration Tool
Author: Dominic M. Hoang
Version: 1.0

Migrates secrets from HashiCorp Vault to Delinea Secret Server
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
    source_path: str
    target_name: str
    success: bool
    error: Optional[str] = None
    source_fields: List[str] = field(default_factory=list)
    mapped_fields: Dict[str, str] = field(default_factory=dict)
    skipped_fields: List[str] = field(default_factory=list)
    delinea_secret_id: Optional[int] = None
    timestamp: datetime = field(default_factory=datetime.now)


@dataclass
class MigrationReport:
    """Summary report for migration batch"""
    total_secrets: int = 0
    successful: int = 0
    failed: int = 0
    skipped: int = 0
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
                "skipped": self.skipped,
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
                    "source_path": r.source_path,
                    "target_name": r.target_name,
                    "success": r.success,
                    "error": r.error,
                    "delinea_secret_id": r.delinea_secret_id,
                    "mapped_fields": r.mapped_fields,
                    "skipped_fields": r.skipped_fields,
                    "timestamp": r.timestamp.isoformat()
                }
                for r in self.results
            ]
        }


# ============================================================================
# Default Field Mappings
# ============================================================================

DEFAULT_FIELD_MAPPINGS = {
    # Common password fields
    "password": "Password",
    "passwd": "Password",
    "secret": "Password",
    "pass": "Password",

    # Username fields
    "username": "Username",
    "user": "Username",
    "login": "Username",
    "account": "Username",

    # Server/machine fields
    "host": "Machine",
    "server": "Server",
    "hostname": "Machine",
    "machine": "Machine",
    "ip": "Machine",
    "address": "Machine",

    # Database fields
    "database": "Database",
    "db": "Database",
    "dbname": "Database",

    # URL fields
    "url": "URL",
    "endpoint": "Endpoint URL",
    "uri": "URL",

    # API fields
    "api_key": "API Key",
    "apikey": "API Key",
    "api-key": "API Key",
    "api_secret": "API Secret",
    "client_id": "Client ID",
    "client_secret": "Client Secret",

    # Notes
    "notes": "Notes",
    "description": "Notes",
    "comment": "Notes"
}

# Template recommendations based on Vault path patterns
TEMPLATE_RECOMMENDATIONS = {
    "database": 3,  # Database (SQL Server)
    "db": 3,
    "mysql": 3,
    "postgres": 3,
    "sql": 3,
    "linux": 2,  # Unix Account (SSH)
    "unix": 2,
    "ssh": 2,
    "windows": 1,  # Windows Account
    "ad": 1,
    "domain": 1,
    "api": 5,  # API Key
    "key": 5,
    "token": 5,
    "web": 4,  # Web Password
    "http": 4
}


# ============================================================================
# Migration Class
# ============================================================================

class VaultToDelineaMigrator:
    """
    Migrates secrets from HashiCorp Vault to Delinea Secret Server

    Features:
    - Dry-run mode for safe testing
    - Configurable field mapping
    - Automatic template recommendation
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
            vault_client: Vault client instance (or None to create)
            delinea_client: Delinea client instance (or None to create)
            field_mappings: Custom field mappings (merged with defaults)
            mock_mode: Use mock mode for Delinea
        """
        self.mock_mode = mock_mode
        self.field_mappings = {**DEFAULT_FIELD_MAPPINGS, **(field_mappings or {})}

        # Initialize clients lazily
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

    def recommend_template(self, vault_path: str, data: Dict[str, Any]) -> int:
        """
        Recommend a Delinea template based on Vault path and data

        Args:
            vault_path: Vault secret path
            data: Secret data fields

        Returns:
            Template ID recommendation
        """
        path_lower = vault_path.lower()

        # Check path for pattern matches
        for pattern, template_id in TEMPLATE_RECOMMENDATIONS.items():
            if pattern in path_lower:
                return template_id

        # Check data fields
        data_keys = [k.lower() for k in data.keys()]
        if "api_key" in data_keys or "api-key" in data_keys:
            return 5  # API Key
        if "connection_string" in data_keys or "database" in data_keys:
            return 3  # Database
        if "private_key" in data_keys or "ssh" in "_".join(data_keys):
            return 2  # Unix/SSH

        # Default to Windows Account (generic)
        return 1

    def map_fields(
        self,
        vault_data: Dict[str, Any],
        template_id: int
    ) -> tuple[Dict[str, str], List[str]]:
        """
        Map Vault fields to Delinea template fields

        Args:
            vault_data: Source Vault secret data
            template_id: Target Delinea template ID

        Returns:
            Tuple of (mapped_fields, skipped_fields)
        """
        mapped = {}
        skipped = []

        for vault_key, value in vault_data.items():
            vault_key_lower = vault_key.lower()

            # Try direct mapping
            if vault_key_lower in self.field_mappings:
                mapped[self.field_mappings[vault_key_lower]] = str(value)
            else:
                # Try partial match
                matched = False
                for pattern, target_field in self.field_mappings.items():
                    if pattern in vault_key_lower:
                        mapped[target_field] = str(value)
                        matched = True
                        break

                if not matched:
                    # Use original key name with Title Case
                    mapped[vault_key.replace("_", " ").title()] = str(value)
                    skipped.append(vault_key)

        return mapped, skipped

    def migrate_secret(
        self,
        vault_path: str,
        delinea_folder_id: int,
        template_id: Optional[int] = None,
        dry_run: bool = True,
        secret_name: Optional[str] = None
    ) -> MigrationResult:
        """
        Migrate a single secret from Vault to Delinea

        Args:
            vault_path: Vault secret path
            delinea_folder_id: Target Delinea folder ID
            template_id: Delinea template ID (auto-detected if None)
            dry_run: If True, don't actually create in Delinea
            secret_name: Override name (default: derive from path)

        Returns:
            MigrationResult with migration details
        """
        try:
            # Get secret from Vault
            vault_secret = self.vault.get_secret(vault_path)
            vault_data = vault_secret.get("data", vault_secret)

            # Determine target name
            target_name = secret_name or vault_path.replace("/", "-").strip("-")

            # Auto-detect template if not specified
            if template_id is None:
                template_id = self.recommend_template(vault_path, vault_data)

            # Map fields
            mapped_fields, skipped_fields = self.map_fields(vault_data, template_id)

            # Create in Delinea (unless dry run)
            delinea_id = None
            if not dry_run:
                created = self.delinea.create_secret(
                    name=target_name,
                    template_id=template_id,
                    folder_id=delinea_folder_id,
                    fields=mapped_fields
                )
                delinea_id = created.id

            return MigrationResult(
                source_path=vault_path,
                target_name=target_name,
                success=True,
                source_fields=list(vault_data.keys()),
                mapped_fields=mapped_fields,
                skipped_fields=skipped_fields,
                delinea_secret_id=delinea_id
            )

        except Exception as e:
            logger.error(f"Migration failed for {vault_path}: {e}")
            return MigrationResult(
                source_path=vault_path,
                target_name=secret_name or vault_path,
                success=False,
                error=str(e)
            )

    def migrate_batch(
        self,
        vault_paths: List[str],
        delinea_folder_id: int,
        template_id: Optional[int] = None,
        dry_run: bool = True,
        progress_callback=None
    ) -> MigrationReport:
        """
        Migrate multiple secrets

        Args:
            vault_paths: List of Vault paths to migrate
            delinea_folder_id: Target Delinea folder ID
            template_id: Template ID (or None for auto-detect)
            dry_run: If True, don't actually create secrets
            progress_callback: Optional callback for progress updates

        Returns:
            MigrationReport with all results
        """
        report = MigrationReport(
            total_secrets=len(vault_paths),
            dry_run=dry_run,
            start_time=datetime.now()
        )

        for i, path in enumerate(vault_paths):
            result = self.migrate_secret(
                vault_path=path,
                delinea_folder_id=delinea_folder_id,
                template_id=template_id,
                dry_run=dry_run
            )

            report.results.append(result)

            if result.success:
                report.successful += 1
            else:
                report.failed += 1

            if progress_callback:
                progress_callback(i + 1, len(vault_paths), result)

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
    """Vault to Delinea Migration Tool"""
    ctx.ensure_object(dict)
    ctx.obj["mock_mode"] = mock


@cli.command()
@click.argument("vault_path")
@click.option("--folder", "-f", type=int, required=True, help="Target Delinea folder ID")
@click.option("--template", "-t", type=int, help="Delinea template ID (auto-detect if omitted)")
@click.option("--name", "-n", help="Target secret name (derived from path if omitted)")
@click.option("--dry-run/--execute", default=True, help="Dry run mode (default: True)")
@click.option("--output", "-o", help="Output report file (JSON)")
@click.pass_context
def migrate(ctx, vault_path, folder, template, name, dry_run, output):
    """Migrate a single secret from Vault to Delinea"""
    migrator = VaultToDelineaMigrator(mock_mode=ctx.obj["mock_mode"])

    mode_text = "[yellow]DRY RUN[/yellow]" if dry_run else "[red]EXECUTE[/red]"
    console.print(Panel.fit(
        f"[bold]Vault to Delinea Migration[/bold]\n\n"
        f"Source: {vault_path}\n"
        f"Target Folder: {folder}\n"
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
            vault_path=vault_path,
            delinea_folder_id=folder,
            template_id=template,
            dry_run=dry_run,
            secret_name=name
        )

    if result.success:
        console.print(f"\n[green]Migration successful![/green]")

        table = Table(title="Migration Details", show_header=True)
        table.add_column("Property", style="cyan")
        table.add_column("Value", style="green")

        table.add_row("Source Path", result.source_path)
        table.add_row("Target Name", result.target_name)
        table.add_row("Source Fields", ", ".join(result.source_fields))
        table.add_row("Mapped Fields", str(len(result.mapped_fields)))

        if result.skipped_fields:
            table.add_row("Skipped Fields", ", ".join(result.skipped_fields))

        if result.delinea_secret_id:
            table.add_row("Delinea Secret ID", str(result.delinea_secret_id))

        console.print(table)

        if result.mapped_fields:
            console.print("\n[bold]Field Mapping:[/bold]")
            for target, value in result.mapped_fields.items():
                masked = "********" if any(p in target.lower() for p in ["password", "secret", "key"]) else value[:50]
                console.print(f"  {target}: {masked}")

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


@cli.command("batch")
@click.argument("vault_paths", nargs=-1)
@click.option("--folder", "-f", type=int, required=True, help="Target Delinea folder ID")
@click.option("--template", "-t", type=int, help="Delinea template ID")
@click.option("--dry-run/--execute", default=True, help="Dry run mode")
@click.option("--output", "-o", help="Output report file (JSON)")
@click.pass_context
def batch_migrate(ctx, vault_paths, folder, template, dry_run, output):
    """Migrate multiple secrets from Vault to Delinea"""
    if not vault_paths:
        console.print("[red]No paths provided[/red]")
        return

    migrator = VaultToDelineaMigrator(mock_mode=ctx.obj["mock_mode"])

    mode_text = "[yellow]DRY RUN[/yellow]" if dry_run else "[red]EXECUTE[/red]"
    console.print(Panel.fit(
        f"[bold]Batch Migration: Vault to Delinea[/bold]\n\n"
        f"Secrets: {len(vault_paths)}\n"
        f"Target Folder: {folder}\n"
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
        task = progress.add_task("Migrating secrets...", total=len(vault_paths))

        def update_progress(current, total, result):
            status = "[green]OK[/green]" if result.success else "[red]FAIL[/red]"
            progress.update(task, advance=1, description=f"Migrating... {result.source_path} {status}")

        report = migrator.migrate_batch(
            vault_paths=list(vault_paths),
            delinea_folder_id=folder,
            template_id=template,
            dry_run=dry_run,
            progress_callback=update_progress
        )

    # Summary
    console.print(f"\n[bold]Migration Summary[/bold]")
    console.print(f"  Total: {report.total_secrets}")
    console.print(f"  [green]Successful: {report.successful}[/green]")
    console.print(f"  [red]Failed: {report.failed}[/red]")

    if report.failed > 0:
        console.print("\n[red]Failed migrations:[/red]")
        for r in report.results:
            if not r.success:
                console.print(f"  - {r.source_path}: {r.error}")

    if output:
        migrator.generate_report(report, output)
        console.print(f"\n[dim]Report saved to {output}[/dim]")


@cli.command()
@click.pass_context
def demo(ctx):
    """Run migration demo with mock data"""
    console.print(Panel.fit(
        "[bold cyan]Vault to Delinea Migration Demo[/bold cyan]\n\n"
        "Demonstrates migration capabilities using mock data.",
        border_style="cyan"
    ))

    # Create migrator with mock Delinea
    migrator = VaultToDelineaMigrator(mock_mode=True)

    console.print("\n[bold]1. Template Recommendation[/bold]")
    test_paths = [
        "secret/database/prod-mysql",
        "secret/api/stripe-key",
        "secret/linux/web-server",
        "secret/windows/dc-admin"
    ]
    for path in test_paths:
        template_id = migrator.recommend_template(path, {})
        console.print(f"   {path} -> Template ID: {template_id}")

    console.print("\n[bold]2. Field Mapping[/bold]")
    sample_data = {
        "username": "admin",
        "password": "secret123",
        "host": "db.example.com",
        "port": "5432",
        "custom_field": "value"
    }
    mapped, skipped = migrator.map_fields(sample_data, 3)
    console.print(f"   Mapped: {mapped}")
    console.print(f"   Skipped (kept as-is): {skipped}")

    console.print("\n[bold]3. Dry Run Migration (Mock)[/bold]")
    # Note: This would require Vault to be running, so just show the concept
    console.print("   Would migrate 'secret/test' to Delinea folder 1")
    console.print("   Dry run mode prevents actual creation")

    console.print("\n[green]Demo complete![/green]")


if __name__ == "__main__":
    cli()
