$ErrorActionPreference = "Stop"

$Root = Split-Path -Parent $MyInvocation.MyCommand.Path
$Backend = Join-Path $Root "backend"
$Frontend = Join-Path $Root "frontend"
$Logs = Join-Path $Root ".run-logs"
$BackendRunner = Join-Path $Logs "run-backend.ps1"
$FrontendRunner = Join-Path $Logs "run-frontend.ps1"
$VenvPython312 = Join-Path $Backend ".venv312\Scripts\python.exe"

if (-not (Test-Path $Logs)) {
  New-Item -ItemType Directory -Path $Logs -Force | Out-Null
}

Write-Host ""
Write-Host "Starting CampusMind..." -ForegroundColor Cyan
Write-Host "Project: $Root"

if (-not (Test-Path $VenvPython312)) {
  Write-Host "Missing backend runtime: $VenvPython312" -ForegroundColor Red
  Write-Host "Please create/install .venv312 first." -ForegroundColor Yellow
  Read-Host "Press Enter to close"
  exit 1
}

if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
  Write-Host "Node.js was not found. Please install Node.js 18+ first." -ForegroundColor Red
  Read-Host "Press Enter to close"
  exit 1
}

if (-not (Get-Command npm.cmd -ErrorAction SilentlyContinue)) {
  Write-Host "npm.cmd was not found. Please reinstall Node.js." -ForegroundColor Red
  Read-Host "Press Enter to close"
  exit 1
}

Write-Host "Opening backend window..." -ForegroundColor Green
Start-Process -FilePath "powershell.exe" -ArgumentList "-NoExit -ExecutionPolicy Bypass -File `"$BackendRunner`"" -WindowStyle Normal

Start-Sleep -Seconds 2

Write-Host "Opening frontend window..." -ForegroundColor Green
Start-Process -FilePath "powershell.exe" -ArgumentList "-NoExit -ExecutionPolicy Bypass -File `"$FrontendRunner`"" -WindowStyle Normal

Start-Sleep -Seconds 5
Start-Process "http://localhost:3000"

Write-Host ""
Write-Host "CampusMind is starting." -ForegroundColor Cyan
Write-Host "Frontend: http://localhost:3000"
Write-Host "Backend:  http://127.0.0.1:8000"
Write-Host "API docs: http://127.0.0.1:8000/docs"
Write-Host ""
Write-Host "Keep the Backend and Frontend windows open while using the app."
