# Exercise 4: Password Rotation

**Duration:** 30-45 minutes
**Difficulty:** Intermediate
**CyberArk Alignment:** CPM (Central Policy Manager), automated password management

## Learning Objectives

- Configure automated password rotation
- Understand static roles vs dynamic credentials
- Implement rotation schedules
- Monitor rotation events
- Handle rotation failures

## Prerequisites

- Completed Exercise 3
- Database secrets engine configured
- Admin token

## Part 1: Static Role Configuration

### Step 1: Configure PostgreSQL Static Role

```bash
docker exec -it vault sh
export VAULT_ADDR='http://127.0.0.1:8200'
export VAULT_TOKEN='root-token-change-me'

# Create static role for PostgreSQL root user
vault write database/static-roles/postgres-root \
    db_name=postgresql \
    username="vaultadmin" \
    rotation_period="24h"
```

**What is a static role?**
- Uses existing database username (not dynamically generated)
- Vault rotates the password on a schedule
- Similar to CyberArk CPM rotating privileged accounts

### Step 2: Read Static Credentials

```bash
# Get current credentials
vault read database/static-creds/postgres-root
```

**Expected Output:**
```
Key                    Value
---                    -----
last_vault_rotation    2025-11-30T...
password               <32-character-password>
rotation_period        24h
ttl                    23h59m
username               vaultadmin
```

### Step 3: Test Connection with Rotated Credentials

```bash
# Get password
STATIC_PASS=$(vault read -field=password database/static-creds/postgres-root)

# Test connection
PGPASSWORD=$STATIC_PASS psql -h postgres-target -U vaultadmin -d testdb -c "SELECT current_user;"
```

## Part 2: Manual Rotation

### Step 4: Trigger Manual Rotation

```bash
# Get current password
BEFORE=$(vault read -field=password database/static-creds/postgres-root)
echo "Password before: $BEFORE"

# Manually rotate
vault write -f database/rotate-role/postgres-root

# Get new password
sleep 2
AFTER=$(vault read -field=password database/static-creds/postgres-root)
echo "Password after: $AFTER"

# Verify they're different
if [ "$BEFORE" != "$AFTER" ]; then
    echo "✓ Password rotated successfully"
else
    echo "✗ Password did not change"
fi
```

### Step 5: Verify Old Password is Invalid

```bash
# Try old password (should fail)
PGPASSWORD=$BEFORE psql -h postgres-target -U vaultadmin -d testdb -c "SELECT 1;"
# Expected: Authentication failed

# Try new password (should work)
PGPASSWORD=$AFTER psql -h postgres-target -U vaultadmin -d testdb -c "SELECT 1;"
# Expected: Success
```

**CyberArk Equivalent:** Immediate password change via CPM

## Part 3: Rotation Root Credentials

### Step 6: Rotate Root Connection Credentials

```bash
# Rotate the root credentials Vault uses to connect
vault write -f database/rotate-root/postgresql

# Vault's connection password is now different
# But applications still get credentials normally
vault read database/creds/readonly
```

**Important:** This rotates Vault's own access credentials to the database.

## Part 4: MySQL Rotation

### Step 7: Configure MySQL Static Role

```bash
vault write database/static-roles/mysql-root \
    db_name=mysql \
    username="root" \
    rotation_period="24h"
```

### Step 8: Test MySQL Rotation

```bash
# Get current password
MYSQL_BEFORE=$(vault read -field=password database/static-creds/mysql-root)

# Rotate
vault write -f database/rotate-role/mysql-root

# Get new password
sleep 2
MYSQL_AFTER=$(vault read -field=password database/static-creds/mysql-root)

# Test new password
mysql -h mysql-target -u root -p$MYSQL_AFTER -e "SELECT 'Rotation successful!' AS result;"
```

## Part 5: Monitoring Rotation

### Step 9: Check Rotation Status

```bash
# Read static role metadata
vault read database/static-creds/postgres-root

# Check last rotation time
vault read -format=json database/static-creds/postgres-root | jq -r '.data.last_vault_rotation'

# Calculate time until next rotation
TTL=$(vault read -field=ttl database/static-creds/postgres-root)
echo "Next rotation in: $TTL"
```

### Step 10: View Rotation Events in Audit Log

```bash
# Filter audit log for rotation events
grep "database/rotate" /vault/logs/audit.log | tail -5 | jq .

# Detailed view of last rotation
grep "database/rotate-role/postgres-root" /vault/logs/audit.log | tail -1 | jq '{
    time: .time,
    type: .type,
    path: .request.path,
    operation: .request.operation,
    user: .auth.display_name
}'
```

## Part 6: Rotation Policies

### Step 11: Different Rotation Periods

```bash
# Critical systems - rotate every 4 hours
vault write database/static-roles/critical-db \
    db_name=postgresql \
    username="vaultadmin" \
    rotation_period="4h"

# Standard systems - rotate every day
vault write database/static-roles/standard-db \
    db_name=postgresql \
    username="vaultadmin" \
    rotation_period="24h"

# Low-risk systems - rotate weekly
vault write database/static-roles/lowrisk-db \
    db_name=postgresql \
    username="vaultadmin" \
    rotation_period="168h"
```

### Step 12: Disable Automatic Rotation

```bash
# For accounts that shouldn't auto-rotate
vault write database/static-roles/manual-only \
    db_name=postgresql \
    username="vaultadmin" \
    rotation_period="0"  # 0 = no automatic rotation
```

## Part 7: Rotation Automation Scripts

### Step 13: Create Rotation Monitoring Script

```bash
cat > /tmp/monitor-rotation.sh <<'EOF'
#!/bin/sh
# Monitor password rotation status

echo "Password Rotation Status Report"
echo "================================"
echo ""

for role in postgres-root mysql-root; do
    echo "Role: $role"

    CREDS=$(vault read -format=json database/static-creds/$role 2>/dev/null)

    if [ $? -eq 0 ]; then
        LAST_ROTATION=$(echo $CREDS | jq -r '.data.last_vault_rotation')
        TTL=$(echo $CREDS | jq -r '.data.ttl')
        PERIOD=$(echo $CREDS | jq -r '.data.rotation_period')

        echo "  Last Rotation: $LAST_ROTATION"
        echo "  Rotation Period: $PERIOD"
        echo "  Next Rotation: ${TTL} seconds"
        echo ""
    else
        echo "  Status: Not configured"
        echo ""
    fi
done
EOF

chmod +x /tmp/monitor-rotation.sh
/tmp/monitor-rotation.sh
```

### Step 14: Emergency Rotation Script

```bash
cat > /tmp/emergency-rotate.sh <<'EOF'
#!/bin/sh
# Emergency password rotation for all databases

echo "EMERGENCY ROTATION INITIATED"
echo "==========================="
echo ""

for role in postgres-root mysql-root; do
    echo "Rotating $role..."

    vault write -f database/rotate-role/$role

    if [ $? -eq 0 ]; then
        echo "  ✓ Success"
    else
        echo "  ✗ Failed"
    fi
done

echo ""
echo "Emergency rotation complete. Verify application connectivity."
EOF

chmod +x /tmp/emergency-rotate.sh
```

## Part 8: Application Integration

### Step 15: Application Startup Pattern

```bash
cat > /tmp/app-startup.sh <<'EOF'
#!/bin/sh
# Simulates application retrieving credentials on startup

echo "Application starting..."

# Retrieve database credentials from Vault
DB_CREDS=$(vault read -format=json database/static-creds/postgres-root)
DB_USER=$(echo $DB_CREDS | jq -r '.data.username')
DB_PASS=$(echo $DB_CREDS | jq -r '.data.password')

# Use credentials to connect
export DATABASE_URL="postgresql://$DB_USER:$DB_PASS@postgres-target:5432/testdb"

echo "Connected to database as: $DB_USER"

# Application would start here
# while true; do
#     # Application logic
#     sleep 60
# done
EOF

chmod +x /tmp/app-startup.sh
/tmp/app-startup.sh
```

### Step 16: Credential Refresh Pattern

```bash
cat > /tmp/credential-refresh.sh <<'EOF'
#!/bin/sh
# Periodically refresh credentials before they rotate

REFRESH_INTERVAL=3600  # Refresh every hour

while true; do
    echo "Refreshing credentials at $(date)"

    DB_CREDS=$(vault read -format=json database/static-creds/postgres-root)
    DB_PASS=$(echo $DB_CREDS | jq -r '.data.password')

    # Update application configuration
    # (implementation depends on your application)

    echo "Credentials refreshed"
    sleep $REFRESH_INTERVAL
done
EOF

chmod +x /tmp/credential-refresh.sh
```

## Challenges

### Challenge 1: Rotation Notification System
Create a script that:
- Monitors rotation events
- Sends notification when rotation occurs
- Logs rotation history

### Challenge 2: Graceful Rotation
Implement a pattern where:
- Application gets warning before rotation
- Application refreshes credentials
- Old connections drain gracefully
- New connections use new credentials

### Challenge 3: Multi-Account Rotation
Rotate multiple accounts across different databases:
- PostgreSQL production
- PostgreSQL development
- MySQL production
- All in coordinated manner

## Verification Checklist

- [ ] Configured static roles
- [ ] Retrieved static credentials
- [ ] Performed manual rotation
- [ ] Verified old password invalid
- [ ] Rotated root credentials
- [ ] Configured different rotation periods
- [ ] Monitored rotation events
- [ ] Created automation scripts

## Clean Up

```bash
# Remove static roles
vault delete database/static-roles/postgres-root
vault delete database/static-roles/mysql-root
vault delete database/static-roles/critical-db
vault delete database/static-roles/standard-db
vault delete database/static-roles/lowrisk-db
vault delete database/static-roles/manual-only

# Remove test scripts
rm /tmp/monitor-rotation.sh
rm /tmp/emergency-rotate.sh
rm /tmp/app-startup.sh
rm /tmp/credential-refresh.sh
```

## Key Takeaways

1. **Static roles** manage existing accounts (vs dynamic which create new accounts)
2. **Automatic rotation** prevents credential staleness
3. **Rotation period** balances security vs operational impact
4. **Applications** must handle credential changes gracefully
5. **Monitoring** is critical for rotation health

## CyberArk PAM-DEF Concepts

| CyberArk Concept | Vault Equivalent | Covered |
|------------------|------------------|---------|
| CPM | Database Static Roles | ✓ |
| Automated Password Change | Rotation Period | ✓ |
| Immediate Password Change | Manual Rotation | ✓ |
| Reconcile Account | Rotate Root | ✓ |
| Platform Management | Rotation Statements | ✓ |

## Next Steps

Proceed to [Exercise 5: Audit & Logging](05-audit-logging.md) to learn about:
- Comprehensive audit logging
- Compliance reporting
- Security event monitoring
- Log analysis

---

**Fantastic!** You now understand automated password rotation and CPM concepts.
