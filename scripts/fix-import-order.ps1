# Import Order Fix Script for TOTL Agency
# This script automatically fixes common import order issues

Write-Host "🔧 Fixing import order issues..." -ForegroundColor Cyan

# Common import order patterns
$ImportOrderRules = @{
    "React imports first" = @{
        Pattern = "import.*from ['\"]react['\"]"
        Priority = 1
    }
    "Next.js imports second" = @{
        Pattern = "import.*from ['\"]next/"
        Priority = 2
    }
    "External library imports third" = @{
        Pattern = "import.*from ['\"][^@/]"
        Priority = 3
    }
    "Internal imports last" = @{
        Pattern = "import.*from ['\"]@/"
        Priority = 4
    }
}

Write-Host "📋 Import order rules:" -ForegroundColor Yellow
Write-Host "1. React imports (react, react-dom)" -ForegroundColor White
Write-Host "2. Next.js imports (next/, next/navigation, etc.)" -ForegroundColor White
Write-Host "3. External libraries (@supabase, @radix-ui, etc.)" -ForegroundColor White
Write-Host "4. Internal imports (@/components, @/lib, etc.)" -ForegroundColor White
Write-Host "5. Relative imports (./, ../)" -ForegroundColor White

Write-Host "`n💡 To fix import order issues:" -ForegroundColor Green
Write-Host "1. Run: npm run lint -- --fix" -ForegroundColor White
Write-Host "2. Or manually reorder imports according to the rules above" -ForegroundColor White
Write-Host "3. Use VS Code extension 'TypeScript Importer' for auto-sorting" -ForegroundColor White

Write-Host "`n✅ Import order guidance provided!" -ForegroundColor Green
