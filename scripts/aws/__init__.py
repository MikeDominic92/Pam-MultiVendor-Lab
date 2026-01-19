"""
PAM-Vault-Lab AWS Integrations Module
Version 1.1 - December 2025 Enhancement

This module provides AWS Secrets Manager integration capabilities for the PAM-Vault-Lab project.
Enables bidirectional secret synchronization, rotation handling, and audit tracking.

Author: Mike Dominic
Version: 1.1.0
Created: December 2025
"""

from .aws_secrets_connector import AWSSecretsConnector
from .secret_sync import SecretSyncManager
from .rotation_handler import RotationEventHandler

__all__ = [
    'AWSSecretsConnector',
    'SecretSyncManager',
    'RotationEventHandler'
]

__version__ = '1.1.0'
__author__ = 'Mike Dominic'
