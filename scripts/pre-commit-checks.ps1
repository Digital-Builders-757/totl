# Pre-commit checks for TOTL Agency (DX hardened)
# Single source of truth: npm scripts.
# - `npm run verify-all` is the CI-parity gate (authoritative)
# - This script exists as a stable hook entrypoint for Windows environments.

Write-Host "🚨 Running pre-commit checks (delegated to npm run verify-all)..." -ForegroundColor Cyan

& npm run verify-all
exit $LASTEXITCODE
