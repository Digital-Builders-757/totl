# Update Supabase MCP Configuration
# This script updates the Cursor MCP configuration to use the command-based Supabase MCP server

$mcpConfigPath = "$env:USERPROFILE\.cursor\mcp.json"

Write-Host "🔧 Updating Supabase MCP Configuration" -ForegroundColor Cyan
Write-Host ""

# Check if mcp.json exists
if (-not (Test-Path $mcpConfigPath)) {
    Write-Host "❌ MCP configuration file not found at: $mcpConfigPath" -ForegroundColor Red
    Write-Host "   Please ensure Cursor is installed and configured." -ForegroundColor Yellow
    exit 1
}

# Read current configuration
Write-Host "📖 Reading current MCP configuration..." -ForegroundColor Yellow
$currentConfig = Get-Content $mcpConfigPath -Raw | ConvertFrom-Json

# Get project reference (from current config or prompt)
$projectRef = "utvircuwknqzpnmvxidp"  # From your current config

# Prompt for access token
Write-Host ""
Write-Host "🔑 Supabase Access Token Required" -ForegroundColor Yellow
Write-Host "   Get your token from: https://supabase.com/dashboard/account/tokens" -ForegroundColor Gray
Write-Host "   Or check your .env.local file for SUPABASE_ACCESS_TOKEN" -ForegroundColor Gray
Write-Host ""
$accessToken = Read-Host "Enter your Supabase Access Token (starts with 'sbp_')"

if (-not $accessToken -or -not $accessToken.StartsWith("sbp_")) {
    Write-Host "⚠️  Warning: Access token should start with 'sbp_'" -ForegroundColor Yellow
    $continue = Read-Host "Continue anyway? (y/n)"
    if ($continue -ne "y") {
        Write-Host "❌ Configuration update cancelled." -ForegroundColor Red
        exit 1
    }
}

# Update Supabase MCP configuration
Write-Host ""
Write-Host "🔄 Updating Supabase MCP configuration..." -ForegroundColor Yellow

# Create new Supabase MCP config
$newSupabaseConfig = @{
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

# Update the configuration
$currentConfig.mcpServers.supabase = $newSupabaseConfig

# Backup original config
$backupPath = "$mcpConfigPath.backup.$(Get-Date -Format 'yyyyMMdd-HHmmss')"
Write-Host "💾 Creating backup: $backupPath" -ForegroundColor Gray
Copy-Item $mcpConfigPath $backupPath

# Write updated configuration
$updatedJson = $currentConfig | ConvertTo-Json -Depth 10
Set-Content -Path $mcpConfigPath -Value $updatedJson -Encoding UTF8

Write-Host ""
Write-Host "✅ Supabase MCP configuration updated successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Configuration Details:" -ForegroundColor Cyan
Write-Host "   Project Reference: $projectRef" -ForegroundColor Gray
Write-Host "   Mode: Read-only" -ForegroundColor Gray
Write-Host "   Package: @supabase/mcp-server-supabase@latest" -ForegroundColor Gray
Write-Host ""
Write-Host "🔄 Next Steps:" -ForegroundColor Yellow
Write-Host "   1. Restart Cursor completely (close all windows)" -ForegroundColor White
Write-Host "   2. Reopen Cursor" -ForegroundColor White
Write-Host "   3. Test the connection by asking: 'List all tables in my Supabase database'" -ForegroundColor White
Write-Host ""
Write-Host "💡 Backup saved to: $backupPath" -ForegroundColor Gray

