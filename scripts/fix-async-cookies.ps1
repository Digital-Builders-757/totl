# Fix Async Cookies Issues - Next.js 15+ Compatibility
# This script finds and fixes async cookies patterns that cause errors in Next.js 15+

Write-Host "Scanning for async cookies issues..." -ForegroundColor Yellow

$issues = @()

# Find files with problematic patterns
$problematicPatterns = @(
    @{
        Pattern = 'createServerComponentClient.*\{.*cookies.*\}'
        Description = "Direct cookies usage in createServerComponentClient"
        Fix = "Use createSupabaseServerClient from lib/supabase-client"
    },
    @{
        Pattern = 'createServerActionClient.*\{.*cookies.*\}'
        Description = "Direct cookies usage in createServerActionClient"
        Fix = "Use createSupabaseActionClient from lib/supabase-client"
    },
    @{
        Pattern = 'import.*createServerComponentClient.*from.*@supabase/auth-helpers-nextjs'
        Description = "Direct import of createServerComponentClient"
        Fix = "Import from lib/supabase-client instead"
    },
    @{
        Pattern = 'import.*createServerActionClient.*from.*@supabase/auth-helpers-nextjs'
        Description = "Direct import of createServerActionClient"
        Fix = "Import from lib/supabase-client instead"
    }
)

# Scan TypeScript and TSX files
$files = Get-ChildItem -Path . -Recurse -Include "*.ts", "*.tsx" | Where-Object { 
    $_.FullName -notlike "*node_modules*" -and 
    $_.FullName -notlike "*.d.ts" -and
    $_.FullName -notlike "*types/database.ts*" -and
    $_.FullName -notlike "*lib/supabase-client.ts*"
}

foreach ($file in $files) {
    $content = Get-Content $file.FullName -Raw
    $lines = Get-Content $file.FullName
    
    foreach ($pattern in $problematicPatterns) {
        if ($content -match $pattern.Pattern) {
            $lineNumbers = @()
            for ($i = 0; $i -lt $lines.Count; $i++) {
                if ($lines[$i] -match $pattern.Pattern) {
                    $lineNumbers += ($i + 1)
                }
            }
            
            $issues += @{
                File = $file.FullName
                Description = $pattern.Description
                Fix = $pattern.Fix
                LineNumbers = $lineNumbers
            }
        }
    }
}

# Report findings
if ($issues.Count -eq 0) {
    Write-Host "No async cookies issues found!" -ForegroundColor Green
    exit 0
}

Write-Host "`nFound $($issues.Count) async cookies issues:" -ForegroundColor Red

foreach ($issue in $issues) {
    Write-Host "`nFile: $($issue.File)" -ForegroundColor Cyan
    Write-Host "   Issue: $($issue.Description)" -ForegroundColor Yellow
    Write-Host "   Lines: $($issue.LineNumbers -join ', ')" -ForegroundColor Yellow
    Write-Host "   Fix: $($issue.Fix)" -ForegroundColor Green
}

Write-Host "`nTo fix these issues:" -ForegroundColor Yellow
Write-Host "1. Replace direct Supabase client creation with centralized helpers" -ForegroundColor White
Write-Host "2. Use createSupabaseServerClient() for server components" -ForegroundColor White
Write-Host "3. Use createSupabaseActionClient() for server actions" -ForegroundColor White
Write-Host "4. Import from lib/supabase-client instead of @supabase/auth-helpers-nextjs" -ForegroundColor White

Write-Host "`nSee docs/CODING_STANDARDS.md for detailed patterns" -ForegroundColor Blue

exit 1
