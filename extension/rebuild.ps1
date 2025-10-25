Write-Host "Building Auxly Extension..."
cd C:\Auxly\extension
npm run compile
npx @vscode/vsce package --no-dependencies
Write-Host "Done!"



