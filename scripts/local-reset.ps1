$ErrorActionPreference = 'Stop'

Write-Host "`n=== TMS XOLUM · RESET LOCAL ===" -ForegroundColor Yellow
$repoRoot = Split-Path -Parent $PSScriptRoot
Set-Location $repoRoot

if (-not (Get-Command docker -ErrorAction SilentlyContinue)) { throw 'Docker Desktop no esta disponible.' }
if (-not (Test-Path '.env')) { Copy-Item '.env.example' '.env' }

Write-Host 'Eliminando exclusivamente el volumen LOCAL tms_pg...' -ForegroundColor Yellow
docker compose down -v
if ($LASTEXITCODE -ne 0) { throw 'No se pudo bajar el stack local.' }

docker compose up -d postgres
$ready = $false
for ($i = 0; $i -lt 30; $i++) {
  docker compose exec -T postgres pg_isready -U postgres -d tms_dev *> $null
  if ($LASTEXITCODE -eq 0) { $ready = $true; break }
  Start-Sleep -Seconds 2
}
if (-not $ready) { throw 'PostgreSQL no respondio a tiempo.' }

npm install
npm run db:generate
npm run db:migrate
npm run db:seed:local

Write-Host "`nBase local recreada y cargada con datos demo." -ForegroundColor Green
Write-Host 'Ejecuta: npm run dev'
