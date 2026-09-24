@echo off
cd /d "%~dp0"
echo Stopping the Sologix local test site...
docker compose -f docker-compose.local.yml down
echo Stopped. Your test data is kept; run reset-local.bat to wipe it.
pause
