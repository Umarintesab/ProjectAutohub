@echo off
title AutoHub Launcher
color 0A
echo.
echo  ================================
echo        AUTOHUB is Starting...
echo  ================================
echo.
echo  Starting Backend Server...
start cmd /k "title AutoHub Backend && cd /d %~dp0backend && node server.js"
timeout /t 3 /nobreak > nul
echo  Starting Frontend...
start cmd /k "title AutoHub Frontend && cd /d %~dp0frontend && npm start"
echo.
echo  ================================
echo   Both servers are starting!
echo   Frontend: http://localhost:3000
echo   Backend:  http://localhost:5000
echo  ================================
echo.
pause