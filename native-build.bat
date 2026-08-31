@echo off
REM -------------------------------------------------------------------------
REM  Rutba native-apps - one-click build.
REM
REM    native-build            install workspaces (+ Electron on first run)
REM    native-build electron   (re)install/upgrade Electron only
REM    native-build test       run the @rutba/sync test suites
REM
REM  Electron stays a deliberate install (it is a ~100 MB binary and the
REM  scaffold is runnable without it) - but deliberate should not mean manual,
REM  so this script does it on first run and remembers.
REM -------------------------------------------------------------------------
cd /d "%~dp0"

if /i "%~1"=="test" (
    call npm test
    exit /b %errorlevel%
)

echo.
echo  native-apps build
echo  ---------------------------------------------
call npm install --no-audit --no-fund
if errorlevel 1 exit /b 1

if /i "%~1"=="electron" goto :electron
if not exist node_modules\electron\dist\electron.exe (
    echo.
    echo  Electron not installed yet - installing (first run only) ...
    goto :electron
)
echo.
echo  Electron already installed. Shells:
echo    apps\rutba-pos-desktop\run.bat     (POS,    app :4002, bridge :4030)
echo    apps\rutba-mail-desktop\run.bat    (Mail,   app :4021, bridge :4031)
echo    apps\rutba-studio-desktop\run.bat  (Studio, app :4231, bridge :4032)
exit /b 0

:electron
call npm install -D electron --no-audit --no-fund
if errorlevel 1 (
    echo.
    echo  Electron install failed. Retry: native-build.bat electron
    exit /b 1
)
echo.
echo  Electron installed. Run a shell, e.g.: apps\rutba-pos-desktop\run.bat
exit /b 0
