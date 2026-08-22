@echo off
setlocal
cd /d "%~dp0"
echo.
echo ==============================================
echo        TMS XOLUM - INICIO LOCAL
echo ==============================================
echo.
where node >nul 2>&1 || (
  echo [ERROR] Node.js no esta instalado o no esta en PATH.
  echo Instala Node.js LTS y vuelve a ejecutar este archivo.
  pause
  exit /b 1
)
where npm >nul 2>&1 || (
  echo [ERROR] npm no esta disponible.
  pause
  exit /b 1
)
if not exist node_modules (
  echo Instalando dependencias por primera vez...
  call npm install || goto :error
)
echo Preparando Prisma...
call npm run db:generate || goto :error
echo.
echo TMS XOLUM se abrira en http://localhost:3000
start "" http://localhost:3000
echo.
call npm run dev
exit /b 0
:error
echo.
echo [ERROR] No se pudo iniciar TMS XOLUM. Revisa el mensaje anterior.
pause
exit /b 1
