@echo off
REM Rutba Studio - desktop shell. One click: Social/Studio web app (:4011) +
REM bridge (:4032) + this window. Studio talks to the bridge, not the API.
call "%~dp0..\scripts\run-shell.bat" "Rutba Studio" content\apps\social 4011 4032
