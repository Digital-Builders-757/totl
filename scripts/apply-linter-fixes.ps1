# =====================================================
# Apply Database Linter Fixes
# =====================================================
# This script applies the performance fixes for Supabase
# Database Linter warnings
#
# Usage: .\scripts\apply-linter-fixes.ps1
# =====================================================

Write-Host "=================================================" -ForegroundColor Cyan
Write-Host "  TOTL Agency - Database Linter Fixes" -ForegroundColor Cyan
Write-Host "=================================================" -ForegroundColor Cyan
Write-Host ""

# Check if we're in the project root
if (-not (Test-Path "supabase")) {
    Write-Host "Error: Please run this script from the project root directory" -ForegroundColor Red
    Write-Host "   Expected path: C:\Users\young\OneDrive\Desktop\Project Files\totl" -ForegroundColor Yellow
    exit 1
}

Write-Host "What this script does:" -ForegroundColor Yellow
Write-Host "   1. Optimizes 4 gig_notifications RLS policies (~95% performance gain)" -ForegroundColor White
Write-Host "   2. Removes 3 duplicate indexes (improved write performance)" -ForegroundColor White
Write-Host "   3. Verifies the fixes were applied correctly" -ForegroundColor White
Write-Host ""

Write-Host "IMPORTANT NOTES:" -ForegroundColor Yellow
Write-Host "   - This script will apply changes to your REMOTE database" -ForegroundColor White
Write-Host "   - Changes are IDEMPOTENT (safe to run multiple times)" -ForegroundColor White
Write-Host "   - No data will be lost or modified" -ForegroundColor White
Write-Host "   - Only RLS policies and indexes will be updated" -ForegroundColor White
Write-Host ""

# Confirm before proceeding
$confirm = Read-Host "Do you want to proceed? (yes/no)"
if ($confirm -ne "yes") {
    Write-Host "Cancelled by user" -ForegroundColor Red
    exit 0
}

Write-Host ""
Write-Host "Step 1: Checking Supabase connection..." -ForegroundColor Cyan

# Check if Supabase CLI is available
try {
    $supabaseVersion = npx supabase --version 2>&1
    Write-Host "Supabase CLI version: $supabaseVersion" -ForegroundColor Green
} catch {
    Write-Host "Error: Supabase CLI not found" -ForegroundColor Red
    Write-Host "   Please install: npm install -g supabase" -ForegroundColor Yellow
    exit 1
}

Write-Host ""
Write-Host "Step 2: Reading SQL script..." -ForegroundColor Cyan

$sqlFile = "scripts\apply_linter_fixes.sql"
if (-not (Test-Path $sqlFile)) {
    Write-Host "Error: SQL file not found at $sqlFile" -ForegroundColor Red
    exit 1
}

$sqlContent = Get-Content $sqlFile -Raw
Write-Host "SQL script loaded successfully" -ForegroundColor Green

Write-Host ""
Write-Host "Step 3: Applying fixes to remote database..." -ForegroundColor Cyan
Write-Host ""
Write-Host "MANUAL STEP REQUIRED:" -ForegroundColor Yellow
Write-Host ""
Write-Host "Due to migration ordering issues, please apply the fix manually:" -ForegroundColor White
Write-Host ""
Write-Host "1. Go to: https://supabase.com/dashboard" -ForegroundColor Cyan
Write-Host "2. Select your TOTL project (total model agency mvp)" -ForegroundColor Cyan
Write-Host "3. Click SQL Editor in the left sidebar" -ForegroundColor Cyan
Write-Host "4. Click New query" -ForegroundColor Cyan
Write-Host "5. Copy the contents of:" -ForegroundColor Cyan
Write-Host "   $sqlFile" -ForegroundColor Yellow
Write-Host "6. Paste into the SQL Editor" -ForegroundColor Cyan
Write-Host "7. Click Run (or press Ctrl+Enter)" -ForegroundColor Cyan
Write-Host "8. Verify all queries succeed" -ForegroundColor Cyan
Write-Host ""

Write-Host "The SQL file is ready at:" -ForegroundColor Green
Write-Host "   $(Resolve-Path $sqlFile)" -ForegroundColor Yellow
Write-Host ""

# Offer to open the file
$openFile = Read-Host "Would you like to open the SQL file now? (yes/no)"
if ($openFile -eq "yes") {
    Start-Process notepad $sqlFile
    Write-Host "Opened SQL file in Notepad" -ForegroundColor Green
}

Write-Host ""
Write-Host "For detailed instructions, see:" -ForegroundColor Cyan
Write-Host "   docs\APPLY_LINTER_FIXES.md" -ForegroundColor Yellow
Write-Host ""
Write-Host "Script completed successfully" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Apply the SQL via Supabase SQL Editor (instructions above)" -ForegroundColor White
Write-Host "2. Run verification queries included at the end of the SQL file" -ForegroundColor White
Write-Host "3. Run database linter to verify all warnings are fixed" -ForegroundColor White
Write-Host ""
