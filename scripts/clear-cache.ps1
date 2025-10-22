# Clear Next.js Cache Script
# This script clears all Next.js build caches and temporary files

Write-Host "🧹 Clearing Next.js caches..." -ForegroundColor Cyan

# Stop any running Next.js processes
Write-Host "`n📍 Stopping any running Next.js processes..." -ForegroundColor Yellow
Get-Process -Name node -ErrorAction SilentlyContinue | Stop-Process -Force
Write-Host "✅ Processes stopped" -ForegroundColor Green

# Remove .next directory
if (Test-Path ".next") {
    Write-Host "`n🗑️  Removing .next directory..." -ForegroundColor Yellow
    Remove-Item -Recurse -Force ".next"
    Write-Host "✅ .next directory removed" -ForegroundColor Green
} else {
    Write-Host "`n✅ .next directory doesn't exist" -ForegroundColor Green
}

# Remove node_modules/.cache
if (Test-Path "node_modules/.cache") {
    Write-Host "`n🗑️  Removing node_modules/.cache..." -ForegroundColor Yellow
    Remove-Item -Recurse -Force "node_modules/.cache"
    Write-Host "✅ node_modules/.cache removed" -ForegroundColor Green
} else {
    Write-Host "`n✅ node_modules/.cache doesn't exist" -ForegroundColor Green
}

# Clear Next.js cache directory
$nextCache = "$env:TEMP\.next"
if (Test-Path $nextCache) {
    Write-Host "`n🗑️  Clearing system Next.js cache..." -ForegroundColor Yellow
    Remove-Item -Recurse -Force $nextCache -ErrorAction SilentlyContinue
    Write-Host "✅ System cache cleared" -ForegroundColor Green
}

Write-Host "`n✨ Cache clearing complete!" -ForegroundColor Green
Write-Host "`n💡 Next steps:" -ForegroundColor Cyan
Write-Host "   1. Run: npm run dev" -ForegroundColor White
Write-Host "   2. Check http://localhost:3000" -ForegroundColor White
Write-Host "   3. Monitor Sentry for errors" -ForegroundColor White
