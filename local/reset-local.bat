@echo off
cd /d "%~dp0"
echo This deletes the LOCAL test database and uploads (not the live site).
choice /M "Continue"
if errorlevel 2 exit /b 0
docker compose -f docker-compose.local.yml down -v
echo Local test data wiped. Run start-local.bat for a fresh copy.
pause
