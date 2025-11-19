# Simple Supabase MCP Configuration Update
# This updates ONLY the Supabase MCP server configuration

$mcpConfigPath = "$env:USERPROFILE\.cursor\mcp.json"

Write-Host "🔧 Updating Supabase MCP Configuration" -ForegroundColor Cyan
Write-Host ""

if (-not (Test-Path $mcpConfigPath)) {
    Write-Host "❌ MCP config not found at: $mcpConfigPath" -ForegroundColor Red
    exit 1
}

# Read current config
$config = Get-Content $mcpConfigPath -Raw | ConvertFrom-Json

# Project reference (from your current config)
$projectRef = "utvircuwknqzpnmvxidp"

Write-Host "📋 Current Configuration:" -ForegroundColor Yellow
Write-Host "   Project Reference: $projectRef" -ForegroundColor Gray
Write-Host ""

# Get access token
Write-Host "🔑 Supabase Access Token" -ForegroundColor Yellow
Write-Host "   Get from: https://supabase.com/dashboard/account/tokens" -ForegroundColor Gray
Write-Host "   Token should start with 'sbp_'" -ForegroundColor Gray
Write-Host ""
$accessToken = Read-Host "Enter your Supabase Access Token"

if (-not $accessToken) {
    Write-Host "❌ Access token is required" -ForegroundColor Red
    exit 1
}

# Update Supabase config
$config.mcpServers.supabase = @{
    command = "cmd"
    args = @(
        "/c",
        "npx",
        "-y",
        "@supabase/mcp-server-supabase@latest",
        "--read-only",
        "--project-ref=$projectRef"
    )
    env = @{
        SUPABASE_ACCESS_TOKEN = $accessToken
    }
}

# Backup
$backup = "$mcpConfigPath.backup.$(Get-Date -Format 'yyyyMMdd-HHmmss')"
Copy-Item $mcpConfigPath $backup
Write-Host "💾 Backup created: $backup" -ForegroundColor Gray

# Save updated config
$config | ConvertTo-Json -Depth 10 | Set-Content $mcpConfigPath -Encoding UTF8

Write-Host ""
Write-Host "✅ Configuration updated successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "🔄 Next Steps:" -ForegroundColor Yellow
Write-Host "   1. Restart Cursor completely" -ForegroundColor White
Write-Host "   2. Test with: 'List all tables in my Supabase database'" -ForegroundColor White

