# Exercise 2: Secret Management

**Duration:** 30-40 minutes
**Difficulty:** Beginner to Intermediate
**CyberArk Alignment:** Safe management, password versioning, dual control

## Learning Objectives

- Master KV secrets engine version 2
- Implement secret versioning and rollback
- Perform soft delete and recovery operations
- Manage secret metadata
- Understand secret lifecycle

## Prerequisites

- Completed Exercise 1: Vault Basics
- Vault running and unsealed
- Root or admin token

## Part 1: Secret Versioning

### Step 1: Create a Versioned Secret

```bash
docker exec -it vault sh
export VAULT_ADDR='http://127.0.0.1:8200'
export VAULT_TOKEN='root-token-change-me'

# Create initial version
vault kv put secret/app/database \
    username=dbuser \
    password=initial_pass_v1 \
    host=db.example.com

# Check metadata
vault kv metadata get secret/app/database
```

**Expected Output:**
```
========= Metadata =========
Key                     Value
---                     -----
created_time            2025-11-30T...
current_version         1
max_versions            0
oldest_version          0
updated_time            2025-11-30T...
```

### Step 2: Create Multiple Versions

```bash
# Version 2
vault kv put secret/app/database \
    username=dbuser \
    password=updated_pass_v2 \
    host=db.example.com \
    port=5432

# Version 3
vault kv put secret/app/database \
    username=dbuser_admin \
    password=secure_pass_v3 \
    host=db.prod.example.com \
    port=5432

# Version 4
vault kv put secret/app/database \
    username=dbuser_admin \
    password=final_pass_v4 \
    host=db.prod.example.com \
    port=5432 \
    ssl=true
```

### Step 3: Retrieve Specific Versions

```bash
# Get current version (v4)
vault kv get secret/app/database

# Get version 1
vault kv get -version=1 secret/app/database

# Get version 2
vault kv get -version=2 secret/app/database

# Compare versions
vault kv get -version=3 -format=json secret/app/database | jq '.data.data'
vault kv get -version=4 -format=json secret/app/database | jq '.data.data'
```

**CyberArk Equivalent:** Password history in CyberArk safes

### Step 4: View Version History

```bash
# Get all metadata including versions
vault kv metadata get secret/app/database

# Using API
curl -H "X-Vault-Token: root-token-change-me" \
    http://localhost:8200/v1/secret/metadata/app/database | jq .
```

## Part 2: Soft Delete and Recovery

### Step 5: Soft Delete Latest Version

```bash
# Delete latest version (v4) - soft delete
vault kv delete secret/app/database

# Try to read (will show as deleted)
vault kv get secret/app/database
# Expected: No value found at secret/data/app/database

# But version 3 is still accessible
vault kv get -version=3 secret/app/database
```

### Step 6: Undelete a Version

```bash
# Recover deleted version 4
vault kv undelete -versions=4 secret/app/database

# Verify recovery
vault kv get secret/app/database
```

**CyberArk Equivalent:** Restoring deleted passwords from recycle bin

### Step 7: Delete Specific Versions

```bash
# Delete version 1 and 2
vault kv delete -versions=1,2 secret/app/database

# Verify
vault kv get -version=1 secret/app/database
# Expected: Error or empty

vault kv get -version=3 secret/app/database
# Expected: Still works
```

### Step 8: Permanent Destruction

```bash
# Permanently destroy version 1 (cannot be recovered)
vault kv destroy -versions=1 secret/app/database

# Try to undelete
vault kv undelete -versions=1 secret/app/database
# Expected: Cannot undelete destroyed version
```

**WARNING:** Destroy is permanent. Use with extreme caution!

## Part 3: Metadata Management

### Step 9: Set Max Versions

```bash
# Limit to 5 versions
vault kv metadata put -max-versions=5 secret/app/database

# Verify
vault kv metadata get secret/app/database | grep max_versions
```

### Step 10: Test Max Versions Enforcement

```bash
# Create versions 5, 6, 7, 8
for i in 5 6 7 8; do
    vault kv put secret/app/database \
        username=dbuser_v${i} \
        password=pass_v${i}
done

# Check which versions exist
vault kv metadata get secret/app/database

# Version 3 should be auto-deleted (oldest beyond max)
vault kv get -version=3 secret/app/database
```

### Step 11: Custom Metadata

```bash
# Add custom metadata fields
vault kv metadata put secret/app/database \
    max-versions=10 \
    cas-required=false \
    delete-version-after=0

# Custom metadata (using kv put with -mount flag)
vault kv put secret/app/database \
    username=dbuser \
    password=pass123 \
    -mount=secret
```

## Part 4: Check-and-Set (CAS)

### Step 12: Enable CAS Requirement

```bash
# Require CAS for updates
vault kv metadata put -cas-required=true secret/app/secure

# Try to write without CAS
vault kv put secret/app/secure \
    api_key=secret123
# Expected: Error - check-and-set parameter required
```

### Step 13: Use CAS for Updates

```bash
# First write (version 1)
vault kv put secret/app/secure \
    api_key=secret123

# Get current version
CURRENT_VERSION=$(vault kv metadata get -format=json secret/app/secure | jq -r '.data.current_version')

# Update with CAS
vault kv put -cas=$CURRENT_VERSION secret/app/secure \
    api_key=newsecret456

# Try with wrong CAS (should fail)
vault kv put -cas=1 secret/app/secure \
    api_key=failedsecret
# Expected: Error - version mismatch
```

**CyberArk Equivalent:** Dual control / concurrent access prevention

## Part 5: Bulk Operations

### Step 14: Create Secret Hierarchy

```bash
# Create development secrets
vault kv put secret/app/dev/database password=dev_pass
vault kv put secret/app/dev/api api_key=dev_key
vault kv put secret/app/dev/cache redis_pass=dev_redis

# Create staging secrets
vault kv put secret/app/staging/database password=stg_pass
vault kv put secret/app/staging/api api_key=stg_key

# Create production secrets
vault kv put secret/app/prod/database password=prod_pass
vault kv put secret/app/prod/api api_key=prod_key
```

### Step 15: List and Navigate Hierarchy

```bash
# List all app secrets
vault kv list secret/app/

# List dev secrets
vault kv list secret/app/dev/

# List prod secrets
vault kv list secret/app/prod/
```

### Step 16: Bulk Delete (with caution!)

```bash
# Delete all dev secrets
vault kv delete secret/app/dev/database
vault kv delete secret/app/dev/api
vault kv delete secret/app/dev/cache

# Verify deletion
vault kv list secret/app/dev/
```

## Part 6: Secret Lifecycle Automation

### Step 17: Automated Deletion Policy

```bash
# Set automatic deletion after 30 days
vault kv metadata put -delete-version-after=720h secret/app/temp

# Create secret
vault kv put secret/app/temp token=temp_token_123

# Check metadata
vault kv metadata get secret/app/temp | grep delete_version_after
```

### Step 18: Secret Rollback Scenario

```bash
# Simulate production incident
vault kv put secret/app/prod/api \
    api_key=broken_key_v1

# Production breaks - rollback needed!
# First, check version history
vault kv metadata get secret/app/prod/api

# Rollback to previous version
PREV_VERSION=$((CURRENT_VERSION - 1))
OLD_DATA=$(vault kv get -version=$PREV_VERSION -format=json secret/app/prod/api | jq -r '.data.data')

# Restore old data as new version
vault kv put secret/app/prod/api api_key=prod_key
```

## Part 7: UI Operations

### Step 19: Manage Secrets via UI

1. Navigate to `http://localhost:8200/ui`
2. Go to `secret/` path
3. Click on `app/database`
4. Click "Create new version"
5. Modify values
6. View version history tab
7. Delete a version
8. Undelete it

## Challenges

### Challenge 1: Implement Secret Rotation Log
Create a secret that logs its rotation history:
```bash
vault kv put secret/app/rotated \
    password=pass1 \
    rotated_at="$(date -Iseconds)" \
    rotated_by="admin"
```

### Challenge 2: Emergency Rollback Procedure
Write a shell script to:
1. Backup current secret version
2. Roll back to version N
3. Log the rollback event

### Challenge 3: Secret Naming Convention
Implement this structure:
```
secret/
├── {environment}/
│   ├── {application}/
│   │   └── {component}/
```

Example:
```
secret/prod/webapp/database
secret/prod/webapp/cache
secret/dev/webapp/database
```

## Verification Checklist

- [ ] Created versioned secrets
- [ ] Retrieved specific versions
- [ ] Performed soft delete
- [ ] Recovered deleted secrets
- [ ] Destroyed a version permanently
- [ ] Set max versions limit
- [ ] Used check-and-set (CAS)
- [ ] Created secret hierarchy
- [ ] Implemented rollback

## Clean Up

```bash
# Delete test secrets
vault kv metadata delete secret/app/database
vault kv metadata delete secret/app/secure
vault kv metadata delete secret/app/temp

# Delete hierarchies
for env in dev staging prod; do
    for component in database api cache; do
        vault kv metadata delete secret/app/$env/$component 2>/dev/null || true
    done
done
```

## Key Takeaways

1. **Versioning prevents data loss** - All changes are tracked
2. **Soft delete allows recovery** - Mistakes can be undone
3. **CAS prevents conflicts** - Concurrent modification protection
4. **Metadata controls behavior** - Max versions, auto-deletion
5. **Hierarchy organizes secrets** - Environment/app/component structure

## CyberArk PAM-DEF Concepts

| CyberArk Concept | Vault Equivalent | Covered |
|------------------|------------------|---------|
| Password History | Secret Versioning | ✓ |
| Password Recovery | Undelete/Rollback | ✓ |
| Dual Control | Check-and-Set (CAS) | ✓ |
| Safe Structure | Secret Hierarchy | ✓ |
| Retention Policy | Max Versions | ✓ |

## Next Steps

Proceed to [Exercise 3: Dynamic Credentials](03-dynamic-credentials.md) to learn about:
- Database secrets engine
- On-demand credential generation
- Automatic credential revocation
- TTL management

---

**Excellent work!** You now understand advanced secret management in Vault.
