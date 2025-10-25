#!/usr/bin/env pwsh
# Create VSIX package for testing

Write-Host "📦 Creating Auxly VSIX package..." -ForegroundColor Cyan

try {
    # Run vsce package
    npx @vscode/vsce package --out auxly-CSP-FIXED.vsix --no-dependencies
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Package created: auxly-CSP-FIXED.vsix" -ForegroundColor Green
        Write-Host ""
        Write-Host "To install, run:" -ForegroundColor Yellow
        Write-Host "  code --install-extension auxly-CSP-FIXED.vsix --force" -ForegroundColor White
    } else {
        Write-Host "❌ Package creation failed" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "❌ Error: $_" -ForegroundColor Red
    exit 1
}









