"""
Unified Configuration Management for PAM Multi-Vendor Lab
Author: Dominic M. Hoang
Version: 2.0

Loads settings from .env file and environment variables for all PAM platforms.
"""

import os
from pathlib import Path
from typing import Optional
from dataclasses import dataclass, field


@dataclass
class VaultSettings:
    """HashiCorp Vault configuration"""
    url: str = "http://127.0.0.1:8200"
    token: Optional[str] = None
    namespace: Optional[str] = None
    skip_verify: bool = True

    @classmethod
    def from_env(cls) -> "VaultSettings":
        """Load settings from environment variables"""
        return cls(
            url=os.getenv("VAULT_ADDR", "http://127.0.0.1:8200"),
            token=os.getenv("VAULT_TOKEN"),
            namespace=os.getenv("VAULT_NAMESPACE"),
            skip_verify=os.getenv("VAULT_SKIP_VERIFY", "true").lower() == "true"
        )


@dataclass
class DelineaSettings:
    """Delinea Secret Server configuration"""
    url: str = ""
    username: str = ""
    password: str = ""
    domain: Optional[str] = None
    tenant: Optional[str] = None
    mock_mode: bool = True

    @classmethod
    def from_env(cls) -> "DelineaSettings":
        """Load settings from environment variables"""
        return cls(
            url=os.getenv("DELINEA_URL", ""),
            username=os.getenv("DELINEA_USERNAME", ""),
            password=os.getenv("DELINEA_PASSWORD", ""),
            domain=os.getenv("DELINEA_DOMAIN"),
            tenant=os.getenv("DELINEA_TENANT"),
            mock_mode=os.getenv("DELINEA_MOCK_MODE", "true").lower() == "true"
        )


@dataclass
class AWSSettings:
    """AWS Secrets Manager configuration"""
    region: str = "us-east-1"
    access_key_id: Optional[str] = None
    secret_access_key: Optional[str] = None
    mock_mode: bool = True

    @classmethod
    def from_env(cls) -> "AWSSettings":
        """Load settings from environment variables"""
        return cls(
            region=os.getenv("AWS_REGION", "us-east-1"),
            access_key_id=os.getenv("AWS_ACCESS_KEY_ID"),
            secret_access_key=os.getenv("AWS_SECRET_ACCESS_KEY"),
            mock_mode=os.getenv("AWS_MOCK_MODE", "true").lower() == "true"
        )


@dataclass
class Settings:
    """Combined settings for all PAM platforms"""
    vault: VaultSettings = field(default_factory=VaultSettings.from_env)
    delinea: DelineaSettings = field(default_factory=DelineaSettings.from_env)
    aws: AWSSettings = field(default_factory=AWSSettings.from_env)

    # General settings
    log_level: str = "INFO"
    dry_run: bool = False
    default_platform: str = "vault"

    @classmethod
    def from_env(cls) -> "Settings":
        """Load all settings from environment variables"""
        return cls(
            vault=VaultSettings.from_env(),
            delinea=DelineaSettings.from_env(),
            aws=AWSSettings.from_env(),
            log_level=os.getenv("LOG_LEVEL", "INFO"),
            dry_run=os.getenv("DRY_RUN", "false").lower() == "true",
            default_platform=os.getenv("DEFAULT_PAM_PLATFORM", "vault")
        )


# Singleton instance
_settings: Optional[Settings] = None


def load_dotenv_if_exists():
    """Load .env file if python-dotenv is available"""
    try:
        from dotenv import load_dotenv
        env_path = Path(__file__).parent.parent / ".env"
        if env_path.exists():
            load_dotenv(env_path)
    except ImportError:
        pass


def get_settings() -> Settings:
    """Get or create settings singleton"""
    global _settings
    if _settings is None:
        load_dotenv_if_exists()
        _settings = Settings.from_env()
    return _settings


def reload_settings() -> Settings:
    """Force reload settings from environment"""
    global _settings
    load_dotenv_if_exists()
    _settings = Settings.from_env()
    return _settings


if __name__ == "__main__":
    # Test configuration loading
    settings = get_settings()
    print("PAM Multi-Vendor Lab Configuration")
    print("=" * 50)
    print(f"\nVault:")
    print(f"  URL: {settings.vault.url}")
    print(f"  Token: {'***' if settings.vault.token else 'Not set'}")
    print(f"  Namespace: {settings.vault.namespace or 'Not set'}")
    print(f"\nDelinea:")
    print(f"  URL: {settings.delinea.url or 'Not set'}")
    print(f"  Username: {settings.delinea.username or 'Not set'}")
    print(f"  Mock Mode: {settings.delinea.mock_mode}")
    print(f"\nAWS:")
    print(f"  Region: {settings.aws.region}")
    print(f"  Mock Mode: {settings.aws.mock_mode}")
    print(f"\nGeneral:")
    print(f"  Log Level: {settings.log_level}")
    print(f"  Default Platform: {settings.default_platform}")
