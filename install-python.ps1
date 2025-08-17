# PowerShell script to install Python for Serena MCP
# Run this in PowerShell as Administrator

Write-Host "🐍 Installing Python for TOTL Agency Serena MCP Setup" -ForegroundColor Green
Write-Host "=================================================" -ForegroundColor Green

# Check if running as administrator
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)

if (-not $isAdmin) {
    Write-Host "⚠️  Please run PowerShell as Administrator for best results" -ForegroundColor Yellow
    Write-Host "Right-click PowerShell and select 'Run as Administrator'" -ForegroundColor Yellow
    Write-Host ""
}

# Method 1: Try Windows Package Manager (winget)
Write-Host "🔍 Checking for Windows Package Manager (winget)..." -ForegroundColor Blue

try {
    $wingetVersion = winget --version
    Write-Host "✅ Winget found: $wingetVersion" -ForegroundColor Green
    
    Write-Host "📦 Installing Python via winget..." -ForegroundColor Blue
    winget install Python.Python.3.11 --accept-package-agreements --accept-source-agreements
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Python installed successfully via winget!" -ForegroundColor Green
    } else {
        Write-Host "❌ Winget installation failed, trying alternative method..." -ForegroundColor Red
    }
} catch {
    Write-Host "❌ Winget not available, using alternative method..." -ForegroundColor Red
}

# Method 2: Open Microsoft Store
Write-Host "🏪 Opening Microsoft Store for Python installation..." -ForegroundColor Blue
Start-Process "ms-windows-store://pdp/?productid=9NRWMJP3717K"

Write-Host ""
Write-Host "📋 NEXT STEPS:" -ForegroundColor Yellow
Write-Host "1. If Microsoft Store opened, install Python 3.11+" -ForegroundColor White
Write-Host "2. After installation, close and reopen your terminal" -ForegroundColor White
Write-Host "3. Run: python --version" -ForegroundColor White
Write-Host "4. Run: pip --version" -ForegroundColor White
Write-Host ""
Write-Host "If Microsoft Store didn't work:" -ForegroundColor Yellow
Write-Host "1. Visit: https://www.python.org/downloads/windows/" -ForegroundColor White
Write-Host "2. Download Python 3.11+" -ForegroundColor White
Write-Host "3. IMPORTANT: Check 'Add Python to PATH' during installation" -ForegroundColor Red
Write-Host ""

# Wait for user input
Write-Host "Press any key after installing Python to continue..." -ForegroundColor Green
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

# Test Python installation
Write-Host "🧪 Testing Python installation..." -ForegroundColor Blue

try {
    $pythonVersion = python --version 2>&1
    if ($pythonVersion -match "Python") {
        Write-Host "✅ Python is working: $pythonVersion" -ForegroundColor Green
        
        $pipVersion = pip --version 2>&1
        if ($pipVersion -match "pip") {
            Write-Host "✅ Pip is working: $pipVersion" -ForegroundColor Green
            Write-Host ""
            Write-Host "🎉 Python installation successful!" -ForegroundColor Green
            Write-Host "You can now proceed to install Serena MCP" -ForegroundColor Green
        } else {
            Write-Host "❌ Pip not working. Try reinstalling Python." -ForegroundColor Red
        }
    } else {
        Write-Host "❌ Python not found. Installation may have failed." -ForegroundColor Red
        Write-Host "Try closing terminal and opening a new one." -ForegroundColor Yellow
    }
} catch {
    Write-Host "❌ Error testing Python. Try restarting terminal." -ForegroundColor Red
}

Write-Host ""
Write-Host "📋 Next: Run the Serena MCP installation commands" -ForegroundColor Green