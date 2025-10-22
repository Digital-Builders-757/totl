#!/usr/bin/env pwsh

<#
.SYNOPSIS
    Run UI/UX Playwright tests for TOTL Agency
    
.DESCRIPTION
    Runs the comprehensive UI/UX test suite that validates all features
    implemented in the October 22, 2025 session.
    
.PARAMETER Quick
    Run only quick tests (public pages, no auth required)
    
.PARAMETER Full
    Run full test suite (includes auth-required tests)
    
.PARAMETER Headed
    Run tests in headed mode (show browser)
    
.PARAMETER Debug
    Run tests in debug mode
    
.EXAMPLE
    .\run-ui-ux-tests.ps1 -Quick
    Run quick tests only
    
.EXAMPLE
    .\run-ui-ux-tests.ps1 -Full -Headed
    Run full test suite with visible browser
    
.EXAMPLE
    .\run-ui-ux-tests.ps1 -Debug
    Run tests in debug mode (Playwright Inspector)
#>

param(
    [switch]$Quick,
    [switch]$Full,
    [switch]$Headed,
    [switch]$Debug,
    [switch]$Report
)

Write-Host "🎭 TOTL Agency - UI/UX Test Suite" -ForegroundColor Cyan
Write-Host "=================================" -ForegroundColor Cyan
Write-Host ""

# Check if Playwright is installed
if (-not (Test-Path "node_modules/@playwright/test")) {
    Write-Host "❌ Playwright not found. Installing..." -ForegroundColor Red
    npm install --save-dev @playwright/test
    npx playwright install chromium
}

# Build test command
$testCommand = "npx playwright test"

# Determine which tests to run
if ($Quick) {
    Write-Host "🏃 Running Quick Tests (Public Pages Only)..." -ForegroundColor Green
    $testCommand += " ui-ux-quick-test"
} elseif ($Full) {
    Write-Host "🎯 Running Full Test Suite..." -ForegroundColor Green
    $testCommand += " ui-ux-upgrades"
} else {
    Write-Host "🏃 Running Quick Tests (Default)..." -ForegroundColor Green
    Write-Host "    Use -Full flag for complete suite" -ForegroundColor Gray
    $testCommand += " ui-ux-quick-test"
}

# Add options
if ($Headed) {
    Write-Host "👀 Running in headed mode (browser visible)" -ForegroundColor Yellow
    $testCommand += " --headed"
}

if ($Debug) {
    Write-Host "🐛 Running in debug mode (Playwright Inspector)" -ForegroundColor Yellow
    $testCommand += " --debug"
}

Write-Host ""
Write-Host "📋 Test Categories:" -ForegroundColor Cyan
Write-Host "   ✅ Command Palette (⌘K)" -ForegroundColor White
Write-Host "   ✅ Image Loading & Skeletons" -ForegroundColor White
Write-Host "   ✅ Form Input Polish" -ForegroundColor White
Write-Host "   ✅ Button States & Hover" -ForegroundColor White
Write-Host "   ✅ Mobile Responsiveness" -ForegroundColor White
Write-Host "   ✅ Performance Metrics" -ForegroundColor White
Write-Host "   ✅ Accessibility" -ForegroundColor White
Write-Host ""

# Check if dev server is running
Write-Host "🔍 Checking if dev server is running..." -ForegroundColor Yellow
$devServerRunning = $false

try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000" -TimeoutSec 2 -UseBasicParsing -ErrorAction SilentlyContinue
    $devServerRunning = $true
    Write-Host "✅ Dev server is running" -ForegroundColor Green
} catch {
    Write-Host "⚠️  Dev server not detected - Playwright will start it automatically" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "🚀 Starting tests..." -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
Write-Host ""

# Run tests
Invoke-Expression $testCommand
$exitCode = $LASTEXITCODE

Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray

if ($exitCode -eq 0) {
    Write-Host ""
    Write-Host "✅ All tests passed!" -ForegroundColor Green
    Write-Host ""
    
    if ($Report) {
        Write-Host "📊 Opening test report..." -ForegroundColor Cyan
        npx playwright show-report
    } else {
        Write-Host "💡 Tip: Use -Report flag to view detailed HTML report" -ForegroundColor Gray
    }
} else {
    Write-Host ""
    Write-Host "❌ Some tests failed" -ForegroundColor Red
    Write-Host ""
    Write-Host "📊 View detailed report:" -ForegroundColor Yellow
    Write-Host "   npx playwright show-report" -ForegroundColor White
    Write-Host ""
    Write-Host "🐛 Debug failed tests:" -ForegroundColor Yellow
    Write-Host "   .\scripts\run-ui-ux-tests.ps1 -Debug" -ForegroundColor White
}

Write-Host ""
Write-Host "📁 Test Results:" -ForegroundColor Cyan
Write-Host "   - HTML Report: playwright-report/index.html" -ForegroundColor White
Write-Host "   - JSON Results: test-results/results.json" -ForegroundColor White
Write-Host "   - JUnit XML: test-results/results.xml" -ForegroundColor White

if ($exitCode -ne 0) {
    Write-Host ""
    Write-Host "   - Screenshots: test-results/ (failures only)" -ForegroundColor White
    Write-Host "   - Videos: test-results/ (failures only)" -ForegroundColor White
    Write-Host "   - Traces: test-results/ (failures only)" -ForegroundColor White
}

Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray

exit $exitCode

