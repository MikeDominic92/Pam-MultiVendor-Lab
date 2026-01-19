# Exercise 5: Audit & Compliance Logging

**Duration:** 30-40 minutes
**Difficulty:** Intermediate
**CyberArk Alignment:** Audit vault, compliance reporting, SIEM integration

## Learning Objectives

- Enable and configure audit devices
- Analyze audit log entries
- Create compliance reports
- Implement log filtering
- Monitor security events

## Prerequisites

- Completed previous exercises
- Vault audit device enabled
- jq installed for JSON parsing

## Part 1: Audit Device Configuration

### Step 1: List Audit Devices

```bash
docker exec -it vault sh
export VAULT_ADDR='http://127.0.0.1:8200'
export VAULT_TOKEN='root-token-change-me'

# List enabled audit devices
vault audit list
```

**Expected Output:**
```
Path     Type    Description
----     ----    -----------
file/    file    n/a
```

### Step 2: Enable Additional Audit Device (if needed)

```bash
# Enable syslog audit device (example)
vault audit enable syslog

# Enable file audit with custom path
vault audit enable -path=file2 file file_path=/vault/logs/audit-backup.log
```

### Step 3: Audit Device Options

```bash
# Enable with HMAC of sensitive data
vault audit enable file \
    file_path=/vault/logs/audit-detailed.log \
    hmac_accessor=true \
    format=json
```

## Part 2: Understanding Audit Log Format

### Step 4: Examine Audit Log Structure

```bash
# View raw audit log entry
tail -1 /vault/logs/audit.log | jq .
```

**Key Fields:**
- `type`: "request" or "response"
- `auth.display_name`: User/service making request
- `auth.policies`: Policies assigned to auth token
- `request.path`: API endpoint accessed
- `request.operation`: read, write, delete, list
- `request.data`: Request parameters (sensitive values HMACed)
- `response.data`: Response data (sensitive values HMACed)
- `error`: Error message if request failed

### Step 5: Request vs Response Logs

```bash
# Generate an event
vault kv put secret/audit/test key=value

# View request entry
grep "secret/data/audit/test" /vault/logs/audit.log | grep '"type":"request"' | tail -1 | jq .

# View response entry
grep "secret/data/audit/test" /vault/logs/audit.log | grep '"type":"response"' | tail -1 | jq .
```

## Part 3: Audit Log Analysis

### Step 6: Track Secret Access

```bash
# Who accessed which secrets?
cat /vault/logs/audit.log | jq -r 'select(.request.path | contains("secret/data")) | "\(.time) \(.auth.display_name) accessed \(.request.path) - \(.request.operation)"'
```

### Step 7: Failed Authentication Attempts

```bash
# Find failed logins
cat /vault/logs/audit.log | jq 'select(.error != null and .request.path | contains("auth")) | {time, path: .request.path, error, remote_address: .request.remote_address}'
```

### Step 8: Policy Changes

```bash
# Track policy modifications
grep "sys/policies" /vault/logs/audit.log | jq 'select(.request.operation != "read") | {time, operation: .request.operation, policy: .request.path, user: .auth.display_name}'
```

### Step 9: Privilege Escalation Attempts

```bash
# Find denied operations
cat /vault/logs/audit.log | jq 'select(.error != null and (.error | contains("permission denied"))) | {time, user: .auth.display_name, attempted_path: .request.path, operation: .request.operation}'
```

## Part 4: Compliance Reporting

### Step 10: Access Report by User

```bash
cat > /tmp/access-report.sh <<'EOF'
#!/bin/sh
# Generate user access report

echo "Vault Access Report - $(date)"
echo "========================================"
echo ""

cat /vault/logs/audit.log | \
jq -r 'select(.type == "request") | "\(.auth.display_name // "anonymous")"' | \
sort | uniq -c | sort -rn | \
while read count user; do
    echo "User: $user - Requests: $count"
done
EOF

chmod +x /tmp/access-report.sh
/tmp/access-report.sh
```

### Step 11: Secret Access Matrix

```bash
cat > /tmp/secret-access-matrix.sh <<'EOF'
#!/bin/sh
# Which users accessed which secrets

echo "Secret Access Matrix"
echo "===================="
echo ""

cat /vault/logs/audit.log | \
jq -r 'select(.request.path | contains("secret/data")) | "\(.auth.display_name)\t\(.request.path)\t\(.request.operation)"' | \
sort | uniq | \
while IFS=$'\t' read user path op; do
    echo "  $user -> $path ($op)"
done
EOF

chmod +x /tmp/secret-access-matrix.sh
/tmp/secret-access-matrix.sh
```

### Step 12: Rotation Audit Trail

```bash
# Track all password rotations
grep "rotate" /vault/logs/audit.log | jq '{
    time,
    path: .request.path,
    user: .auth.display_name,
    success: (if .error then false else true end)
}'
```

### Step 13: Time-Based Activity Report

```bash
cat > /tmp/hourly-activity.sh <<'EOF'
#!/bin/sh
# Activity by hour

echo "Hourly Activity Report"
echo "======================"
echo ""

cat /vault/logs/audit.log | \
jq -r '.time' | \
cut -d'T' -f2 | \
cut -d':' -f1 | \
sort | uniq -c | \
while read count hour; do
    printf "Hour %02d:00 - %5d requests\n" $hour $count
done
EOF

chmod +x /tmp/hourly-activity.sh
/tmp/hourly-activity.sh
```

## Part 5: Security Monitoring

### Step 14: Real-Time Monitoring

```bash
# Tail audit log in real-time
tail -f /vault/logs/audit.log | jq -r '"\(.time) [\(.type)] \(.auth.display_name // "anon") \(.request.operation) \(.request.path)"'

# In another terminal, generate events:
# vault kv get secret/database/prod
# vault policy read admin-policy
# vault token create
```

### Step 15: Alert on Sensitive Operations

```bash
cat > /tmp/security-monitor.sh <<'EOF'
#!/bin/sh
# Monitor for sensitive operations

tail -f /vault/logs/audit.log | while read line; do
    # Check for policy changes
    if echo "$line" | grep -q "sys/policies"; then
        DETAIL=$(echo "$line" | jq -r '"\(.time) ALERT: Policy change by \(.auth.display_name) - \(.request.operation) \(.request.path)"')
        echo "$DETAIL"
    fi

    # Check for auth changes
    if echo "$line" | grep -q "sys/auth"; then
        DETAIL=$(echo "$line" | jq -r '"\(.time) ALERT: Auth method change by \(.auth.display_name)"')
        echo "$DETAIL"
    fi

    # Check for failed authentications
    if echo "$line" | jq -e '.error != null and (.request.path | contains("auth"))' > /dev/null; then
        DETAIL=$(echo "$line" | jq -r '"\(.time) WARNING: Failed auth from \(.request.remote_address)"')
        echo "$DETAIL"
    fi
done
EOF

chmod +x /tmp/security-monitor.sh
```

## Part 6: Retention and Rotation

### Step 16: Log Rotation Setup

```bash
# Create logrotate configuration (example - would be on host)
cat > /tmp/vault-logrotate.conf <<'EOF'
/vault/logs/audit.log {
    daily
    rotate 90
    compress
    delaycompress
    notifempty
    create 0600 vault vault
    postrotate
        # Signal Vault to reopen log file
        docker exec vault killall -HUP vault
    endscript
}
EOF
```

### Step 17: Archive Old Logs

```bash
# Simulate archiving logs older than 30 days
find /vault/logs -name "audit.log.*" -mtime +30 -exec gzip {} \;
find /vault/logs -name "audit.log.*.gz" -mtime +90 -exec rm {} \;
```

## Part 7: SIEM Integration Simulation

### Step 18: Export to JSON for SIEM

```bash
# Export last 24 hours to structured JSON
cat > /tmp/export-to-siem.sh <<'EOF'
#!/bin/sh
# Export audit logs for SIEM ingestion

YESTERDAY=$(date -d "yesterday" +%Y-%m-%d)

cat /vault/logs/audit.log | \
jq -c 'select(.time | startswith("'$YESTERDAY'"))' \
> /tmp/vault-audit-export-$YESTERDAY.json

echo "Exported to: /tmp/vault-audit-export-$YESTERDAY.json"
wc -l /tmp/vault-audit-export-$YESTERDAY.json
EOF

chmod +x /tmp/export-to-siem.sh
/tmp/export-to-siem.sh
```

### Step 19: CEF Format Export (for Splunk/ArcSight)

```bash
# Convert to Common Event Format
cat /vault/logs/audit.log | \
jq -r '"CEF:0|HashiCorp|Vault|1.15|" + .request.operation + "|" + .request.path + "|" + (if .error then "High" else "Low" end) + "|src=" + (.request.remote_address // "unknown") + " suser=" + (.auth.display_name // "anonymous") + " act=" + .request.operation'
```

## Part 8: Compliance Queries

### Step 20: PCI-DSS Compliance Report

```bash
cat > /tmp/pci-compliance.sh <<'EOF'
#!/bin/sh
# PCI-DSS Requirement 10: Track and monitor all access

echo "PCI-DSS Audit Report"
echo "===================="
echo ""

echo "10.1 - Link access to individuals:"
cat /vault/logs/audit.log | jq -r 'select(.auth.display_name) | .auth.display_name' | sort | uniq

echo ""
echo "10.2.1 - All individual user accesses to cardholder data:"
grep "secret/data/cardholder" /vault/logs/audit.log | jq -r '"\(.time) \(.auth.display_name) accessed cardholder data"'

echo ""
echo "10.2.2 - Administrative actions:"
grep "sys/policies\|sys/auth\|sys/mounts" /vault/logs/audit.log | jq -r '"\(.time) \(.auth.display_name) performed admin action: \(.request.path)"'

echo ""
echo "10.2.7 - Creation and deletion of system-level objects:"
grep '"operation":"write"\|"operation":"delete"' /vault/logs/audit.log | jq -r '"\(.time) \(.request.operation) \(.request.path)"'
EOF

chmod +x /tmp/pci-compliance.sh
/tmp/pci-compliance.sh
```

### Step 21: SOC 2 Evidence Collection

```bash
# Collect evidence for SOC 2 audit
cat > /tmp/soc2-evidence.sh <<'EOF'
#!/bin/sh

echo "SOC 2 Type II Evidence - Access Controls"
echo "========================================="
echo ""

echo "1. User authentication logs:"
grep "auth/token/create" /vault/logs/audit.log | wc -l

echo ""
echo "2. Failed authentication attempts:"
grep '"error".*"auth/token"' /vault/logs/audit.log | wc -l

echo ""
echo "3. Privileged access granted:"
grep "admin-policy" /vault/logs/audit.log | wc -l

echo ""
echo "4. Audit log integrity:"
md5sum /vault/logs/audit.log
EOF

chmod +x /tmp/soc2-evidence.sh
/tmp/soc2-evidence.sh
```

## Challenges

### Challenge 1: Anomaly Detection
Create a script that detects:
- Unusual access patterns (time of day, frequency)
- Access to secrets outside normal paths
- Multiple failed authentication attempts

### Challenge 2: Compliance Dashboard
Build a dashboard script that shows:
- Total requests in last 24h
- Top 10 users by activity
- Failed operations count
- Most accessed secrets

### Challenge 3: Automated Alerting
Implement alerts for:
- Any root token usage
- Policy modifications
- Audit device changes
- Mass secret deletions

## Verification Checklist

- [ ] Audit device enabled and working
- [ ] Understood audit log format
- [ ] Created access reports
- [ ] Tracked password rotations
- [ ] Monitored security events
- [ ] Exported logs for SIEM
- [ ] Generated compliance reports

## Clean Up

```bash
# Archive audit logs
gzip /vault/logs/audit.log
mv /vault/logs/audit.log.gz /tmp/

# Remove test scripts
rm /tmp/access-report.sh
rm /tmp/secret-access-matrix.sh
rm /tmp/hourly-activity.sh
rm /tmp/security-monitor.sh
rm /tmp/export-to-siem.sh
rm /tmp/pci-compliance.sh
rm /tmp/soc2-evidence.sh
```

## Key Takeaways

1. **Every operation is logged** - Complete audit trail
2. **Sensitive data is protected** - HMAC hashing in logs
3. **Real-time monitoring** - Detect threats immediately
4. **Compliance ready** - PCI-DSS, SOC 2, HIPAA support
5. **SIEM integration** - Export to enterprise tools

## CyberArk PAM-DEF Concepts

| CyberArk Concept | Vault Equivalent | Covered |
|------------------|------------------|---------|
| Audit Vault | Audit Device | ✓ |
| SIEM Integration | Log Export | ✓ |
| Compliance Reports | Custom Queries | ✓ |
| Session Monitoring | Real-time Logs | ✓ |
| Forensic Investigation | Log Analysis | ✓ |

## Congratulations!

You've completed all 5 exercises in the PAM-Vault-Lab!

### What You've Learned:

1. **Exercise 1:** Vault initialization, policies, tokens
2. **Exercise 2:** Secret management, versioning, rollback
3. **Exercise 3:** Dynamic credentials, just-in-time access
4. **Exercise 4:** Password rotation, CPM concepts
5. **Exercise 5:** Audit logging, compliance reporting

### Next Steps:

- Practice regularly to build muscle memory
- Experiment with advanced Vault features
- Study CyberArk PAM-DEF exam objectives
- Build your own PAM workflows
- Contribute improvements to this lab

---

**You're now ready to tackle CyberArk PAM-DEF certification with hands-on PAM experience!**
