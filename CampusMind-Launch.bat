@echo off
setlocal

set "ROOT=%~dp0"
set "BACKEND=%ROOT%backend"
set "FRONTEND=%ROOT%frontend"
set "LOGS=%ROOT%.run-logs"
set "ENV_FILE=%ROOT%.env"
set "ENV_EXAMPLE=%ROOT%.env.example"
set "VENV_PY=%BACKEND%\.venv\Scripts\python.exe"
set "BACKEND_MARKER=%BACKEND%\.venv\.campusmind-installed"

if not exist "%LOGS%" mkdir "%LOGS%"

echo.
echo Starting CampusMind...
echo Project: %ROOT%
echo.

if not exist "%ENV_FILE%" (
  if exist "%ENV_EXAMPLE%" (
    copy "%ENV_EXAMPLE%" "%ENV_FILE%" >nul
    echo Created .env from .env.example
  )
)

where node >nul 2>nul
if errorlevel 1 (
  echo Node.js was not found. Please install Node.js 18+ first.
  pause
  exit /b 1
)

where npm >nul 2>nul
if errorlevel 1 (
  echo npm was not found. Please reinstall Node.js.
  pause
  exit /b 1
)

if not exist "%VENV_PY%" (
  echo Creating backend virtual environment...
  cd /d "%BACKEND%"
  python -m venv .venv
  if errorlevel 1 (
    echo Failed to create Python virtual environment.
    pause
    exit /b 1
  )
)

if not exist "%BACKEND_MARKER%" (
  echo Installing backend dependencies...
  cd /d "%BACKEND%"
  "%VENV_PY%" -m pip install -r requirements.txt
  if errorlevel 1 (
    echo Failed to install backend dependencies.
    pause
    exit /b 1
  )
  type nul > "%BACKEND_MARKER%"
)

if not exist "%FRONTEND%\node_modules" (
  echo Installing frontend dependencies...
  cd /d "%FRONTEND%"
  call npm install
  if errorlevel 1 (
    echo Failed to install frontend dependencies.
    pause
    exit /b 1
  )
)

echo Starting backend on http://127.0.0.1:8000
start "CampusMind Backend" /D "%BACKEND%" cmd.exe /k ".venv\Scripts\python.exe -m uvicorn main:app --host 0.0.0.0 --port 8000"

echo Starting frontend on http://localhost:3000
start "CampusMind Frontend" /D "%FRONTEND%" cmd.exe /k "npm.cmd run dev:host"

timeout /t 5 /nobreak >nul
start "" "http://localhost:3000"

echo.
echo CampusMind is starting.
echo Frontend: http://localhost:3000
echo Backend:  http://127.0.0.1:8000
echo API docs: http://127.0.0.1:8000/docs
echo.
echo You can close this window. Keep the Backend and Frontend windows open while using the app.
pause
