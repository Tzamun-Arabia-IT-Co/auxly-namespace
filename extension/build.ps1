Write-Host "Building Auxly 0.1.9..."
cd C:\Auxly\extension
npx vsce package --allow-star-activation --no-dependencies
if ($LASTEXITCODE -eq 0) {
    Write-Host "SUCCESS: auxly-extension-0.1.9.vsix created!"
} else {
    Write-Host "ERROR: vsce package failed with exit code $LASTEXITCODE"
}


