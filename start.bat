@echo off
title Job Search Assistant
echo.
echo  ====================================
echo   Job Search Assistant - Starting...
echo  ====================================
echo.

:: Get the directory where this script lives
cd /d "%~dp0"

:: Start backend
echo Starting backend...
cd backend
start "Backend" cmd /k "npm start"
cd ..

:: Wait for backend to be ready
echo Waiting for backend to start...
timeout /t 3 /nobreak >nul

:: Start frontend
echo Starting frontend...
cd frontend
start "Frontend" cmd /k "npm run dev"
cd ..

:: Wait for frontend to be ready
timeout /t 4 /nobreak >nul

:: Open browser
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
