# Exercise 1: Vault Basics

**Duration:** 30-45 minutes
**Difficulty:** Beginner
**CyberArk Alignment:** Vault initialization, PVWA basics

## Learning Objectives

By the end of this exercise, you will be able to:
- Initialize and unseal HashiCorp Vault
- Create and manage Vault policies
- Generate and use authentication tokens
- Store and retrieve basic secrets
- Enable and review audit logging

## Prerequisites

- Docker and Docker Compose running
- PAM-Vault-Lab containers started (`docker-compose up -d`)
- Basic command line knowledge

## Part 1: Vault Initialization

### Step 1: Check Vault Status

```bash
# Check if Vault is running
docker ps | grep vault

# Check Vault health
curl http://localhost:8200/v1/sys/health
```

**Expected Output:**
```json
{
  "initialized": true,
  "sealed": false,
  "standby": false
}
```

In dev mode, Vault is automatically initialized and unsealed.

### Step 2: Access Vault UI

1. Open browser to: `http://localhost:8200`
2. Sign in with token: `root-token-change-me` (or value from `.env`)
3. Explore the UI interface

**CyberArk Equivalent:** This is similar to accessing PVWA (Password Vault Web Access)

### Step 3: Verify Vault CLI

```bash
# Enter Vault container
docker exec -it vault sh

# Set Vault address
export VAULT_ADDR='http://127.0.0.1:8200'

# Check status
vault status
```

**Expected Output:**
```
Key             Value
---             -----
Seal Type       shamir
Initialized     true
Sealed          false
Total Shares    1
Threshold       1
Version         1.15.x
```

## Part 2: Policies and Permissions

### Step 4: List Existing Policies

```bash
# List all policies
vault policy list
```

**Expected Output:**
```
admin-policy
default
readonly-policy
rotation-policy
root
```

### Step 5: Read a Policy

```bash
# Read admin policy
vault policy read admin-policy

# Read readonly policy
vault policy read readonly-policy
```

**Understanding Policies:**
- **admin-policy**: Full access (equivalent to Vault Admin in CyberArk)
- **readonly-policy**: Read-only access (equivalent to Auditor role)
- **rotation-policy**: Password rotation permissions (equivalent to CPM)

### Step 6: Create a Custom Policy

Create a new policy file:

```bash
cat > /tmp/dev-policy.hcl <<EOF
# Developer Policy - Limited access to dev secrets only
path "secret/data/dev/*" {
  capabilities = ["create", "read", "update", "list"]
}

path "secret/metadata/dev/*" {
  capabilities = ["read", "list"]
}

# Cannot access production secrets
path "secret/data/prod/*" {
  capabilities = ["deny"]
}
EOF
```

Apply the policy:

```bash
vault policy write dev-policy /tmp/dev-policy.hcl

# Verify
vault policy read dev-policy
```

## Part 3: Token Management

### Step 7: Create Tokens for Different Roles

```bash
# Create admin token (24 hour TTL)
vault token create -policy=admin-policy -ttl=24h -display-name="admin-token"
```

**Save the token from output!**

```bash
# Create readonly token
vault token create -policy=readonly-policy -ttl=24h -display-name="readonly-token"

# Create developer token
vault token create -policy=dev-policy -ttl=8h -display-name="dev-token"
```

### Step 8: Test Token Capabilities

```bash
# Lookup your current token
vault token lookup

# Display token info
vault token lookup -format=json | jq '.data.policies'
```

### Step 9: Test Permission Boundaries

```bash
# Export the readonly token (use the token from Step 7)
export VAULT_TOKEN="<readonly-token-here>"

# Try to create a secret (should succeed for read, fail for write)
vault kv put secret/test key=value
# Expected: Permission denied

# Read a secret (should succeed)
vault kv get secret/database/prod
# Expected: Success

# Reset to root token
export VAULT_TOKEN="root-token-change-me"
```

## Part 4: Secret Operations

### Step 10: Store Your First Secret

```bash
# Create a secret
vault kv put secret/myapp/config \
    db_host=localhost \
    db_port=5432 \
    db_user=appuser \
    db_password=supersecret123

# Verify creation
vault kv get secret/myapp/config
```

**Expected Output:**
```
====== Data ======
Key          Value
---          -----
db_host      localhost
db_password  supersecret123
db_port      5432
db_user      appuser
```

### Step 11: Update a Secret (Creates New Version)

```bash
# Update the secret
vault kv put secret/myapp/config \
    db_host=localhost \
    db_port=5432 \
    db_user=appuser \
    db_password=newsecret456

# Get specific version
vault kv get -version=1 secret/myapp/config
vault kv get -version=2 secret/myapp/config
```

### Step 12: List Secrets

```bash
# List all secrets
vault kv list secret/

# List secrets in subdirectory
vault kv list secret/database
```

## Part 5: Audit Logging

### Step 13: Enable File Audit Device

```bash
# Enable audit logging
vault audit enable file file_path=/vault/logs/audit.log

# List audit devices
vault audit list
```

### Step 14: Generate Audit Events

```bash
# Perform various operations
vault kv get secret/database/prod
vault kv put secret/test/audit-test key=value
vault token lookup
```

### Step 15: Review Audit Log

```bash
# View recent audit events
tail -20 /vault/logs/audit.log | jq .

# Filter for specific operations
grep "secret/database/prod" /vault/logs/audit.log | jq .
```

**Audit Log Fields:**
- `type`: request or response
- `auth.display_name`: User/token that made request
- `request.path`: API path accessed
- `request.operation`: Operation performed (read, write, delete)
- `response.data`: Response data (secrets are HMAC hashed)

## Part 6: UI Exploration

### Step 16: Explore Vault UI

1. **Secrets Tab:**
   - Navigate to `secret/` path
   - View secrets created in previous steps
   - Create a new secret via UI

2. **Policies Tab:**
   - View all policies
   - Examine policy rules

3. **Access Tab:**
   - View authentication methods
   - Explore token creation

## Challenges

Try these additional challenges:

### Challenge 1: Hierarchical Secrets
Create a secret hierarchy for a multi-environment application:
```
secret/
├── dev/
│   └── webapp/config
├── staging/
│   └── webapp/config
└── prod/
    └── webapp/config
```

### Challenge 2: Token with Multiple Policies
Create a token with both `readonly-policy` and `dev-policy`

### Challenge 3: Time-Limited Token
Create a token that expires in 5 minutes and test expiration

## Verification Checklist

- [ ] Vault is running and unsealed
- [ ] Can access Vault UI
- [ ] Created custom policy
- [ ] Generated tokens with different policies
- [ ] Stored and retrieved secrets
- [ ] Updated secrets (versioning works)
- [ ] Audit logging enabled
- [ ] Can view audit logs

## Clean Up

```bash
# Delete test secrets
vault kv delete secret/test/audit-test
vault kv delete secret/myapp/config

# Revoke test tokens (use token IDs from creation)
vault token revoke <token-id>
```

## Key Takeaways

1. **Policies control access** - Similar to CyberArk safes and permissions
2. **Tokens are temporary** - Use TTL to limit credential lifetime
3. **Audit logging is critical** - Track all access for compliance
4. **Secrets are versioned** - KV v2 maintains history
5. **Least privilege** - Grant minimum required permissions

## CyberArk PAM-DEF Concepts Covered

| CyberArk Concept | Vault Equivalent | Covered |
|------------------|------------------|---------|
| PVWA Login | Vault UI/API | ✓ |
| Safe Management | KV Secrets Engine | ✓ |
| Safe Permissions | Vault Policies | ✓ |
| User Management | Token Creation | ✓ |
| Audit Trail | Audit Device | ✓ |

## Next Steps

Proceed to [Exercise 2: Secret Management](02-secret-management.md) to learn about:
- Secret versioning and rollback
- Soft delete and recovery
- Secret metadata management
- Bulk operations

## Troubleshooting

**Problem:** Cannot connect to Vault
**Solution:** Check `docker-compose ps` - ensure vault container is running

**Problem:** Permission denied
**Solution:** Verify you're using correct token with required policy

**Problem:** Audit log not found
**Solution:** Ensure audit device is enabled: `vault audit list`

---

**Congratulations!** You've completed Exercise 1. You now understand Vault basics and how they map to CyberArk PAM concepts.
