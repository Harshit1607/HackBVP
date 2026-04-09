# WiFi-DensePose / RuView Start Script
# This script starts both the Python backend and the Next.js frontend.

Write-Host "Starting WiFi-DensePose Platform..." -ForegroundColor Cyan

# 1. Start Backend in a new window
Write-Host "[1/2] Starting Backend at http://localhost:8001" -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd backend; python -m uvicorn api.main:app --reload --port 8001"

# 2. Start Frontend in a new window
Write-Host "[2/2] Starting Frontend at http://localhost:3000" -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd frontend; npm run dev"

Write-Host "Both services are starting. Please wait for the windows to initialize." -ForegroundColor Green
Write-Host "Backend API: http://localhost:8001/docs"
Write-Host "Frontend Dashboard: http://localhost:3000"
