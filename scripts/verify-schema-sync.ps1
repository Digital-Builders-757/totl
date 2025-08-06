# verify-schema-sync.ps1 - Verify that the database schema and code are in sync
# This script checks for:
#   - types/database.ts being up-to-date (generated from current schema)
#   - database_schema_audit.md reflecting the latest schema (including enums)
#   - No local duplicate interface/type definitions for database tables
#   - No usage of 'any' in database-related code
#   - Proper use of the centralized Supabase client (no direct supabase-js usage outside lib)

param(
    [switch]$SkipDbGeneration  # Use this flag to skip the schema-to-types generation step (e.g., if already done in CI)
)
$ErrorActionPreference = "Continue"
$exitCode = 0

Write-Host "Running schema and type safety verification..." -ForegroundColor Green

# 1. Ensure Supabase CLI is available
if (-not (Get-Command "supabase" -ErrorAction SilentlyContinue)) {
    Write-Error "Supabase CLI is not installed or not available in PATH. Please install Supabase CLI to run this script."
    $exitCode = 1
    if ($SkipDbGeneration) {
        # If skipping DB generation, continue with other checks even though we can't verify types
        Write-Host "Skipping database schema verification due to missing Supabase CLI." -ForegroundColor Yellow
    } else {
        Write-Host "Cannot verify schema types without Supabase CLI. Aborting remaining checks." -ForegroundColor Red
        exit $exitCode
    }
}

# 2. Schema-to-types consistency check (optional if SkipDbGeneration is set)
$typesFile = "types/database.ts"
$genTypesFile = "types/database.gen.ts"
if (-not $SkipDbGeneration) {
    Write-Host "Ensuring local database reflects all migrations..." -ForegroundColor Cyan
    try {
        # Apply latest migrations to a local Supabase instance (Docker must be running)
        $null = & supabase db reset --no-confirm
    } catch {
        Write-Warning "Supabase CLI failed to apply migrations locally: $($_.Exception.Message)"
    }
    Write-Host "Generating fresh TypeScript types from current database schema..." -ForegroundColor Cyan
    try {
        & supabase gen types typescript --local > $genTypesFile
    } catch {
        Write-Warning "Failed to generate types from schema. (Ensure Docker is running and the project is linked.)"
    }
    if (Test-Path $genTypesFile) {
        # Compare generated types with the committed types file
        $newTypes = Get-Content $genTypesFile -Raw
        $origTypes = Get-Content $typesFile -Raw
        # Normalize content by trimming trailing whitespace and normalizing line endings
        $newNorm = ($newTypes -split "`r`n|`n|`r") | ForEach-Object { $_.TrimEnd() }
        $origNorm = ($origTypes -split "`r`n|`n|`r") | ForEach-Object { $_.TrimEnd() }
        if ($newNorm -ne $origNorm) {
            Write-Error "ERROR: types/database.ts is out-of-date or modified manually. It does not match the database schema."
            Write-Host "=> Run the Supabase CLI to regenerate the types file and commit the changes." -ForegroundColor Yellow
            $exitCode = 1
        } else {
            Write-Host "OK: types/database.ts is up-to-date with the database schema." -ForegroundColor Green
        }
        # Clean up the generated file
        Remove-Item $genTypesFile -Force
    } else {
        Write-Error "ERROR: Could not generate types for comparison. Schema check skipped."
        $exitCode = 1
    }
}

# 3. Verify that the audit file is up-to-date with the schema (timestamps and enums)
$auditFile = "database_schema_audit.md"
if (-not (Test-Path $auditFile)) {
    Write-Error "WARNING: $auditFile not found. Skipping audit file checks."
    $exitCode = 1
} else {
    # Check if audit file has been modified after the latest migration file
    $migrationFiles = Get-ChildItem "supabase/migrations" -Filter "*.sql" -File
    if ($migrationFiles.Count -gt 0) {
        $latestMigration = $migrationFiles | Sort-Object Name | Select-Object -Last 1
        $latestMigTime = $latestMigration.LastWriteTime
        if ($latestMigration.BaseName -match '^\d{14}') {
            $timestampStr = $Matches[0]
            try {
                $latestMigTime = [datetime]::ParseExact($timestampStr, 'yyyyMMddHHmmss', $null)
            } catch {
                # Ignore parse errors, fallback to LastWriteTime
            }
        }
        $auditTime = (Get-Item $auditFile).LastWriteTime
        if ($auditTime -lt $latestMigTime) {
            Write-Error ("ERROR: {0} appears outdated. Last updated {1}, but latest migration is {2}. Update the audit file to reflect new schema changes." -f $auditFile, $auditTime, $latestMigTime)
            $exitCode = 1
        } else {
            Write-Host "OK: $auditFile was last updated on $($auditTime.ToString("u")), after the latest migration." -ForegroundColor Green
        }
    }
    # Check that all enum values in the audit file match the database types
    $dbTypesContent = Get-Content $typesFile -Raw
    if ($dbTypesContent -match "Enums:\s*\{([^}]+)\}") {
        $enumsBlock = $Matches[1]
        $enumDefs = [regex]::Matches($enumsBlock, '(\w+):\s*".*?";')
        foreach ($match in $enumDefs) {
            $enumName = $match.Groups[1].Value  # e.g. "user_role"
            $unionStr = $match.Groups[0].Value   # e.g. user_role: "talent" | "client" | "admin";
            # Extract values from the union string
            $valuesInTypes = [regex]::Matches($unionStr, '"([^"]*)"') | ForEach-Object { $_.Groups[1].Value }
            # Determine the enum name format in audit file (TitleCase without underscores, e.g. "UserRole")
            $enumTitle = ($enumName -split "_") -join "" | ForEach-Object { $_.Substring(0,1).ToUpper() + $_.Substring(1).ToLower() }
            $auditContent = Get-Content $auditFile -Raw
            $enumPattern = [regex]::Escape($enumTitle) + "\*\*:\s*([^\r\n]+)"
            $auditMatch = [regex]::Match($auditContent, $enumPattern)
            if ($auditMatch.Success) {
                $auditLine = $auditMatch.Groups[1].Value
                $valuesInAudit = [regex]::Matches($auditLine, "'([^']*)'") | ForEach-Object { $_.Groups[1].Value }
                $valuesInTypes = $valuesInTypes | Sort-Object
                $valuesInAudit = $valuesInAudit | Sort-Object
                if ($valuesInTypes -join "," -ne $valuesInAudit -join ",") {
                    Write-Error ("ERROR: Enum `{0}` values mismatch. Audit has [{1}] vs DB types [{2}]." -f $enumName, ($valuesInAudit -join ", "), ($valuesInTypes -join ", "))
                    $exitCode = 1
                } else {
                    Write-Host "OK: Enum $enumName values match between schema audit and types." -ForegroundColor Green
                }
            } else {
                Write-Error "ERROR: Enum `$enumName` is missing in $auditFile. Document this enum in the audit file."
                $exitCode = 1
            }
        }
    }
}

# 4. Scan the codebase for forbidden patterns (duplicate types, usage of any, direct supabase imports)
Write-Host "Scanning project files for forbidden patterns..." -ForegroundColor Cyan
# Map of known table names to expected type names
$tablesToTypes = @{
    "profiles" = "Profile";
    "talent_profiles" = "TalentProfile";
    "client_profiles" = "ClientProfile";
    "gigs" = "Gig";
    "applications" = "Application";
    "bookings" = "Booking";
    "portfolio_items" = "PortfolioItem";
    "gig_requirements" = "GigRequirement";
}
$files = Get-ChildItem -Path . -Include *.ts,*.tsx -Recurse | Where-Object {
    $_.FullName -notmatch '\\node_modules\\' -and 
    $_.FullName -notmatch '\\.next\\' -and 
    $_.FullName -notmatch 'types\\database.ts$' -and 
    $_.FullName -notmatch 'types\\supabase.ts$'
}
foreach ($file in $files) {
    $relativePath = $file.FullName.Substring((Get-Location).Path.Length + 1)
    $lines = Get-Content $file.FullName
    for ($i = 0; $i -lt $lines.Count; $i++) {
        $line = $lines[$i]
        $trimmed = $line.Trim()
        # Skip comment lines entirely
        if ($trimmed.StartsWith('//') -or $trimmed.StartsWith('/*') -or $trimmed.StartsWith('*')) { continue }
        # Duplicate interface definitions for DB tables
        if ($line -match '^\s*interface\s+([A-Za-z0-9_]+)\b') {
            $ifaceName = $Matches[1]
            if ($tablesToTypes.Values -contains $ifaceName) {
                Write-Error ("ERROR: Detected a manual interface for `{0}` in {1} (line {2}). Remove this duplicate and use types from types/database.ts." -f $ifaceName, $relativePath, $($i+1))
                $exitCode = 1
            }
        }
        if ($line -match '^\s*type\s+([A-Za-z0-9_]+)\b') {
            $typeName = $Matches[1]
            if ($tablesToTypes.Values -contains $typeName) {
                if ($line -match '=' -and ($line -match '\{' -or $trimmed -like "type $typeName =")) {
                    # If this is a direct type definition (starts an object or union) for a DB type
                    if ($line -notmatch 'Database\[') {
                        Write-Error ("ERROR: Detected a manual type definition for `{0}` in {1} (line {2}). Define types using the generated Database types instead." -f $typeName, $relativePath, $($i+1))
                        $exitCode = 1
                    }
                }
            }
        }
        # Usage of 'any' in code
        if ($line -match '\bany\b') {
            Write-Error ("ERROR: Usage of 'any' type in {0} (line {1}): {2}" -f $relativePath, $($i+1), $trimmed)
            $exitCode = 1
        }
        # Direct supabase-js import (forbidden outside central client)
        if ($line -match "@supabase/supabase-js") {
            if ($relativePath -notmatch 'supabase-client.ts$' -and $relativePath -notmatch 'supabase-admin-client.ts$') {
                Write-Error ("ERROR: Direct Supabase client import in {0} (line {1}). Use the shared supabase-client instead." -f $relativePath, $($i+1))
                $exitCode = 1
            }
        }
    }
}

# 5. Final output and exit code
if ($exitCode -eq 0) {
    Write-Host "All checks passed. Database schema and types are in sync, and no violations were found." -ForegroundColor Green
} else {
    Write-Host "Schema verification failed. Please fix the issues above before committing." -ForegroundColor Red
}
exit $exitCode 