@echo off
REM ─────────────────────────────────────────────────────────────────────────
REM  Shared launcher for the Rutba desktop shells - called by each
REM  apps\rutba-*-desktop\run.bat with the app name and its ports.
REM
REM  One window, one click: web app up, bridge up (inside the shell), window
REM  up. Closing the window ends everything this script started.
REM ─────────────────────────────────────────────────────────────────────────
setlocal

set "APP_NAME=%~1"
set "APP_DIR=%~2"
set "APP_PORT=%~3"
set "BRIDGE_PORT=%~4"

if "%APP_NAME%"=="" (
    echo usage: run-shell.bat ^<name^> ^<app-dir^> ^<app-port^> ^<bridge-port^>
    exit /b 1
)

set "ROOT=%~dp0..\.."
set "CONSUMER=%ROOT%\..\consumer"
set "BRIDGE_API=http://127.0.0.1:%BRIDGE_PORT%/api"

title %APP_NAME%

echo.
echo  %APP_NAME% - desktop shell
echo  ─────────────────────────────────────────────
echo   web app   %APP_DIR%  ^(port %APP_PORT%^)
echo   bridge    %BRIDGE_API%  ^(upstream :4020^)
echo.

REM ── Electron must be installed once at the repo root (native-build.bat) ──
if not exist "%ROOT%\node_modules\electron\dist\electron.exe" (
    echo  ERROR: Electron is not installed yet.
    echo  Run native-build.bat at the repo root once, then retry.
    exit /b 1
)

REM ── Web app dev server, unless one is already listening on its port ──
netstat -ano | findstr ":%APP_PORT% " | findstr LISTENING >nul 2>&1
if %errorlevel%==0 (
    echo  web app already listening on :%APP_PORT% - reusing it
) else (
    echo  starting the web app on :%APP_PORT% ...
    start "%APP_NAME% web" /min cmd /c "cd /d "%CONSUMER%" && set NEXT_PUBLIC_API_URL=%BRIDGE_API%&& npm run start --prefix %APP_DIR%"
)

REM ── The shell itself: window + bridge in a UtilityProcess ──
echo  starting the Electron shell ...
cd /d "%~dp0.."
"%ROOT%\node_modules\.bin\electron.cmd" .

endlocal
