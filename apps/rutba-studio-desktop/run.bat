@echo off
REM Rutba Studio - desktop shell. One click: Studio web app (:4231) + bridge
REM (:4032) + this window. Studio talks to the bridge, not the API directly.
call "%~dp0..\scripts\run-shell.bat" "Rutba Studio" studio\apps\studio 4231 4032
