# Exercise 3: Dynamic Database Credentials

**Duration:** 45-60 minutes
**Difficulty:** Intermediate
**CyberArk Alignment:** Dynamic privileged credentials, just-in-time access

## Learning Objectives

- Configure database secrets engine
- Generate dynamic credentials on-demand
- Understand credential TTL and leases
- Implement different database roles
- Practice credential revocation

## Prerequisites

- Completed Exercises 1 and 2
- Docker containers running (PostgreSQL and MySQL)
- Admin or root token

## Part 1: PostgreSQL Dynamic Credentials

### Step 1: Configure PostgreSQL Connection

```bash
docker exec -it vault sh
export VAULT_ADDR='http://127.0.0.1:8200'
export VAULT_TOKEN='root-token-change-me'

# Configure PostgreSQL connection
vault write database/config/postgresql \
    plugin_name=postgresql-database-plugin \
    allowed_roles="readonly,readwrite,admin" \
    connection_url="postgresql://{{username}}:{{password}}@postgres-target:5432/testdb?sslmode=disable" \
    username="vaultadmin" \
    password="vaultpass123"
```

**What this does:**
- Connects Vault to PostgreSQL
- Uses vaultadmin as the rotation user
- Defines which roles can request credentials

### Step 2: Create Read-Only Role

```bash
vault write database/roles/readonly \
    db_name=postgresql \
    creation_statements="CREATE ROLE \"{{name}}\" WITH LOGIN PASSWORD '{{password}}' VALID UNTIL '{{expiration}}'; \
        GRANT SELECT ON ALL TABLES IN SCHEMA public TO \"{{name}}\";" \
    default_ttl="1h" \
    max_ttl="24h"
```

**Role Parameters:**
- `creation_statements`: SQL to create user
- `default_ttl`: Default credential lifetime (1 hour)
- `max_ttl`: Maximum allowed TTL (24 hours)

### Step 3: Create Read-Write Role

```bash
vault write database/roles/readwrite \
    db_name=postgresql \
    creation_statements="CREATE ROLE \"{{name}}\" WITH LOGIN PASSWORD '{{password}}' VALID UNTIL '{{expiration}}'; \
        GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO \"{{name}}\";" \
    default_ttl="30m" \
    max_ttl="2h"
```

### Step 4: Generate Dynamic Credentials

```bash
# Generate readonly credentials
vault read database/creds/readonly
```

**Expected Output:**
```
Key                Value
---                -----
lease_id           database/creds/readonly/abc123...
lease_duration     1h
lease_renewable    true
password           A1a-xyz789...
username           v-root-readonly-abc123def456-1234567890
```

**IMPORTANT:** Save the username and password!

### Step 5: Test Database Connection

```bash
# Install PostgreSQL client (if not installed)
apk add postgresql-client

# Test connection with generated credentials
PGPASSWORD='<password-from-step-4>' psql \
    -h postgres-target \
    -U <username-from-step-4> \
    -d testdb \
    -c "SELECT * FROM users;"
```

**Expected:** Query succeeds, returns user data

### Step 6: Test Permission Boundaries

```bash
# Try to INSERT (should fail for readonly)
PGPASSWORD='<password>' psql \
    -h postgres-target \
    -U <username> \
    -d testdb \
    -c "INSERT INTO users (username, email) VALUES ('hacker', 'bad@example.com');"
```

**Expected:** Permission denied

```bash
# Generate readwrite credentials
vault read database/creds/readwrite

# Try INSERT again with new credentials
PGPASSWORD='<new-password>' psql \
    -h postgres-target \
    -U <new-username> \
    -d testdb \
    -c "INSERT INTO users (username, email) VALUES ('testuser', 'test@example.com');"
```

**Expected:** Success

## Part 2: Lease Management

### Step 7: View Active Leases

```bash
# List all leases for database
vault list sys/leases/lookup/database/creds/readonly
```

### Step 8: Renew a Lease

```bash
# Generate credentials with short TTL
CREDS=$(vault read -format=json database/creds/readonly)
LEASE_ID=$(echo $CREDS | jq -r '.lease_id')

echo "Lease ID: $LEASE_ID"

# Wait 30 seconds
sleep 30

# Renew lease for another hour
vault lease renew -increment=3600 $LEASE_ID

# Check new TTL
vault lease lookup $LEASE_ID
```

### Step 9: Revoke a Lease

```bash
# Generate test credentials
CREDS=$(vault read -format=json database/creds/readonly)
USERNAME=$(echo $CREDS | jq -r '.data.username')
PASSWORD=$(echo $CREDS | jq -r '.data.password')
LEASE_ID=$(echo $CREDS | jq -r '.lease_id')

# Test connection works
PGPASSWORD=$PASSWORD psql -h postgres-target -U $USERNAME -d testdb -c "SELECT 1;"

# Revoke the lease
vault lease revoke $LEASE_ID

# Try connection again (should fail)
PGPASSWORD=$PASSWORD psql -h postgres-target -U $USERNAME -d testdb -c "SELECT 1;"
```

**Expected:** Connection fails - user deleted

**CyberArk Equivalent:** Password check-in/revocation

### Step 10: Revoke All Leases for a Role

```bash
# Generate multiple credentials
vault read database/creds/readonly
vault read database/creds/readonly
vault read database/creds/readonly

# Revoke all readonly credentials
vault lease revoke -prefix database/creds/readonly

# Verify all connections fail
```

## Part 3: MySQL Dynamic Credentials

### Step 11: Configure MySQL Connection

```bash
vault write database/config/mysql \
    plugin_name=mysql-database-plugin \
    allowed_roles="mysql-readonly,mysql-admin" \
    connection_url="{{username}}:{{password}}@tcp(mysql-target:3306)/" \
    username="root" \
    password="rootpass123"
```

### Step 12: Create MySQL Roles

```bash
# Read-only role
vault write database/roles/mysql-readonly \
    db_name=mysql \
    creation_statements="CREATE USER '{{name}}'@'%' IDENTIFIED BY '{{password}}'; \
        GRANT SELECT ON testdb.* TO '{{name}}'@'%';" \
    default_ttl="1h" \
    max_ttl="24h"

# Admin role (short TTL for high privilege)
vault write database/roles/mysql-admin \
    db_name=mysql \
    creation_statements="CREATE USER '{{name}}'@'%' IDENTIFIED BY '{{password}}'; \
        GRANT ALL PRIVILEGES ON testdb.* TO '{{name}}'@'%';" \
    default_ttl="15m" \
    max_ttl="1h"
```

### Step 13: Generate and Test MySQL Credentials

```bash
# Generate MySQL credentials
MYSQL_CREDS=$(vault read -format=json database/creds/mysql-readonly)
MYSQL_USER=$(echo $MYSQL_CREDS | jq -r '.data.username')
MYSQL_PASS=$(echo $MYSQL_CREDS | jq -r '.data.password')

# Install MySQL client
apk add mysql-client

# Test connection
mysql -h mysql-target -u $MYSQL_USER -p$MYSQL_PASS -e "USE testdb; SELECT * FROM users;"
```

## Part 4: Advanced TTL Management

### Step 14: Custom TTL on Generation

```bash
# Request credentials with custom TTL (30 minutes instead of default 1 hour)
vault read database/creds/readonly ttl=30m

# Request maximum TTL
vault read database/creds/readonly ttl=24h
```

### Step 15: Monitor Credential Expiration

```bash
# Generate credentials
CREDS=$(vault read -format=json database/creds/readonly)
LEASE_ID=$(echo $CREDS | jq -r '.lease_id')

# Check remaining time
while true; do
    TTL=$(vault lease lookup -format=json $LEASE_ID | jq -r '.data.ttl')
    echo "Remaining TTL: $TTL seconds ($(date))"

    if [ $TTL -le 0 ]; then
        echo "Lease expired!"
        break
    fi

    sleep 10
done
```

### Step 16: Automatic Renewal Script

Create a script for automatic renewal:

```bash
cat > /tmp/auto-renew.sh <<'EOF'
#!/bin/sh
LEASE_ID=$1
RENEW_INTERVAL=300  # Renew every 5 minutes

while true; do
    vault lease renew $LEASE_ID
    if [ $? -eq 0 ]; then
        echo "Renewed at $(date)"
    else
        echo "Renewal failed at $(date)"
        exit 1
    fi
    sleep $RENEW_INTERVAL
done
EOF

chmod +x /tmp/auto-renew.sh

# Usage: /tmp/auto-renew.sh <lease-id>
```

## Part 5: Role-Based Access

### Step 17: Create Application-Specific Roles

```bash
# Web application role (read-only, longer TTL)
vault write database/roles/webapp \
    db_name=postgresql \
    creation_statements="CREATE ROLE \"{{name}}\" WITH LOGIN PASSWORD '{{password}}' VALID UNTIL '{{expiration}}'; \
        GRANT SELECT ON ALL TABLES IN SCHEMA public TO \"{{name}}\";" \
    default_ttl="4h" \
    max_ttl="12h"

# Batch job role (read-write, medium TTL)
vault write database/roles/batchjob \
    db_name=postgresql \
    creation_statements="CREATE ROLE \"{{name}}\" WITH LOGIN PASSWORD '{{password}}' VALID UNTIL '{{expiration}}'; \
        GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA public TO \"{{name}}\";" \
    default_ttl="2h" \
    max_ttl="6h"

# DBA role (full access, very short TTL)
vault write database/roles/dba \
    db_name=postgresql \
    creation_statements="CREATE ROLE \"{{name}}\" WITH LOGIN PASSWORD '{{password}}' VALID UNTIL '{{expiration}}' SUPERUSER;" \
    default_ttl="5m" \
    max_ttl="30m"
```

### Step 18: Policy-Based Role Access

Create a policy that only allows webapp role access:

```bash
cat > /tmp/webapp-policy.hcl <<EOF
# Allow reading webapp credentials only
path "database/creds/webapp" {
  capabilities = ["read"]
}

# Deny access to admin credentials
path "database/creds/dba" {
  capabilities = ["deny"]
}
EOF

vault policy write webapp-policy /tmp/webapp-policy.hcl

# Create token with this policy
vault token create -policy=webapp-policy
```

Test the policy:

```bash
export VAULT_TOKEN=<token-from-above>

# Should work
vault read database/creds/webapp

# Should fail
vault read database/creds/dba
```

## Challenges

### Challenge 1: Build a Connection Pooler
Create a script that:
1. Generates credentials
2. Maintains a pool of 5 active credentials
3. Auto-renews before expiration
4. Rotates out oldest when generating new

### Challenge 2: Implement Break-Glass Access
Create a high-privilege role with 5-minute TTL that:
- Requires approval (simulated)
- Logs all usage
- Auto-revokes after single use

### Challenge 3: Multi-Database Application
Configure an application that needs:
- PostgreSQL readonly credentials (4h TTL)
- MySQL readonly credentials (4h TTL)
- Shared TTL management

## Verification Checklist

- [ ] Configured PostgreSQL database connection
- [ ] Created multiple database roles
- [ ] Generated dynamic credentials
- [ ] Tested database connectivity
- [ ] Verified permission boundaries
- [ ] Renewed a lease
- [ ] Revoked a lease
- [ ] Configured MySQL connection
- [ ] Implemented custom TTLs
- [ ] Created role-based policies

## Clean Up

```bash
# Revoke all database credentials
vault lease revoke -prefix database/creds/

# Remove database roles
vault delete database/roles/readonly
vault delete database/roles/readwrite
vault delete database/roles/webapp
vault delete database/roles/batchjob
vault delete database/roles/dba
vault delete database/roles/mysql-readonly
vault delete database/roles/mysql-admin

# Remove database configurations
vault delete database/config/postgresql
vault delete database/config/mysql
```

## Key Takeaways

1. **Just-in-time credentials** - Generated on-demand, not stored
2. **Automatic expiration** - No orphaned credentials
3. **Least privilege** - Different roles for different needs
4. **Audit trail** - Every credential generation is logged
5. **No credential sharing** - Each request gets unique credentials

## CyberArk PAM-DEF Concepts

| CyberArk Concept | Vault Equivalent | Covered |
|------------------|------------------|---------|
| Dynamic Credentials | Database Secrets Engine | ✓ |
| Password Checkout | Credential Generation | ✓ |
| Password Check-in | Lease Revocation | ✓ |
| Access Workflows | Policy-Based Access | ✓ |
| Session Recording | Audit Logs | ✓ |

## Next Steps

Proceed to [Exercise 4: Password Rotation](04-password-rotation.md) to learn about:
- Automated password rotation (CPM equivalent)
- Rotation schedules
- Static credential management
- Rotation verification

---

**Outstanding!** You now understand dynamic credentials and just-in-time access.
