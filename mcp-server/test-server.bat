@echo off
echo Testing MCP Server...
echo.
cd /d "%~dp0"
node dist\index.js 2> test-output.log
echo.
echo Server exited. Check test-output.log for errors.
type test-output.log
pause


