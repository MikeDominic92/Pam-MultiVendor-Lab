#!/bin/sh
# Setup automated password rotation for databases
# Simulates CyberArk CPM (Central Policy Manager) functionality

set -e

echo "==================================="
echo "Database Password Rotation Setup"
echo "==================================="
echo ""

export VAULT_ADDR='http://127.0.0.1:8200'

# Check Vault connection
if ! vault status >/dev/null 2>&1; then
    echo "ERROR: Cannot connect to Vault"
    exit 1
fi

echo "Step 1: Configuring Static Database Roles"
echo "------------------------------------------"

# Configure static role for PostgreSQL root rotation
echo "Configuring PostgreSQL root credential rotation..."
vault write database/static-roles/postgres-root \
    db_name=postgresql \
    username="vaultadmin" \
    rotation_period="24h"

echo "  ✓ PostgreSQL root rotation configured (every 24h)"

# Configure static role for MySQL root rotation
echo "Configuring MySQL root credential rotation..."
vault write database/static-roles/mysql-root \
    db_name=mysql \
    username="root" \
    rotation_period="24h"

echo "  ✓ MySQL root rotation configured (every 24h)"

echo ""
echo "Step 2: Testing Rotation Functionality"
echo "---------------------------------------"

# Rotate PostgreSQL root password immediately
echo "Testing PostgreSQL password rotation..."
vault write -f database/rotate-root/postgresql
echo "  ✓ PostgreSQL root password rotated"

# Rotate MySQL root password immediately
echo "Testing MySQL password rotation..."
vault write -f database/rotate-root/mysql
echo "  ✓ MySQL root password rotated"

echo ""
echo "Step 3: Reading Rotated Credentials"
echo "------------------------------------"

# Read PostgreSQL static credentials
echo "PostgreSQL static credentials:"
PG_STATIC=$(vault read -format=json database/static-creds/postgres-root)
if [ -n "$PG_STATIC" ]; then
    PG_STATIC_USER=$(echo "$PG_STATIC" | jq -r '.data.username')
    PG_ROTATION_PERIOD=$(echo "$PG_STATIC" | jq -r '.data.rotation_period')
    echo "  Username: $PG_STATIC_USER"
    echo "  Rotation Period: $PG_ROTATION_PERIOD seconds"
    echo "  ✓ Credentials retrieved"
else
    echo "  ✗ Failed to retrieve credentials"
fi

echo ""
echo "MySQL static credentials:"
MYSQL_STATIC=$(vault read -format=json database/static-creds/mysql-root)
if [ -n "$MYSQL_STATIC" ]; then
    MYSQL_STATIC_USER=$(echo "$MYSQL_STATIC" | jq -r '.data.username')
    MYSQL_ROTATION_PERIOD=$(echo "$MYSQL_STATIC" | jq -r '.data.rotation_period')
    echo "  Username: $MYSQL_STATIC_USER"
    echo "  Rotation Period: $MYSQL_ROTATION_PERIOD seconds"
    echo "  ✓ Credentials retrieved"
else
    echo "  ✗ Failed to retrieve credentials"
fi

echo ""
echo "Step 4: Creating Rotation Schedule Info"
echo "----------------------------------------"
cat <<EOF

Rotation Schedule:
------------------
PostgreSQL Root:
  - Role: postgres-root
  - Username: vaultadmin
  - Rotation: Every 24 hours
  - Last Rotation: $(date)

MySQL Root:
  - Role: mysql-root
  - Username: root
  - Rotation: Every 24 hours
  - Last Rotation: $(date)

How Rotation Works:
-------------------
1. Vault connects to database using current credentials
2. Generates new random password (32 characters)
3. Updates database password via ALTER USER command
4. Stores new password in Vault
5. Old password is immediately invalid
6. Process repeats every 24 hours automatically

Manual Rotation:
----------------
To manually rotate passwords:
  vault write -f database/rotate-root/postgresql
  vault write -f database/rotate-root/mysql

Retrieve Current Credentials:
------------------------------
  vault read database/static-creds/postgres-root
  vault read database/static-creds/mysql-root

Monitor Rotation:
-----------------
Check audit logs at: /vault/logs/audit.log
Look for events: "database/rotate-root"

EOF

echo ""
echo "==================================="
echo "Database Rotation Setup Complete!"
echo "==================================="
echo ""
echo "IMPORTANT NOTES:"
echo "- Passwords will rotate automatically every 24 hours"
echo "- Always retrieve credentials from Vault before connecting"
echo "- Old passwords become invalid after rotation"
echo "- Rotation events are logged in audit log"
echo ""
echo "Next Steps:"
echo "1. Complete Exercise 4 (Password Rotation)"
echo "2. Monitor audit logs for rotation events"
echo "3. Test application connectivity with rotated credentials"
echo "==================================="
