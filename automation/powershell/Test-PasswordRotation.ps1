<#
.SYNOPSIS
    Test password rotation functionality in Vault

.DESCRIPTION
    Tests automated password rotation for database credentials.
    Simulates CyberArk CPM (Central Policy Manager) operations.

.PARAMETER VaultAddr
    Vault server address (default: http://localhost:8200)

.PARAMETER VaultToken
    Vault authentication token

.PARAMETER Database
    Database to test: PostgreSQL, MySQL, or Both (default: Both)

.PARAMETER RotateNow
    Immediately rotate passwords instead of just testing

.EXAMPLE
    .\Test-PasswordRotation.ps1 -VaultToken "hvs.xxxxx"

.EXAMPLE
    .\Test-PasswordRotation.ps1 -Database PostgreSQL -RotateNow

.NOTES
    Author: Mike Dominic
    Version: 1.0
    CyberArk Equivalent: CPM password rotation verification
#>

[CmdletBinding()]
param(
    [Parameter(Mandatory=$false)]
    [string]$VaultAddr = $env:VAULT_ADDR ?? "http://localhost:8200",

    [Parameter(Mandatory=$false)]
    [string]$VaultToken = $env:VAULT_TOKEN,

    [Parameter(Mandatory=$false)]
    [ValidateSet("PostgreSQL", "MySQL", "Both")]
    [string]$Database = "Both",

    [Parameter(Mandatory=$false)]
    [switch]$RotateNow
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

# Validate token
if ([string]::IsNullOrWhiteSpace($VaultToken)) {
    Write-Error "Vault token is required. Set VAULT_TOKEN environment variable or use -VaultToken parameter."
    exit 1
}

# Function to invoke Vault API
function Invoke-VaultAPI {
    param(
        [string]$Path,
        [string]$Method = "GET",
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
        return Invoke-RestMethod @params
    }
    catch {
        Write-Error "Vault API error: $_"
        throw
    }
}

# Banner
Write-Host "`n==================================" -ForegroundColor Cyan
Write-Host "Password Rotation Testing" -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan
Write-Host ""

# Define databases to test
$databases = @()
if ($Database -eq "PostgreSQL" -or $Database -eq "Both") {
    $databases += @{
        Name = "PostgreSQL"
        ConfigPath = "database/config/postgresql"
        RotatePath = "database/rotate-root/postgresql"
        StaticRole = "postgres-root"
        CredsPath = "database/static-creds/postgres-root"
    }
}
if ($Database -eq "MySQL" -or $Database -eq "Both") {
    $databases += @{
        Name = "MySQL"
        ConfigPath = "database/config/mysql"
        RotatePath = "database/rotate-root/mysql"
        StaticRole = "mysql-root"
        CredsPath = "database/static-creds/mysql-root"
    }
}

$results = @()

foreach ($db in $databases) {
    Write-Host "Testing $($db.Name)..." -ForegroundColor Yellow
    Write-Host "--------------------" -ForegroundColor Yellow

    $testResult = @{
        Database = $db.Name
        ConfigExists = $false
        RoleExists = $false
        CredentialsBefore = $null
        CredentialsAfter = $null
        RotationSuccess = $false
        PasswordChanged = $false
        Error = $null
    }

    try {
        # Check if database is configured
        Write-Host "  Checking database configuration..." -NoNewline
        try {
            $config = Invoke-VaultAPI -Path $db.ConfigPath
            $testResult.ConfigExists = $true
            Write-Host " ✓" -ForegroundColor Green
        }
        catch {
            Write-Host " ✗" -ForegroundColor Red
            $testResult.Error = "Database not configured"
            $results += $testResult
            continue
        }

        # Check if static role exists
        Write-Host "  Checking static role..." -NoNewline
        try {
            $role = Invoke-VaultAPI -Path "database/static-roles/$($db.StaticRole)"
            $testResult.RoleExists = $true
            Write-Host " ✓" -ForegroundColor Green
        }
        catch {
            Write-Host " ✗" -ForegroundColor Red
            $testResult.Error = "Static role not found"
            $results += $testResult
            continue
        }

        # Get current credentials
        Write-Host "  Retrieving current credentials..." -NoNewline
        $credsBefore = Invoke-VaultAPI -Path $db.CredsPath
        $testResult.CredentialsBefore = @{
            Username = $credsBefore.data.username
            PasswordHash = (Get-FileHash -InputStream ([System.IO.MemoryStream]::new([System.Text.Encoding]::UTF8.GetBytes($credsBefore.data.password)))).Hash
            LastRotation = $credsBefore.data.last_vault_rotation
        }
        Write-Host " ✓" -ForegroundColor Green
        Write-Host "    Username: $($credsBefore.data.username)" -ForegroundColor Gray
        Write-Host "    Last Rotation: $($credsBefore.data.last_vault_rotation ?? 'Never')" -ForegroundColor Gray

        # Rotate if requested
        if ($RotateNow) {
            Write-Host "  Rotating password..." -NoNewline
            try {
                Invoke-VaultAPI -Path $db.RotatePath -Method POST
                Write-Host " ✓" -ForegroundColor Green
                $testResult.RotationSuccess = $true

                # Wait for rotation to complete
                Start-Sleep -Seconds 2

                # Get new credentials
                Write-Host "  Retrieving new credentials..." -NoNewline
                $credsAfter = Invoke-VaultAPI -Path $db.CredsPath
                $testResult.CredentialsAfter = @{
                    Username = $credsAfter.data.username
                    PasswordHash = (Get-FileHash -InputStream ([System.IO.MemoryStream]::new([System.Text.Encoding]::UTF8.GetBytes($credsAfter.data.password)))).Hash
                    LastRotation = $credsAfter.data.last_vault_rotation
                }
                Write-Host " ✓" -ForegroundColor Green

                # Verify password changed
                $passwordChanged = $testResult.CredentialsBefore.PasswordHash -ne $testResult.CredentialsAfter.PasswordHash
                $testResult.PasswordChanged = $passwordChanged

                if ($passwordChanged) {
                    Write-Host "  Password rotation verified!" -ForegroundColor Green
                    Write-Host "    New Last Rotation: $($credsAfter.data.last_vault_rotation)" -ForegroundColor Gray
                }
                else {
                    Write-Host "  ⚠ WARNING: Password did not change" -ForegroundColor Yellow
                }
            }
            catch {
                Write-Host " ✗" -ForegroundColor Red
                $testResult.Error = "Rotation failed: $_"
            }
        }
        else {
            Write-Host "  [Skipped rotation - use -RotateNow to rotate]" -ForegroundColor DarkGray
        }

        Write-Host ""
    }
    catch {
        $testResult.Error = $_.Exception.Message
        Write-Host "  ✗ Error: $_" -ForegroundColor Red
        Write-Host ""
    }

    $results += $testResult
}

# Summary
Write-Host "==================================" -ForegroundColor Cyan
Write-Host "Test Summary" -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan
Write-Host ""

foreach ($result in $results) {
    Write-Host "$($result.Database):" -ForegroundColor Cyan
    Write-Host "  Configuration: $(if ($result.ConfigExists) { '✓' } else { '✗' })" -ForegroundColor $(if ($result.ConfigExists) { "Green" } else { "Red" })
    Write-Host "  Static Role: $(if ($result.RoleExists) { '✓' } else { '✗' })" -ForegroundColor $(if ($result.RoleExists) { "Green" } else { "Red" })

    if ($RotateNow) {
        Write-Host "  Rotation: $(if ($result.RotationSuccess) { '✓' } else { '✗' })" -ForegroundColor $(if ($result.RotationSuccess) { "Green" } else { "Red" })
        Write-Host "  Password Changed: $(if ($result.PasswordChanged) { '✓' } else { '✗' })" -ForegroundColor $(if ($result.PasswordChanged) { "Green" } else { "Red" })
    }

    if ($result.Error) {
        Write-Host "  Error: $($result.Error)" -ForegroundColor Red
    }

    Write-Host ""
}

# Recommendations
Write-Host "==================================" -ForegroundColor Cyan
Write-Host "Recommendations" -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan

$allPassed = ($results | Where-Object { -not $_.Error }).Count -eq $results.Count

if ($allPassed) {
    Write-Host "✓ All tests passed!" -ForegroundColor Green
    if (-not $RotateNow) {
        Write-Host ""
        Write-Host "Next Steps:" -ForegroundColor Yellow
        Write-Host "1. Run with -RotateNow to test actual rotation" -ForegroundColor White
        Write-Host "2. Monitor audit logs for rotation events" -ForegroundColor White
        Write-Host "3. Verify application connectivity with rotated credentials" -ForegroundColor White
    }
}
else {
    Write-Host "✗ Some tests failed" -ForegroundColor Red
    Write-Host ""
    Write-Host "Action Required:" -ForegroundColor Yellow
    Write-Host "1. Run setup scripts to configure databases" -ForegroundColor White
    Write-Host "   docker exec vault /scripts/enable-secrets-engines.sh" -ForegroundColor Gray
    Write-Host "   docker exec vault /scripts/setup-database-rotation.sh" -ForegroundColor Gray
    Write-Host "2. Re-run this test" -ForegroundColor White
}

Write-Host ""
Write-Host "==================================" -ForegroundColor Cyan
Write-Host ""

# Return results object
return $results
