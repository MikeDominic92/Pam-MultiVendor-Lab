"""
Secret Synchronization Manager
PAM-Vault-Lab v1.1 Enhancement - December 2025

Provides bidirectional secret synchronization between HashiCorp Vault and AWS Secrets Manager.
Enables hybrid cloud secret management with audit trail and conflict resolution.

Features:
- Bidirectional sync (Vault <-> AWS)
- Conflict detection and resolution
- Audit logging
- Sync strategies (overwrite, skip, merge)
- Batch synchronization
- Dry-run mode

Author: Mike Dominic
Version: 1.1.0
"""

import logging
from typing import Dict, List, Optional, Any, Tuple
from datetime import datetime, timezone
from enum import Enum
from dataclasses import dataclass, asdict
import json

try:
    import hvac
    from hvac.exceptions import VaultError, InvalidPath
    HVAC_AVAILABLE = True
except ImportError:
    HVAC_AVAILABLE = False

from .aws_secrets_connector import AWSSecretsConnector

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


class SyncDirection(Enum):
    """Synchronization direction"""
    VAULT_TO_AWS = "vault_to_aws"
    AWS_TO_VAULT = "aws_to_vault"
    BIDIRECTIONAL = "bidirectional"


class ConflictResolution(Enum):
    """Conflict resolution strategy"""
    OVERWRITE_DESTINATION = "overwrite_destination"
    SKIP = "skip"
    USE_NEWEST = "use_newest"
    MANUAL = "manual"


@dataclass
class SyncResult:
    """Result of a synchronization operation"""
    secret_name: str
    direction: str
    status: str  # success, failed, skipped, conflict
    message: str
    timestamp: datetime
    vault_version: Optional[int] = None
    aws_version: Optional[str] = None


@dataclass
class SyncAuditEntry:
    """Audit entry for synchronization operations"""
    operation: str
    secret_name: str
    direction: str
    status: str
    user: str
    timestamp: datetime
    details: Dict[str, Any]


class SecretSyncManager:
    """
    Manages bidirectional secret synchronization between Vault and AWS

    v1.1 Enhancement - December 2025
    """

    def __init__(
        self,
        vault_client: Optional[Any] = None,
        aws_connector: Optional[AWSSecretsConnector] = None,
        vault_addr: Optional[str] = None,
        vault_token: Optional[str] = None,
        aws_region: str = 'us-east-1',
        mock_mode: bool = False
    ):
        """
        Initialize Secret Sync Manager

        Args:
            vault_client: Existing VaultPAMClient instance (optional)
            aws_connector: Existing AWSSecretsConnector instance (optional)
            vault_addr: Vault server address
            vault_token: Vault authentication token
            aws_region: AWS region for Secrets Manager
            mock_mode: Enable mock mode for demos

        v1.1 Enhancement - December 2025
        """
        self.mock_mode = mock_mode
        self.audit_log: List[SyncAuditEntry] = []

        # Initialize Vault client
        if vault_client:
            self.vault_client = vault_client
        elif HVAC_AVAILABLE and not mock_mode:
            import os
            vault_addr = vault_addr or os.getenv('VAULT_ADDR', 'http://localhost:8200')
            vault_token = vault_token or os.getenv('VAULT_TOKEN')

            if not vault_token:
                raise ValueError("Vault token required")

            self.vault_client = hvac.Client(url=vault_addr, token=vault_token)

            if not self.vault_client.is_authenticated():
                raise VaultError("Vault authentication failed")
        else:
            self.vault_client = None

        # Initialize AWS connector
        if aws_connector:
            self.aws_connector = aws_connector
        else:
            self.aws_connector = AWSSecretsConnector(
                region_name=aws_region,
                mock_mode=mock_mode
            )

        logger.info("Secret Sync Manager initialized")

    def sync_secret(
        self,
        secret_name: str,
        direction: SyncDirection = SyncDirection.VAULT_TO_AWS,
        conflict_resolution: ConflictResolution = ConflictResolution.USE_NEWEST,
        dry_run: bool = False
    ) -> SyncResult:
        """
        Synchronize a single secret

        Args:
            secret_name: Name of the secret to sync
            direction: Sync direction
            conflict_resolution: How to handle conflicts
            dry_run: If True, only simulate the sync

        Returns:
            SyncResult object

        v1.1 Enhancement - December 2025
        """
        try:
            logger.info(f"Syncing secret '{secret_name}' ({direction.value})")

            if direction == SyncDirection.VAULT_TO_AWS:
                return self._sync_vault_to_aws(secret_name, conflict_resolution, dry_run)
            elif direction == SyncDirection.AWS_TO_VAULT:
                return self._sync_aws_to_vault(secret_name, conflict_resolution, dry_run)
            else:
                return self._sync_bidirectional(secret_name, conflict_resolution, dry_run)

        except Exception as e:
            logger.error(f"Sync failed for {secret_name}: {e}")
            return SyncResult(
                secret_name=secret_name,
                direction=direction.value,
                status="failed",
                message=str(e),
                timestamp=datetime.now(timezone.utc)
            )

    def _sync_vault_to_aws(
        self,
        secret_name: str,
        conflict_resolution: ConflictResolution,
        dry_run: bool
    ) -> SyncResult:
        """Sync from Vault to AWS Secrets Manager"""
        try:
            # Get secret from Vault
            vault_secret = self._get_vault_secret(secret_name)

            if not vault_secret:
                return SyncResult(
                    secret_name=secret_name,
                    direction="vault_to_aws",
                    status="failed",
                    message="Secret not found in Vault",
                    timestamp=datetime.now(timezone.utc)
                )

            # Check if exists in AWS
            aws_exists = self._check_aws_secret_exists(secret_name)

            if dry_run:
                action = "update" if aws_exists else "create"
                return SyncResult(
                    secret_name=secret_name,
                    direction="vault_to_aws",
                    status="skipped",
                    message=f"Dry run: Would {action} secret in AWS",
                    timestamp=datetime.now(timezone.utc),
                    vault_version=vault_secret.get('metadata', {}).get('version')
                )

            # Perform sync
            if aws_exists:
                if conflict_resolution == ConflictResolution.SKIP:
                    return SyncResult(
                        secret_name=secret_name,
                        direction="vault_to_aws",
                        status="skipped",
                        message="Secret exists in AWS, skipping per conflict resolution",
                        timestamp=datetime.now(timezone.utc)
                    )

                # Update existing secret
                result = self.aws_connector.update_secret(
                    name=secret_name,
                    secret_value=vault_secret['data']
                )
                message = "Updated secret in AWS"
            else:
                # Create new secret
                result = self.aws_connector.create_secret(
                    name=secret_name,
                    secret_value=vault_secret['data'],
                    description=f"Synced from Vault - v1.1",
                    tags={'Source': 'HashiCorp-Vault', 'SyncedBy': 'PAM-Vault-Lab'}
                )
                message = "Created secret in AWS"

            # Log audit entry
            self._log_audit(
                operation="sync",
                secret_name=secret_name,
                direction="vault_to_aws",
                status="success",
                details={
                    'aws_version': result.get('version_id'),
                    'vault_version': vault_secret.get('metadata', {}).get('version')
                }
            )

            return SyncResult(
                secret_name=secret_name,
                direction="vault_to_aws",
                status="success",
                message=message,
                timestamp=datetime.now(timezone.utc),
                vault_version=vault_secret.get('metadata', {}).get('version'),
                aws_version=result.get('version_id')
            )

        except Exception as e:
            logger.error(f"Error syncing {secret_name} from Vault to AWS: {e}")
            raise

    def _sync_aws_to_vault(
        self,
        secret_name: str,
        conflict_resolution: ConflictResolution,
        dry_run: bool
    ) -> SyncResult:
        """Sync from AWS Secrets Manager to Vault"""
        try:
            # Get secret from AWS
            aws_secret = self.aws_connector.get_secret(secret_name)

            if not aws_secret:
                return SyncResult(
                    secret_name=secret_name,
                    direction="aws_to_vault",
                    status="failed",
                    message="Secret not found in AWS",
                    timestamp=datetime.now(timezone.utc)
                )

            # Check if exists in Vault
            vault_exists = self._check_vault_secret_exists(secret_name)

            if dry_run:
                action = "update" if vault_exists else "create"
                return SyncResult(
                    secret_name=secret_name,
                    direction="aws_to_vault",
                    status="skipped",
                    message=f"Dry run: Would {action} secret in Vault",
                    timestamp=datetime.now(timezone.utc),
                    aws_version=aws_secret.get('version_id')
                )

            # Perform sync
            if vault_exists and conflict_resolution == ConflictResolution.SKIP:
                return SyncResult(
                    secret_name=secret_name,
                    direction="aws_to_vault",
                    status="skipped",
                    message="Secret exists in Vault, skipping per conflict resolution",
                    timestamp=datetime.now(timezone.utc)
                )

            # Write to Vault (KV v2)
            self._write_vault_secret(secret_name, aws_secret['secret_data'])

            # Log audit entry
            self._log_audit(
                operation="sync",
                secret_name=secret_name,
                direction="aws_to_vault",
                status="success",
                details={
                    'aws_version': aws_secret.get('version_id')
                }
            )

            return SyncResult(
                secret_name=secret_name,
                direction="aws_to_vault",
                status="success",
                message="Synced secret from AWS to Vault",
                timestamp=datetime.now(timezone.utc),
                aws_version=aws_secret.get('version_id')
            )

        except Exception as e:
            logger.error(f"Error syncing {secret_name} from AWS to Vault: {e}")
            raise

    def _sync_bidirectional(
        self,
        secret_name: str,
        conflict_resolution: ConflictResolution,
        dry_run: bool
    ) -> SyncResult:
        """Bidirectional sync with conflict detection"""
        vault_exists = self._check_vault_secret_exists(secret_name)
        aws_exists = self._check_aws_secret_exists(secret_name)

        if not vault_exists and not aws_exists:
            return SyncResult(
                secret_name=secret_name,
                direction="bidirectional",
                status="failed",
                message="Secret not found in either system",
                timestamp=datetime.now(timezone.utc)
            )

        if vault_exists and not aws_exists:
            return self._sync_vault_to_aws(secret_name, conflict_resolution, dry_run)

        if aws_exists and not vault_exists:
            return self._sync_aws_to_vault(secret_name, conflict_resolution, dry_run)

        # Both exist - conflict detection needed
        if conflict_resolution == ConflictResolution.USE_NEWEST:
            # Compare timestamps and sync from newest
            vault_secret = self._get_vault_secret(secret_name)
            aws_secret = self.aws_connector.get_secret(secret_name)

            vault_time = vault_secret.get('metadata', {}).get('created_time')
            aws_time = aws_secret.get('created_date')

            if vault_time and aws_time:
                if vault_time > aws_time.isoformat():
                    return self._sync_vault_to_aws(secret_name, ConflictResolution.OVERWRITE_DESTINATION, dry_run)
                else:
                    return self._sync_aws_to_vault(secret_name, ConflictResolution.OVERWRITE_DESTINATION, dry_run)

        return SyncResult(
            secret_name=secret_name,
            direction="bidirectional",
            status="conflict",
            message="Secret exists in both systems, manual resolution required",
            timestamp=datetime.now(timezone.utc)
        )

    def batch_sync(
        self,
        secret_names: List[str],
        direction: SyncDirection = SyncDirection.VAULT_TO_AWS,
        conflict_resolution: ConflictResolution = ConflictResolution.USE_NEWEST,
        dry_run: bool = False
    ) -> List[SyncResult]:
        """
        Synchronize multiple secrets in batch

        Args:
            secret_names: List of secret names to sync
            direction: Sync direction
            conflict_resolution: How to handle conflicts
            dry_run: If True, only simulate the sync

        Returns:
            List of SyncResult objects

        v1.1 Enhancement - December 2025
        """
        logger.info(f"Starting batch sync of {len(secret_names)} secrets")

        results = []
        for secret_name in secret_names:
            result = self.sync_secret(
                secret_name=secret_name,
                direction=direction,
                conflict_resolution=conflict_resolution,
                dry_run=dry_run
            )
            results.append(result)

        # Log summary
        success_count = sum(1 for r in results if r.status == "success")
        failed_count = sum(1 for r in results if r.status == "failed")
        skipped_count = sum(1 for r in results if r.status == "skipped")

        logger.info(
            f"Batch sync complete: {success_count} success, "
            f"{failed_count} failed, {skipped_count} skipped"
        )

        return results

    def get_sync_status(self, secret_name: str) -> Dict[str, Any]:
        """
        Get synchronization status for a secret

        Args:
            secret_name: Name of the secret

        Returns:
            Dictionary with sync status details

        v1.1 Enhancement - December 2025
        """
        vault_exists = self._check_vault_secret_exists(secret_name)
        aws_exists = self._check_aws_secret_exists(secret_name)

        status = {
            'secret_name': secret_name,
            'in_vault': vault_exists,
            'in_aws': aws_exists,
            'synced': False,
            'last_sync': None,
            'conflicts': []
        }

        if vault_exists and aws_exists:
            # Check if values match
            try:
                vault_secret = self._get_vault_secret(secret_name)
                aws_secret = self.aws_connector.get_secret(secret_name)

                # Compare data
                vault_data = vault_secret.get('data', {})
                aws_data = aws_secret.get('secret_data', {})

                status['synced'] = vault_data == aws_data

                if not status['synced']:
                    status['conflicts'].append("Secret values differ between systems")

            except Exception as e:
                logger.error(f"Error checking sync status: {e}")
                status['conflicts'].append(f"Error: {str(e)}")

        return status

    def export_audit_log(self, output_file: str) -> None:
        """
        Export audit log to JSON file

        Args:
            output_file: Path to output file

        v1.1 Enhancement - December 2025
        """
        try:
            with open(output_file, 'w') as f:
                json.dump([asdict(entry) for entry in self.audit_log], f, indent=2, default=str)

            logger.info(f"Exported audit log to {output_file}")

        except Exception as e:
            logger.error(f"Error exporting audit log: {e}")
            raise

    # Helper methods

    def _get_vault_secret(self, secret_name: str) -> Optional[Dict[str, Any]]:
        """Get secret from Vault"""
        if self.mock_mode or not self.vault_client:
            return {'data': {'mock': 'data'}, 'metadata': {'version': 1}}

        try:
            path = secret_name.replace('secret/', '')
            response = self.vault_client.secrets.kv.v2.read_secret_version(
                path=path,
                mount_point='secret'
            )
            return response
        except (InvalidPath, Exception):
            return None

    def _write_vault_secret(self, secret_name: str, data: Any) -> None:
        """Write secret to Vault"""
        if self.mock_mode or not self.vault_client:
            return

        path = secret_name.replace('secret/', '')

        # Ensure data is a dict
        if isinstance(data, str):
            data = {'value': data}

        self.vault_client.secrets.kv.v2.create_or_update_secret(
            path=path,
            secret=data,
            mount_point='secret'
        )

    def _check_vault_secret_exists(self, secret_name: str) -> bool:
        """Check if secret exists in Vault"""
        return self._get_vault_secret(secret_name) is not None

    def _check_aws_secret_exists(self, secret_name: str) -> bool:
        """Check if secret exists in AWS"""
        try:
            self.aws_connector.get_secret(secret_name)
            return True
        except (ValueError, Exception):
            return False

    def _log_audit(
        self,
        operation: str,
        secret_name: str,
        direction: str,
        status: str,
        details: Dict[str, Any]
    ) -> None:
        """Log audit entry"""
        entry = SyncAuditEntry(
            operation=operation,
            secret_name=secret_name,
            direction=direction,
            status=status,
            user="system",
            timestamp=datetime.now(timezone.utc),
            details=details
        )
        self.audit_log.append(entry)
        logger.info(f"Audit: {operation} {secret_name} ({direction}) - {status}")
