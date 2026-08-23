$ErrorActionPreference = 'Stop'

Write-Host "`n=== TMS XOLUM · CONFIGURACION LOCAL ===" -ForegroundColor Cyan

$repoRoot = Split-Path -Parent $PSScriptRoot
Set-Location $repoRoot

if (-not (Get-Command node -ErrorAction SilentlyContinue)) { throw 'Node.js no esta instalado o no esta en PATH.' }
if (-not (Get-Command npm -ErrorAction SilentlyContinue)) { throw 'npm no esta disponible en PATH.' }
if (-not (Get-Command docker -ErrorAction SilentlyContinue)) { throw 'Docker Desktop no esta instalado o no esta iniciado.' }

if (-not (Test-Path '.env')) {
  Copy-Item '.env.example' '.env'
  Write-Host 'Creado .env desde .env.example' -ForegroundColor Green
} else {
  Write-Host '.env ya existe; no se sobreescribe.' -ForegroundColor Yellow
}

Write-Host 'Levantando PostgreSQL/PostGIS...' -ForegroundColor Cyan
docker compose up -d postgres

Write-Host 'Esperando PostgreSQL...' -ForegroundColor Cyan
$ready = $false
for ($i = 0; $i -lt 30; $i++) {
  docker compose exec -T postgres pg_isready -U postgres -d tms_dev *> $null
  if ($LASTEXITCODE -eq 0) { $ready = $true; break }
  Start-Sleep -Seconds 2
}
if (-not $ready) { throw 'PostgreSQL no respondio a tiempo. Revisa Docker Desktop.' }

Write-Host 'Instalando dependencias...' -ForegroundColor Cyan
npm install
if ($LASTEXITCODE -ne 0) { throw 'npm install fallo.' }

Write-Host 'Generando Prisma Client...' -ForegroundColor Cyan
npm run db:generate
if ($LASTEXITCODE -ne 0) { throw 'Prisma generate fallo.' }

Write-Host 'Aplicando migraciones...' -ForegroundColor Cyan
npm run db:migrate
if ($LASTEXITCODE -ne 0) { throw 'Prisma migrate deploy fallo.' }

Write-Host 'Cargando datos demo...' -ForegroundColor Cyan
npm run db:seed:local
if ($LASTEXITCODE -ne 0) { throw 'El seed local fallo.' }

Write-Host "`n=== LISTO ===" -ForegroundColor Green
Write-Host 'Base: PostgreSQL local / tms_dev'
Write-Host 'URL:  http://localhost:3000'
Write-Host 'Usuario recomendado: admin@demo.xolum.mx'
Write-Host 'Password demo:      XolumDemo2026!'
Write-Host "`nPara iniciar la aplicacion:" -ForegroundColor Yellow
Write-Host 'npm run dev'
