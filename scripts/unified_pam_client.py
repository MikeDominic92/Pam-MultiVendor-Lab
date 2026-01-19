"""
Unified PAM Client - Cross-Platform Abstraction Layer
Author: Dominic M. Hoang
Version: 1.0

Provides a unified interface for working with multiple PAM platforms:
- HashiCorp Vault
- Delinea Secret Server
- AWS Secrets Manager
"""

import os
import sys
import json
import logging
from typing import Dict, List, Optional, Any, Union
from datetime import datetime
from dataclasses import dataclass, field, asdict
from enum import Enum

import click
from rich.console import Console
from rich.table import Table
from rich.panel import Panel
from rich.progress import Progress, SpinnerColumn, TextColumn

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)
console = Console()


# ============================================================================
# Enums and Data Classes
# ============================================================================

class Platform(str, Enum):
    """Supported PAM platforms"""
    VAULT = "vault"
    DELINEA = "delinea"
    AWS = "aws"


class SecretType(str, Enum):
    """Common secret types across platforms"""
    PASSWORD = "password"
    API_KEY = "api_key"
    CERTIFICATE = "certificate"
    SSH_KEY = "ssh_key"
    DATABASE = "database"
    GENERIC = "generic"


@dataclass
class UnifiedSecret:
    """
    Platform-agnostic secret representation

    Provides a common structure for secrets regardless of source platform.
    """
    name: str
    secret_type: SecretType
    data: Dict[str, Any]
    source_platform: Platform
    path: str = ""
    metadata: Dict[str, Any] = field(default_factory=dict)
    last_modified: Optional[datetime] = None
    version: Optional[int] = None
    id: Optional[Union[int, str]] = None

    def get_field(self, field_name: str, default: Any = None) -> Any:
        """Get a field value from the secret data"""
        return self.data.get(field_name, default)

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for serialization"""
        return {
            "name": self.name,
            "secret_type": self.secret_type.value,
            "data": self.data,
            "source_platform": self.source_platform.value,
            "path": self.path,
            "metadata": self.metadata,
            "last_modified": self.last_modified.isoformat() if self.last_modified else None,
            "version": self.version,
            "id": self.id
        }

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "UnifiedSecret":
        """Create from dictionary"""
        return cls(
            name=data["name"],
            secret_type=SecretType(data.get("secret_type", "generic")),
            data=data.get("data", {}),
            source_platform=Platform(data["source_platform"]),
            path=data.get("path", ""),
            metadata=data.get("metadata", {}),
            last_modified=datetime.fromisoformat(data["last_modified"]) if data.get("last_modified") else None,
            version=data.get("version"),
            id=data.get("id")
        )


@dataclass
class PlatformHealth:
    """Health status for a platform"""
    platform: Platform
    connected: bool
    authenticated: bool
    error: Optional[str] = None
    details: Dict[str, Any] = field(default_factory=dict)


# ============================================================================
# Platform Adapters
# ============================================================================

class VaultAdapter:
    """Adapter for HashiCorp Vault"""

    def __init__(self):
        self._client = None

    def _get_client(self):
        """Lazy initialization of Vault client"""
        if self._client is None:
            from vault_client import VaultPAMClient
            self._client = VaultPAMClient()
        return self._client

    def is_available(self) -> bool:
        """Check if Vault is configured and available"""
        try:
            client = self._get_client()
            return client.client.is_authenticated()
        except Exception:
            return False

    def health_check(self) -> PlatformHealth:
        """Check Vault health"""
        try:
            client = self._get_client()
            if client.client.is_authenticated():
                return PlatformHealth(
                    platform=Platform.VAULT,
                    connected=True,
                    authenticated=True,
                    details={"url": client.vault_addr}
                )
            return PlatformHealth(
                platform=Platform.VAULT,
                connected=True,
                authenticated=False,
                error="Not authenticated"
            )
        except Exception as e:
            return PlatformHealth(
                platform=Platform.VAULT,
                connected=False,
                authenticated=False,
                error=str(e)
            )

    def get_secret(self, path: str) -> UnifiedSecret:
        """Get secret from Vault"""
        client = self._get_client()
        secret = client.get_secret(path)

        return UnifiedSecret(
            name=path.split("/")[-1],
            secret_type=self._infer_secret_type(secret["data"]),
            data=secret["data"],
            source_platform=Platform.VAULT,
            path=path,
            metadata=secret.get("metadata", {}),
            last_modified=datetime.fromisoformat(
                secret["metadata"]["created_time"].replace("Z", "+00:00")
            ) if secret.get("metadata", {}).get("created_time") else None,
            version=secret.get("metadata", {}).get("version")
        )

    def list_secrets(self, path: str = "") -> List[str]:
        """List secrets at path"""
        client = self._get_client()
        return client.list_secrets(path)

    def store_secret(self, secret: UnifiedSecret) -> None:
        """Store secret in Vault"""
        client = self._get_client()
        client.create_secret(secret.path or secret.name, secret.data)

    def _infer_secret_type(self, data: Dict) -> SecretType:
        """Infer secret type from data fields"""
        keys = [k.lower() for k in data.keys()]
        if "password" in keys or "passwd" in keys:
            return SecretType.PASSWORD
        if "api_key" in keys or "apikey" in keys or "api-key" in keys:
            return SecretType.API_KEY
        if "certificate" in keys or "cert" in keys:
            return SecretType.CERTIFICATE
        if "private_key" in keys or "ssh_key" in keys:
            return SecretType.SSH_KEY
        if "connection_string" in keys or "database" in keys:
            return SecretType.DATABASE
        return SecretType.GENERIC


class DelineaAdapter:
    """Adapter for Delinea Secret Server"""

    def __init__(self, mock_mode: bool = True):
        self._client = None
        self.mock_mode = mock_mode

    def _get_client(self):
        """Lazy initialization of Delinea client"""
        if self._client is None:
            from delinea_client import DelineaSecretServerClient
            self._client = DelineaSecretServerClient(mock_mode=self.mock_mode)
        return self._client

    def is_available(self) -> bool:
        """Check if Delinea is configured and available"""
        try:
            client = self._get_client()
            health = client.health_check()
            return health.get("connected", False)
        except Exception:
            return False

    def health_check(self) -> PlatformHealth:
        """Check Delinea health"""
        try:
            client = self._get_client()
            health = client.health_check()
            return PlatformHealth(
                platform=Platform.DELINEA,
                connected=health.get("connected", False),
                authenticated=health.get("authenticated", False),
                error=health.get("error"),
                details={
                    "mode": health.get("mode"),
                    "secret_count": health.get("secret_count"),
                    "url": health.get("url")
                }
            )
        except Exception as e:
            return PlatformHealth(
                platform=Platform.DELINEA,
                connected=False,
                authenticated=False,
                error=str(e)
            )

    def get_secret(self, secret_id: int) -> UnifiedSecret:
        """Get secret from Delinea by ID"""
        client = self._get_client()
        secret = client.get_secret(secret_id)

        data = {f.field_name: f.value for f in secret.fields}

        return UnifiedSecret(
            name=secret.name,
            secret_type=self._infer_secret_type(secret.template_name),
            data=data,
            source_platform=Platform.DELINEA,
            path=secret.folder_path,
            metadata={
                "template_name": secret.template_name,
                "template_id": secret.template_id,
                "folder_id": secret.folder_id,
                "active": secret.active,
                "checked_out": secret.checked_out
            },
            id=secret.id
        )

    def search_secrets(self, search_text: str = "") -> List[UnifiedSecret]:
        """Search secrets in Delinea"""
        client = self._get_client()
        secrets = client.search_secrets(search_text=search_text)

        results = []
        for s in secrets:
            data = {f.field_name: f.value for f in s.fields}
            results.append(UnifiedSecret(
                name=s.name,
                secret_type=self._infer_secret_type(s.template_name),
                data=data,
                source_platform=Platform.DELINEA,
                path=s.folder_path,
                metadata={"template_name": s.template_name},
                id=s.id
            ))

        return results

    def store_secret(
        self,
        secret: UnifiedSecret,
        template_id: int,
        folder_id: int
    ) -> int:
        """Store secret in Delinea"""
        client = self._get_client()
        created = client.create_secret(
            name=secret.name,
            template_id=template_id,
            folder_id=folder_id,
            fields=secret.data
        )
        return created.id

    def _infer_secret_type(self, template_name: str) -> SecretType:
        """Infer secret type from template name"""
        template_lower = template_name.lower()
        if "windows" in template_lower or "unix" in template_lower:
            return SecretType.PASSWORD
        if "api" in template_lower:
            return SecretType.API_KEY
        if "database" in template_lower or "sql" in template_lower:
            return SecretType.DATABASE
        if "ssh" in template_lower:
            return SecretType.SSH_KEY
        if "certificate" in template_lower:
            return SecretType.CERTIFICATE
        return SecretType.GENERIC


class AWSAdapter:
    """Adapter for AWS Secrets Manager"""

    def __init__(self, mock_mode: bool = True):
        self._connector = None
        self.mock_mode = mock_mode

    def _get_connector(self):
        """Lazy initialization of AWS connector"""
        if self._connector is None:
            from aws.aws_secrets_connector import AWSSecretsConnector
            self._connector = AWSSecretsConnector(mock_mode=self.mock_mode)
        return self._connector

    def is_available(self) -> bool:
        """Check if AWS is configured and available"""
        try:
            connector = self._get_connector()
            return True  # Mock mode always available
        except Exception:
            return False

    def health_check(self) -> PlatformHealth:
        """Check AWS health"""
        try:
            connector = self._get_connector()
            return PlatformHealth(
                platform=Platform.AWS,
                connected=True,
                authenticated=True,
                details={"mode": "mock" if self.mock_mode else "live"}
            )
        except Exception as e:
            return PlatformHealth(
                platform=Platform.AWS,
                connected=False,
                authenticated=False,
                error=str(e)
            )

    def get_secret(self, name: str) -> UnifiedSecret:
        """Get secret from AWS Secrets Manager"""
        connector = self._get_connector()
        secret = connector.get_secret(name)

        # Parse JSON value if present
        data = secret.get("SecretValue", {})
        if isinstance(data, str):
            try:
                data = json.loads(data)
            except json.JSONDecodeError:
                data = {"value": data}

        return UnifiedSecret(
            name=secret.get("Name", name),
            secret_type=SecretType.GENERIC,
            data=data,
            source_platform=Platform.AWS,
            path=name,
            metadata={
                "arn": secret.get("ARN"),
                "description": secret.get("Description")
            },
            id=secret.get("ARN")
        )

    def store_secret(self, secret: UnifiedSecret) -> str:
        """Store secret in AWS Secrets Manager"""
        connector = self._get_connector()
        result = connector.create_secret(
            name=secret.name,
            secret_value=secret.data,
            description=secret.metadata.get("description", "")
        )
        return result.get("ARN", "")


# ============================================================================
# Unified PAM Client
# ============================================================================

class UnifiedPAMClient:
    """
    Unified client for multi-platform PAM operations

    Provides:
    - Auto-detection of available platforms
    - Consistent API across Vault, Delinea, and AWS
    - Health monitoring across all platforms
    - Cross-platform secret comparison
    """

    def __init__(
        self,
        default_platform: Optional[Platform] = None,
        delinea_mock: bool = True,
        aws_mock: bool = True
    ):
        """
        Initialize unified client

        Args:
            default_platform: Default platform to use (auto-detected if None)
            delinea_mock: Use mock mode for Delinea
            aws_mock: Use mock mode for AWS
        """
        self.vault = VaultAdapter()
        self.delinea = DelineaAdapter(mock_mode=delinea_mock)
        self.aws = AWSAdapter(mock_mode=aws_mock)

        self._adapters = {
            Platform.VAULT: self.vault,
            Platform.DELINEA: self.delinea,
            Platform.AWS: self.aws
        }

        self.default_platform = default_platform or self._detect_default_platform()

    def _detect_default_platform(self) -> Platform:
        """Auto-detect the best available platform"""
        if self.vault.is_available():
            return Platform.VAULT
        if self.delinea.is_available():
            return Platform.DELINEA
        if self.aws.is_available():
            return Platform.AWS
        return Platform.VAULT  # Default fallback

    def detect_platforms(self) -> List[Platform]:
        """Detect all available platforms"""
        available = []
        for platform, adapter in self._adapters.items():
            if adapter.is_available():
                available.append(platform)
        return available

    def health_check_all(self) -> Dict[Platform, PlatformHealth]:
        """Check health of all platforms"""
        results = {}
        for platform, adapter in self._adapters.items():
            results[platform] = adapter.health_check()
        return results

    def get_secret(
        self,
        identifier: Union[str, int],
        platform: Optional[Platform] = None
    ) -> UnifiedSecret:
        """
        Get a secret from any platform

        Args:
            identifier: Secret path (Vault/AWS) or ID (Delinea)
            platform: Platform to use (default if None)

        Returns:
            UnifiedSecret object
        """
        platform = platform or self.default_platform
        adapter = self._adapters[platform]

        if platform == Platform.VAULT:
            return adapter.get_secret(str(identifier))
        elif platform == Platform.DELINEA:
            return adapter.get_secret(int(identifier))
        elif platform == Platform.AWS:
            return adapter.get_secret(str(identifier))

        raise ValueError(f"Unknown platform: {platform}")

    def store_secret(
        self,
        secret: UnifiedSecret,
        platform: Optional[Platform] = None,
        **kwargs
    ) -> Union[str, int]:
        """
        Store a secret to a platform

        Args:
            secret: UnifiedSecret to store
            platform: Target platform
            **kwargs: Platform-specific options

        Returns:
            Secret identifier (path/ID/ARN)
        """
        platform = platform or self.default_platform
        adapter = self._adapters[platform]

        if platform == Platform.VAULT:
            adapter.store_secret(secret)
            return secret.path or secret.name
        elif platform == Platform.DELINEA:
            template_id = kwargs.get("template_id", 1)
            folder_id = kwargs.get("folder_id", 1)
            return adapter.store_secret(secret, template_id, folder_id)
        elif platform == Platform.AWS:
            return adapter.store_secret(secret)

        raise ValueError(f"Unknown platform: {platform}")

    def compare_secrets(
        self,
        secret1: UnifiedSecret,
        secret2: UnifiedSecret
    ) -> Dict[str, Any]:
        """
        Compare two secrets from different platforms

        Returns comparison report including:
        - Matching fields
        - Different fields
        - Missing fields
        """
        fields1 = set(secret1.data.keys())
        fields2 = set(secret2.data.keys())

        common_fields = fields1 & fields2
        only_in_1 = fields1 - fields2
        only_in_2 = fields2 - fields1

        different_values = []
        matching_values = []

        for field in common_fields:
            if secret1.data[field] == secret2.data[field]:
                matching_values.append(field)
            else:
                different_values.append(field)

        return {
            "secret1": {
                "name": secret1.name,
                "platform": secret1.source_platform.value
            },
            "secret2": {
                "name": secret2.name,
                "platform": secret2.source_platform.value
            },
            "matching_fields": matching_values,
            "different_fields": different_values,
            "only_in_secret1": list(only_in_1),
            "only_in_secret2": list(only_in_2),
            "match_percentage": (
                len(matching_values) / len(common_fields) * 100
                if common_fields else 0
            )
        }

    def find_duplicates(
        self,
        search_term: str
    ) -> Dict[Platform, List[UnifiedSecret]]:
        """
        Find secrets with similar names across platforms

        Args:
            search_term: Term to search for

        Returns:
            Dict of platform -> matching secrets
        """
        results = {}

        # Search Delinea
        if self.delinea.is_available():
            delinea_secrets = self.delinea.search_secrets(search_term)
            if delinea_secrets:
                results[Platform.DELINEA] = delinea_secrets

        # Note: Vault and AWS don't have search APIs in same way
        # Would need to list and filter

        return results


# ============================================================================
# CLI Interface
# ============================================================================

@click.group()
@click.pass_context
def cli(ctx):
    """Unified PAM Client - Multi-Platform Secret Management"""
    ctx.ensure_object(dict)
    ctx.obj["client"] = UnifiedPAMClient()


@cli.command()
@click.pass_context
def detect(ctx):
    """Detect available PAM platforms"""
    client = ctx.obj["client"]

    console.print(Panel.fit(
        "[bold cyan]PAM Platform Detection[/bold cyan]",
        border_style="cyan"
    ))

    platforms = client.detect_platforms()

    if platforms:
        console.print(f"\n[green]Available platforms:[/green]")
        for p in platforms:
            console.print(f"  - {p.value}")
        console.print(f"\n[dim]Default platform: {client.default_platform.value}[/dim]")
    else:
        console.print("[yellow]No platforms currently available[/yellow]")


@cli.command()
@click.pass_context
def health(ctx):
    """Check health of all PAM platforms"""
    client = ctx.obj["client"]

    console.print(Panel.fit(
        "[bold cyan]PAM Platform Health Check[/bold cyan]",
        border_style="cyan"
    ))

    health_results = client.health_check_all()

    table = Table(show_header=True, header_style="bold")
    table.add_column("Platform", style="cyan")
    table.add_column("Connected", style="green")
    table.add_column("Authenticated", style="green")
    table.add_column("Details")

    for platform, health in health_results.items():
        connected = "[green]Yes[/green]" if health.connected else "[red]No[/red]"
        authenticated = "[green]Yes[/green]" if health.authenticated else "[red]No[/red]"

        details = ""
        if health.error:
            details = f"[red]{health.error}[/red]"
        elif health.details:
            details = ", ".join(f"{k}={v}" for k, v in health.details.items() if v)

        table.add_row(platform.value, connected, authenticated, details)

    console.print(table)


@cli.command("get")
@click.argument("identifier")
@click.option("--platform", "-p", type=click.Choice(["vault", "delinea", "aws"]), help="Platform")
@click.option("--show-secrets", "-s", is_flag=True, help="Show secret values")
@click.pass_context
def get_secret(ctx, identifier, platform, show_secrets):
    """Get a secret from a platform"""
    client = ctx.obj["client"]

    plat = Platform(platform) if platform else None

    try:
        secret = client.get_secret(identifier, platform=plat)

        table = Table(title=f"Secret: {secret.name}", show_header=True)
        table.add_column("Field", style="cyan")
        table.add_column("Value", style="green")

        for key, value in secret.data.items():
            if not show_secrets and any(p in key.lower() for p in ["password", "secret", "key", "token"]):
                value = "********"
            table.add_row(key, str(value))

        console.print(table)
        console.print(f"\n[dim]Platform: {secret.source_platform.value}[/dim]")
        console.print(f"[dim]Type: {secret.secret_type.value}[/dim]")
        console.print(f"[dim]Path: {secret.path}[/dim]")

        if show_secrets:
            console.print("\n[red]Warning: Secret values displayed![/red]")

    except Exception as e:
        console.print(f"[red]Error: {e}[/red]")
        sys.exit(1)


@cli.command("compare")
@click.argument("id1")
@click.argument("id2")
@click.option("--platform1", "-p1", type=click.Choice(["vault", "delinea", "aws"]), required=True)
@click.option("--platform2", "-p2", type=click.Choice(["vault", "delinea", "aws"]), required=True)
@click.pass_context
def compare(ctx, id1, id2, platform1, platform2):
    """Compare secrets from two platforms"""
    client = ctx.obj["client"]

    try:
        secret1 = client.get_secret(id1, Platform(platform1))
        secret2 = client.get_secret(id2, Platform(platform2))

        result = client.compare_secrets(secret1, secret2)

        console.print(Panel.fit(
            f"[bold]Comparing:[/bold]\n"
            f"  {result['secret1']['name']} ({result['secret1']['platform']})\n"
            f"  {result['secret2']['name']} ({result['secret2']['platform']})",
            title="Secret Comparison",
            border_style="cyan"
        ))

        console.print(f"\n[green]Match: {result['match_percentage']:.1f}%[/green]")

        if result["matching_fields"]:
            console.print(f"\n[green]Matching fields:[/green] {', '.join(result['matching_fields'])}")

        if result["different_fields"]:
            console.print(f"\n[yellow]Different values:[/yellow] {', '.join(result['different_fields'])}")

        if result["only_in_secret1"]:
            console.print(f"\n[blue]Only in {platform1}:[/blue] {', '.join(result['only_in_secret1'])}")

        if result["only_in_secret2"]:
            console.print(f"\n[blue]Only in {platform2}:[/blue] {', '.join(result['only_in_secret2'])}")

    except Exception as e:
        console.print(f"[red]Error: {e}[/red]")
        sys.exit(1)


@cli.command()
@click.pass_context
def demo(ctx):
    """Run interactive demo of unified PAM capabilities"""
    console.print(Panel.fit(
        "[bold cyan]Unified PAM Client Demo[/bold cyan]\n\n"
        "This demo showcases cross-platform PAM capabilities\n"
        "using mock data from Delinea Secret Server.",
        title="PAM Multi-Vendor Lab",
        border_style="cyan"
    ))

    client = UnifiedPAMClient(delinea_mock=True, aws_mock=True)

    console.print("\n[bold]1. Platform Detection[/bold]")
    platforms = client.detect_platforms()
    console.print(f"   Available: {[p.value for p in platforms]}")
    console.print(f"   Default: {client.default_platform.value}")

    console.print("\n[bold]2. Health Check All Platforms[/bold]")
    health = client.health_check_all()
    for p, h in health.items():
        status = "[green]OK[/green]" if h.connected else "[red]FAIL[/red]"
        console.print(f"   {p.value}: {status}")

    console.print("\n[bold]3. Get Secret from Delinea[/bold]")
    secret = client.get_secret(1, Platform.DELINEA)
    console.print(f"   Name: {secret.name}")
    console.print(f"   Type: {secret.secret_type.value}")
    console.print(f"   Fields: {list(secret.data.keys())}")

    console.print("\n[bold]4. Search for Duplicates[/bold]")
    results = client.find_duplicates("admin")
    for p, secrets in results.items():
        console.print(f"   {p.value}: {[s.name for s in secrets]}")

    console.print("\n[bold]5. Create Unified Secret[/bold]")
    new_secret = UnifiedSecret(
        name="demo-unified-secret",
        secret_type=SecretType.API_KEY,
        data={
            "api_key": "unified-key-12345",
            "api_secret": "unified-secret-67890"
        },
        source_platform=Platform.DELINEA
    )
    console.print(f"   Created: {new_secret.name}")
    console.print(f"   Data: {new_secret.to_dict()}")

    console.print("\n[green]Demo complete![/green]")
    console.print("\n[dim]Run 'python unified_pam_client.py --help' for all commands[/dim]")


if __name__ == "__main__":
    cli()
