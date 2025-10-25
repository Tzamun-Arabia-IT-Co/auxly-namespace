@echo off
echo.
echo ========================================
echo  API Key Expiration Migration
echo ========================================
echo.
echo This will add 12-month expiration to all API keys
echo.
pause

cd backend
echo.
echo Running migration...
echo.
call npx ts-node src/db/run-expiration-migration.ts

echo.
echo ========================================
echo  Migration Complete!
echo ========================================
echo.
pause






