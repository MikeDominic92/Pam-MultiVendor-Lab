"""
Test Password Rotation Functionality
"""

import os
import time
import pytest
import hvac


@pytest.fixture
def vault_client():
    """Create Vault client fixture"""
    vault_addr = os.getenv('VAULT_ADDR', 'http://localhost:8200')
    vault_token = os.getenv('VAULT_TOKEN', 'root-token-change-me')

    client = hvac.Client(url=vault_addr, token=vault_token)
    return client


@pytest.fixture
def setup_database_config(vault_client):
    """Setup database configuration for testing"""
    # This assumes PostgreSQL is running and configured
    # Skip if not available
    try:
        vault_client.write(
            'database/config/test-postgres',
            plugin_name='postgresql-database-plugin',
            allowed_roles=['test-role'],
            connection_url='postgresql://{{username}}:{{password}}@postgres-target:5432/testdb?sslmode=disable',
            username='vaultadmin',
            password='vaultpass123'
        )
        yield 'test-postgres'

        # Cleanup
        vault_client.delete('database/config/test-postgres')
    except Exception as e:
        pytest.skip(f"Database configuration failed: {e}")


def test_database_role_creation(vault_client, setup_database_config):
    """Test creating a database role"""
    db_name = setup_database_config

    vault_client.write(
        'database/roles/test-readonly',
        db_name=db_name,
        creation_statements=[
            "CREATE ROLE \"{{name}}\" WITH LOGIN PASSWORD '{{password}}' VALID UNTIL '{{expiration}}';"
        ],
        default_ttl='1h',
        max_ttl='24h'
    )

    # Verify role was created
    role = vault_client.read('database/roles/test-readonly')
    assert role is not None

    # Cleanup
    vault_client.delete('database/roles/test-readonly')


def test_dynamic_credential_generation(vault_client, setup_database_config):
    """Test generating dynamic database credentials"""
    db_name = setup_database_config

    # Create role first
    vault_client.write(
        'database/roles/test-dynamic',
        db_name=db_name,
        creation_statements=[
            "CREATE ROLE \"{{name}}\" WITH LOGIN PASSWORD '{{password}}' VALID UNTIL '{{expiration}}';"
        ],
        default_ttl='1h',
        max_ttl='24h'
    )

    # Generate credentials
    response = vault_client.read('database/creds/test-dynamic')

    assert 'data' in response
    assert 'username' in response['data']
    assert 'password' in response['data']
    assert 'lease_id' in response

    # Revoke credentials
    vault_client.sys.revoke_lease(response['lease_id'])

    # Cleanup
    vault_client.delete('database/roles/test-dynamic')


def test_static_role_rotation(vault_client, setup_database_config):
    """Test static role password rotation"""
    db_name = setup_database_config

    # Create static role
    vault_client.write(
        'database/static-roles/test-static',
        db_name=db_name,
        username='vaultadmin',
        rotation_period='24h'
    )

    # Get initial credentials
    initial = vault_client.read('database/static-creds/test-static')
    initial_password = initial['data']['password']

    # Trigger rotation
    vault_client.write('database/rotate-role/test-static')

    # Wait for rotation
    time.sleep(2)

    # Get new credentials
    rotated = vault_client.read('database/static-creds/test-static')
    rotated_password = rotated['data']['password']

    # Verify password changed
    assert initial_password != rotated_password

    # Cleanup
    vault_client.delete('database/static-roles/test-static')


def test_lease_renewal(vault_client, setup_database_config):
    """Test lease renewal for dynamic credentials"""
    db_name = setup_database_config

    # Create role
    vault_client.write(
        'database/roles/test-lease',
        db_name=db_name,
        creation_statements=[
            "CREATE ROLE \"{{name}}\" WITH LOGIN PASSWORD '{{password}}' VALID UNTIL '{{expiration}}';"
        ],
        default_ttl='1m',  # 1 minute for faster testing
        max_ttl='1h'
    )

    # Generate credentials
    response = vault_client.read('database/creds/test-lease')
    lease_id = response['lease_id']
    initial_duration = response['lease_duration']

    # Renew lease
    renewed = vault_client.sys.renew_lease(lease_id, increment='2m')

    assert renewed['lease_id'] == lease_id

    # Cleanup
    vault_client.sys.revoke_lease(lease_id)
    vault_client.delete('database/roles/test-lease')


def test_lease_revocation(vault_client, setup_database_config):
    """Test revoking a lease"""
    db_name = setup_database_config

    # Create role
    vault_client.write(
        'database/roles/test-revoke',
        db_name=db_name,
        creation_statements=[
            "CREATE ROLE \"{{name}}\" WITH LOGIN PASSWORD '{{password}}' VALID UNTIL '{{expiration}}';"
        ],
        default_ttl='1h',
        max_ttl='24h'
    )

    # Generate credentials
    response = vault_client.read('database/creds/test-revoke')
    lease_id = response['lease_id']

    # Revoke lease
    vault_client.sys.revoke_lease(lease_id)

    # Attempting to renew should fail
    with pytest.raises(Exception):
        vault_client.sys.renew_lease(lease_id)

    # Cleanup
    vault_client.delete('database/roles/test-revoke')


def test_root_credential_rotation(vault_client, setup_database_config):
    """Test rotating root database credentials"""
    db_name = setup_database_config

    # Rotate root credentials
    vault_client.write(f'database/rotate-root/{db_name}')

    # Vault should still be able to generate credentials
    vault_client.write(
        'database/roles/test-after-root-rotate',
        db_name=db_name,
        creation_statements=[
            "CREATE ROLE \"{{name}}\" WITH LOGIN PASSWORD '{{password}}' VALID UNTIL '{{expiration}}';"
        ],
        default_ttl='1h',
        max_ttl='24h'
    )

    response = vault_client.read('database/creds/test-after-root-rotate')
    assert 'username' in response['data']

    # Cleanup
    vault_client.sys.revoke_lease(response['lease_id'])
    vault_client.delete('database/roles/test-after-root-rotate')


if __name__ == '__main__':
    pytest.main([__file__, '-v'])
