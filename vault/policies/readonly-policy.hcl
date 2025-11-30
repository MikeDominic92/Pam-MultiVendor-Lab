# Read-Only Policy - Restricted Access
# Use Case: Auditors, compliance teams, monitoring systems
# CyberArk Equivalent: Auditor role

# Read-only access to KV v2 secrets (data path)
path "secret/data/*" {
  capabilities = ["read", "list"]
}

# Read metadata for secrets (version history, etc.)
path "secret/metadata/*" {
  capabilities = ["read", "list"]
}

# Read database connection info (but cannot create credentials)
path "database/config/*" {
  capabilities = ["read", "list"]
}

path "database/roles/*" {
  capabilities = ["read", "list"]
}

# Cannot generate credentials - removed "create" capability
path "database/creds/*" {
  capabilities = ["read"]
}

# Read SSH roles (but cannot sign keys)
path "ssh/roles/*" {
  capabilities = ["read", "list"]
}

# Read auth methods configuration
path "auth/*" {
  capabilities = ["read", "list"]
}

# Read policies (cannot modify)
path "sys/policies/*" {
  capabilities = ["read", "list"]
}

# Read system health
path "sys/health" {
  capabilities = ["read"]
}

path "sys/seal-status" {
  capabilities = ["read"]
}

# List secrets engines
path "sys/mounts" {
  capabilities = ["read", "list"]
}

# List audit devices
path "sys/audit" {
  capabilities = ["read", "list"]
}

# Read metrics for monitoring
path "sys/metrics" {
  capabilities = ["read"]
}

# Own token lookup (can check own token info)
path "auth/token/lookup-self" {
  capabilities = ["read"]
}

# Can renew own token
path "auth/token/renew-self" {
  capabilities = ["update"]
}

# Read internal counters
path "sys/internal/counters/*" {
  capabilities = ["read", "list"]
}

# Deny destructive operations
path "secret/data/*" {
  capabilities = ["read", "list"]
  denied_parameters = {
    "delete" = []
  }
}

path "secret/metadata/*" {
  capabilities = ["read", "list"]
  denied_parameters = {
    "delete" = []
    "destroy" = []
  }
}
