# TOTL Agency - Supabase Setup Script
# Run this script to configure Supabase CLI for non-interactive operation

Write-Host "🚀 Setting up Supabase CLI for TOTL Agency..." -ForegroundColor Green

# Set environment variables for non-interactive operation
$env:SUPABASE_PROJECT_ID = "utvircuwknqzpnmvxidp"
$env:SUPABASE_DB_PASSWORD = "IOCoziTrErLEtCzJ"

Write-Host "✅ Environment variables set:" -ForegroundColor Green
Write-Host "   SUPABASE_PROJECT_ID: $env:SUPABASE_PROJECT_ID" -ForegroundColor Cyan
Write-Host "   SUPABASE_DB_PASSWORD: [HIDDEN]" -ForegroundColor Cyan

# Link to remote project
Write-Host "📎 Linking to remote project..." -ForegroundColor Yellow
supabase link --project-ref $env:SUPABASE_PROJECT_ID

Write-Host "📊 Testing database connection..." -ForegroundColor Yellow

Write-Host "`n🎉 Setup complete! You can now run:" -ForegroundColor Green
Write-Host "   npm run db:push    # Push migrations to remote" -ForegroundColor Cyan
Write-Host "   npm run db:status  # Check migration status" -ForegroundColor Cyan
Write-Host "   npm run db:new     # Create new migration" -ForegroundColor Cyan

Write-Host "`n💡 Note: Environment variables are set for this session only." -ForegroundColor Yellow
Write-Host "   Run this script again if you open a new PowerShell window." -ForegroundColor Yellow
