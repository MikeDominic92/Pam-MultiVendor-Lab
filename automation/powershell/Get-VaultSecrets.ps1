<#
.SYNOPSIS
    Retrieve secrets from HashiCorp Vault

.DESCRIPTION
    Securely retrieve privileged credentials from Vault.
    Simulates password checkout in CyberArk PVWA.

.PARAMETER VaultAddr
    Vault server address (default: http://localhost:8200)

.PARAMETER VaultToken
    Vault authentication token

.PARAMETER SecretPath
    Path to the secret in Vault (without 'data' component)

.PARAMETER ShowPassword
    Display password in clear text (use with caution)

.PARAMETER OutputFormat
    Output format: Text, JSON, or PSObject (default: Text)

.EXAMPLE
    .\Get-VaultSecrets.ps1 -SecretPath "secret/database/prod" -VaultToken "hvs.xxxxx"

.EXAMPLE
    .\Get-VaultSecrets.ps1 -SecretPath "secret/windows/servers/dc01/Administrator" -ShowPassword

.EXAMPLE
    $creds = .\Get-VaultSecrets.ps1 -SecretPath "secret/linux/servers/web01/root" -OutputFormat PSObject

.NOTES
    Author: Mike Dominic
    Version: 1.0
    CyberArk Equivalent: Password checkout via PVWA
#>

[CmdletBinding()]
param(
    [Parameter(Mandatory=$false)]
    [string]$VaultAddr = $env:VAULT_ADDR ?? "http://localhost:8200",

    [Parameter(Mandatory=$false)]
    [string]$VaultToken = $env:VAULT_TOKEN,

    [Parameter(Mandatory=$true)]
    [string]$SecretPath,

    [Parameter(Mandatory=$false)]
    [switch]$ShowPassword,

    [Parameter(Mandatory=$false)]
    [ValidateSet("Text", "JSON", "PSObject")]
    [string]$OutputFormat = "Text"
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

# Validate Vault token
if ([string]::IsNullOrWhiteSpace($VaultToken)) {
    Write-Error "Vault token is required. Set VAULT_TOKEN environment variable or use -VaultToken parameter."
    exit 1
}

# Function to invoke Vault API
function Invoke-VaultAPI {
    param(
        [string]$Path,
        [string]$Method = "GET"
    )

    $headers = @{
        "X-Vault-Token" = $VaultToken
    }

    $uri = "$VaultAddr/v1/$Path"

    try {
        $response = Invoke-RestMethod -Uri $uri -Method $Method -Headers $headers
        return $response
    }
    catch {
        Write-Error "Vault API error: $_"
        throw
    }
}

# Normalize secret path (add 'data' component for KV v2)
$normalizedPath = $SecretPath
if ($SecretPath -match "^secret/") {
    $normalizedPath = $SecretPath -replace "^secret/", "secret/data/"
}

# Banner
if ($OutputFormat -eq "Text") {
    Write-Host "`n==================================" -ForegroundColor Cyan
    Write-Host "Vault Secret Retrieval" -ForegroundColor Cyan
    Write-Host "==================================" -ForegroundColor Cyan
    Write-Host ""
}

# Retrieve secret
try {
    if ($OutputFormat -eq "Text") {
        Write-Host "Retrieving secret from: $SecretPath" -ForegroundColor Yellow
    }

    $response = Invoke-VaultAPI -Path $normalizedPath

    if (-not $response.data.data) {
        Write-Error "No data found at path: $SecretPath"
        exit 1
    }

    $secretData = $response.data.data
    $metadata = $response.data.metadata

    # Output based on format
    switch ($OutputFormat) {
        "JSON" {
            $output = @{
                path = $SecretPath
                data = $secretData
                metadata = $metadata
            } | ConvertTo-Json -Depth 10
            Write-Output $output
        }

        "PSObject" {
            $output = [PSCustomObject]@{
                Path = $SecretPath
                Data = $secretData
                Metadata = $metadata
                Username = $secretData.username
                Password = if ($ShowPassword) { $secretData.password } else { "***HIDDEN***" }
            }
            return $output
        }

        "Text" {
            Write-Host "  ✓ Secret retrieved successfully" -ForegroundColor Green
            Write-Host ""
            Write-Host "Secret Details:" -ForegroundColor Cyan
            Write-Host "---------------" -ForegroundColor Cyan
            Write-Host "Path: $SecretPath" -ForegroundColor White

            # Display all fields
            foreach ($key in $secretData.Keys | Sort-Object) {
                $value = $secretData[$key]

                # Mask sensitive fields unless ShowPassword is set
                if (-not $ShowPassword -and $key -match "password|secret|key|token") {
                    $value = "***HIDDEN***"
                }

                Write-Host "${key}: $value" -ForegroundColor Gray
            }

            # Metadata
            Write-Host ""
            Write-Host "Metadata:" -ForegroundColor Cyan
            Write-Host "---------" -ForegroundColor Cyan
            Write-Host "Version: $($metadata.version)" -ForegroundColor Gray
            Write-Host "Created: $($metadata.created_time)" -ForegroundColor Gray
            Write-Host "Updated: $($metadata.created_time)" -ForegroundColor Gray
            Write-Host "Deletion Time: $(if ($metadata.deletion_time) { $metadata.deletion_time } else { 'Not deleted' })" -ForegroundColor Gray

            # Security warning
            if ($ShowPassword) {
                Write-Host ""
                Write-Host "⚠ WARNING: Password displayed in clear text!" -ForegroundColor Red
                Write-Host "Ensure this session is secure and clear screen after use." -ForegroundColor Red
            }

            Write-Host ""
            Write-Host "==================================" -ForegroundColor Cyan
        }
    }

    # Audit log (if text mode)
    if ($OutputFormat -eq "Text") {
        $auditEntry = @{
            timestamp = (Get-Date).ToString("yyyy-MM-ddTHH:mm:ssZ")
            user = $env:USERNAME ?? "unknown"
            action = "secret_read"
            path = $SecretPath
            show_password = $ShowPassword.IsPresent
        }

        # Log to file (append mode)
        $logPath = Join-Path $env:TEMP "vault-access.log"
        $auditEntry | ConvertTo-Json -Compress | Add-Content -Path $logPath

        Write-Host "Access logged to: $logPath" -ForegroundColor DarkGray
        Write-Host ""
    }
}
catch {
    if ($OutputFormat -eq "Text") {
        Write-Host "  ✗ Failed to retrieve secret" -ForegroundColor Red
        Write-Host "Error: $_" -ForegroundColor Red
    }
    throw
}

# Return data for PSObject format
if ($OutputFormat -eq "PSObject") {
    return $output
}
