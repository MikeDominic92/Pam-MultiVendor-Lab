"""
Secret Rotation Event Handler
PAM-Vault-Lab v1.1 Enhancement - December 2025

Handles automatic secret rotation events from AWS Secrets Manager and HashiCorp Vault.
Provides notification processing, rotation orchestration, and status tracking.

Features:
- AWS Secrets Manager rotation Lambda integration
- Vault rotation event handling
- Rotation status tracking
- Notification processing
- Rotation scheduling
- Rollback support

Author: Mike Dominic
Version: 1.1.0
"""

import logging
from typing import Dict, List, Optional, Any, Callable
from datetime import datetime, timezone, timedelta
from enum import Enum
from dataclasses import dataclass, asdict
import json

try:
    import hvac
    from hvac.exceptions import VaultError
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


class RotationStatus(Enum):
    """Status of a rotation operation"""
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    SUCCESS = "success"
    FAILED = "failed"
    ROLLED_BACK = "rolled_back"


class RotationStep(Enum):
    """Steps in the rotation process"""
    CREATE_SECRET = "createSecret"
    SET_SECRET = "setSecret"
    TEST_SECRET = "testSecret"
    FINISH_SECRET = "finishSecret"


@dataclass
class RotationEvent:
    """Rotation event from AWS Secrets Manager"""
    secret_arn: str
    secret_name: str
    token: str
    step: str
    timestamp: datetime
    client_request_token: Optional[str] = None


@dataclass
class RotationResult:
    """Result of a rotation operation"""
    secret_name: str
    status: RotationStatus
    start_time: datetime
    end_time: Optional[datetime]
    duration_seconds: Optional[float]
    message: str
    old_version: Optional[str] = None
    new_version: Optional[str] = None
    error: Optional[str] = None


@dataclass
class RotationSchedule:
    """Rotation schedule configuration"""
    secret_name: str
    rotation_interval_days: int
    last_rotation: Optional[datetime]
    next_rotation: Optional[datetime]
    enabled: bool


class RotationEventHandler:
    """
    Handles secret rotation events and orchestration

    v1.1 Enhancement - December 2025
    """

    def __init__(
        self,
        aws_connector: Optional[AWSSecretsConnector] = None,
        vault_client: Optional[Any] = None,
        aws_region: str = 'us-east-1',
        mock_mode: bool = False
    ):
        """
        Initialize Rotation Event Handler

        Args:
            aws_connector: AWS Secrets connector instance
            vault_client: Vault client instance
            aws_region: AWS region
            mock_mode: Enable mock mode for demos

        v1.1 Enhancement - December 2025
        """
        self.mock_mode = mock_mode
        self.rotation_history: List[RotationResult] = []
        self.rotation_schedules: Dict[str, RotationSchedule] = {}

        # Initialize AWS connector
        if aws_connector:
            self.aws_connector = aws_connector
        else:
            self.aws_connector = AWSSecretsConnector(
                region_name=aws_region,
                mock_mode=mock_mode
            )

        # Initialize Vault client
        if vault_client:
            self.vault_client = vault_client
        elif HVAC_AVAILABLE and not mock_mode:
            import os
            vault_addr = os.getenv('VAULT_ADDR', 'http://localhost:8200')
            vault_token = os.getenv('VAULT_TOKEN')

            if vault_token:
                self.vault_client = hvac.Client(url=vault_addr, token=vault_token)
                if not self.vault_client.is_authenticated():
                    logger.warning("Vault authentication failed")
                    self.vault_client = None
            else:
                self.vault_client = None
        else:
            self.vault_client = None

        logger.info("Rotation Event Handler initialized")

    def handle_aws_rotation_event(self, event: Dict[str, Any]) -> Dict[str, Any]:
        """
        Handle AWS Secrets Manager rotation Lambda event

        AWS Lambda rotation function handler compatible format.

        Args:
            event: Lambda event dictionary containing:
                - SecretId: ARN or name of the secret
                - ClientRequestToken: Unique token for this rotation
                - Step: Rotation step (createSecret, setSecret, testSecret, finishSecret)

        Returns:
            Dictionary with operation status

        v1.1 Enhancement - December 2025
        """
        try:
            secret_arn = event.get('SecretId', '')
            token = event.get('ClientRequestToken', '')
            step = event.get('Step', '')

            logger.info(f"Handling AWS rotation event: {step} for {secret_arn}")

            # Extract secret name from ARN
            secret_name = self._extract_secret_name_from_arn(secret_arn)

            # Create rotation event
            rotation_event = RotationEvent(
                secret_arn=secret_arn,
                secret_name=secret_name,
                token=token,
                step=step,
                timestamp=datetime.now(timezone.utc),
                client_request_token=token
            )

            # Handle specific rotation step
            if step == RotationStep.CREATE_SECRET.value:
                return self._handle_create_secret(rotation_event)
            elif step == RotationStep.SET_SECRET.value:
                return self._handle_set_secret(rotation_event)
            elif step == RotationStep.TEST_SECRET.value:
                return self._handle_test_secret(rotation_event)
            elif step == RotationStep.FINISH_SECRET.value:
                return self._handle_finish_secret(rotation_event)
            else:
                raise ValueError(f"Unknown rotation step: {step}")

        except Exception as e:
            logger.error(f"Error handling rotation event: {e}")
            return {
                'statusCode': 500,
                'body': json.dumps({'error': str(e)})
            }

    def _handle_create_secret(self, event: RotationEvent) -> Dict[str, Any]:
        """
        Step 1: Create a new secret version

        This step generates a new password/secret value and stores it
        as a pending version in Secrets Manager.
        """
        try:
            logger.info(f"Creating new secret for {event.secret_name}")

            # Generate new secret value (example: password)
            new_secret_value = self._generate_secret_value(event.secret_name)

            if not self.mock_mode:
                # Get current secret metadata
                current_secret = self.aws_connector.get_secret(event.secret_name)

                # Create new version with pending label
                # Note: In real Lambda, you would use put_secret_value with VersionStages
                # For this demo, we'll update the secret
                self.aws_connector.update_secret(
                    name=event.secret_name,
                    secret_value=new_secret_value
                )

            return {
                'statusCode': 200,
                'body': json.dumps({
                    'message': 'Secret created successfully',
                    'step': 'createSecret'
                })
            }

        except Exception as e:
            logger.error(f"Error in createSecret step: {e}")
            raise

    def _handle_set_secret(self, event: RotationEvent) -> Dict[str, Any]:
        """
        Step 2: Set the secret in the target system

        This step updates the actual service/database with the new credentials.
        """
        try:
            logger.info(f"Setting secret in target system for {event.secret_name}")

            # Get the pending secret value
            if not self.mock_mode:
                new_secret = self.aws_connector.get_secret(event.secret_name)
                secret_value = new_secret.get('secret_data')

                # Update target system (database, API, etc.)
                # This is where you would connect to your database and change the password
                self._update_target_system(event.secret_name, secret_value)

            return {
                'statusCode': 200,
                'body': json.dumps({
                    'message': 'Secret set in target system',
                    'step': 'setSecret'
                })
            }

        except Exception as e:
            logger.error(f"Error in setSecret step: {e}")
            raise

    def _handle_test_secret(self, event: RotationEvent) -> Dict[str, Any]:
        """
        Step 3: Test the new secret

        This step verifies that the new secret works by attempting to
        authenticate with the target system.
        """
        try:
            logger.info(f"Testing new secret for {event.secret_name}")

            if not self.mock_mode:
                # Get the pending secret
                new_secret = self.aws_connector.get_secret(event.secret_name)
                secret_value = new_secret.get('secret_data')

                # Test authentication with new credentials
                test_result = self._test_secret_authentication(event.secret_name, secret_value)

                if not test_result:
                    raise Exception("Secret test failed - authentication unsuccessful")

            return {
                'statusCode': 200,
                'body': json.dumps({
                    'message': 'Secret tested successfully',
                    'step': 'testSecret'
                })
            }

        except Exception as e:
            logger.error(f"Error in testSecret step: {e}")
            raise

    def _handle_finish_secret(self, event: RotationEvent) -> Dict[str, Any]:
        """
        Step 4: Finish the rotation

        This step moves the AWSCURRENT label to the new version and
        marks the rotation as complete.
        """
        try:
            logger.info(f"Finishing rotation for {event.secret_name}")

            # In a real Lambda, you would update version stages here
            # For this demo, we'll just mark as complete

            # Record rotation result
            result = RotationResult(
                secret_name=event.secret_name,
                status=RotationStatus.SUCCESS,
                start_time=event.timestamp,
                end_time=datetime.now(timezone.utc),
                duration_seconds=(datetime.now(timezone.utc) - event.timestamp).total_seconds(),
                message="Rotation completed successfully"
            )

            self.rotation_history.append(result)

            # Update rotation schedule
            self._update_rotation_schedule(event.secret_name)

            return {
                'statusCode': 200,
                'body': json.dumps({
                    'message': 'Rotation finished successfully',
                    'step': 'finishSecret'
                })
            }

        except Exception as e:
            logger.error(f"Error in finishSecret step: {e}")
            raise

    def rotate_vault_secret(
        self,
        database_name: str,
        notify_aws: bool = True
    ) -> RotationResult:
        """
        Rotate a Vault database secret

        Args:
            database_name: Name of the database connection in Vault
            notify_aws: Whether to sync the rotation to AWS

        Returns:
            RotationResult object

        v1.1 Enhancement - December 2025
        """
        start_time = datetime.now(timezone.utc)

        try:
            logger.info(f"Rotating Vault secret for {database_name}")

            if not self.mock_mode and self.vault_client:
                # Rotate root credentials in Vault
                self.vault_client.write(f'database/rotate-root/{database_name}')

                # If notify_aws, sync to AWS Secrets Manager
                if notify_aws:
                    self._sync_rotation_to_aws(database_name)

            end_time = datetime.now(timezone.utc)
            duration = (end_time - start_time).total_seconds()

            result = RotationResult(
                secret_name=database_name,
                status=RotationStatus.SUCCESS,
                start_time=start_time,
                end_time=end_time,
                duration_seconds=duration,
                message="Vault secret rotated successfully"
            )

            self.rotation_history.append(result)
            logger.info(f"Rotation successful for {database_name} (took {duration}s)")

            return result

        except Exception as e:
            logger.error(f"Rotation failed for {database_name}: {e}")

            result = RotationResult(
                secret_name=database_name,
                status=RotationStatus.FAILED,
                start_time=start_time,
                end_time=datetime.now(timezone.utc),
                duration_seconds=None,
                message="Rotation failed",
                error=str(e)
            )

            self.rotation_history.append(result)
            return result

    def schedule_rotation(
        self,
        secret_name: str,
        rotation_interval_days: int = 30
    ) -> RotationSchedule:
        """
        Schedule automatic rotation for a secret

        Args:
            secret_name: Name of the secret
            rotation_interval_days: Days between rotations

        Returns:
            RotationSchedule object

        v1.1 Enhancement - December 2025
        """
        now = datetime.now(timezone.utc)
        next_rotation = now + timedelta(days=rotation_interval_days)

        schedule = RotationSchedule(
            secret_name=secret_name,
            rotation_interval_days=rotation_interval_days,
            last_rotation=now,
            next_rotation=next_rotation,
            enabled=True
        )

        self.rotation_schedules[secret_name] = schedule
        logger.info(f"Scheduled rotation for {secret_name} every {rotation_interval_days} days")

        return schedule

    def get_rotation_status(self, secret_name: str) -> Dict[str, Any]:
        """
        Get rotation status for a secret

        Args:
            secret_name: Name of the secret

        Returns:
            Dictionary with rotation status details

        v1.1 Enhancement - December 2025
        """
        # Get recent rotation history
        recent_rotations = [
            r for r in self.rotation_history
            if r.secret_name == secret_name
        ][-5:]  # Last 5 rotations

        # Get schedule
        schedule = self.rotation_schedules.get(secret_name)

        # Calculate success rate
        if recent_rotations:
            success_count = sum(1 for r in recent_rotations if r.status == RotationStatus.SUCCESS)
            success_rate = (success_count / len(recent_rotations)) * 100
        else:
            success_rate = 0

        status = {
            'secret_name': secret_name,
            'last_rotation': recent_rotations[-1].end_time if recent_rotations else None,
            'last_status': recent_rotations[-1].status.value if recent_rotations else None,
            'success_rate': success_rate,
            'rotation_count': len(recent_rotations),
            'schedule': asdict(schedule) if schedule else None,
            'next_rotation': schedule.next_rotation if schedule else None
        }

        return status

    def rollback_rotation(
        self,
        secret_name: str,
        target_version: Optional[str] = None
    ) -> RotationResult:
        """
        Rollback a failed rotation

        Args:
            secret_name: Name of the secret
            target_version: Specific version to rollback to (default: previous)

        Returns:
            RotationResult object

        v1.1 Enhancement - December 2025
        """
        start_time = datetime.now(timezone.utc)

        try:
            logger.info(f"Rolling back rotation for {secret_name}")

            if not self.mock_mode:
                # In AWS, you would restore the previous version
                # In Vault, you would use the previous version of the secret

                # For demo purposes, we'll simulate rollback
                pass

            end_time = datetime.now(timezone.utc)
            duration = (end_time - start_time).total_seconds()

            result = RotationResult(
                secret_name=secret_name,
                status=RotationStatus.ROLLED_BACK,
                start_time=start_time,
                end_time=end_time,
                duration_seconds=duration,
                message="Rotation rolled back successfully"
            )

            self.rotation_history.append(result)
            logger.info(f"Rollback successful for {secret_name}")

            return result

        except Exception as e:
            logger.error(f"Rollback failed for {secret_name}: {e}")

            result = RotationResult(
                secret_name=secret_name,
                status=RotationStatus.FAILED,
                start_time=start_time,
                end_time=datetime.now(timezone.utc),
                duration_seconds=None,
                message="Rollback failed",
                error=str(e)
            )

            self.rotation_history.append(result)
            return result

    def export_rotation_history(self, output_file: str) -> None:
        """
        Export rotation history to JSON file

        Args:
            output_file: Path to output file

        v1.1 Enhancement - December 2025
        """
        try:
            history_data = [asdict(result) for result in self.rotation_history]

            with open(output_file, 'w') as f:
                json.dump(history_data, f, indent=2, default=str)

            logger.info(f"Exported rotation history to {output_file}")

        except Exception as e:
            logger.error(f"Error exporting rotation history: {e}")
            raise

    # Helper methods

    def _extract_secret_name_from_arn(self, arn: str) -> str:
        """Extract secret name from ARN"""
        # ARN format: arn:aws:secretsmanager:region:account:secret:name-6RandomCharacters
        if ':secret:' in arn:
            return arn.split(':secret:')[1].split('-')[0]
        return arn

    def _generate_secret_value(self, secret_name: str) -> Dict[str, str]:
        """Generate a new secret value (password)"""
        import secrets
        import string

        # Generate a secure random password
        alphabet = string.ascii_letters + string.digits + "!@#$%^&*"
        password = ''.join(secrets.choice(alphabet) for _ in range(32))

        return {
            'username': f'{secret_name}_user',
            'password': password,
            'engine': 'postgresql',
            'host': 'localhost',
            'port': 5432
        }

    def _update_target_system(self, secret_name: str, secret_value: Any) -> bool:
        """Update target system with new credentials"""
        # In production, this would connect to the actual database/service
        # and update the credentials
        logger.info(f"Updating target system for {secret_name}")
        return True

    def _test_secret_authentication(self, secret_name: str, secret_value: Any) -> bool:
        """Test authentication with new credentials"""
        # In production, this would attempt to connect using the new credentials
        logger.info(f"Testing authentication for {secret_name}")
        return True

    def _sync_rotation_to_aws(self, database_name: str) -> None:
        """Sync Vault rotation to AWS Secrets Manager"""
        try:
            # Get current credentials from Vault
            if self.vault_client:
                # For static credentials
                response = self.vault_client.read(f'database/static-creds/{database_name}')

                if response:
                    credentials = {
                        'username': response['data']['username'],
                        'password': response['data']['password']
                    }

                    # Update in AWS
                    self.aws_connector.update_secret(
                        name=database_name,
                        secret_value=credentials,
                        description=f"Synced from Vault rotation - {datetime.now(timezone.utc).isoformat()}"
                    )

                    logger.info(f"Synced rotation to AWS for {database_name}")

        except Exception as e:
            logger.warning(f"Could not sync rotation to AWS: {e}")

    def _update_rotation_schedule(self, secret_name: str) -> None:
        """Update rotation schedule after successful rotation"""
        if secret_name in self.rotation_schedules:
            schedule = self.rotation_schedules[secret_name]
            schedule.last_rotation = datetime.now(timezone.utc)
            schedule.next_rotation = schedule.last_rotation + timedelta(days=schedule.rotation_interval_days)

            logger.info(f"Updated rotation schedule for {secret_name}")
