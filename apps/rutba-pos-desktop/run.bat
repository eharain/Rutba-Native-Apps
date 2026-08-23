@echo off
REM Rutba POS - desktop shell. One click: POS web app (:4002) + bridge (:4030)
REM + this window. The POS talks to the bridge, not the API directly.
call "%~dp0..\scripts\run-shell.bat" "Rutba POS" sales\apps\pos 4002 4030
