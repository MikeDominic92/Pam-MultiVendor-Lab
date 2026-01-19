"""
PAM Multi-Vendor Lab Scripts
Author: Dominic M. Hoang

This package provides cross-platform PAM automation:
- vault_client: HashiCorp Vault operations
- delinea_client: Delinea Secret Server operations
- unified_pam_client: Multi-platform abstraction layer
- vault_to_delinea: Migration from Vault to Delinea
- delinea_to_vault: Migration from Delinea to Vault
- config: Unified configuration management

AWS integrations are in the 'aws' subpackage.
"""

from .config import get_settings, Settings

__all__ = [
    "get_settings",
    "Settings",
]
