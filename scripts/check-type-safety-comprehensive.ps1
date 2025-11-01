# Type Safety Comprehensive Check Script
# Prevents custom database entity interfaces and incorrect enum usage

param(
    [switch]$Fix,
    [switch]$Verbose
)

$ErrorActionPreference = "Stop"

Write-Host "`n🎯 Type Safety Comprehensive Check" -ForegroundColor Cyan
Write-Host "=" * 60 -ForegroundColor Cyan

$totalIssues = 0
$criticalIssues = 0
$warningIssues = 0

# Function to check files for patterns
function Test-Pattern {
    param(
        [string]$Pattern,
        [string]$Description,
        [string]$Severity,
        [string[]]$Paths,
        [string[]]$Exclude = @("node_modules", ".next", "dist", "docs", "types/database.ts", "types/database-helpers.ts")
    )
    
    Write-Host "`n📋 Checking: $Description" -ForegroundColor Yellow
    
    $excludeArgs = $Exclude | ForEach-Object { "--exclude-dir=$_" }
    $found = $false
    
    foreach ($path in $Paths) {
        if (Test-Path $path) {
            $results = Get-ChildItem -Path $path -Recurse -Include *.ts,*.tsx -File | 
                Where-Object { 
                    $file = $_
                    -not ($Exclude | Where-Object { $file.FullName -like "*$_*" })
                } |
                Select-String -Pattern $Pattern
            
            if ($results) {
                $found = $true
                Write-Host "  ❌ FOUND in:" -ForegroundColor Red
                
                $grouped = $results | Group-Object Path
                foreach ($group in $grouped) {
                    $relativePath = $group.Name -replace [regex]::Escape($PWD), "."
                    Write-Host "     $relativePath" -ForegroundColor Red
                    
                    if ($Verbose) {
                        foreach ($match in $group.Group) {
                            Write-Host "       Line $($match.LineNumber): $($match.Line.Trim())" -ForegroundColor DarkRed
                        }
                    }
                }
                
                if ($Severity -eq "CRITICAL") {
                    $script:criticalIssues++
                } else {
                    $script:warningIssues++
                }
                $script:totalIssues++
            }
        }
    }
    
    if (-not $found) {
        Write-Host "  ✅ No issues found" -ForegroundColor Green
    }
    
    return $found
}

# Check 1: Custom Application interface
Write-Host "`n🔍 Check 1: Custom 'Application' Interfaces" -ForegroundColor Cyan
$hasAppInterface = Test-Pattern `
    -Pattern "^\s*interface\s+Application\s*\{" `
    -Description "Custom 'Application' interface (should use generated types)" `
    -Severity "CRITICAL" `
    -Paths @("components", "app", "lib")

# Check 2: Custom Gig interface
Write-Host "`n🔍 Check 2: Custom 'Gig' Interfaces" -ForegroundColor Cyan
$hasGigInterface = Test-Pattern `
    -Pattern "^\s*interface\s+Gig\s*\{" `
    -Description "Custom 'Gig' interface (should use generated types)" `
    -Severity "CRITICAL" `
    -Paths @("components", "app", "lib")

# Check 3: Custom Profile interface
Write-Host "`n🔍 Check 3: Custom 'Profile' Interfaces" -ForegroundColor Cyan
$hasProfileInterface = Test-Pattern `
    -Pattern "^\s*interface\s+(Profile|TalentProfile|ClientProfile)\s*\{" `
    -Description "Custom 'Profile' interface (should use generated types)" `
    -Severity "CRITICAL" `
    -Paths @("components", "app", "lib")

# Check 4: Custom Booking interface
Write-Host "`n🔍 Check 4: Custom 'Booking' Interfaces" -ForegroundColor Cyan
$hasBookingInterface = Test-Pattern `
    -Pattern "^\s*interface\s+Booking\s*\{" `
    -Description "Custom 'Booking' interface (should use generated types)" `
    -Severity "CRITICAL" `
    -Paths @("components", "app", "lib")

# Check 5: Incorrect application status "pending"
Write-Host "`n🔍 Check 5: Incorrect Application Status 'pending'" -ForegroundColor Cyan
$hasPendingStatus = Test-Pattern `
    -Pattern "status.*===.*['\"]pending['\"]" `
    -Description "Incorrect 'pending' status (should be 'new' or 'under_review')" `
    -Severity "CRITICAL" `
    -Paths @("components", "app", "lib")

# Check 6: Plain string for status (warning)
Write-Host "`n🔍 Check 6: Untyped Status Fields" -ForegroundColor Cyan
$hasStringStatus = Test-Pattern `
    -Pattern "status:\s*string" `
    -Description "Untyped 'status' field (should use enum type)" `
    -Severity "WARNING" `
    -Paths @("components", "app", "lib")

# Check 7: Missing Database import when using database entities
Write-Host "`n🔍 Check 7: Missing Type Imports" -ForegroundColor Cyan
$componentFiles = Get-ChildItem -Path components,app -Recurse -Include *.ts,*.tsx -File |
    Where-Object { 
        $content = Get-Content $_.FullName -Raw
        # Has database entity references but no Database import
        ($content -match "Application|Gig|Profile|Booking") -and
        ($content -notmatch "import.*Database.*from.*@/types/supabase") -and
        ($content -notmatch "import.*from.*@/types/database-helpers")
    }

if ($componentFiles) {
    Write-Host "  ⚠️  Files using database entities without proper imports:" -ForegroundColor Yellow
    foreach ($file in $componentFiles) {
        $relativePath = $file.FullName -replace [regex]::Escape($PWD), "."
        Write-Host "     $relativePath" -ForegroundColor Yellow
    }
    $warningIssues++
    $totalIssues++
} else {
    Write-Host "  ✅ All files have proper type imports" -ForegroundColor Green
}

# Summary
Write-Host "`n" + ("=" * 60) -ForegroundColor Cyan
Write-Host "📊 Type Safety Check Summary" -ForegroundColor Cyan
Write-Host ("=" * 60) -ForegroundColor Cyan

if ($criticalIssues -eq 0 -and $warningIssues -eq 0) {
    Write-Host "`n✅ All Checks Passed!" -ForegroundColor Green
    Write-Host "   No type safety issues found." -ForegroundColor Green
    exit 0
} else {
    Write-Host "`n❌ Issues Found:" -ForegroundColor Red
    if ($criticalIssues -gt 0) {
        Write-Host "   🚨 Critical Issues: $criticalIssues" -ForegroundColor Red
    }
    if ($warningIssues -gt 0) {
        Write-Host "   ⚠️  Warnings: $warningIssues" -ForegroundColor Yellow
    }
    Write-Host "   📝 Total Issues: $totalIssues" -ForegroundColor Red
    
    Write-Host "`n📖 How to Fix:" -ForegroundColor Yellow
    Write-Host "   1. Read: docs/TYPE_SAFETY_RULES.md" -ForegroundColor White
    Write-Host "   2. Import: import { Database } from '@/types/supabase'" -ForegroundColor White
    Write-Host "   3. Use generated types instead of custom interfaces" -ForegroundColor White
    Write-Host "   4. Check enum values in database_schema_audit.md" -ForegroundColor White
    
    Write-Host "`n🔍 For detailed examples, see:" -ForegroundColor Yellow
    Write-Host "   - docs/TYPE_SAFETY_AUDIT_REPORT.md" -ForegroundColor White
    Write-Host "   - Run with -Verbose flag to see exact line numbers" -ForegroundColor White
    
    exit 1
}

