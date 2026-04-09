@echo off
SETLOCAL EnableDelayedExpansion

:: --- CONFIGURATION ---
set FRONTEND_DIR=frontend
set ENV_FILE=%FRONTEND_DIR%\.env.local

:: --- UI HEADER ---
cls
echo.
echo  ##########################################################
echo  #                                                        #
echo  #    RUVIEW : TACTICAL BIOMETRIC OBSERVATORY v4.0        #
echo  #    --------------------------------------------        #
echo  #    [ MISSION-CRITICAL FRONTEND LAUNCHER ]              #
echo  #                                                        #
echo  ##########################################################
echo.

:: --- DIRECTORY CHECK ---
if not exist "%FRONTEND_DIR%" (
    echo [ ERROR ] CANNOT LOCATE %FRONTEND_DIR% DIRECTORY.
    echo [ ACTION ] PLEASE ENSURE YOU ARE IN THE PROJECT ROOT.
    pause
    exit /b
)

:: --- ENVIRONMENT SETUP ---
echo [ SYS ] CONFIGURING LOCAL ENVIRONMENT...
echo.
echo # RuView Local Config > "%ENV_FILE%"
echo NEXT_PUBLIC_USE_MOCK=true >> "%ENV_FILE%"
echo NEXT_PUBLIC_WS_URL=ws://localhost:8000/ws/sensing >> "%ENV_FILE%"
echo NEXT_PUBLIC_API_URL=http://localhost:8000 >> "%ENV_FILE%"

echo [ OK  ] MOCK_MODE ENABLED (BYPASSING BACKEND PORT 8000)
echo [ OK  ] %ENV_FILE% GENERATED
echo.

:: --- NODE_MODULES CHECK ---
if not exist "%FRONTEND_DIR%\node_modules" (
    echo [ INFO ] NODE_MODULES NOT FOUND. INITIALIZING NPM INSTALL...
    cd %FRONTEND_DIR%
    call npm install
    cd ..
)

:: --- LAUNCH ---
echo [ SYS ] COMMENCING FRONTEND DEPLOYMENT...
echo [ SYS ] STATUS: LINKING TO CLIENT INTERFACE...
echo.
cd %FRONTEND_DIR%
npm run dev

:: --- CLEANUP ---
pause
