# Delinea Secret Server Setup Guide

Author: Dominic M. Hoang

## Overview

Delinea Secret Server is a privileged access management (PAM) solution that securely stores and manages sensitive credentials, API keys, and secrets. This guide covers three deployment options to get you started quickly.

## Deployment Options

### Option A: Mock Mode (Recommended for Demos)

Mock Mode provides a simulation of Delinea Secret Server without requiring any setup or infrastructure.

* No external dependencies required
* Perfect for development, testing, and demonstrations
* Returns simulated but realistic responses
* No network connectivity needed
* Ideal for CI/CD pipelines and automated testing

To enable Mock Mode, set the environment variable:

```
DELINEA_MOCK_MODE=true
```

Mock Mode requires no additional configuration beyond this single variable.

### Option B: Delinea Cloud Trial (Free 30-Day Trial)

Delinea Cloud Trial provides a fully functional cloud-hosted instance without credit card requirements.

* No infrastructure to manage
* Instant provisioning
* Full feature set included
* Free 30-day trial period
* Accessible from anywhere with internet connectivity

This is recommended for proof-of-concept projects and evaluation.

### Option C: On-Premises Installation

On-Premises installation requires a Windows Server environment and is recommended for production deployments with strict data residency requirements.

* Full control over infrastructure and data location
* Requires Windows Server 2016 or later
* Requires SQL Server database backend
* Network and security configuration required
* Best suited for enterprise deployments with existing Windows infrastructure

## Cloud Trial Setup Instructions

### Step 1: Sign Up for Delinea Cloud Trial

1. Visit https://delinea.com/products/secret-server
2. Click "Start Free Trial" or "Try it Free"
3. Complete the registration form with:
   * Company name
   * Email address
   * Password
4. Verify your email address via confirmation link
5. Log in to your cloud instance
6. Note your tenant URL (format: `https://[tenant-id].secretservercloud.com`)

### Step 2: Create OAuth2 API Credentials

1. Log in to your Delinea Cloud instance
2. Navigate to Administration > Users and Roles > API Accounts
3. Click "New"
4. Configure the API account:
   * Name: Enter a descriptive name (e.g., "pam-vault-lab")
   * Description: Document the purpose
   * Grant Type: Select "Client Credentials"
5. Click "Create"
6. Copy and securely store:
   * Client ID
   * Client Secret
7. Save these credentials to a secure location

### Step 3: Configure Environment Variables

Create a `.env` file or set environment variables in your system with the values from your Delinea Cloud instance.

## Environment Variables

Configure the following environment variables for your Delinea Secret Server connection:

### Required Variables

* `DELINEA_URL` - Base URL of your Delinea instance
  * Cloud format: `https://[tenant-id].secretservercloud.com`
  * On-Premises format: `https://[server-name]/secretserver`
  * Example: `https://acme.secretservercloud.com`

* `DELINEA_USERNAME` - API Client ID (for OAuth2 authentication)
  * Obtain from API Accounts configuration
  * Example: `a1b2c3d4-e5f6-7890-abcd-ef1234567890`

* `DELINEA_PASSWORD` - API Client Secret (for OAuth2 authentication)
  * Obtain from API Accounts configuration
  * Keep this value secure and never commit to version control
  * Example: `SuperSecretClientSecret123!`

### Optional Variables

* `DELINEA_DOMAIN` - Domain name for on-premises installations
  * Only required for on-premises setups with domain authentication
  * Format: `DOMAIN.LOCAL` or `DOMAIN.COM`
  * Example: `ACME.LOCAL`

* `DELINEA_TENANT` - Tenant ID for cloud deployments
  * Extract from your cloud instance URL
  * Format: The subdomain in your cloud URL
  * Example: `acme` (from `acme.secretservercloud.com`)

* `DELINEA_MOCK_MODE` - Enable mock mode for testing
  * Set to `true` to use simulated responses
  * Set to `false` or omit to use real Delinea instance
  * Default: `false`

### Example Configuration

```
# Cloud Trial Configuration
DELINEA_URL=https://acme.secretservercloud.com
DELINEA_USERNAME=a1b2c3d4-e5f6-7890-abcd-ef1234567890
DELINEA_PASSWORD=SuperSecretClientSecret123!
DELINEA_TENANT=acme

# Or Mock Mode Configuration
DELINEA_MOCK_MODE=true
```

## Testing the Connection

### Using Command Line

Test your Delinea configuration using cURL:

```bash
# Get OAuth2 token
curl -X POST "https://acme.secretservercloud.com/oauth2/token" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=client_credentials" \
  -d "client_id=YOUR_CLIENT_ID" \
  -d "client_secret=YOUR_CLIENT_SECRET"

# Use token to retrieve a secret (example secret ID: 1)
curl -X GET "https://acme.secretservercloud.com/api/v1/secrets/1" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### Using Python

```python
import os
import requests

# Load environment variables
delinea_url = os.getenv('DELINEA_URL')
client_id = os.getenv('DELINEA_USERNAME')
client_secret = os.getenv('DELINEA_PASSWORD')

# Authenticate
token_endpoint = f"{delinea_url}/oauth2/token"
auth_response = requests.post(
    token_endpoint,
    data={
        'grant_type': 'client_credentials',
        'client_id': client_id,
        'client_secret': client_secret
    }
)

if auth_response.status_code == 200:
    token = auth_response.json()['access_token']
    print("Authentication successful!")

    # Test API call
    headers = {'Authorization': f'Bearer {token}'}
    api_response = requests.get(
        f"{delinea_url}/api/v1/secrets",
        headers=headers
    )

    if api_response.status_code == 200:
        print("API connection successful!")
        print(f"Found {len(api_response.json()['records'])} secrets")
    else:
        print(f"API error: {api_response.status_code}")
else:
    print(f"Authentication failed: {auth_response.status_code}")
```

### Using Mock Mode

To test with Mock Mode enabled:

```python
import os
os.environ['DELINEA_MOCK_MODE'] = 'true'

# Your code will now use simulated responses
# No real Delinea instance is contacted
```

## Troubleshooting

### Authentication Failures

**Problem:** "Invalid client credentials" error

* Verify Client ID and Client Secret are correct
* Ensure credentials have not expired in Delinea console
* Check that credentials are properly copied without extra whitespace
* Confirm API account is enabled in Delinea administration

**Problem:** "Access Denied" error

* Verify the API account has appropriate permissions
* Check that the API account is assigned to the correct role
* Ensure the secret you're accessing exists and the API account has read permissions

### Connection Issues

**Problem:** "Connection timeout" or "Unable to reach server"

* Verify the DELINEA_URL is correct
* Check network connectivity to the Delinea server
* Confirm firewall allows HTTPS (port 443) traffic
* For on-premises: verify the Delinea service is running
* Test with Mock Mode to isolate connectivity issues

**Problem:** "Certificate verification failed" (on-premises)

* Update system CA certificates
* Alternatively, disable certificate verification (not recommended for production):
  ```python
  import requests
  requests.verify = False
  ```
* Better approach: Install the self-signed certificate in your system's trust store

### Environment Variable Issues

**Problem:** Environment variables not loading

* Verify `.env` file is in the correct directory
* Check file permissions allow reading
* Confirm variables are exported (not just set)
* For command line: use `export VAR_NAME=value` on Unix or `set VAR_NAME=value` on Windows
* Restart application after changing environment variables

### Mock Mode Issues

**Problem:** Mock Mode not activating

* Confirm `DELINEA_MOCK_MODE` is set to exactly `true` (lowercase, boolean)
* Check that the variable is set before importing Delinea modules
* Verify no conflicting configuration overrides Mock Mode setting

## Resources and Links

### Official Delinea Resources

* Delinea Secret Server Product Page: https://delinea.com/products/secret-server
* Delinea Cloud Trial: https://delinea.com/try-free
* Delinea API Documentation: https://docs.delinea.com/online/Content/API/
* Delinea Support Portal: https://support.delinea.com

### Getting Help

* Community Forums: https://community.delinea.com
* Technical Support: support@delinea.com
* Documentation: https://docs.delinea.com

### Additional Setup Guides

* OAuth2 Setup: https://docs.delinea.com/online/Content/API/OAuth2-setup.htm
* API Account Configuration: https://docs.delinea.com/online/Content/Admin/API-Account.htm
* Cloud Trial Getting Started: https://docs.delinea.com/online/Content/Cloud/Getting-Started-Cloud.htm

### Delinea Version Support

* This guide covers Delinea Secret Server 11.0 and later
* Cloud Trial always runs the latest version
* On-Premises installations support versions 10.9+
