"""
Test Vault Connectivity and Basic Operations
"""

import os
import pytest
import hvac
from hvac.exceptions import VaultError


@pytest.fixture
def vault_client():
    """Create Vault client fixture"""
    vault_addr = os.getenv('VAULT_ADDR', 'http://localhost:8200')
    vault_token = os.getenv('VAULT_TOKEN', 'root-token-change-me')

    client = hvac.Client(url=vault_addr, token=vault_token)
    return client


def test_vault_connection(vault_client):
    """Test basic Vault connectivity"""
    assert vault_client.is_authenticated(), "Vault authentication failed"


def test_vault_health(vault_client):
    """Test Vault health endpoint"""
    health = vault_client.sys.read_health_status()
    assert health is not None
    # In dev mode, vault should be initialized and unsealed
    # Note: read_health_status raises exception if sealed, so if we get here, it's unsealed


def test_vault_policies(vault_client):
    """Test policy listing"""
    policies = vault_client.sys.list_policies()
    assert 'data' in policies
    assert 'policies' in policies['data']
    assert 'root' in policies['data']['policies']


def test_kv_write_read(vault_client):
    """Test KV v2 write and read"""
    test_path = 'test/connection-test'
    test_data = {
        'key1': 'value1',
        'key2': 'value2',
        'test': 'pytest'
    }

    # Write secret
    vault_client.secrets.kv.v2.create_or_update_secret(
        path=test_path,
        secret=test_data,
        mount_point='secret'
    )

    # Read secret
    response = vault_client.secrets.kv.v2.read_secret_version(
        path=test_path,
        mount_point='secret'
    )

    assert response['data']['data'] == test_data

    # Cleanup
    vault_client.secrets.kv.v2.delete_metadata_and_all_versions(
        path=test_path,
        mount_point='secret'
    )


def test_kv_versioning(vault_client):
    """Test KV v2 versioning"""
    test_path = 'test/version-test'

    # Version 1
    vault_client.secrets.kv.v2.create_or_update_secret(
        path=test_path,
        secret={'value': 'v1'},
        mount_point='secret'
    )

    # Version 2
    vault_client.secrets.kv.v2.create_or_update_secret(
        path=test_path,
        secret={'value': 'v2'},
        mount_point='secret'
    )

    # Read version 1
    v1 = vault_client.secrets.kv.v2.read_secret_version(
        path=test_path,
        version=1,
        mount_point='secret'
    )

    # Read version 2 (latest)
    v2 = vault_client.secrets.kv.v2.read_secret_version(
        path=test_path,
        mount_point='secret'
    )

    assert v1['data']['data']['value'] == 'v1'
    assert v2['data']['data']['value'] == 'v2'
    assert v1['data']['metadata']['version'] == 1
    assert v2['data']['metadata']['version'] == 2

    # Cleanup
    vault_client.secrets.kv.v2.delete_metadata_and_all_versions(
        path=test_path,
        mount_point='secret'
    )


def test_database_secrets_engine(vault_client):
    """Test database secrets engine is enabled"""
    mounts = vault_client.sys.list_mounted_secrets_engines()
    assert 'database/' in mounts['data']


def test_audit_device(vault_client):
    """Test audit device is enabled"""
    audit_devices = vault_client.sys.list_enabled_audit_devices()
    # Should have at least one audit device
    assert len(audit_devices['data']) > 0


def test_token_creation(vault_client):
    """Test token creation with policy"""
    # Create a test token
    token_response = vault_client.auth.token.create(
        policies=['default'],
        ttl='1h',
        renewable=True
    )

    assert 'auth' in token_response
    assert 'client_token' in token_response['auth']

    # Revoke the token
    vault_client.auth.token.revoke(token_response['auth']['client_token'])


def test_secret_deletion(vault_client):
    """Test secret soft delete and undelete"""
    test_path = 'test/delete-test'

    # Create secret
    vault_client.secrets.kv.v2.create_or_update_secret(
        path=test_path,
        secret={'data': 'test'},
        mount_point='secret'
    )

    # Soft delete
    vault_client.secrets.kv.v2.delete_latest_version_of_secret(
        path=test_path,
        mount_point='secret'
    )

    # Verify deleted (should raise exception or return deleted status)
    try:
        response = vault_client.secrets.kv.v2.read_secret_version(
            path=test_path,
            mount_point='secret'
        )
        # If we get here, check if it's marked as deleted
        assert response['data']['metadata'].get('deletion_time') is not None
    except:
        # Expected if deleted
        pass

    # Undelete
    vault_client.secrets.kv.v2.undelete_secret_versions(
        path=test_path,
        versions=[1],
        mount_point='secret'
    )

    # Should be readable again
    response = vault_client.secrets.kv.v2.read_secret_version(
        path=test_path,
        mount_point='secret'
    )
    assert response['data']['data']['data'] == 'test'

    # Cleanup
    vault_client.secrets.kv.v2.delete_metadata_and_all_versions(
        path=test_path,
        mount_point='secret'
    )


if __name__ == '__main__':
    pytest.main([__file__, '-v'])
