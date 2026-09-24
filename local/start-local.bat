@echo off
setlocal
title Sologix - local test site
cd /d "%~dp0"

echo.
echo  Sologix local test site
echo  -----------------------

where docker >nul 2>nul
if errorlevel 1 goto nodocker
docker info >nul 2>nul
if errorlevel 1 goto notrunning

if exist local.env goto haveenv
echo  Creating local test settings (local.env)...
powershell -NoProfile -ExecutionPolicy Bypass -Command "$b = New-Object byte[] 48; [Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($b); $s = [Convert]::ToBase64String($b) -replace '[+/=]', 'x'; (Get-Content 'local.env.template') -replace '__JWT__', ('local' + $s) | Set-Content -Encoding ascii 'local.env'"
if not exist local.env goto fail
:haveenv

echo  Building and starting (first time takes 5-10 minutes)...
docker compose -f docker-compose.local.yml up -d --build
if errorlevel 1 goto fail

echo  Waiting for the site to come up...
powershell -NoProfile -ExecutionPolicy Bypass -Command "for ($i = 0; $i -lt 120; $i++) { try { Invoke-WebRequest -UseBasicParsing 'http://localhost:8080/api/health' -TimeoutSec 3 | Out-Null; exit 0 } catch { Start-Sleep -Seconds 2 } }; exit 1"
if errorlevel 1 goto fail

start "" http://localhost:8080
echo.
echo  Site is running:   http://localhost:8080
echo  Admin panel:       http://localhost:8080/admin/login
echo    Email:           admin@sologixenergy.in
echo    Password:        Local-Test-Sologix-2026
echo  (Local test login only - the real site's password is unchanged.)
echo.
echo  To stop it later, double-click stop-local.bat
echo.
pause
exit /b 0

:nodocker
echo.
echo  Docker Desktop is not installed on this PC.
echo  Install it from the page that is opening now, restart, start Docker Desktop,
echo  then double-click start-local.bat again.
start "" https://www.docker.com/products/docker-desktop/
pause
exit /b 1

:notrunning
echo.
echo  Docker Desktop is installed but not running.
echo  Open Docker Desktop, wait until it says "Engine running", then run this again.
pause
exit /b 1

:fail
echo.
echo  Something went wrong. Last log lines from the site:
docker compose -f docker-compose.local.yml logs --tail 40 app
pause
exit /b 1
