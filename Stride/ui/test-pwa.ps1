# Test PWA Locally

# This script serves the production build with http-server to test PWA features

Write-Host "=== Stride PWA Test Server ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "Starting HTTP server on port 8080..." -ForegroundColor Yellow
Write-Host "Access the app at: http://localhost:8080" -ForegroundColor Green
Write-Host ""
Write-Host "To test PWA features:" -ForegroundColor Cyan
Write-Host "  1. Open Chrome DevTools (F12)" -ForegroundColor White
Write-Host "  2. Go to Application tab" -ForegroundColor White
Write-Host "  3. Check 'Service Workers' section" -ForegroundColor White
Write-Host "  4. Check 'Manifest' section" -ForegroundColor White
Write-Host "  5. Test offline mode with 'Offline' checkbox" -ForegroundColor White
Write-Host ""
Write-Host "Press Ctrl+C to stop the server" -ForegroundColor Yellow
Write-Host ""

# Check if http-server is available
$httpServerCheck = Get-Command npx -ErrorAction SilentlyContinue

if (-not $httpServerCheck) {
    Write-Host "ERROR: npx is not available. Please install Node.js." -ForegroundColor Red
    exit 1
}

# Navigate to build output directory
$distPath = Join-Path $PSScriptRoot "dist\ui\browser"

if (-not (Test-Path $distPath)) {
    Write-Host "ERROR: Build output not found at $distPath" -ForegroundColor Red
    Write-Host "Please run 'npm run build:prod' first" -ForegroundColor Yellow
    exit 1
}

# Start http-server
Set-Location $distPath
npx http-server -p 8080 -c-1 --cors
