# Rotation Policy - Credential Rotation Access
# Use Case: Automated rotation systems, CPM-equivalent service accounts
# CyberArk Equivalent: CPM (Central Policy Manager) permissions

# Read and update secrets for rotation
path "secret/data/*" {
  capabilities = ["create", "read", "update"]
}

# Manage secret metadata (for tracking rotation)
path "secret/metadata/*" {
  capabilities = ["read", "list", "update"]
}

# Delete old versions after rotation
path "secret/delete/*" {
  capabilities = ["update"]
}

path "secret/destroy/*" {
  capabilities = ["update"]
}

# Full access to database rotation
path "database/rotate-root/*" {
  capabilities = ["update"]
}

path "database/rotate-role/*" {
  capabilities = ["update"]
}

path "database/config/*" {
  capabilities = ["read", "update"]
}

path "database/roles/*" {
  capabilities = ["read", "create", "update"]
}

# Generate credentials for testing rotation
path "database/creds/*" {
  capabilities = ["read"]
}

# Static credentials rotation
path "database/static-creds/*" {
  capabilities = ["read"]
}

path "database/static-roles/*" {
  capabilities = ["create", "read", "update", "list"]
}

# SSH key rotation
path "ssh/roles/*" {
  capabilities = ["read", "create", "update"]
}

path "ssh/creds/*" {
  capabilities = ["create", "update"]
}

# Manage leases (revoke old credentials)
path "sys/leases/revoke" {
  capabilities = ["update"]
}

path "sys/leases/revoke-prefix/*" {
  capabilities = ["update"]
}

path "sys/leases/lookup" {
  capabilities = ["update"]
}

# Own token management
path "auth/token/lookup-self" {
  capabilities = ["read"]
}

path "auth/token/renew-self" {
  capabilities = ["update"]
}

# Read system health for validation
path "sys/health" {
  capabilities = ["read"]
}

# Read policies to validate permissions
path "sys/policies/*" {
  capabilities = ["read"]
}

# Cannot delete secrets engines or policies
path "sys/mounts/*" {
  capabilities = ["deny"]
}

path "sys/policies/*" {
  capabilities = ["read"]
  denied_parameters = {
    "delete" = []
  }
}

# Cannot modify audit configuration
path "sys/audit" {
  capabilities = ["deny"]
}

path "sys/audit/*" {
  capabilities = ["deny"]
}
