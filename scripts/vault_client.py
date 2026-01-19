"""
HashiCorp Vault Client for PAM Operations
Author: Mike Dominic
Version: 1.0

This module provides a Python client for interacting with HashiCorp Vault
for Privileged Access Management operations.
"""

import os
import sys
import json
import logging
from typing import Dict, List, Optional, Any
from datetime import datetime

import hvac
from hvac.exceptions import VaultError, InvalidPath, Forbidden
import click
from colorama import init, Fore, Style
from tabulate import tabulate

# Initialize colorama for cross-platform colored output
init(autoreset=True)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


class VaultPAMClient:
    """
    Vault client for PAM operations
    """

    def __init__(
        self,
        vault_addr: Optional[str] = None,
        vault_token: Optional[str] = None,
        verify_ssl: bool = False
    ):
        """
        Initialize Vault client

        Args:
            vault_addr: Vault server address (default: from VAULT_ADDR env)
            vault_token: Vault token (default: from VAULT_TOKEN env)
            verify_ssl: Verify SSL certificates (default: False for lab)
        """
        self.vault_addr = vault_addr or os.getenv('VAULT_ADDR', 'http://localhost:8200')
        self.vault_token = vault_token or os.getenv('VAULT_TOKEN')

        if not self.vault_token:
            raise ValueError("Vault token is required. Set VAULT_TOKEN environment variable.")

        try:
            self.client = hvac.Client(
                url=self.vault_addr,
                token=self.vault_token,
                verify=verify_ssl
            )

            # Verify authentication
            if not self.client.is_authenticated():
                raise VaultError("Authentication failed. Check your token.")

            logger.info(f"Connected to Vault at {self.vault_addr}")

        except Exception as e:
            logger.error(f"Failed to connect to Vault: {e}")
            raise

    def get_secret(self, path: str, version: Optional[int] = None) -> Dict[str, Any]:
        """
        Retrieve a secret from Vault KV v2

        Args:
            path: Secret path (e.g., 'secret/database/prod')
            version: Specific version to retrieve (default: latest)

        Returns:
            Dictionary containing secret data
        """
        try:
            # Normalize path for KV v2
            if not path.startswith('secret/'):
                path = f'secret/{path}'

            # Read secret
            if version:
                secret = self.client.secrets.kv.v2.read_secret_version(
                    path=path.replace('secret/', ''),
                    version=version,
                    mount_point='secret'
                )
            else:
                secret = self.client.secrets.kv.v2.read_secret_version(
                    path=path.replace('secret/', ''),
                    mount_point='secret'
                )

            logger.info(f"Retrieved secret from {path}")
            return secret['data']

        except InvalidPath:
            logger.error(f"Secret not found at path: {path}")
            raise
        except Forbidden:
            logger.error(f"Access denied to secret: {path}")
            raise
        except Exception as e:
            logger.error(f"Error retrieving secret: {e}")
            raise

    def create_secret(self, path: str, data: Dict[str, Any]) -> None:
        """
        Create or update a secret in Vault KV v2

        Args:
            path: Secret path
            data: Secret data as dictionary
        """
        try:
            if not path.startswith('secret/'):
                path = f'secret/{path}'

            self.client.secrets.kv.v2.create_or_update_secret(
                path=path.replace('secret/', ''),
                secret=data,
                mount_point='secret'
            )

            logger.info(f"Created/updated secret at {path}")

        except Exception as e:
            logger.error(f"Error creating secret: {e}")
            raise

    def list_secrets(self, path: str = '') -> List[str]:
        """
        List secrets at a path

        Args:
            path: Path to list (default: root)

        Returns:
            List of secret paths
        """
        try:
            if not path.startswith('secret/'):
                path = f'secret/{path}' if path else 'secret'

            result = self.client.secrets.kv.v2.list_secrets(
                path=path.replace('secret/', ''),
                mount_point='secret'
            )

            return result['data']['keys']

        except InvalidPath:
            logger.warning(f"No secrets found at {path}")
            return []
        except Exception as e:
            logger.error(f"Error listing secrets: {e}")
            raise

    def delete_secret(self, path: str, versions: Optional[List[int]] = None) -> None:
        """
        Delete secret versions (soft delete)

        Args:
            path: Secret path
            versions: List of versions to delete (default: latest)
        """
        try:
            if not path.startswith('secret/'):
                path = f'secret/{path}'

            if versions:
                self.client.secrets.kv.v2.delete_secret_versions(
                    path=path.replace('secret/', ''),
                    versions=versions,
                    mount_point='secret'
                )
            else:
                self.client.secrets.kv.v2.delete_latest_version_of_secret(
                    path=path.replace('secret/', ''),
                    mount_point='secret'
                )

            logger.info(f"Deleted secret at {path}")

        except Exception as e:
            logger.error(f"Error deleting secret: {e}")
            raise

    def get_dynamic_db_credentials(self, role: str) -> Dict[str, str]:
        """
        Generate dynamic database credentials

        Args:
            role: Database role name

        Returns:
            Dictionary with username and password
        """
        try:
            response = self.client.read(f'database/creds/{role}')

            credentials = {
                'username': response['data']['username'],
                'password': response['data']['password'],
                'lease_id': response['lease_id'],
                'lease_duration': response['lease_duration']
            }

            logger.info(f"Generated dynamic credentials for role: {role}")
            return credentials

        except Exception as e:
            logger.error(f"Error generating credentials: {e}")
            raise

    def rotate_root_credentials(self, database: str) -> None:
        """
        Rotate root database credentials

        Args:
            database: Database name (postgresql, mysql, etc.)
        """
        try:
            self.client.write(f'database/rotate-root/{database}')
            logger.info(f"Rotated root credentials for {database}")

        except Exception as e:
            logger.error(f"Error rotating credentials: {e}")
            raise

    def get_static_credentials(self, role: str) -> Dict[str, Any]:
        """
        Get static database credentials

        Args:
            role: Static role name

        Returns:
            Dictionary with credentials and metadata
        """
        try:
            response = self.client.read(f'database/static-creds/{role}')

            return {
                'username': response['data']['username'],
                'password': response['data']['password'],
                'last_vault_rotation': response['data'].get('last_vault_rotation'),
                'rotation_period': response['data'].get('rotation_period'),
                'ttl': response['data'].get('ttl')
            }

        except Exception as e:
            logger.error(f"Error retrieving static credentials: {e}")
            raise

    def list_policies(self) -> List[str]:
        """
        List all Vault policies

        Returns:
            List of policy names
        """
        try:
            policies = self.client.sys.list_policies()
            return policies['data']['policies']

        except Exception as e:
            logger.error(f"Error listing policies: {e}")
            raise

    def get_audit_logs(self, filter_path: Optional[str] = None) -> List[Dict]:
        """
        Note: This is a placeholder. In production, audit logs are
        written to files and should be processed separately.

        Args:
            filter_path: Filter logs by path

        Returns:
            List of audit events (from file in real implementation)
        """
        logger.warning("Audit log retrieval from file not implemented in this demo")
        return []


@click.group()
def cli():
    """Vault PAM Client - Command Line Interface"""
    pass


@cli.command()
@click.option('--path', required=True, help='Secret path')
@click.option('--show-password', is_flag=True, help='Show password in clear text')
def get(path: str, show_password: bool):
    """Retrieve a secret from Vault"""
    try:
        client = VaultPAMClient()
        secret = client.get_secret(path)

        print(f"\n{Fore.CYAN}Secret: {path}{Style.RESET_ALL}")
        print("=" * 50)

        data = secret['data']
        for key, value in data.items():
            if 'password' in key.lower() or 'secret' in key.lower() or 'key' in key.lower():
                if not show_password:
                    value = '***HIDDEN***'
            print(f"{Fore.GREEN}{key}:{Style.RESET_ALL} {value}")

        print("\n" + Fore.CYAN + "Metadata:" + Style.RESET_ALL)
        metadata = secret['metadata']
        print(f"Version: {metadata['version']}")
        print(f"Created: {metadata['created_time']}")

        if show_password:
            print(f"\n{Fore.RED}⚠ WARNING: Passwords displayed in clear text!{Style.RESET_ALL}")

    except Exception as e:
        print(f"{Fore.RED}Error: {e}{Style.RESET_ALL}")
        sys.exit(1)


@cli.command()
@click.option('--path', default='', help='Path to list')
def list_cmd(path: str):
    """List secrets at a path"""
    try:
        client = VaultPAMClient()
        secrets = client.list_secrets(path)

        if secrets:
            print(f"\n{Fore.CYAN}Secrets at {path or 'root'}:{Style.RESET_ALL}")
            for secret in secrets:
                print(f"  • {secret}")
        else:
            print(f"{Fore.YELLOW}No secrets found at {path}{Style.RESET_ALL}")

    except Exception as e:
        print(f"{Fore.RED}Error: {e}{Style.RESET_ALL}")
        sys.exit(1)


@cli.command()
@click.option('--role', required=True, help='Database role name')
def db_creds(role: str):
    """Generate dynamic database credentials"""
    try:
        client = VaultPAMClient()
        creds = client.get_dynamic_db_credentials(role)

        print(f"\n{Fore.CYAN}Dynamic Credentials Generated{Style.RESET_ALL}")
        print("=" * 50)
        print(f"{Fore.GREEN}Username:{Style.RESET_ALL} {creds['username']}")
        print(f"{Fore.GREEN}Password:{Style.RESET_ALL} {creds['password']}")
        print(f"{Fore.GREEN}Lease ID:{Style.RESET_ALL} {creds['lease_id']}")
        print(f"{Fore.GREEN}Lease Duration:{Style.RESET_ALL} {creds['lease_duration']}s")
        print(f"\n{Fore.YELLOW}⚠ These credentials will expire in {creds['lease_duration']}s{Style.RESET_ALL}")

    except Exception as e:
        print(f"{Fore.RED}Error: {e}{Style.RESET_ALL}")
        sys.exit(1)


@cli.command()
@click.option('--database', required=True, help='Database name (postgresql, mysql)')
def rotate(database: str):
    """Rotate database root credentials"""
    try:
        client = VaultPAMClient()
        client.rotate_root_credentials(database)

        print(f"{Fore.GREEN}✓ Successfully rotated credentials for {database}{Style.RESET_ALL}")

    except Exception as e:
        print(f"{Fore.RED}Error: {e}{Style.RESET_ALL}")
        sys.exit(1)


@cli.command()
def policies():
    """List all Vault policies"""
    try:
        client = VaultPAMClient()
        policy_list = client.list_policies()

        print(f"\n{Fore.CYAN}Vault Policies:{Style.RESET_ALL}")
        for policy in policy_list:
            print(f"  • {policy}")

    except Exception as e:
        print(f"{Fore.RED}Error: {e}{Style.RESET_ALL}")
        sys.exit(1)


if __name__ == '__main__':
    cli()
