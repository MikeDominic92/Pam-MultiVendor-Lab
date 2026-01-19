# Lab 7: Cross-Platform PAM Migration

**Duration:** 45 minutes
**Difficulty:** Advanced
**CyberArk Alignment:** Secret migration, cross-platform integration, data portability

## Overview

This lab walks you through migrating secrets between different PAM platforms - specifically from Delinea Secret Server to HashiCorp Vault and vice versa. You'll understand the challenges of cross-platform migration, perform dry-run migrations, customize field mappings, and execute batch migrations with detailed reporting.

This is a critical skill for organizations undergoing PAM platform transitions or maintaining multi-platform environments.

## Learning Objectives

By the end of this exercise, you will be able to:
* Understand the challenges and risks of cross-platform PAM migration
* Execute dry-run migrations to validate migration strategies
* Analyze migration reports and identify issues
* Customize field mappings for different platform schemas
* Perform batch migrations with progress tracking
* Implement reverse migration concepts
* Generate and interpret migration comparison reports
* Apply best practices for safe, auditable migrations

## Prerequisites

* Docker and Docker Compose running
* PAM-Vault-Lab containers started (`docker-compose up -d`)
* Both Delinea Secret Server and Vault instances accessible
* Python 3.9+ with required dependencies installed
* Familiarity with Labs 01-05 concepts
* Basic understanding of JSON and field mapping concepts

## Part 1: Understanding Migration Challenges

### Step 1: Review the Migration Architecture

Migration between PAM platforms involves several challenges:

```
Delinea Secret Server          HashiCorp Vault
├── Secret ID (numeric)        ├── Secret Path (string)
├── Secret Name                ├── Metadata
├── Folder Structure           ├── Version Control
├── Custom Fields              ├── Engine Type
├── Permissions Model          ├── Access Control (ACL)
└── Audit Log                  └── Audit Log
```

**Key Differences:**
* **Data Models:** Different schema structures require field mapping
* **ID Systems:** Numeric IDs vs. path-based identifiers
* **Permissions:** Role-based vs. policy-based access control
* **Field Types:** Custom fields vs. standard metadata
* **Versioning:** Secret history handling varies
* **Audit Trails:** Different logging mechanisms and detail levels

### Step 2: Document Migration Considerations

Create a file `migration-plan.txt` with the following considerations:

```
MIGRATION CHECKLIST
==================

1. DATA INVENTORY
   - [ ] Total secrets count
   - [ ] Secret categories
   - [ ] Custom field types
   - [ ] Folder hierarchy depth

2. FIELD MAPPING
   - [ ] Document all custom fields
   - [ ] Identify required vs. optional fields
   - [ ] Plan transformation logic
   - [ ] Test mappings with sample data

3. PERMISSIONS MAPPING
   - [ ] List all roles/groups in source
   - [ ] Map to target platform policies
   - [ ] Identify permission gaps
   - [ ] Plan fallback permissions

4. VALIDATION STRATEGY
   - [ ] Define success criteria
   - [ ] Plan spot checks
   - [ ] Test critical secrets first
   - [ ] Verify audit trails

5. ROLLBACK PLAN
   - [ ] Backup all source data
   - [ ] Document rollback procedures
   - [ ] Plan for partial rollbacks
   - [ ] Test rollback in dev first

6. CUTOVER TIMING
   - [ ] Plan maintenance window
   - [ ] Notify dependent systems
   - [ ] Prepare rollback team
   - [ ] Schedule monitoring

7. POST-MIGRATION
   - [ ] Verify all secrets migrated
   - [ ] Update consuming applications
   - [ ] Deprecate old platform
   - [ ] Archive historical data
```

## Part 2: Dry-Run Migration (Delinea to Vault)

Dry-run migrations allow you to test without making actual changes. This is critical for production readiness.

### Step 1: Prepare Migration Environment

```bash
# Navigate to the scripts directory
cd /path/to/pam-vault-lab/scripts

# Review available migration options
python delinea_to_vault.py --help
```

Expected options include:
* `--dry-run`: Test migration without writing to Vault
* `--config`: Path to configuration file
* `--filter`: Filter secrets by pattern
* `--field-mapping`: Custom field mapping file
* `--output`: Report output file

### Step 2: Execute Dry-Run Migration

```bash
# Run a dry-run migration from Delinea to Vault
# This will NOT modify any data in either system
python delinea_to_vault.py \
  --dry-run \
  --config config.py \
  --output migration-dry-run-report.json

# Monitor the output for progress
```

**Expected Output:**
```
Starting dry-run migration from Delinea to Vault...
Processing: database_credentials [ID: 1001]
Processing: api_keys [ID: 1002]
...
Migration Summary
=================
Total Secrets: 42
Successful (simulated): 41
Failed: 1
Success Rate: 97.6%
Duration: 12.3 seconds
```

### Step 3: Examine Dry-Run Report

```bash
# View the dry-run report in JSON format
cat migration-dry-run-report.json | python -m json.tool

# Extract key metrics
python -c "
import json
with open('migration-dry-run-report.json') as f:
    data = json.load(f)
    print(f\"Total: {data['summary']['total_secrets']}\")
    print(f\"Success Rate: {data['summary']['success_rate']}\")
    print(f\"Failed: {data['summary']['failed']}\")
    if data['summary']['failed'] > 0:
        for result in data['results']:
            if not result['success']:
                print(f\"  - {result['source_name']}: {result['error']}\")
"
```

### Step 4: Analyze Failed Migrations

For any failed secrets, investigate the root cause:

```bash
# Extract failed secret details from report
python -c "
import json
with open('migration-dry-run-report.json') as f:
    data = json.load(f)
    for result in data['results']:
        if not result['success']:
            print(f\"Secret: {result['source_name']}\")
            print(f\"  Source Fields: {', '.join(result['source_fields'])}\")
            print(f\"  Error: {result['error']}\")
            print()
"
```

**Common Issues:**
* Missing required fields in target platform
* Invalid characters in secret paths
* Unsupported field types
* Permission constraints
* Custom field incompatibilities

## Part 3: Analyzing Migration Reports

### Step 1: Generate Detailed Report

```bash
# Generate migration report with detailed field information
python delinea_to_vault.py \
  --dry-run \
  --config config.py \
  --verbose \
  --output detailed-migration-report.json
```

### Step 2: Create Report Summary

```bash
# Create a human-readable summary
python -c "
import json
from datetime import datetime

with open('detailed-migration-report.json') as f:
    data = json.load(f)

summary = data['summary']
total = summary['total_secrets']
success = summary['successful']
failed = summary['failed']
rate = summary['success_rate']

print('='*60)
print('MIGRATION ANALYSIS REPORT')
print('='*60)
print(f\"Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\")
print(f\"Mode: {'DRY-RUN' if summary['dry_run'] else 'ACTUAL'}\")
print()
print('SUMMARY')
print('-'*60)
print(f\"Total Secrets:       {total}\")
print(f\"Successful:          {success}\")
print(f\"Failed:              {failed}\")
print(f\"Success Rate:        {rate}\")
print(f\"Duration:            {data['timing']['duration_seconds']:.1f} seconds\")
print()
print('FIELD MAPPING OVERVIEW')
print('-'*60)
field_stats = {}
for result in data['results']:
    for src_field, tgt_field in result['mapped_fields'].items():
        if src_field not in field_stats:
            field_stats[src_field] = {'mapped_to': tgt_field, 'count': 0}
        field_stats[src_field]['count'] += 1

for src, info in sorted(field_stats.items()):
    print(f\"  {src:<25} -> {info['mapped_to']:<25} ({info['count']} secrets)\")
print('='*60)
"
```

### Step 3: Identify Problematic Secrets

```bash
# Find secrets with mapping issues
python -c "
import json

with open('detailed-migration-report.json') as f:
    data = json.load(f)

issues = []
for result in data['results']:
    if not result['success']:
        issues.append(result)

if issues:
    print(f\"Found {len(issues)} problematic secrets:\")
    print()
    for issue in issues[:10]:  # Show first 10
        print(f\"Secret: {issue['source_name']}\")
        print(f\"  Source ID: {issue['source_id']}\")
        print(f\"  Fields: {', '.join(issue['source_fields'])}\")
        print(f\"  Error: {issue['error']}\")
        print()
else:
    print('No issues found!')
"
```

## Part 4: Customize Field Mappings

### Step 1: Create Custom Field Mapping Configuration

Different organizations have different custom fields. Create a mapping file:

```bash
# Create field_mapping.json
cat > field_mapping.json << 'EOF'
{
  "standard_mappings": {
    "secret_name": "path",
    "username": "username",
    "password": "password",
    "url": "url",
    "notes": "notes"
  },
  "custom_field_mappings": {
    "Environment": "metadata.environment",
    "Application": "metadata.application",
    "Tier": "metadata.tier",
    "Owner": "metadata.owner",
    "CostCenter": "metadata.cost_center",
    "ExpiryDate": "metadata.expiry_date"
  },
  "transformation_rules": {
    "secret_path_pattern": "infrastructure/{folder}/{secret_name}",
    "case_conversion": "lowercase",
    "special_char_handling": "replace_with_underscore",
    "max_path_length": 255
  },
  "skip_fields": [
    "internal_id",
    "legacy_reference",
    "decommissioned_date"
  ],
  "default_values": {
    "migrated_from": "delinea",
    "migration_date": "current_timestamp",
    "requires_validation": true
  }
}
EOF

cat field_mapping.json
```

### Step 2: Apply Custom Mappings

```bash
# Run migration with custom field mappings
python delinea_to_vault.py \
  --dry-run \
  --config config.py \
  --field-mapping field_mapping.json \
  --output custom-mapped-report.json
```

### Step 3: Compare Original vs. Custom Mappings

```bash
# Compare field mappings between dry runs
python -c "
import json

def extract_mappings(report_file):
    with open(report_file) as f:
        data = json.load(f)

    mappings = {}
    for result in data['results']:
        if result['success']:
            for src, tgt in result['mapped_fields'].items():
                if src not in mappings:
                    mappings[src] = set()
                mappings[src].add(tgt)
    return mappings

original = extract_mappings('migration-dry-run-report.json')
custom = extract_mappings('custom-mapped-report.json')

print('FIELD MAPPING COMPARISON')
print('='*60)
for field in sorted(set(original.keys()) | set(custom.keys())):
    orig = list(original.get(field, ['(not mapped)']))[0]
    cust = list(custom.get(field, ['(not mapped)']))[0]
    status = '✓' if orig == cust else 'CHANGED'
    print(f\"{status} {field:<25} {orig:<30} -> {cust:<30}\")
"
```

## Part 5: Run Batch Migration

### Step 1: Prepare for Production Migration

Before running a batch migration, ensure:

```bash
# 1. Verify connectivity to both systems
echo "Testing Delinea connectivity..."
python -c "
from delinea_client import DelineaClient
from config import DELINEA_CONFIG
client = DelineaClient(DELINEA_CONFIG)
print(f'Delinea Status: {\"Connected\" if client.is_connected() else \"Failed\"}')
"

echo "Testing Vault connectivity..."
python -c "
from vault_client import VaultClient
from config import VAULT_CONFIG
client = VaultClient(VAULT_CONFIG)
print(f'Vault Status: {\"Connected\" if client.is_authenticated() else \"Failed\"}')
"

# 2. Backup source data
mkdir -p backups
python delinea_to_vault.py \
  --backup \
  --output backups/delinea-backup-$(date +%Y%m%d-%H%M%S).json
```

### Step 2: Execute Batch Migration

```bash
# Run the actual migration (not dry-run)
python delinea_to_vault.py \
  --config config.py \
  --field-mapping field_mapping.json \
  --batch-size 10 \
  --parallel-workers 3 \
  --output migration-batch-report.json

# The command will:
# - Migrate 10 secrets at a time
# - Use 3 parallel workers for performance
# - Display real-time progress
# - Generate detailed report on completion
```

### Step 3: Monitor Migration Progress

In a separate terminal, monitor the migration:

```bash
# Watch the migration report in real-time
watch -n 2 'tail -20 migration-batch-report.json | python -m json.tool'

# Or check specific metrics
while true; do
  if [ -f migration-batch-report.json ]; then
    python -c "
      import json
      with open('migration-batch-report.json') as f:
        data = json.load(f)
      print(f\"Progress: {data['summary']['successful']}/{data['summary']['total_secrets']}\")
    "
  fi
  sleep 5
done
```

### Step 4: Verify Migrated Secrets

```bash
# Verify secrets were created in Vault
vault kv list secret/migrations/

# Spot-check specific migrated secrets
vault kv get secret/migrations/database_credentials

# Compare field counts
python -c "
import json
from vault_client import VaultClient
from config import VAULT_CONFIG

with open('migration-batch-report.json') as f:
    data = json.load(f)

vault = VaultClient(VAULT_CONFIG)

success_count = 0
mismatch_count = 0

for result in data['results'][:10]:  # Check first 10
    try:
        secret = vault.read_secret(result['target_path'])
        source_fields = len(result['source_fields'])
        target_fields = len(secret['data']['data'])

        if source_fields == target_fields:
            success_count += 1
        else:
            mismatch_count += 1
            print(f\"Mismatch: {result['source_name']}\")
            print(f\"  Source fields: {source_fields}\")
            print(f\"  Target fields: {target_fields}\")
    except Exception as e:
        print(f\"Error verifying {result['target_path']}: {e}\")

print(f\"\\nVerification Summary:\")
print(f\"  Verified: {success_count}\")
print(f\"  Mismatches: {mismatch_count}\")
"
```

## Part 6: Reverse Migration (Vault to Delinea)

This demonstrates the bidirectional migration capability - migrating secrets from Vault back to Delinea.

### Step 1: Understand Reverse Migration Challenges

Reverse migrations present additional challenges:

* **Path to Name Conversion:** Vault paths may not map cleanly back to Delinea names
* **Metadata Loss:** Some Vault metadata may not have Delinea equivalents
* **Permission Conflicts:** Vault policies may not align with Delinea roles
* **Folder Structure:** Recreating folder hierarchies from flat paths

### Step 2: Create Reverse Mapping Configuration

```bash
cat > reverse_mapping.json << 'EOF'
{
  "path_to_name_rules": {
    "extract_name_from_path": "last_segment",
    "folder_mapping": {
      "infrastructure/database": "Database Secrets",
      "infrastructure/api": "API Secrets",
      "application/prod": "Production Credentials",
      "application/staging": "Staging Credentials"
    }
  },
  "metadata_to_field_mapping": {
    "metadata.environment": "Environment",
    "metadata.application": "Application",
    "metadata.owner": "Owner",
    "metadata.tier": "Tier"
  },
  "delinea_folder_structure": {
    "create_if_missing": true,
    "default_folder": "Migrated Secrets"
  },
  "conflict_resolution": {
    "strategy": "skip_existing",
    "options": ["skip_existing", "overwrite", "version_suffix"]
  }
}
EOF
```

### Step 3: Perform Reverse Migration Dry-Run

```bash
# Test reverse migration from Vault back to Delinea
python vault_to_delinea.py \
  --dry-run \
  --config config.py \
  --field-mapping reverse_mapping.json \
  --vault-path secret/migrations \
  --output reverse-migration-report.json
```

### Step 4: Analyze Reverse Migration Results

```bash
# Review reverse migration report
python -c "
import json

with open('reverse-migration-report.json') as f:
    data = json.load(f)

print('REVERSE MIGRATION ANALYSIS')
print('='*60)
print(f\"Total Secrets: {data['summary']['total_secrets']}\")
print(f\"Successful: {data['summary']['successful']}\")
print(f\"Failed: {data['summary']['failed']}\")
print(f\"Success Rate: {data['summary']['success_rate']}\")
print()

if data['summary']['failed'] > 0:
    print('FAILED MIGRATIONS:')
    for result in data['results']:
        if not result['success']:
            print(f\"  - {result['source_path']}\")
            print(f\"    Target: {result['target_name']}\")
            print(f\"    Error: {result['error']}\")
            if result['skipped_fields']:
                print(f\"    Skipped: {', '.join(result['skipped_fields'])}\")
"
```

## Part 7: Bonus - Generate Comparison Report

This exercise creates a comprehensive report comparing the source and migrated secrets.

### Step 1: Create Comparison Script

```bash
cat > compare_migrations.py << 'EOF'
#!/usr/bin/env python
"""
Compare source and migrated secrets for data integrity verification.
"""

import json
from collections import defaultdict

def compare_migrations(source_report, vault_verification, output_file):
    """
    Compare migrated secrets against source data.

    Args:
        source_report: Path to original migration report
        vault_verification: Path to Vault verification data
        output_file: Path to output comparison report
    """

    with open(source_report) as f:
        migration = json.load(f)

    with open(vault_verification) as f:
        vault_data = json.load(f)

    comparison = {
        "total_migrated": len(migration['results']),
        "verified_in_vault": 0,
        "field_mismatches": [],
        "missing_in_vault": [],
        "data_integrity_score": 0.0
    }

    verified = 0
    for result in migration['results']:
        if result['success']:
            target = result['target_path']
            if target in vault_data:
                verified += 1
                source_fields = set(result['source_fields'])
                vault_fields = set(vault_data[target].keys())

                if source_fields != vault_fields:
                    comparison['field_mismatches'].append({
                        "secret": result['source_name'],
                        "missing_fields": list(source_fields - vault_fields),
                        "extra_fields": list(vault_fields - source_fields)
                    })
            else:
                comparison['missing_in_vault'].append(result['source_name'])

    comparison['verified_in_vault'] = verified
    comparison['data_integrity_score'] = (verified / len(migration['results']) * 100) if migration['results'] else 0

    with open(output_file, 'w') as f:
        json.dump(comparison, f, indent=2)

    return comparison

if __name__ == "__main__":
    result = compare_migrations(
        'migration-batch-report.json',
        'vault-verification.json',
        'comparison-report.json'
    )

    print("Comparison Report Generated:")
    print(f"  Verified: {result['verified_in_vault']}/{result['total_migrated']}")
    print(f"  Integrity Score: {result['data_integrity_score']:.1f}%")
    print(f"  Mismatches: {len(result['field_mismatches'])}")
    print(f"  Missing: {len(result['missing_in_vault'])}")
EOF

chmod +x compare_migrations.py
```

### Step 2: Run Comparison

```bash
# Generate vault verification data
python -c "
import json
from vault_client import VaultClient
from config import VAULT_CONFIG

vault = VaultClient(VAULT_CONFIG)
secrets = vault.list_all_secrets('secret/migrations')

verification = {}
for secret_path in secrets:
    secret = vault.read_secret(secret_path)
    verification[secret_path] = secret['data']['data']

with open('vault-verification.json', 'w') as f:
    json.dump(verification, f, indent=2)

print(f'Verification data: {len(verification)} secrets')
"

# Run comparison
python compare_migrations.py
```

### Step 3: Analyze Comparison Results

```bash
# Review comparison report
python -c "
import json

with open('comparison-report.json') as f:
    data = json.load(f)

print('DATA INTEGRITY VERIFICATION')
print('='*60)
print(f\"Total Migrated:    {data['total_migrated']}\")
print(f\"Verified in Vault: {data['verified_in_vault']}\")
print(f\"Integrity Score:   {data['data_integrity_score']:.1f}%\")
print()

if data['field_mismatches']:
    print(f\"Field Mismatches ({len(data['field_mismatches'])}):\")
    for mismatch in data['field_mismatches'][:5]:
        print(f\"  {mismatch['secret']}\")
        if mismatch['missing_fields']:
            print(f\"    Missing: {', '.join(mismatch['missing_fields'])}\")
        if mismatch['extra_fields']:
            print(f\"    Extra: {', '.join(mismatch['extra_fields'])}\")

if data['missing_in_vault']:
    print(f\"\\nMissing from Vault ({len(data['missing_in_vault'])}):\")
    for secret in data['missing_in_vault'][:5]:
        print(f\"  - {secret}\")
"
```

## Migration Best Practices Checklist

Before executing any production migration, verify all items:

* **Planning Phase**
  * [ ] Document all custom fields in source system
  * [ ] Create field mapping strategy
  * [ ] Identify permission mapping approach
  * [ ] Plan folder/path structure
  * [ ] Define success criteria and metrics
  * [ ] Schedule maintenance window
  * [ ] Notify dependent teams

* **Preparation Phase**
  * [ ] Backup all source data
  * [ ] Test in non-production environment first
  * [ ] Verify target platform capacity
  * [ ] Create rollback procedures
  * [ ] Prepare communication templates
  * [ ] Set up monitoring for migration
  * [ ] Document known issues/limitations

* **Validation Phase**
  * [ ] Run dry-run migration
  * [ ] Analyze dry-run report for failures
  * [ ] Test field mappings with sample data
  * [ ] Verify permission mappings work
  * [ ] Spot-check audit trail integrity
  * [ ] Test integration with consuming apps
  * [ ] Validate all secret types migrate

* **Execution Phase**
  * [ ] Create backup of current Vault state
  * [ ] Execute batch migration
  * [ ] Monitor real-time progress
  * [ ] Verify migration completion
  * [ ] Run spot checks on random secrets
  * [ ] Verify audit logs in both systems
  * [ ] Document any issues encountered

* **Verification Phase**
  * [ ] Run comparison report
  * [ ] Verify data integrity score meets threshold
  * [ ] Check for missing or malformed secrets
  * [ ] Validate all consumers can access secrets
  * [ ] Review audit logs for completeness
  * [ ] Perform final permission verification
  * [ ] Get stakeholder sign-off

* **Post-Migration Phase**
  * [ ] Update documentation
  * [ ] Decommission old system (if applicable)
  * [ ] Archive migrated data
  * [ ] Update recovery procedures
  * [ ] Conduct team training on new platform
  * [ ] Monitor for issues in production
  * [ ] Schedule cleanup of legacy data

## Key Takeaways

1. **Plan Extensively:** Migration success depends more on planning than execution. Use dry-runs to validate strategies.

2. **Field Mapping is Critical:** Different platforms have different data models. Careful mapping prevents data loss.

3. **Dry-Run Before Production:** Always test with dry-run mode. This catches issues without risk.

4. **Verify at Every Step:** Create validation checkpoints throughout the migration process.

5. **Maintain Bidirectional Capability:** Plan for reverse migrations. You may need to roll back or migrate again later.

6. **Audit Everything:** Keep detailed logs of what was migrated, when, and by whom. This is essential for compliance.

7. **Communication is Key:** Keep all stakeholders informed. Surprises in production are expensive.

8. **Document Mappings:** Custom field mappings should be versioned and tracked. Future migrations depend on this documentation.

## Next Steps

1. **Extend Mappings:** Create custom field mappings for your organization's specific requirements.

2. **Automate Monitoring:** Build alerting for failed migrations and data integrity issues.

3. **Integration Testing:** Verify that applications consuming secrets work with migrated secrets.

4. **Disaster Recovery:** Test rollback procedures to ensure you can recover from migration failures.

5. **Multi-Platform Strategy:** Design a strategy for managing multiple PAM platforms in parallel during transition periods.

6. **Compliance Validation:** Ensure migrated secrets meet all compliance and security requirements.

7. **Performance Tuning:** Optimize batch sizes and parallel workers based on your infrastructure.

## Lab Completion

To verify completion of this lab:

```bash
# Confirm all reports generated
ls -la migration-*-report.json
ls -la comparison-report.json

# Verify migration quality
python -c "
import json
import sys

with open('migration-batch-report.json') as f:
    data = json.load(f)

success_rate = float(data['summary']['success_rate'].rstrip('%'))

if success_rate >= 95.0:
    print('✓ Lab Completed Successfully')
    print(f'  Migration Success Rate: {success_rate:.1f}%')
    sys.exit(0)
else:
    print('✗ Lab Incomplete - Investigate Failures')
    print(f'  Migration Success Rate: {success_rate:.1f}%')
    sys.exit(1)
"
```

---

**Author:** Dominic M. Hoang
**Version:** 1.0
**Last Updated:** 2025-01-19
