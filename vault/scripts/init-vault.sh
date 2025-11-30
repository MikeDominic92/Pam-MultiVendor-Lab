#!/bin/sh
# Initialize HashiCorp Vault for PAM-Vault-Lab
# This script initializes Vault, creates policies, and sets up basic configuration

set -e

echo "==================================="
echo "PAM-Vault-Lab - Vault Initialization"
echo "==================================="
echo ""

# Check if running in dev mode
if vault status | grep -q "HA Enabled.*false"; then
    echo "Running in DEV MODE - Vault is already initialized and unsealed"
    export VAULT_ADDR='http://127.0.0.1:8200'

    # In dev mode, check if token is set
    if [ -z "$VAULT_TOKEN" ] && [ -z "$VAULT_DEV_ROOT_TOKEN_ID" ]; then
        echo "ERROR: No token found. Set VAULT_TOKEN or VAULT_DEV_ROOT_TOKEN_ID"
        exit 1
    fi

    # Use dev root token if available
    if [ -n "$VAULT_DEV_ROOT_TOKEN_ID" ]; then
        export VAULT_TOKEN="$VAULT_DEV_ROOT_TOKEN_ID"
    fi
else
    echo "Production mode detected - proceeding with initialization"

    # Check if already initialized
    if vault status 2>&1 | grep -q "Vault is sealed"; then
        echo "Vault is already initialized but sealed"
        echo "Please unseal Vault manually with your unseal keys"
        exit 1
    fi

    # Initialize Vault
    echo "Initializing Vault..."
    vault operator init -key-shares=5 -key-threshold=3 > /tmp/vault-init.txt

    echo ""
    echo "IMPORTANT: Save the following information securely!"
    echo "==========================================="
    cat /tmp/vault-init.txt
    echo "==========================================="
    echo ""

    # Extract unseal keys and root token
    UNSEAL_KEY_1=$(grep 'Unseal Key 1:' /tmp/vault-init.txt | awk '{print $NF}')
    UNSEAL_KEY_2=$(grep 'Unseal Key 2:' /tmp/vault-init.txt | awk '{print $NF}')
    UNSEAL_KEY_3=$(grep 'Unseal Key 3:' /tmp/vault-init.txt | awk '{print $NF}')
    export VAULT_TOKEN=$(grep 'Initial Root Token:' /tmp/vault-init.txt | awk '{print $NF}')

    # Unseal Vault
    echo "Unsealing Vault..."
    vault operator unseal "$UNSEAL_KEY_1"
    vault operator unseal "$UNSEAL_KEY_2"
    vault operator unseal "$UNSEAL_KEY_3"
    echo "Vault unsealed successfully!"
fi

echo ""
echo "Step 1: Creating Policies..."
echo "----------------------------"

# Create admin policy
echo "Creating admin-policy..."
vault policy write admin-policy /vault/policies/admin-policy.hcl
echo "  ✓ admin-policy created"

# Create readonly policy
echo "Creating readonly-policy..."
vault policy write readonly-policy /vault/policies/readonly-policy.hcl
echo "  ✓ readonly-policy created"

# Create rotation policy
echo "Creating rotation-policy..."
vault policy write rotation-policy /vault/policies/rotation-policy.hcl
echo "  ✓ rotation-policy created"

echo ""
echo "Step 2: Enabling Secrets Engines..."
echo "------------------------------------"

# Enable KV v2 secrets engine
echo "Enabling KV v2 secrets engine at 'secret/'..."
vault secrets enable -version=2 -path=secret kv 2>/dev/null || echo "  ⚠ KV v2 already enabled at secret/"

# Enable database secrets engine
echo "Enabling database secrets engine..."
vault secrets enable database 2>/dev/null || echo "  ⚠ Database secrets engine already enabled"

# Enable SSH secrets engine
echo "Enabling SSH secrets engine..."
vault secrets enable ssh 2>/dev/null || echo "  ⚠ SSH secrets engine already enabled"

echo ""
echo "Step 3: Enabling Audit Device..."
echo "---------------------------------"

# Enable file audit device
echo "Enabling file audit device..."
vault audit enable file file_path=/vault/logs/audit.log 2>/dev/null || echo "  ⚠ Audit device already enabled"

echo ""
echo "Step 4: Creating Sample Tokens..."
echo "----------------------------------"

# Create admin token
echo "Creating admin token..."
ADMIN_TOKEN=$(vault token create -policy=admin-policy -ttl=24h -format=json | jq -r '.auth.client_token')
echo "  Admin Token: $ADMIN_TOKEN"

# Create readonly token
echo "Creating readonly token..."
READONLY_TOKEN=$(vault token create -policy=readonly-policy -ttl=24h -format=json | jq -r '.auth.client_token')
echo "  Readonly Token: $READONLY_TOKEN"

# Create rotation token
echo "Creating rotation token..."
ROTATION_TOKEN=$(vault token create -policy=rotation-policy -ttl=168h -format=json | jq -r '.auth.client_token')
echo "  Rotation Token: $ROTATION_TOKEN"

echo ""
echo "Step 5: Creating Sample Secrets..."
echo "-----------------------------------"

# Create sample secrets
echo "Creating sample secrets..."
vault kv put secret/database/prod username=admin password=supersecret123
echo "  ✓ Created secret/database/prod"

vault kv put secret/database/dev username=devuser password=devpass456
echo "  ✓ Created secret/database/dev"

vault kv put secret/app/api-keys service=myapp api_key=abc123xyz789
echo "  ✓ Created secret/app/api-keys"

echo ""
echo "==================================="
echo "Vault Initialization Complete!"
echo "==================================="
echo ""
echo "Access Information:"
echo "-------------------"
echo "Vault URL: http://localhost:8200"
echo "Root Token: $VAULT_TOKEN"
echo ""
echo "Sample Tokens:"
echo "  Admin Token: $ADMIN_TOKEN"
echo "  Readonly Token: $READONLY_TOKEN"
echo "  Rotation Token: $ROTATION_TOKEN"
echo ""
echo "Next Steps:"
echo "1. Access Vault UI at http://localhost:8200"
echo "2. Run: ./enable-secrets-engines.sh"
echo "3. Run: ./setup-database-rotation.sh"
echo "4. Start exercises in /exercises directory"
echo ""
echo "IMPORTANT: Save all tokens securely!"
echo "==================================="
