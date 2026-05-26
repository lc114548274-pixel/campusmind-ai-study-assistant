$ErrorActionPreference = "Stop"

$Root = Split-Path -Parent $MyInvocation.MyCommand.Path
$Backend = Join-Path $Root "backend"
$Frontend = Join-Path $Root "frontend"
$EnvFile = Join-Path $Root ".env"
$EnvExample = Join-Path $Root ".env.example"
$VenvPython = Join-Path $Backend ".venv\Scripts\python.exe"
$BackendMarker = Join-Path $Backend ".venv\.campusmind-installed"

Write-Host ""
Write-Host "CampusMind 本地一键启动" -ForegroundColor Cyan
Write-Host "项目目录: $Root"

if (-not (Test-Path $EnvFile)) 
{
  Copy-Item $EnvExample $EnvFile
  Write-Host "已创建 .env。需要真实在线 AI 时，请在 .env 中填写 OPENAI_API_KEY。" -ForegroundColor Yellow
}

if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
  throw "未检测到 Node.js。请先安装 Node.js 18+。"
}

if (-not (Get-Command npm -ErrorAction SilentlyContinue)) {
  throw "未检测到 npm。请确认 Node.js 安装完整。"
}

if (-not (Test-Path $VenvPython)) {
  Write-Host "正在创建后端 Python 虚拟环境..." -ForegroundColor Yellow
  Push-Location $Backend
  python -m venv .venv
  Pop-Location
}

if (-not (Test-Path $BackendMarker)) {
  Write-Host "正在安装后端依赖..." -ForegroundColor Yellow
  Push-Location $Backend
  & $VenvPython -m pip install -r requirements.txt
  New-Item -ItemType File -Path $BackendMarker -Force | Out-Null
  Pop-Location
}

if (-not (Test-Path (Join-Path $Frontend "node_modules"))) {
  Write-Host "正在安装前端依赖..." -ForegroundColor Yellow
  Push-Location $Frontend
  npm install
  Pop-Location
}

Write-Host "正在启动后端: http://127.0.0.1:8000" -ForegroundColor Green
Start-Process powershell -ArgumentList @(
  "-NoExit",
  "-Command",
  "cd `"$Backend`"; .\.venv\Scripts\activate; uvicorn main:app --reload --host 0.0.0.0 --port 8000"
)

Write-Host "正在启动前端: http://localhost:3000" -ForegroundColor Green
Start-Process powershell -ArgumentList @(
  "-NoExit",
  "-Command",
  "cd `"$Frontend`"; npm run dev:host"
)

Start-Sleep -Seconds 3
Start-Process "http://localhost:3000"

Write-Host ""
Write-Host "启动完成。" -ForegroundColor Cyan
Write-Host "前端: http://localhost:3000"
Write-Host "后端: http://127.0.0.1:8000"
Write-Host "API 文档: http://127.0.0.1:8000/docs"
Write-Host ""
Write-Host "提示: 如果是第一次启动，前后端可能还需要几十秒完成编译。" -ForegroundColor Yellow
