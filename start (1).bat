@echo off
title Job Search Assistant
echo.
echo  ====================================
echo   Job Search Assistant - Starting...
echo  ====================================
echo.

cd /d "%~dp0"

echo Starting backend...
cd backend
start "Backend" cmd /k "node server.js"
cd ..

echo Waiting for backend...
timeout /t 3 /nobreak >nul

echo Starting frontend...
cd frontend
start "Frontend" cmd /k "npx vite --port 3000"
cd ..

timeout /t 4 /nobreak >nul

echo Opening dashboard...
start http://localhost:3000

echo.
echo  ====================================
echo   Dashboard: http://localhost:3000
echo   Backend:   http://localhost:8000
echo  ====================================
echo.
echo  Close the two terminal windows to stop.
echo.
pause
