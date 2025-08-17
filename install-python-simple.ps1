# Simple PowerShell script to install Python
Write-Host "Installing Python for TOTL Agency Serena MCP Setup" -ForegroundColor Green

# Try winget first
try {
    winget install Python.Python.3.11
    Write-Host "Python installed via winget" -ForegroundColor Green
} catch {
    # Open Microsoft Store as fallback
    Start-Process "ms-windows-store://pdp/?productid=9NRWMJP3717K"
    Write-Host "Microsoft Store opened - please install Python 3.11" -ForegroundColor Yellow
}

Write-Host "After installation, close and reopen your terminal" -ForegroundColor Yellow