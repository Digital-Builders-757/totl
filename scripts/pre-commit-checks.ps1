# Pre-commit checks for TOTL Agency
# This script runs critical checks before any commit to prevent common errors

Write-Host "🔍 Running pre-commit checks..." -ForegroundColor Cyan

$ErrorCount = 0
$WarningCount = 0

# 0. Security standards check
Write-Host "`n🔐 Running security standards check..." -ForegroundColor Yellow
try {
    & powershell -ExecutionPolicy Bypass -File scripts/security-standards-check.ps1
    if ($LASTEXITCODE -ne 0) {
        $ErrorCount++
    }
} catch {
    Write-Host "❌ CRITICAL: Could not run security standards check" -ForegroundColor Red
    Write-Host "Error: $_" -ForegroundColor Red
    $ErrorCount++
}

# 1. Check for wrong import paths
$WrongImports = Get-ChildItem -Recurse -Include "*.ts","*.tsx" | Select-String "@/types/database" | Where-Object { $_.Path -notlike "*docs*" -and $_.Path -notlike "*node_modules*" -and $_.Line -notlike "*database-helpers*" }

if ($WrongImports) {
    Write-Host "❌ CRITICAL: Found files with wrong import paths:" -ForegroundColor Red
    $WrongImports | ForEach-Object {
        if ($_.Line) {
            Write-Host "  - $($_.Path):$($_.LineNumber): $($_.Line.Trim())" -ForegroundColor Red
        } else {
            Write-Host "  - $($_.Path):$($_.LineNumber): (line content unavailable)" -ForegroundColor Red
        }
    }
    $ErrorCount++
} else {
    Write-Host "✅ All import paths are correct" -ForegroundColor Green
}

# 2. Check for wrong Supabase admin client imports
Write-Host "`n🔧 Checking Supabase admin client imports..." -ForegroundColor Yellow
$WrongAdminImports = Get-ChildItem -Recurse -Include "*.ts","*.tsx" | Select-String "@/lib/supabase/supabase-admin-client"

if ($WrongAdminImports) {
    Write-Host "❌ CRITICAL: Found files with wrong admin client import paths:" -ForegroundColor Red
    $WrongAdminImports | ForEach-Object {
        if ($_.Line) {
            Write-Host "  - $($_.Path):$($_.LineNumber): $($_.Line.Trim())" -ForegroundColor Red
        } else {
            Write-Host "  - $($_.Path):$($_.LineNumber): (line content unavailable)" -ForegroundColor Red
        }
    }
    $ErrorCount++
} else {
    Write-Host "✅ All Supabase admin client imports are correct" -ForegroundColor Green
}

# 3. Check for import order issues
Write-Host "`n📋 Checking import order..." -ForegroundColor Yellow
try {
    $LintCheck = & npm run lint 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ All imports are properly ordered" -ForegroundColor Green
    } else {
        $ImportOrderWarnings = $LintCheck | Select-String "import/order"
        if ($ImportOrderWarnings) {
            Write-Host "⚠️  WARNING: Found import order issues:" -ForegroundColor Yellow
            $ImportOrderWarnings | Select-Object -First 5 | ForEach-Object {
                Write-Host "  $_" -ForegroundColor Yellow
            }
            $WarningCount++
        } else {
            Write-Host "✅ No import order issues found" -ForegroundColor Green
        }
    }
} catch {
    Write-Host "⚠️  WARNING: Could not run lint check for import order" -ForegroundColor Yellow
    Write-Host "Error: $_" -ForegroundColor Yellow
    $WarningCount++
}

# 4. Check for explicit 'any' types
Write-Host "`n🚫 Checking for explicit 'any' types..." -ForegroundColor Yellow
$AnyTypes = Get-ChildItem -Recurse -Include "*.ts","*.tsx" | Select-String ": any" | Where-Object { $_.Path -notlike "*docs*" -and $_.Path -notlike "*node_modules*" -and $_.Line -notlike "*eslint-disable*" }

if ($AnyTypes) {
    Write-Host "⚠️  WARNING: Found files with explicit 'any' types:" -ForegroundColor Yellow
    $AnyTypes | ForEach-Object {
        if ($_.Line) {
            Write-Host "  - $($_.Path):$($_.LineNumber): $($_.Line.Trim())" -ForegroundColor Yellow
        } else {
            Write-Host "  - $($_.Path):$($_.LineNumber): (line content unavailable)" -ForegroundColor Yellow
        }
    }
    $WarningCount++
} else {
    Write-Host "✅ No explicit 'any' types found" -ForegroundColor Green
}

# 5. Check for npm run commands in code (excluding config files)
Write-Host "`n🔍 Checking for erroneous npm run commands..." -ForegroundColor Yellow
$NpmRunCommands = Get-ChildItem -Recurse -Include "*.ts","*.tsx" | Select-String "npm run" | Where-Object { $_.Path -notlike "*docs*" -and $_.Path -notlike "*node_modules*" -and $_.Path -notlike "*playwright.config*" -and $_.Path -notlike "*package.json*" }

if ($NpmRunCommands) {
    Write-Host "❌ CRITICAL: Found erroneous npm run commands in code:" -ForegroundColor Red
    $NpmRunCommands | ForEach-Object {
        if ($_.Line) {
            Write-Host "  - $($_.Path):$($_.LineNumber): $($_.Line.Trim())" -ForegroundColor Red
        } else {
            Write-Host "  - $($_.Path):$($_.LineNumber): (line content unavailable)" -ForegroundColor Red
        }
    }
    $ErrorCount++
} else {
    Write-Host "✅ No erroneous npm run commands found" -ForegroundColor Green
}

# 6. TypeScript compilation check
Write-Host "`n🔧 Running TypeScript compilation check..." -ForegroundColor Yellow
try {
    $TsCheck = & npx tsc --noEmit 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ TypeScript compilation successful" -ForegroundColor Green
    } else {
        Write-Host "❌ CRITICAL: TypeScript compilation failed" -ForegroundColor Red
        Write-Host "First 10 errors:" -ForegroundColor Red
        $TsCheck | Select-Object -First 10 | ForEach-Object {
            Write-Host "  $_" -ForegroundColor Red
        }
        $ErrorCount++
    }
} catch {
    Write-Host "❌ CRITICAL: Could not run TypeScript check" -ForegroundColor Red
    Write-Host "Error: $_" -ForegroundColor Red
    $ErrorCount++
}

# 7. Build check
Write-Host "`n🏗️ Running build check..." -ForegroundColor Yellow
try {
    $BuildCheck = & npm run build 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Build successful" -ForegroundColor Green
    } else {
        Write-Host "❌ CRITICAL: Build failed" -ForegroundColor Red
        Write-Host "Build errors:" -ForegroundColor Red
        $BuildCheck | Select-Object -Last 20 | ForEach-Object {
            Write-Host "  $_" -ForegroundColor Red
        }
        $ErrorCount++
    }
} catch {
    Write-Host "❌ CRITICAL: Could not run build check" -ForegroundColor Red
    Write-Host "Error: $_" -ForegroundColor Red
    $ErrorCount++
}

# Summary
Write-Host "`n📊 Pre-commit check summary:" -ForegroundColor Cyan
Write-Host "  Errors: $ErrorCount" -ForegroundColor $(if ($ErrorCount -eq 0) { "Green" } else { "Red" })
Write-Host "  Warnings: $WarningCount" -ForegroundColor $(if ($WarningCount -eq 0) { "Green" } else { "Yellow" })

if ($ErrorCount -gt 0) {
    Write-Host "ERROR: COMMIT BLOCKED - Critical errors found!" -ForegroundColor Red
    Write-Host "Please fix the errors above before committing." -ForegroundColor Red
    exit 1
} elseif ($WarningCount -gt 0) {
    Write-Host "WARNING: Non-critical issues found. Consider fixing them." -ForegroundColor Yellow
    Write-Host "You can still commit, but it is recommended to fix these issues." -ForegroundColor Yellow
    exit 0
} else {
    Write-Host "SUCCESS: All checks passed! Ready to commit." -ForegroundColor Green
    exit 0
}
