"""
Automated Password Rotation Script
Simulates CyberArk CPM (Central Policy Manager)

Author: Mike Dominic
Version: 1.0
"""

import os
import sys
import time
import logging
from datetime import datetime, timedelta
from typing import Dict, List, Optional

import hvac
from hvac.exceptions import VaultError
import click
from colorama import Fore, Style, init

init(autoreset=True)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


class PasswordRotationManager:
    """Manages automated password rotation for databases"""

    def __init__(self, vault_addr: str = None, vault_token: str = None):
        self.vault_addr = vault_addr or os.getenv('VAULT_ADDR', 'http://localhost:8200')
        self.vault_token = vault_token or os.getenv('VAULT_TOKEN')

        if not self.vault_token:
            raise ValueError("VAULT_TOKEN environment variable required")

        self.client = hvac.Client(url=self.vault_addr, token=self.vault_token)

        if not self.client.is_authenticated():
            raise VaultError("Authentication failed")

    def rotate_database_password(self, database_name: str) -> Dict:
        """
        Rotate password for a database connection

        Args:
            database_name: Name of database connection in Vault

        Returns:
            Dictionary with rotation results
        """
        start_time = datetime.now()

        try:
            logger.info(f"Starting rotation for {database_name}")

            # Rotate root credentials
            self.client.write(f'database/rotate-root/{database_name}')

            end_time = datetime.now()
            duration = (end_time - start_time).total_seconds()

            result = {
                'database': database_name,
                'status': 'success',
                'timestamp': end_time.isoformat(),
                'duration_seconds': duration
            }

            logger.info(f"Rotation successful for {database_name} (took {duration}s)")
            return result

        except Exception as e:
            logger.error(f"Rotation failed for {database_name}: {e}")
            return {
                'database': database_name,
                'status': 'failed',
                'error': str(e),
                'timestamp': datetime.now().isoformat()
            }

    def verify_rotation(self, static_role: str) -> Dict:
        """
        Verify password was rotated by checking credentials

        Args:
            static_role: Name of static role

        Returns:
            Verification results
        """
        try:
            response = self.client.read(f'database/static-creds/{static_role}')

            return {
                'role': static_role,
                'username': response['data']['username'],
                'last_rotation': response['data'].get('last_vault_rotation', 'Never'),
                'rotation_period': response['data'].get('rotation_period', 0),
                'verified': True
            }

        except Exception as e:
            logger.error(f"Verification failed for {static_role}: {e}")
            return {
                'role': static_role,
                'verified': False,
                'error': str(e)
            }

    def get_rotation_schedule(self, database_name: str) -> Optional[Dict]:
        """Get rotation schedule for a database"""
        try:
            config = self.client.read(f'database/config/{database_name}')
            return config.get('data', {})
        except:
            return None


@click.command()
@click.option('--database', '-d', multiple=True, help='Database to rotate (can specify multiple)')
@click.option('--all', 'rotate_all', is_flag=True, help='Rotate all configured databases')
@click.option('--verify', is_flag=True, help='Verify rotation after completion')
@click.option('--static-role', help='Static role name for verification')
def main(database: tuple, rotate_all: bool, verify: bool, static_role: str):
    """
    Automated password rotation tool

    Examples:
        python password_rotation.py --database postgresql
        python password_rotation.py --database postgresql --database mysql
        python password_rotation.py --all --verify
    """

    print(f"\n{Fore.CYAN}{'='*60}{Style.RESET_ALL}")
    print(f"{Fore.CYAN}Password Rotation Manager{Style.RESET_ALL}")
    print(f"{Fore.CYAN}{'='*60}{Style.RESET_ALL}\n")

    try:
        manager = PasswordRotationManager()

        # Determine which databases to rotate
        databases_to_rotate = []

        if rotate_all:
            databases_to_rotate = ['postgresql', 'mysql']
        elif database:
            databases_to_rotate = list(database)
        else:
            print(f"{Fore.RED}Error: Specify --database or --all{Style.RESET_ALL}")
            sys.exit(1)

        results = []

        # Rotate each database
        for db in databases_to_rotate:
            print(f"\n{Fore.YELLOW}Rotating {db}...{Style.RESET_ALL}")

            result = manager.rotate_database_password(db)
            results.append(result)

            if result['status'] == 'success':
                print(f"{Fore.GREEN}✓ Success{Style.RESET_ALL}")
                print(f"  Duration: {result['duration_seconds']:.2f}s")
            else:
                print(f"{Fore.RED}✗ Failed{Style.RESET_ALL}")
                print(f"  Error: {result.get('error', 'Unknown')}")

        # Verification
        if verify and static_role:
            print(f"\n{Fore.YELLOW}Verifying rotation...{Style.RESET_ALL}")
            verification = manager.verify_rotation(static_role)

            if verification['verified']:
                print(f"{Fore.GREEN}✓ Verification successful{Style.RESET_ALL}")
                print(f"  Username: {verification['username']}")
                print(f"  Last Rotation: {verification['last_rotation']}")
            else:
                print(f"{Fore.RED}✗ Verification failed{Style.RESET_ALL}")

        # Summary
        print(f"\n{Fore.CYAN}{'='*60}{Style.RESET_ALL}")
        print(f"{Fore.CYAN}Summary{Style.RESET_ALL}")
        print(f"{Fore.CYAN}{'='*60}{Style.RESET_ALL}")

        success_count = sum(1 for r in results if r['status'] == 'success')
        fail_count = len(results) - success_count

        print(f"Total rotations: {len(results)}")
        print(f"{Fore.GREEN}Successful: {success_count}{Style.RESET_ALL}")
        print(f"{Fore.RED}Failed: {fail_count}{Style.RESET_ALL}\n")

        sys.exit(0 if fail_count == 0 else 1)

    except Exception as e:
        print(f"{Fore.RED}Error: {e}{Style.RESET_ALL}")
        sys.exit(1)


if __name__ == '__main__':
    main()
