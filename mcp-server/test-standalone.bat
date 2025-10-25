@echo off
echo ========================================
echo Testing MCP Server Standalone
echo ========================================
echo.
cd /d "%~dp0"
echo Working directory: %CD%
echo Node version:
node --version
echo.
echo Starting server (will hang if working, press Ctrl+C to stop)...
echo.
node dist\index.js
echo.
echo Server exited.
pause


