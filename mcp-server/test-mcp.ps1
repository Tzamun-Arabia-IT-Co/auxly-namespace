# Test MCP Server and capture all output
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Testing Auxly MCP Server" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $scriptPath

Write-Host "Working Directory: $(Get-Location)" -ForegroundColor Yellow
Write-Host "Node Version: $(node --version)" -ForegroundColor Yellow
Write-Host ""

Write-Host "Starting server (press Ctrl+C to stop)..." -ForegroundColor Green
Write-Host ""

# Run the server and capture stderr
$process = Start-Process -FilePath "node" -ArgumentList "dist\index.js" -NoNewWindow -PassThru -RedirectStandardError "test-stderr.log" -RedirectStandardOutput "test-stdout.log"

# Wait a few seconds
Start-Sleep -Seconds 3

# Check if process is still running
if ($process.HasExited) {
    Write-Host "❌ Server exited immediately (Exit Code: $($process.ExitCode))" -ForegroundColor Red
} else {
    Write-Host "✅ Server is running (PID: $($process.Id))" -ForegroundColor Green
    $process.Kill()
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "STDERR Output:" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Cyan
if (Test-Path "test-stderr.log") {
    Get-Content "test-stderr.log"
} else {
    Write-Host "(No stderr output)" -ForegroundColor Gray
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "STDOUT Output:" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Cyan
if (Test-Path "test-stdout.log") {
    Get-Content "test-stdout.log"
} else {
    Write-Host "(No stdout output)" -ForegroundColor Gray
}

Write-Host ""
Write-Host "Test complete!" -ForegroundColor Cyan


