#!/bin/sh
# Enable and configure secrets engines for PAM-Vault-Lab

set -e

echo "==================================="
echo "Configuring Secrets Engines"
echo "==================================="
echo ""

export VAULT_ADDR='http://127.0.0.1:8200'

# Check if Vault is accessible
if ! vault status >/dev/null 2>&1; then
    echo "ERROR: Cannot connect to Vault. Is it running and unsealed?"
    exit 1
fi

# Check authentication
if ! vault token lookup >/dev/null 2>&1; then
    echo "ERROR: Not authenticated to Vault. Set VAULT_TOKEN environment variable."
    exit 1
fi

echo "Step 1: Configuring Database Secrets Engine"
echo "--------------------------------------------"

# Configure PostgreSQL connection
echo "Configuring PostgreSQL connection..."
vault write database/config/postgresql \
    plugin_name=postgresql-database-plugin \
    allowed_roles="readonly,readwrite" \
    connection_url="postgresql://{{username}}:{{password}}@postgres-target:5432/testdb?sslmode=disable" \
    username="vaultadmin" \
    password="vaultpass123"

echo "  ✓ PostgreSQL connection configured"

# Create readonly role for PostgreSQL
echo "Creating PostgreSQL readonly role..."
vault write database/roles/readonly \
    db_name=postgresql \
    creation_statements="CREATE ROLE \"{{name}}\" WITH LOGIN PASSWORD '{{password}}' VALID UNTIL '{{expiration}}'; \
        GRANT SELECT ON ALL TABLES IN SCHEMA public TO \"{{name}}\";" \
    default_ttl="1h" \
    max_ttl="24h"

echo "  ✓ Readonly role created (TTL: 1h, Max: 24h)"

# Create readwrite role for PostgreSQL
echo "Creating PostgreSQL readwrite role..."
vault write database/roles/readwrite \
    db_name=postgresql \
    creation_statements="CREATE ROLE \"{{name}}\" WITH LOGIN PASSWORD '{{password}}' VALID UNTIL '{{expiration}}'; \
        GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO \"{{name}}\";" \
    default_ttl="30m" \
    max_ttl="2h"

echo "  ✓ Readwrite role created (TTL: 30m, Max: 2h)"

# Configure MySQL connection
echo ""
echo "Configuring MySQL connection..."
vault write database/config/mysql \
    plugin_name=mysql-database-plugin \
    allowed_roles="mysql-readonly,mysql-admin" \
    connection_url="{{username}}:{{password}}@tcp(mysql-target:3306)/" \
    username="root" \
    password="rootpass123"

echo "  ✓ MySQL connection configured"

# Create readonly role for MySQL
echo "Creating MySQL readonly role..."
vault write database/roles/mysql-readonly \
    db_name=mysql \
    creation_statements="CREATE USER '{{name}}'@'%' IDENTIFIED BY '{{password}}'; \
        GRANT SELECT ON testdb.* TO '{{name}}'@'%';" \
    default_ttl="1h" \
    max_ttl="24h"

echo "  ✓ MySQL readonly role created"

# Create admin role for MySQL
echo "Creating MySQL admin role..."
vault write database/roles/mysql-admin \
    db_name=mysql \
    creation_statements="CREATE USER '{{name}}'@'%' IDENTIFIED BY '{{password}}'; \
        GRANT ALL PRIVILEGES ON testdb.* TO '{{name}}'@'%';" \
    default_ttl="15m" \
    max_ttl="1h"

echo "  ✓ MySQL admin role created"

echo ""
echo "Step 2: Configuring SSH Secrets Engine"
echo "---------------------------------------"

# Create OTP role for SSH
echo "Configuring SSH OTP role..."
vault write ssh/roles/otp_key_role \
    key_type=otp \
    default_user=privileged \
    cidr_list=172.28.0.0/16

echo "  ✓ SSH OTP role created"

echo ""
echo "Step 3: Testing Configuration"
echo "------------------------------"

# Test PostgreSQL readonly credentials
echo "Testing PostgreSQL readonly credential generation..."
PG_CREDS=$(vault read -format=json database/creds/readonly)
if [ -n "$PG_CREDS" ]; then
    PG_USER=$(echo "$PG_CREDS" | jq -r '.data.username')
    echo "  ✓ Generated PostgreSQL user: $PG_USER"
else
    echo "  ✗ Failed to generate PostgreSQL credentials"
fi

# Test MySQL readonly credentials
echo "Testing MySQL readonly credential generation..."
MYSQL_CREDS=$(vault read -format=json database/creds/mysql-readonly)
if [ -n "$MYSQL_CREDS" ]; then
    MYSQL_USER=$(echo "$MYSQL_CREDS" | jq -r '.data.username')
    echo "  ✓ Generated MySQL user: $MYSQL_USER"
else
    echo "  ✗ Failed to generate MySQL credentials"
fi

echo ""
echo "Step 4: Summary of Created Resources"
echo "-------------------------------------"
echo ""
echo "Database Connections:"
echo "  - postgresql (postgres-target:5432)"
echo "  - mysql (mysql-target:3306)"
echo ""
echo "Database Roles:"
echo "  PostgreSQL:"
echo "    - readonly (SELECT only, 1h TTL)"
echo "    - readwrite (DML permissions, 30m TTL)"
echo "  MySQL:"
echo "    - mysql-readonly (SELECT only, 1h TTL)"
echo "    - mysql-admin (ALL privileges, 15m TTL)"
echo ""
echo "SSH Roles:"
echo "  - otp_key_role (One-Time Password for user 'privileged')"
echo ""
echo "Usage Examples:"
echo "  Generate PostgreSQL readonly creds:"
echo "    vault read database/creds/readonly"
echo ""
echo "  Generate MySQL admin creds:"
echo "    vault read database/creds/mysql-admin"
echo ""
echo "  Generate SSH OTP:"
echo "    vault write ssh/creds/otp_key_role ip=172.28.0.X"
echo ""
echo "==================================="
echo "Secrets Engines Configured!"
echo "==================================="
