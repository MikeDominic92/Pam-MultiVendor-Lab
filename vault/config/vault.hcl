# HashiCorp Vault Configuration for PAM-Vault-Lab
# This is for LAB USE ONLY - DO NOT use in production

# Backend storage - using file storage for simplicity
storage "file" {
  path = "/vault/file"
}

# HTTP listener
listener "tcp" {
  address     = "0.0.0.0:8200"
  tls_disable = 1  # Disabled for lab - ENABLE in production
}

# API address
api_addr = "http://0.0.0.0:8200"

# UI enabled
ui = true

# Disable mlock for Docker containers
disable_mlock = true

# Telemetry for Prometheus
telemetry {
  prometheus_retention_time = "30s"
  disable_hostname = true
}

# Log level
log_level = "info"

# Maximum lease TTL
max_lease_ttl = "768h"

# Default lease TTL
default_lease_ttl = "168h"

# Cluster configuration (for future multi-node setup)
cluster_name = "pam-vault-lab"

# Plugin directory
plugin_directory = "/vault/plugins"
