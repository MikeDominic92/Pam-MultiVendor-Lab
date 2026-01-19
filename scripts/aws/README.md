# AWS Secrets Manager Integration Module

**PAM-Vault-Lab v1.1 Enhancement - December 2025**

This module provides comprehensive integration between HashiCorp Vault and AWS Secrets Manager, enabling hybrid cloud secret management strategies.

## Overview

The AWS integration module consists of three main components:

1. **AWS Secrets Connector** - Direct interface to AWS Secrets Manager
2. **Secret Sync Manager** - Bidirectional synchronization between Vault and AWS
3. **Rotation Event Handler** - Automated secret rotation orchestration

## Module Files

### `__init__.py`
Module initialization and public API exports.

### `aws_secrets_connector.py` (556 lines)
Core AWS Secrets Manager connector with full CRUD operations.

**Key Features:**
- Create, read, update, delete secrets in AWS Secrets Manager
- Mock mode for offline demos (no AWS credentials required)
- Secret health/staleness scoring algorithm
- Comprehensive error handling
- Type hints and docstrings
- Audit logging

**Main Class:**
```python
class AWSSecretsConnector:
    def __init__(self, region_name='us-east-1', mock_mode=False)
    def create_secret(name, secret_value, description, tags)
    def get_secret(name, version_id=None)
    def update_secret(name, secret_value, description)
    def delete_secret(name, recovery_window_days=30)
    def list_secrets(max_results=100, filters=None)
    def calculate_secret_health_score(secret_metadata)
```

### `secret_sync.py` (565 lines)
Bidirectional secret synchronization manager.

**Key Features:**
- Multiple sync directions (Vault→AWS, AWS→Vault, Bidirectional)
- Conflict detection and resolution strategies
- Batch synchronization support
- Dry-run mode for testing
- Sync status tracking
- Audit trail with JSON export

**Main Class:**
```python
class SecretSyncManager:
    def __init__(self, vault_client=None, aws_connector=None, mock_mode=False)
    def sync_secret(secret_name, direction, conflict_resolution, dry_run)
    def batch_sync(secret_names, direction, conflict_resolution, dry_run)
    def get_sync_status(secret_name)
    def export_audit_log(output_file)
```

**Enums:**
- `SyncDirection`: VAULT_TO_AWS, AWS_TO_VAULT, BIDIRECTIONAL
- `ConflictResolution`: OVERWRITE_DESTINATION, SKIP, USE_NEWEST, MANUAL

### `rotation_handler.py` (641 lines)
Automated secret rotation event handler.

**Key Features:**
- AWS Lambda-compatible rotation event processing
- 4-step rotation workflow (create, set, test, finish)
- Vault database rotation integration
- Rotation scheduling and tracking
- Success rate calculation
- Rollback support for failed rotations
- Rotation history export

**Main Class:**
```python
class RotationEventHandler:
    def __init__(self, aws_connector=None, vault_client=None, mock_mode=False)
    def handle_aws_rotation_event(event)
    def rotate_vault_secret(database_name, notify_aws)
    def schedule_rotation(secret_name, rotation_interval_days)
    def get_rotation_status(secret_name)
    def rollback_rotation(secret_name, target_version)
    def export_rotation_history(output_file)
```

**Enums:**
- `RotationStatus`: PENDING, IN_PROGRESS, SUCCESS, FAILED, ROLLED_BACK
- `RotationStep`: CREATE_SECRET, SET_SECRET, TEST_SECRET, FINISH_SECRET

### `demo_aws_integration.py` (335 lines)
Comprehensive demonstration script showcasing all features in mock mode.

**Demonstrates:**
- AWS Secrets Manager operations
- Secret synchronization
- Rotation handling
- Audit logging
- Health scoring

## Installation

### Install Dependencies

```bash
pip install -r automation/python/requirements.txt
```

**Required Packages:**
- `boto3>=1.34.51` - AWS SDK for Python
- `botocore>=1.34.51` - Low-level AWS SDK
- `hvac>=2.1.0` - HashiCorp Vault client

## Quick Start

### Mock Mode (No AWS Credentials)

Perfect for demos, testing, and development:

```python
from src.integrations import AWSSecretsConnector, SecretSyncManager

# Initialize in mock mode
connector = AWSSecretsConnector(mock_mode=True)

# Create a secret
connector.create_secret(
    name='my-secret',
    secret_value={'username': 'admin', 'password': 'secure123'},
    description='Demo credentials'
)

# Retrieve the secret
secret = connector.get_secret('my-secret')
print(secret['secret_data'])
```

### Production Mode (With AWS Credentials)

```python
import os
from src.integrations import AWSSecretsConnector

# Set AWS credentials
os.environ['AWS_ACCESS_KEY_ID'] = 'your-access-key'
os.environ['AWS_SECRET_ACCESS_KEY'] = 'your-secret-key'

# Initialize connector
connector = AWSSecretsConnector(region_name='us-east-1')

# Use real AWS Secrets Manager
connector.create_secret(
    name='prod-database',
    secret_value={'username': 'admin', 'password': 'P@ssw0rd!'},
    tags={'Environment': 'Production'}
)
```

## Usage Examples

### 1. AWS Secrets Manager Operations

```python
from src.integrations import AWSSecretsConnector

connector = AWSSecretsConnector(mock_mode=True)

# Create
result = connector.create_secret(
    name='api-credentials',
    secret_value={'api_key': 'key123', 'api_secret': 'secret456'},
    tags={'Service': 'PaymentAPI'}
)

# Read
secret = connector.get_secret('api-credentials')

# Update
connector.update_secret(
    name='api-credentials',
    secret_value={'api_key': 'new_key', 'api_secret': 'new_secret'}
)

# Delete
connector.delete_secret('api-credentials', recovery_window_days=7)

# List all secrets
secrets = connector.list_secrets()
for secret_metadata in secrets:
    print(f"{secret_metadata.name}: {secret_metadata.description}")
```

### 2. Secret Synchronization

```python
from src.integrations import SecretSyncManager
from src.integrations.secret_sync import SyncDirection, ConflictResolution

sync_manager = SecretSyncManager(mock_mode=True)

# Sync single secret from Vault to AWS
result = sync_manager.sync_secret(
    secret_name='database/production',
    direction=SyncDirection.VAULT_TO_AWS,
    conflict_resolution=ConflictResolution.OVERWRITE_DESTINATION
)

# Batch sync multiple secrets
results = sync_manager.batch_sync(
    secret_names=['db/prod', 'db/staging', 'api/keys'],
    direction=SyncDirection.VAULT_TO_AWS,
    dry_run=True  # Test first
)

# Check sync status
status = sync_manager.get_sync_status('database/production')
print(f"Synced: {status['synced']}")
```

### 3. Rotation Handling

```python
from src.integrations import RotationEventHandler

handler = RotationEventHandler(mock_mode=True)

# Schedule automatic rotation
schedule = handler.schedule_rotation(
    secret_name='database-credentials',
    rotation_interval_days=30
)

# Rotate a Vault database secret
result = handler.rotate_vault_secret(
    database_name='postgresql',
    notify_aws=True
)

# Get rotation status
status = handler.get_rotation_status('postgresql')
print(f"Success rate: {status['success_rate']}%")

# Rollback if needed
rollback_result = handler.rollback_rotation('postgresql')
```

### 4. Health Scoring

```python
from src.integrations import AWSSecretsConnector

connector = AWSSecretsConnector(mock_mode=True)

# Get all secrets
secrets = connector.list_secrets()

# Calculate health scores
for secret_metadata in secrets:
    health = connector.calculate_secret_health_score(secret_metadata)

    print(f"{secret_metadata.name}:")
    print(f"  Score: {health['health_score']}/100")
    print(f"  Status: {health['status']}")

    if health['issues']:
        print("  Issues:")
        for issue in health['issues']:
            print(f"    - {issue}")

    if health['recommendations']:
        print("  Recommendations:")
        for rec in health['recommendations']:
            print(f"    • {rec}")
```

### 5. Audit Trail

```python
from src.integrations import SecretSyncManager

sync_manager = SecretSyncManager(mock_mode=True)

# Perform some sync operations
sync_manager.sync_secret('secret1', SyncDirection.VAULT_TO_AWS)
sync_manager.sync_secret('secret2', SyncDirection.AWS_TO_VAULT)

# Export audit log
sync_manager.export_audit_log('sync_audit.json')

# Audit log contains:
# - Operation type
# - Secret name
# - Direction
# - Status (success/failed)
# - Timestamp
# - User
# - Details
```

## Running the Demo

Run the comprehensive demo script:

```bash
cd /path/to/pam-vault-lab
python src/integrations/demo_aws_integration.py
```

The demo runs entirely in mock mode and demonstrates:
- AWS Secrets Manager CRUD operations
- Bidirectional synchronization
- Rotation event handling
- Health scoring
- Audit log export

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                  PAM-Vault-Lab v1.1                      │
│                                                           │
│  ┌──────────────┐         ┌──────────────┐              │
│  │  HashiCorp   │◄───────►│  AWS Secrets │              │
│  │    Vault     │   Sync  │   Manager    │              │
│  └──────────────┘         └──────────────┘              │
│         │                        │                       │
│         │                        │                       │
│  ┌──────▼──────────────────────▼─────┐                 │
│  │   Secret Sync Manager              │                 │
│  │  - Bidirectional sync              │                 │
│  │  - Conflict resolution             │                 │
│  │  - Audit logging                   │                 │
│  └────────────────────────────────────┘                 │
│                                                           │
│  ┌────────────────────────────────────┐                 │
│  │   Rotation Event Handler           │                 │
│  │  - AWS Lambda compatible           │                 │
│  │  - Vault rotation integration      │                 │
│  │  - Rollback support                │                 │
│  └────────────────────────────────────┘                 │
│                                                           │
└───────────────────────────────────────────────────────┘
```

## Configuration

### AWS Credentials

For production use, configure AWS credentials using one of these methods:

1. **Environment Variables:**
   ```bash
   export AWS_ACCESS_KEY_ID=your-access-key
   export AWS_SECRET_ACCESS_KEY=your-secret-key
   export AWS_DEFAULT_REGION=us-east-1
   ```

2. **AWS Credentials File** (`~/.aws/credentials`):
   ```ini
   [default]
   aws_access_key_id = your-access-key
   aws_secret_access_key = your-secret-key
   ```

3. **AWS Profile:**
   ```python
   connector = AWSSecretsConnector(
       region_name='us-east-1',
       profile_name='my-profile'
   )
   ```

4. **IAM Role** (when running on AWS):
   No configuration needed - uses instance metadata

### Vault Configuration

Set Vault connection details:

```bash
export VAULT_ADDR=http://localhost:8200
export VAULT_TOKEN=your-vault-token
```

Or pass directly:

```python
sync_manager = SecretSyncManager(
    vault_addr='http://localhost:8200',
    vault_token='your-token'
)
```

## Error Handling

All modules include comprehensive error handling:

```python
from src.integrations import AWSSecretsConnector
from botocore.exceptions import ClientError

try:
    connector = AWSSecretsConnector()
    secret = connector.get_secret('my-secret')
except ValueError as e:
    print(f"Secret not found: {e}")
except ClientError as e:
    print(f"AWS error: {e}")
except Exception as e:
    print(f"Unexpected error: {e}")
```

## Testing

### Mock Mode Testing

All components support mock mode for testing without AWS:

```python
connector = AWSSecretsConnector(mock_mode=True)
sync_manager = SecretSyncManager(mock_mode=True)
handler = RotationEventHandler(mock_mode=True)
```

### Integration Testing

```python
# Test sync operation
def test_sync():
    manager = SecretSyncManager(mock_mode=True)
    result = manager.sync_secret(
        'test-secret',
        SyncDirection.VAULT_TO_AWS,
        dry_run=True
    )
    assert result.status == 'skipped'  # Dry run
    assert 'Would create' in result.message
```

## Logging

All modules use Python's `logging` module:

```python
import logging

# Set log level
logging.basicConfig(level=logging.DEBUG)

# Use the integration
from src.integrations import AWSSecretsConnector
connector = AWSSecretsConnector(mock_mode=True)
# Logs will show detailed operation information
```

## Security Considerations

1. **Never commit AWS credentials** to version control
2. **Use IAM roles** when running on AWS infrastructure
3. **Enable audit logging** for all sync operations
4. **Use encryption** for secrets in transit and at rest
5. **Rotate credentials regularly** using the rotation handler
6. **Review health scores** and address issues promptly

## Performance

- **Batch operations** support up to 100 secrets
- **Connection pooling** via boto3 session management
- **Retry logic** for transient AWS failures
- **Efficient filtering** for large secret lists

## Troubleshooting

### Common Issues

**Import Error:**
```
ModuleNotFoundError: No module named 'boto3'
```
Solution: `pip install boto3 botocore`

**Authentication Failed:**
```
VaultError: Authentication failed
```
Solution: Check `VAULT_TOKEN` environment variable

**AWS Credentials Not Found:**
```
NoCredentialsError: Unable to locate credentials
```
Solution: Configure AWS credentials or use mock mode

**Secret Not Found:**
```
ValueError: Secret xyz not found
```
Solution: Verify secret name and check permissions

## Contributing

Contributions welcome! Please:

1. Follow existing code style
2. Include type hints
3. Add docstrings
4. Update this README
5. Test in mock mode
6. Run linting: `flake8 src/integrations/`

## Version History

- **v1.1.0** (2025-12-04): Initial AWS integration release
  - AWS Secrets Manager connector
  - Bidirectional sync manager
  - Rotation event handler
  - Mock mode support
  - Health scoring
  - Comprehensive demos

## License

MIT License - See LICENSE file in project root

## Author

**Mike Dominic**
- GitHub: [@MikeDominic92](https://github.com/MikeDominic92)
- Portfolio: [IAM-Portfolio](https://github.com/MikeDominic92/IAM-Portfolio)

## Support

For issues, questions, or contributions:
- Open an issue on GitHub
- See [CONTRIBUTING.md](../../CONTRIBUTING.md)
- Review main project [README.md](../../README.md)

---

**PAM-Vault-Lab v1.1 - December 2025 Enhancement**
