# Admin Policy - Full Access to Vault
# Use Case: Vault administrators and lab setup
# CyberArk Equivalent: Vault Admin role

# Full access to all secrets engines
path "secret/*" {
  capabilities = ["create", "read", "update", "delete", "list"]
}

# Full access to KV v2 secrets engine
path "secret/data/*" {
  capabilities = ["create", "read", "update", "delete", "list"]
}

path "secret/metadata/*" {
  capabilities = ["create", "read", "update", "delete", "list"]
}

# Manage database secrets engine
path "database/*" {
  capabilities = ["create", "read", "update", "delete", "list"]
}

# Manage SSH secrets engine
path "ssh/*" {
  capabilities = ["create", "read", "update", "delete", "list"]
}

# Full access to auth methods
path "auth/*" {
  capabilities = ["create", "read", "update", "delete", "list", "sudo"]
}

# Manage policies
path "sys/policies/*" {
  capabilities = ["create", "read", "update", "delete", "list"]
}

# Read system health and status
path "sys/health" {
  capabilities = ["read"]
}

path "sys/seal-status" {
  capabilities = ["read"]
}

# Manage audit devices
path "sys/audit" {
  capabilities = ["read", "list"]
}

path "sys/audit/*" {
  capabilities = ["create", "read", "update", "delete", "sudo"]
}

# Manage secrets engines
path "sys/mounts" {
  capabilities = ["read", "list"]
}

path "sys/mounts/*" {
  capabilities = ["create", "read", "update", "delete", "sudo"]
}

# Access to audit logs
path "sys/audit-hash/*" {
  capabilities = ["create", "update"]
}

# Manage leases
path "sys/leases/*" {
  capabilities = ["create", "read", "update", "delete", "list", "sudo"]
}

# Token management
path "auth/token/create" {
  capabilities = ["create", "update", "sudo"]
}

path "auth/token/renew" {
  capabilities = ["update"]
}

path "auth/token/revoke" {
  capabilities = ["update"]
}

path "auth/token/lookup" {
  capabilities = ["read"]
}

# Manage namespaces (Vault Enterprise - will be ignored in OSS)
path "sys/namespaces/*" {
  capabilities = ["create", "read", "update", "delete", "list"]
}

# Metrics access for monitoring
path "sys/metrics" {
  capabilities = ["read"]
}

# Internal counters for usage data
path "sys/internal/counters/*" {
  capabilities = ["read", "list"]
}
