@echo off
REM Debug wrapper for MCP server - captures all stderr output to log file
echo Starting Auxly MCP Server with debug logging...
echo Log file: %~dp0mcp-server-debug.log
node "%~dp0dist\index.js" 2> "%~dp0mcp-server-debug.log"
echo.
echo Server exited. Check mcp-server-debug.log for details.
pause


