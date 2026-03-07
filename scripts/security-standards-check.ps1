# Simple Security Check Script
Write-Host "Running Security Standards Check..." -ForegroundColor Cyan

$errorCount = 0

function Get-FileContentSafe {
    param(
        [string]$Path
    )

    try {
        # Use -LiteralPath so Next.js route folders like [id] are handled correctly.
        return Get-Content -LiteralPath $Path -Raw -ErrorAction Stop
    }
    catch {
        Write-Host "WARNING: Could not read file: $Path" -ForegroundColor Yellow
        return $null
    }
}

# Check 1: Look for getSession() usage (security risk) - but allow in client components
Write-Host "Checking for insecure getSession() usage..." -ForegroundColor Yellow
$getSessionFiles = Get-ChildItem -Path . -Recurse -Include "*.ts", "*.tsx" | Where-Object { 
    if ($_.FullName -like "*node_modules*" -or $_.FullName -like "*.next*") {
        return $false
    }

    $content = Get-FileContentSafe -Path $_.FullName
    if ([string]::IsNullOrEmpty($content)) {
        return $false
    }

    return $content -match "getSession\(\)" -and $content -notmatch '"use client"'
}

if ($getSessionFiles.Count -gt 0) {
    Write-Host "SECURITY RISK: Found getSession() usage in $($getSessionFiles.Count) files:" -ForegroundColor Red
    foreach ($file in $getSessionFiles) {
        Write-Host "   - $($file.Name)" -ForegroundColor Red
    }
    Write-Host "   -> Replace with getUser() for secure authentication" -ForegroundColor Red
    $errorCount++
}

# Check 2: Look for any types usage
Write-Host "Checking for 'any' type usage..." -ForegroundColor Yellow
$anyTypeFiles = Get-ChildItem -Path . -Recurse -Include "*.ts", "*.tsx" | Where-Object { 
    if ($_.FullName -like "*node_modules*" -or $_.FullName -like "*.next*") {
        return $false
    }

    $content = Get-FileContentSafe -Path $_.FullName
    if ([string]::IsNullOrEmpty($content)) {
        return $false
    }

    return $content -match ": any"
}

if ($anyTypeFiles.Count -gt 0) {
    Write-Host "WARNING: Found 'any' type usage in $($anyTypeFiles.Count) files:" -ForegroundColor Yellow
    foreach ($file in $anyTypeFiles) {
        Write-Host "   - $($file.Name)" -ForegroundColor Yellow
    }
    Write-Host "   -> Use proper TypeScript types from @/types/supabase" -ForegroundColor Yellow
}

# Display results
Write-Host "`nSecurity Standards Check Results:" -ForegroundColor Cyan

if ($errorCount -gt 0) {
    Write-Host "COMMIT BLOCKED: Fix errors before committing" -ForegroundColor Red
    exit 1
} else {
    Write-Host "Security standards check passed!" -ForegroundColor Green
    Write-Host "Reference: docs/CODING_STANDARDS.md for detailed guidelines" -ForegroundColor Cyan
    exit 0
}