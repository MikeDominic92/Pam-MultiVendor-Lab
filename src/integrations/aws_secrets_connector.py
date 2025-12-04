"""
AWS Secrets Manager Connector
PAM-Vault-Lab v1.1 Enhancement - December 2025

This connector provides integration with AWS Secrets Manager for hybrid cloud
secret management and synchronization with HashiCorp Vault.

Features:
- Connect to AWS Secrets Manager via boto3
- CRUD operations for secrets
- Mock mode for offline demos
- Secret health scoring
- Audit logging

Author: Mike Dominic
Version: 1.1.0
"""

import os
import json
import logging
from typing import Dict, List, Optional, Any, Union
from datetime import datetime, timezone
from dataclasses import dataclass, asdict

try:
    import boto3
    from botocore.exceptions import ClientError, BotoCoreError
    BOTO3_AVAILABLE = True
except ImportError:
    BOTO3_AVAILABLE = False

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


@dataclass
class SecretMetadata:
    """Metadata for a secret in AWS Secrets Manager"""
    name: str
    arn: str
    description: Optional[str]
    last_changed: datetime
    last_accessed: Optional[datetime]
    rotation_enabled: bool
    rotation_lambda_arn: Optional[str]
    tags: Dict[str, str]
    version_id: str
    created_date: datetime


class AWSSecretsConnector:
    """
    Connector for AWS Secrets Manager integration

    Provides seamless integration between HashiCorp Vault and AWS Secrets Manager,
    enabling hybrid cloud secret management strategies.

    v1.1 Enhancement - December 2025
    """

    def __init__(
        self,
        region_name: str = 'us-east-1',
        aws_access_key_id: Optional[str] = None,
        aws_secret_access_key: Optional[str] = None,
        mock_mode: bool = False,
        profile_name: Optional[str] = None
    ):
        """
        Initialize AWS Secrets Manager connector

        Args:
            region_name: AWS region (default: us-east-1)
            aws_access_key_id: AWS access key (default: from env or credentials file)
            aws_secret_access_key: AWS secret key (default: from env or credentials file)
            mock_mode: Enable mock mode for demos without AWS credentials
            profile_name: AWS credentials profile name

        Raises:
            ValueError: If boto3 is not available and mock_mode is False
        """
        self.region_name = region_name
        self.mock_mode = mock_mode
        self._mock_secrets: Dict[str, Dict[str, Any]] = {}

        if mock_mode:
            logger.info("AWS Secrets Connector initialized in MOCK MODE")
            self.client = None
            return

        if not BOTO3_AVAILABLE:
            raise ValueError(
                "boto3 is required for AWS Secrets Manager integration. "
                "Install with: pip install boto3"
            )

        # Initialize boto3 client
        try:
            session_kwargs = {'region_name': region_name}

            if profile_name:
                session_kwargs['profile_name'] = profile_name

            if aws_access_key_id and aws_secret_access_key:
                session_kwargs['aws_access_key_id'] = aws_access_key_id
                session_kwargs['aws_secret_access_key'] = aws_secret_access_key

            session = boto3.Session(**session_kwargs)
            self.client = session.client('secretsmanager')

            # Verify connection
            self.client.list_secrets(MaxResults=1)
            logger.info(f"Connected to AWS Secrets Manager in region {region_name}")

        except (ClientError, BotoCoreError) as e:
            logger.error(f"Failed to connect to AWS Secrets Manager: {e}")
            raise

    def create_secret(
        self,
        name: str,
        secret_value: Union[str, Dict[str, Any]],
        description: Optional[str] = None,
        tags: Optional[Dict[str, str]] = None
    ) -> Dict[str, str]:
        """
        Create a new secret in AWS Secrets Manager

        Args:
            name: Secret name
            secret_value: Secret value (string or dict)
            description: Secret description
            tags: Key-value tags for the secret

        Returns:
            Dictionary with ARN, Name, and VersionId

        v1.1 Enhancement - December 2025
        """
        if self.mock_mode:
            return self._mock_create_secret(name, secret_value, description, tags)

        try:
            # Prepare secret string
            if isinstance(secret_value, dict):
                secret_string = json.dumps(secret_value)
            else:
                secret_string = str(secret_value)

            # Prepare tags
            tag_list = []
            if tags:
                tag_list = [{'Key': k, 'Value': v} for k, v in tags.items()]

            # Add v1.1 enhancement tag
            tag_list.append({'Key': 'PAM-Vault-Lab-Version', 'Value': 'v1.1'})
            tag_list.append({'Key': 'Created-By', 'Value': 'PAM-Vault-Lab'})

            # Create secret
            kwargs = {
                'Name': name,
                'SecretString': secret_string,
                'Tags': tag_list
            }

            if description:
                kwargs['Description'] = description

            response = self.client.create_secret(**kwargs)

            logger.info(f"Created secret: {name}")

            return {
                'arn': response['ARN'],
                'name': response['Name'],
                'version_id': response['VersionId']
            }

        except ClientError as e:
            error_code = e.response['Error']['Code']
            if error_code == 'ResourceExistsException':
                logger.warning(f"Secret {name} already exists")
                raise ValueError(f"Secret {name} already exists")
            logger.error(f"Error creating secret {name}: {e}")
            raise

    def get_secret(self, name: str, version_id: Optional[str] = None) -> Dict[str, Any]:
        """
        Retrieve a secret from AWS Secrets Manager

        Args:
            name: Secret name or ARN
            version_id: Specific version to retrieve (default: latest)

        Returns:
            Dictionary containing secret data and metadata

        v1.1 Enhancement - December 2025
        """
        if self.mock_mode:
            return self._mock_get_secret(name, version_id)

        try:
            kwargs = {'SecretId': name}
            if version_id:
                kwargs['VersionId'] = version_id

            response = self.client.get_secret_value(**kwargs)

            # Parse secret value
            secret_data = response.get('SecretString')
            if secret_data:
                try:
                    secret_data = json.loads(secret_data)
                except json.JSONDecodeError:
                    pass  # Keep as string if not JSON

            logger.info(f"Retrieved secret: {name}")

            return {
                'name': response['Name'],
                'arn': response['ARN'],
                'version_id': response['VersionId'],
                'secret_data': secret_data,
                'created_date': response['CreatedDate'],
                'last_accessed': datetime.now(timezone.utc)
            }

        except ClientError as e:
            error_code = e.response['Error']['Code']
            if error_code == 'ResourceNotFoundException':
                logger.error(f"Secret not found: {name}")
                raise ValueError(f"Secret {name} not found")
            logger.error(f"Error retrieving secret {name}: {e}")
            raise

    def update_secret(
        self,
        name: str,
        secret_value: Union[str, Dict[str, Any]],
        description: Optional[str] = None
    ) -> Dict[str, str]:
        """
        Update an existing secret in AWS Secrets Manager

        Args:
            name: Secret name or ARN
            secret_value: New secret value
            description: Updated description

        Returns:
            Dictionary with ARN, Name, and VersionId

        v1.1 Enhancement - December 2025
        """
        if self.mock_mode:
            return self._mock_update_secret(name, secret_value, description)

        try:
            # Prepare secret string
            if isinstance(secret_value, dict):
                secret_string = json.dumps(secret_value)
            else:
                secret_string = str(secret_value)

            kwargs = {
                'SecretId': name,
                'SecretString': secret_string
            }

            if description:
                kwargs['Description'] = description

            response = self.client.update_secret(**kwargs)

            logger.info(f"Updated secret: {name}")

            return {
                'arn': response['ARN'],
                'name': response['Name'],
                'version_id': response['VersionId']
            }

        except ClientError as e:
            logger.error(f"Error updating secret {name}: {e}")
            raise

    def delete_secret(
        self,
        name: str,
        recovery_window_days: int = 30,
        force_delete: bool = False
    ) -> Dict[str, Any]:
        """
        Delete a secret from AWS Secrets Manager

        Args:
            name: Secret name or ARN
            recovery_window_days: Days before permanent deletion (7-30)
            force_delete: Immediately delete without recovery window

        Returns:
            Dictionary with deletion details

        v1.1 Enhancement - December 2025
        """
        if self.mock_mode:
            return self._mock_delete_secret(name)

        try:
            kwargs = {'SecretId': name}

            if force_delete:
                kwargs['ForceDeleteWithoutRecovery'] = True
            else:
                kwargs['RecoveryWindowInDays'] = recovery_window_days

            response = self.client.delete_secret(**kwargs)

            logger.info(f"Deleted secret: {name}")

            return {
                'arn': response['ARN'],
                'name': response['Name'],
                'deletion_date': response.get('DeletionDate')
            }

        except ClientError as e:
            logger.error(f"Error deleting secret {name}: {e}")
            raise

    def list_secrets(
        self,
        max_results: int = 100,
        filters: Optional[List[Dict[str, Any]]] = None
    ) -> List[SecretMetadata]:
        """
        List secrets in AWS Secrets Manager

        Args:
            max_results: Maximum number of results to return
            filters: List of filter dictionaries

        Returns:
            List of SecretMetadata objects

        v1.1 Enhancement - December 2025
        """
        if self.mock_mode:
            return self._mock_list_secrets()

        try:
            kwargs = {'MaxResults': max_results}
            if filters:
                kwargs['Filters'] = filters

            response = self.client.list_secrets(**kwargs)

            secrets = []
            for secret in response.get('SecretList', []):
                metadata = SecretMetadata(
                    name=secret['Name'],
                    arn=secret['ARN'],
                    description=secret.get('Description'),
                    last_changed=secret.get('LastChangedDate'),
                    last_accessed=secret.get('LastAccessedDate'),
                    rotation_enabled=secret.get('RotationEnabled', False),
                    rotation_lambda_arn=secret.get('RotationLambdaARN'),
                    tags={t['Key']: t['Value'] for t in secret.get('Tags', [])},
                    version_id=secret.get('VersionId', ''),
                    created_date=secret.get('CreatedDate')
                )
                secrets.append(metadata)

            logger.info(f"Listed {len(secrets)} secrets")
            return secrets

        except ClientError as e:
            logger.error(f"Error listing secrets: {e}")
            raise

    def calculate_secret_health_score(self, secret_metadata: SecretMetadata) -> Dict[str, Any]:
        """
        Calculate health/staleness score for a secret

        Scoring criteria:
        - Last changed date (staleness)
        - Rotation enabled
        - Access patterns
        - Tag completeness

        Args:
            secret_metadata: SecretMetadata object

        Returns:
            Dictionary with health score and recommendations

        v1.1 Enhancement - December 2025
        """
        score = 100
        issues = []
        recommendations = []

        # Check staleness (last changed)
        if secret_metadata.last_changed:
            days_old = (datetime.now(timezone.utc) - secret_metadata.last_changed).days

            if days_old > 365:
                score -= 40
                issues.append(f"Secret is {days_old} days old (very stale)")
                recommendations.append("Rotate secret immediately")
            elif days_old > 180:
                score -= 25
                issues.append(f"Secret is {days_old} days old (stale)")
                recommendations.append("Schedule secret rotation")
            elif days_old > 90:
                score -= 10
                issues.append(f"Secret is {days_old} days old")
                recommendations.append("Consider rotating secret")

        # Check rotation enabled
        if not secret_metadata.rotation_enabled:
            score -= 20
            issues.append("Automatic rotation not enabled")
            recommendations.append("Enable automatic rotation")

        # Check tags
        required_tags = ['Environment', 'Owner', 'Application']
        missing_tags = [tag for tag in required_tags if tag not in secret_metadata.tags]
        if missing_tags:
            score -= 10
            issues.append(f"Missing tags: {', '.join(missing_tags)}")
            recommendations.append("Add required tags for better organization")

        # Determine health status
        if score >= 90:
            status = "excellent"
        elif score >= 75:
            status = "good"
        elif score >= 50:
            status = "fair"
        else:
            status = "poor"

        return {
            'secret_name': secret_metadata.name,
            'health_score': max(0, score),
            'status': status,
            'issues': issues,
            'recommendations': recommendations,
            'last_changed_days': (datetime.now(timezone.utc) - secret_metadata.last_changed).days if secret_metadata.last_changed else None,
            'rotation_enabled': secret_metadata.rotation_enabled
        }

    # Mock mode implementations for demo purposes

    def _mock_create_secret(
        self,
        name: str,
        secret_value: Union[str, Dict[str, Any]],
        description: Optional[str],
        tags: Optional[Dict[str, str]]
    ) -> Dict[str, str]:
        """Mock implementation for demo mode"""
        if name in self._mock_secrets:
            raise ValueError(f"Secret {name} already exists")

        self._mock_secrets[name] = {
            'secret_value': secret_value,
            'description': description,
            'tags': tags or {},
            'version_id': 'v1',
            'created': datetime.now(timezone.utc),
            'last_changed': datetime.now(timezone.utc)
        }

        return {
            'arn': f'arn:aws:secretsmanager:us-east-1:123456789012:secret:{name}',
            'name': name,
            'version_id': 'v1'
        }

    def _mock_get_secret(self, name: str, version_id: Optional[str]) -> Dict[str, Any]:
        """Mock implementation for demo mode"""
        if name not in self._mock_secrets:
            raise ValueError(f"Secret {name} not found")

        secret = self._mock_secrets[name]
        return {
            'name': name,
            'arn': f'arn:aws:secretsmanager:us-east-1:123456789012:secret:{name}',
            'version_id': secret['version_id'],
            'secret_data': secret['secret_value'],
            'created_date': secret['created'],
            'last_accessed': datetime.now(timezone.utc)
        }

    def _mock_update_secret(
        self,
        name: str,
        secret_value: Union[str, Dict[str, Any]],
        description: Optional[str]
    ) -> Dict[str, str]:
        """Mock implementation for demo mode"""
        if name not in self._mock_secrets:
            raise ValueError(f"Secret {name} not found")

        self._mock_secrets[name]['secret_value'] = secret_value
        self._mock_secrets[name]['last_changed'] = datetime.now(timezone.utc)

        if description:
            self._mock_secrets[name]['description'] = description

        return {
            'arn': f'arn:aws:secretsmanager:us-east-1:123456789012:secret:{name}',
            'name': name,
            'version_id': 'v2'
        }

    def _mock_delete_secret(self, name: str) -> Dict[str, Any]:
        """Mock implementation for demo mode"""
        if name not in self._mock_secrets:
            raise ValueError(f"Secret {name} not found")

        del self._mock_secrets[name]

        return {
            'arn': f'arn:aws:secretsmanager:us-east-1:123456789012:secret:{name}',
            'name': name,
            'deletion_date': datetime.now(timezone.utc)
        }

    def _mock_list_secrets(self) -> List[SecretMetadata]:
        """Mock implementation for demo mode"""
        secrets = []
        for name, data in self._mock_secrets.items():
            metadata = SecretMetadata(
                name=name,
                arn=f'arn:aws:secretsmanager:us-east-1:123456789012:secret:{name}',
                description=data.get('description'),
                last_changed=data['last_changed'],
                last_accessed=None,
                rotation_enabled=False,
                rotation_lambda_arn=None,
                tags=data.get('tags', {}),
                version_id=data['version_id'],
                created_date=data['created']
            )
            secrets.append(metadata)

        return secrets
