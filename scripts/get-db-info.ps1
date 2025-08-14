# TOTL Agency - Get Database Info Script
# This script helps you find the correct database password

Write-Host "🔍 Getting database connection info for TOTL Agency..." -ForegroundColor Green

Write-Host "`n📋 To get your database password:" -ForegroundColor Yellow
Write-Host "1. Go to https://supabase.com/dashboard/project/utvircuwknqzpnmvxidp" -ForegroundColor Cyan
Write-Host "2. Click 'Settings' in the left sidebar" -ForegroundColor Cyan
Write-Host "3. Click 'Database'" -ForegroundColor Cyan
Write-Host "4. Scroll down to 'Connection info'" -ForegroundColor Cyan
Write-Host "5. Look for 'Database password' and copy it" -ForegroundColor Cyan

Write-Host "`n🔗 Your project is already linked!" -ForegroundColor Green
Write-Host "Project ID: utvircuwknqzpnmvxidp" -ForegroundColor Cyan

Write-Host "`n💡 Once you have the password, run:" -ForegroundColor Yellow
Write-Host "   Set environment variable with the password" -ForegroundColor Cyan
Write-Host "   npm run db:push" -ForegroundColor Cyan

Write-Host "`n🚀 Or update the setup script with the correct password and run:" -ForegroundColor Yellow
Write-Host "   npm run db:setup" -ForegroundColor Cyan
