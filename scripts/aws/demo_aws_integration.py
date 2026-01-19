#!/usr/bin/env python3
"""
AWS Secrets Manager Integration Demo
PAM-Vault-Lab v1.1 Enhancement - December 2025

This script demonstrates the AWS Secrets Manager integration capabilities
in mock mode (no AWS credentials required).

Features demonstrated:
- Creating and managing AWS secrets
- Bidirectional synchronization
- Secret health scoring
- Rotation handling
- Audit logging

Author: Mike Dominic
Version: 1.1.0
"""

import sys
import os
from datetime import datetime, timezone, timedelta
from colorama import Fore, Style, init

# Add parent directory to path for imports
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')))

from src.integrations import AWSSecretsConnector, SecretSyncManager, RotationEventHandler
from src.integrations.secret_sync import SyncDirection, ConflictResolution
from src.integrations.aws_secrets_connector import SecretMetadata

# Initialize colorama
init(autoreset=True)


def print_header(title: str):
    """Print a formatted section header"""
    print(f"\n{Fore.CYAN}{'='*70}{Style.RESET_ALL}")
    print(f"{Fore.CYAN}{title}{Style.RESET_ALL}")
    print(f"{Fore.CYAN}{'='*70}{Style.RESET_ALL}\n")


def print_success(message: str):
    """Print a success message"""
    print(f"{Fore.GREEN}✓ {message}{Style.RESET_ALL}")


def print_info(message: str):
    """Print an info message"""
    print(f"{Fore.YELLOW}ℹ {message}{Style.RESET_ALL}")


def demo_aws_connector():
    """Demonstrate AWS Secrets Connector functionality"""
    print_header("1. AWS Secrets Manager Connector Demo")

    # Initialize connector in mock mode
    connector = AWSSecretsConnector(mock_mode=True)
    print_success("Initialized AWS Secrets Connector in MOCK MODE")

    # Create secrets
    print_info("Creating test secrets...")

    secrets_to_create = [
        {
            'name': 'demo-database-prod',
            'value': {'username': 'admin', 'password': 'SecureP@ss123!', 'host': 'db.example.com'},
            'description': 'Production database credentials',
            'tags': {'Environment': 'Production', 'Application': 'WebApp'}
        },
        {
            'name': 'demo-api-key',
            'value': {'api_key': 'sk_test_1234567890abcdef', 'api_secret': 'secret_xyz'},
            'description': 'API credentials',
            'tags': {'Environment': 'Staging', 'Service': 'PaymentAPI'}
        },
        {
            'name': 'demo-ssh-key',
            'value': 'ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAABAQ...',
            'description': 'SSH private key',
            'tags': {'Environment': 'Production', 'Server': 'app-server-01'}
        }
    ]

    for secret_def in secrets_to_create:
        result = connector.create_secret(
            name=secret_def['name'],
            secret_value=secret_def['value'],
            description=secret_def['description'],
            tags=secret_def['tags']
        )
        print_success(f"Created secret: {result['name']}")

    # List secrets
    print_info("\nListing all secrets...")
    secrets = connector.list_secrets()
    print(f"Found {len(secrets)} secrets:")
    for secret in secrets:
        print(f"  • {secret.name} - {secret.description}")

    # Retrieve a secret
    print_info("\nRetrieving secret 'demo-database-prod'...")
    secret_data = connector.get_secret('demo-database-prod')
    print(f"  Username: {secret_data['secret_data']['username']}")
    print(f"  Host: {secret_data['secret_data']['host']}")
    print(f"  Version: {secret_data['version_id']}")

    # Update a secret
    print_info("\nUpdating secret 'demo-api-key'...")
    connector.update_secret(
        name='demo-api-key',
        secret_value={'api_key': 'sk_live_newkey123', 'api_secret': 'secret_updated'}
    )
    print_success("Secret updated")

    # Calculate health scores
    print_info("\nCalculating secret health scores...")
    for secret in secrets:
        health = connector.calculate_secret_health_score(secret)
        status_color = Fore.GREEN if health['status'] == 'excellent' else \
                      Fore.YELLOW if health['status'] == 'good' else Fore.RED

        print(f"\n  {secret.name}:")
        print(f"    Score: {status_color}{health['health_score']}/100 ({health['status']}){Style.RESET_ALL}")

        if health['issues']:
            print(f"    Issues:")
            for issue in health['issues']:
                print(f"      - {issue}")

        if health['recommendations']:
            print(f"    Recommendations:")
            for rec in health['recommendations']:
                print(f"      • {rec}")


def demo_secret_sync():
    """Demonstrate secret synchronization"""
    print_header("2. Secret Synchronization Demo")

    # Initialize sync manager in mock mode
    sync_manager = SecretSyncManager(mock_mode=True)
    print_success("Initialized Secret Sync Manager in MOCK MODE")

    # Sync from Vault to AWS
    print_info("\nSyncing secret from Vault to AWS...")
    result = sync_manager.sync_secret(
        secret_name='database/production',
        direction=SyncDirection.VAULT_TO_AWS,
        conflict_resolution=ConflictResolution.OVERWRITE_DESTINATION
    )
    print(f"  Status: {result.status}")
    print(f"  Message: {result.message}")
    print(f"  Timestamp: {result.timestamp}")

    # Sync from AWS to Vault
    print_info("\nSyncing secret from AWS to Vault...")
    result = sync_manager.sync_secret(
        secret_name='api-credentials',
        direction=SyncDirection.AWS_TO_VAULT,
        conflict_resolution=ConflictResolution.USE_NEWEST
    )
    print(f"  Status: {result.status}")
    print(f"  Message: {result.message}")

    # Batch sync
    print_info("\nPerforming batch synchronization...")
    secrets_to_sync = [
        'database/staging',
        'database/development',
        'api/payment-gateway',
        'ssh/app-servers'
    ]

    results = sync_manager.batch_sync(
        secret_names=secrets_to_sync,
        direction=SyncDirection.VAULT_TO_AWS,
        conflict_resolution=ConflictResolution.SKIP,
        dry_run=True
    )

    print(f"\nBatch sync results:")
    for result in results:
        status_color = Fore.GREEN if result.status == 'success' else \
                      Fore.YELLOW if result.status == 'skipped' else Fore.RED
        print(f"  {status_color}• {result.secret_name}: {result.status}{Style.RESET_ALL}")

    # Get sync status
    print_info("\nChecking sync status...")
    status = sync_manager.get_sync_status('database/production')
    print(f"  In Vault: {status['in_vault']}")
    print(f"  In AWS: {status['in_aws']}")
    print(f"  Synced: {status['synced']}")
    if status['conflicts']:
        print(f"  Conflicts: {', '.join(status['conflicts'])}")


def demo_rotation_handler():
    """Demonstrate rotation event handling"""
    print_header("3. Rotation Event Handler Demo")

    # Initialize rotation handler
    handler = RotationEventHandler(mock_mode=True)
    print_success("Initialized Rotation Event Handler in MOCK MODE")

    # Schedule rotation
    print_info("\nScheduling automatic rotation...")
    schedule = handler.schedule_rotation(
        secret_name='database-credentials',
        rotation_interval_days=30
    )
    print(f"  Secret: {schedule.secret_name}")
    print(f"  Interval: {schedule.rotation_interval_days} days")
    print(f"  Last rotation: {schedule.last_rotation}")
    print(f"  Next rotation: {schedule.next_rotation}")
    print(f"  Enabled: {schedule.enabled}")

    # Rotate Vault secret
    print_info("\nRotating Vault database secret...")
    result = handler.rotate_vault_secret(
        database_name='postgresql',
        notify_aws=True
    )
    print(f"  Status: {result.status.value}")
    print(f"  Message: {result.message}")
    print(f"  Duration: {result.duration_seconds:.2f}s")

    # Simulate AWS rotation event
    print_info("\nSimulating AWS Lambda rotation event...")
    aws_event = {
        'SecretId': 'arn:aws:secretsmanager:us-east-1:123456789012:secret:demo-secret',
        'ClientRequestToken': 'token-12345',
        'Step': 'createSecret'
    }

    response = handler.handle_aws_rotation_event(aws_event)
    print(f"  Status Code: {response['statusCode']}")
    print(f"  Step: createSecret")

    # Continue with remaining steps
    for step in ['setSecret', 'testSecret', 'finishSecret']:
        aws_event['Step'] = step
        response = handler.handle_aws_rotation_event(aws_event)
        print(f"  Step: {step} - Status: {response['statusCode']}")

    # Get rotation status
    print_info("\nGetting rotation status...")
    status = handler.get_rotation_status('postgresql')
    print(f"  Secret: {status['secret_name']}")
    print(f"  Last rotation: {status['last_rotation']}")
    print(f"  Last status: {status['last_status']}")
    print(f"  Success rate: {status['success_rate']:.1f}%")
    print(f"  Rotation count: {status['rotation_count']}")

    # Demonstrate rollback
    print_info("\nDemonstrating rotation rollback...")
    rollback_result = handler.rollback_rotation('postgresql')
    print(f"  Status: {rollback_result.status.value}")
    print(f"  Message: {rollback_result.message}")


def demo_export_audit():
    """Demonstrate audit log export"""
    print_header("4. Audit Trail Export Demo")

    # Create sync manager and perform operations
    sync_manager = SecretSyncManager(mock_mode=True)

    # Perform some operations to generate audit entries
    print_info("Performing operations to generate audit trail...")

    operations = [
        ('database/prod', SyncDirection.VAULT_TO_AWS),
        ('api/keys', SyncDirection.AWS_TO_VAULT),
        ('ssh/servers', SyncDirection.VAULT_TO_AWS),
    ]

    for secret, direction in operations:
        sync_manager.sync_secret(secret, direction)
        print(f"  • Synced {secret} ({direction.value})")

    # Export audit log
    output_file = 'sync_audit_log.json'
    print_info(f"\nExporting audit log to {output_file}...")
    sync_manager.export_audit_log(output_file)
    print_success(f"Audit log exported successfully")
    print(f"  File: {os.path.abspath(output_file)}")
    print(f"  Entries: {len(sync_manager.audit_log)}")

    # Export rotation history
    handler = RotationEventHandler(mock_mode=True)
    handler.rotate_vault_secret('mysql', notify_aws=True)

    rotation_file = 'rotation_history.json'
    print_info(f"\nExporting rotation history to {rotation_file}...")
    handler.export_rotation_history(rotation_file)
    print_success(f"Rotation history exported successfully")
    print(f"  File: {os.path.abspath(rotation_file)}")
    print(f"  Entries: {len(handler.rotation_history)}")


def main():
    """Run all demonstrations"""
    print(f"\n{Fore.CYAN}{'='*70}{Style.RESET_ALL}")
    print(f"{Fore.CYAN}PAM-Vault-Lab v1.1 - AWS Secrets Manager Integration Demo{Style.RESET_ALL}")
    print(f"{Fore.CYAN}{'='*70}{Style.RESET_ALL}")
    print(f"\n{Fore.YELLOW}Running in MOCK MODE - No AWS credentials required{Style.RESET_ALL}")
    print(f"{Fore.YELLOW}All operations are simulated for demonstration purposes{Style.RESET_ALL}")

    try:
        # Run all demos
        demo_aws_connector()
        demo_secret_sync()
        demo_rotation_handler()
        demo_export_audit()

        # Success summary
        print_header("Demo Completed Successfully!")
        print_success("All AWS integration features demonstrated")
        print_info("\nNext Steps:")
        print("  1. Review the generated audit logs (sync_audit_log.json, rotation_history.json)")
        print("  2. Configure real AWS credentials to use production mode")
        print("  3. Integrate with your Vault instance")
        print("  4. Set up automated rotation schedules")
        print(f"\n{Fore.CYAN}For more information, see the README.md AWS Integration section{Style.RESET_ALL}\n")

    except Exception as e:
        print(f"\n{Fore.RED}Error: {e}{Style.RESET_ALL}")
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == '__main__':
    main()
