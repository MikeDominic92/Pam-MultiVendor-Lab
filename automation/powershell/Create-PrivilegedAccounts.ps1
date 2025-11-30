<#
.SYNOPSIS
    Create privileged accounts in Vault for PAM management

.DESCRIPTION
    This script creates sample privileged accounts in HashiCorp Vault,
    simulating the onboarding process in CyberArk PAM.

.PARAMETER VaultAddr
    Vault server address (default: http://localhost:8200)

.PARAMETER VaultToken
    Vault authentication token

.PARAMETER AccountsFile
    JSON file containing account definitions (optional)

.EXAMPLE
    .\Create-PrivilegedAccounts.ps1 -VaultToken "hvs.xxxxx"

.EXAMPLE
    .\Create-PrivilegedAccounts.ps1 -VaultAddr "http://vault:8200" -VaultToken $env:VAULT_TOKEN

.NOTES
    Author: Mike Dominic
    Version: 1.0
    CyberArk Equivalent: Account onboarding via PVWA
#>

[CmdletBinding()]
param(
    [Parameter(Mandatory=$false)]
    [string]$VaultAddr = $env:VAULT_ADDR ?? "http://localhost:8200",

    [Parameter(Mandatory=$false)]
    [string]$VaultToken = $env:VAULT_TOKEN,

    [Parameter(Mandatory=$false)]
    [string]$AccountsFile
)

# Set strict mode
Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

# Banner
Write-Host "`n==================================" -ForegroundColor Cyan
Write-Host "Privileged Account Onboarding" -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan
Write-Host ""

# Validate Vault token
if ([string]::IsNullOrWhiteSpace($VaultToken)) {
    Write-Error "Vault token is required. Set VAULT_TOKEN environment variable or use -VaultToken parameter."
    exit 1
}

# Function to invoke Vault API
function Invoke-VaultAPI {
    [CmdletBinding()]
    param(
        [Parameter(Mandatory=$true)]
        [string]$Path,

        [Parameter(Mandatory=$false)]
        [string]$Method = "GET",

        [Parameter(Mandatory=$false)]
        [hashtable]$Body
    )

    $headers = @{
        "X-Vault-Token" = $VaultToken
        "Content-Type" = "application/json"
    }

    $uri = "$VaultAddr/v1/$Path"

    $params = @{
        Uri = $uri
        Method = $Method
        Headers = $headers
    }

    if ($Body) {
        $params.Body = ($Body | ConvertTo-Json -Depth 10)
    }

    try {
        $response = Invoke-RestMethod @params
        return $response
    }
    catch {
        Write-Error "Vault API error: $_"
        throw
    }
}

# Test Vault connectivity
Write-Host "Testing Vault connectivity..." -ForegroundColor Yellow
try {
    $health = Invoke-RestMethod -Uri "$VaultAddr/v1/sys/health" -Method GET
    Write-Host "  ✓ Connected to Vault" -ForegroundColor Green
}
catch {
    Write-Error "Cannot connect to Vault at $VaultAddr"
    exit 1
}

# Verify authentication
Write-Host "Verifying authentication..." -ForegroundColor Yellow
try {
    $tokenInfo = Invoke-VaultAPI -Path "auth/token/lookup-self"
    Write-Host "  ✓ Authenticated as: $($tokenInfo.data.display_name)" -ForegroundColor Green
    Write-Host "  ✓ Policies: $($tokenInfo.data.policies -join ', ')" -ForegroundColor Green
}
catch {
    Write-Error "Authentication failed. Check your token."
    exit 1
}

# Define privileged accounts
$privilegedAccounts = @(
    @{
        Path = "secret/data/windows/servers/dc01/Administrator"
        Data = @{
            username = "Administrator"
            password = "P@ssw0rd123!"
            server = "DC01.lab.local"
            domain = "LAB"
            type = "Domain Controller"
            managed_by = "IT Security"
            rotation_enabled = $true
            rotation_period = "30d"
        }
    },
    @{
        Path = "secret/data/linux/servers/web01/root"
        Data = @{
            username = "root"
            password = "SecureRoot456!"
            server = "web01.lab.local"
            ip = "192.168.1.10"
            ssh_port = 22
            type = "Web Server"
            managed_by = "DevOps"
            rotation_enabled = $true
            rotation_period = "7d"
        }
    },
    @{
        Path = "secret/data/database/prod/oracle/sys"
        Data = @{
            username = "SYS"
            password = "OracleAdmin789!"
            host = "oracle-prod.lab.local"
            port = 1521
            sid = "PRODDB"
            type = "Oracle Database"
            managed_by = "DBA Team"
            rotation_enabled = $true
            rotation_period = "14d"
        }
    },
    @{
        Path = "secret/data/database/prod/sqlserver/sa"
        Data = @{
            username = "sa"
            password = "SQLAdmin000!"
            host = "mssql-prod.lab.local"
            port = 1433
            database = "master"
            type = "SQL Server"
            managed_by = "DBA Team"
            rotation_enabled = $true
            rotation_period = "14d"
        }
    },
    @{
        Path = "secret/data/cloud/aws/prod/admin"
        Data = @{
            username = "aws-admin"
            access_key_id = "AKIAIOSFODNN7EXAMPLE"
            secret_access_key = "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY"
            account_id = "123456789012"
            region = "us-east-1"
            type = "AWS IAM User"
            managed_by = "Cloud Team"
            rotation_enabled = $true
            rotation_period = "90d"
        }
    },
    @{
        Path = "secret/data/applications/erp/service-account"
        Data = @{
            username = "erp_svc"
            password = "ERPService999!"
            application = "SAP ERP"
            environment = "Production"
            type = "Service Account"
            managed_by = "Application Team"
            rotation_enabled = $false
            notes = "Used by ERP batch jobs"
        }
    }
)

# Load accounts from file if provided
if ($AccountsFile -and (Test-Path $AccountsFile)) {
    Write-Host "`nLoading accounts from file: $AccountsFile" -ForegroundColor Yellow
    $customAccounts = Get-Content $AccountsFile | ConvertFrom-Json
    $privilegedAccounts += $customAccounts
    Write-Host "  ✓ Loaded $($customAccounts.Count) additional accounts" -ForegroundColor Green
}

# Create accounts in Vault
Write-Host "`nCreating privileged accounts in Vault..." -ForegroundColor Yellow
Write-Host "=========================================" -ForegroundColor Yellow

$successCount = 0
$failCount = 0

foreach ($account in $privilegedAccounts) {
    try {
        $displayPath = $account.Path -replace "secret/data/", "secret/"
        Write-Host "`nOnboarding: $displayPath" -ForegroundColor Cyan

        # Add metadata
        $account.Data.onboarded_at = (Get-Date).ToString("yyyy-MM-ddTHH:mm:ssZ")
        $account.Data.onboarded_by = $env:USERNAME ?? "automated"

        # Create secret
        $body = @{
            data = $account.Data
        }

        $result = Invoke-VaultAPI -Path $account.Path -Method POST -Body $body

        Write-Host "  ✓ Account created successfully" -ForegroundColor Green
        Write-Host "  - Username: $($account.Data.username)" -ForegroundColor Gray
        Write-Host "  - Type: $($account.Data.type)" -ForegroundColor Gray
        Write-Host "  - Managed by: $($account.Data.managed_by)" -ForegroundColor Gray
        Write-Host "  - Rotation: $(if ($account.Data.rotation_enabled) { 'Enabled (' + $account.Data.rotation_period + ')' } else { 'Disabled' })" -ForegroundColor Gray

        $successCount++
    }
    catch {
        Write-Host "  ✗ Failed to create account: $_" -ForegroundColor Red
        $failCount++
    }
}

# Summary
Write-Host "`n==================================" -ForegroundColor Cyan
Write-Host "Onboarding Summary" -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan
Write-Host "Total accounts: $($privilegedAccounts.Count)" -ForegroundColor White
Write-Host "Successfully created: $successCount" -ForegroundColor Green
Write-Host "Failed: $failCount" -ForegroundColor $(if ($failCount -gt 0) { "Red" } else { "Green" })

# List created accounts
Write-Host "`nCreated Accounts by Category:" -ForegroundColor Yellow
Write-Host "------------------------------" -ForegroundColor Yellow

$categories = @{
    "Windows" = @()
    "Linux" = @()
    "Database" = @()
    "Cloud" = @()
    "Application" = @()
}

foreach ($account in $privilegedAccounts) {
    $path = $account.Path
    if ($path -match "windows/") { $categories.Windows += $account.Data.username }
    elseif ($path -match "linux/") { $categories.Linux += $account.Data.username }
    elseif ($path -match "database/") { $categories.Database += $account.Data.username }
    elseif ($path -match "cloud/") { $categories.Cloud += $account.Data.username }
    elseif ($path -match "applications/") { $categories.Application += $account.Data.username }
}

foreach ($category in $categories.Keys) {
    if ($categories[$category].Count -gt 0) {
        Write-Host "`n$category Accounts:" -ForegroundColor Cyan
        $categories[$category] | ForEach-Object {
            Write-Host "  - $_" -ForegroundColor Gray
        }
    }
}

# Next steps
Write-Host "`n==================================" -ForegroundColor Cyan
Write-Host "Next Steps" -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan
Write-Host "1. Verify accounts in Vault UI: $VaultAddr/ui" -ForegroundColor White
Write-Host "2. Test account retrieval:" -ForegroundColor White
Write-Host "   .\Get-VaultSecrets.ps1 -SecretPath 'secret/windows/servers/dc01/Administrator'" -ForegroundColor Gray
Write-Host "3. Test password rotation:" -ForegroundColor White
Write-Host "   .\Test-PasswordRotation.ps1" -ForegroundColor Gray
Write-Host "4. Configure rotation policies for enabled accounts" -ForegroundColor White
Write-Host ""
Write-Host "All privileged accounts are now under PAM control!" -ForegroundColor Green
Write-Host "==================================" -ForegroundColor Cyan
Write-Host ""
