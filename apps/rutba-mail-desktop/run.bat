@echo off
REM Rutba Mail - desktop shell. One click: Mail web app (:4021) + bridge (:4031)
REM + this window. Mail talks to the bridge, not the API directly.
call "%~dp0..\scripts\run-shell.bat" "Rutba Mail" content\apps\mail 4021 4031
