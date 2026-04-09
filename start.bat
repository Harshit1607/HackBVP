@echo off
title WiFi-DensePose Platform
echo =======================================
echo   Starting WiFi-DensePose Platform
echo =======================================

echo [INFO] Starting Backend...
start /b "WiFi-DensePose Backend" cmd /c "cd backend & (if exist .venv\Scripts\activate.bat (call .venv\Scripts\activate.bat) else if exist venv\Scripts\activate.bat (call venv\Scripts\activate.bat) else (echo [WARN] No virtual environment found.)) & python -m uvicorn api.main:app --reload --port 8001"

:: Brief pause to let backend spin up slightly
timeout /t 2 /nobreak >nul

echo [INFO] Starting Frontend...
start /b "WiFi-DensePose Frontend" cmd /c "cd frontend & npm run dev"

echo.
echo Both services have been launched in the background!
echo Logs will appear in this terminal.
echo.
echo Backend:  http://localhost:8001/docs
echo Frontend: http://localhost:3000
echo =======================================
echo.
echo Press any key to stop the batch (Note: background tasks may need manual termination if not integrated with IDE).
pause
