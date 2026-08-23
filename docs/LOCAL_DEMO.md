# TMS XOLUM · entorno local demo

Este entorno utiliza exclusivamente datos ficticios. No contiene clientes, operadores, placas, credenciales fiscales ni CSD reales.

## Requisitos Windows

- Node.js 22+
- npm
- Docker Desktop iniciado
- PowerShell

## Primera ejecución

Desde la raíz del repositorio en la rama `ui/v0-dashboard`:

```powershell
npm run local:setup
npm run dev
```

Abrir: http://localhost:3000

`local:setup` crea `.env` únicamente si no existe, levanta PostgreSQL/PostGIS, instala dependencias, genera Prisma, aplica migraciones y carga datos demo.

## Reiniciar completamente la base demo

```powershell
npm run local:reset
npm run dev
```

`local:reset` elimina únicamente el volumen Docker del stack local definido por este proyecto y reconstruye la base demo.

## Organización demo principal

- Nombre: XOLUM Demo Logistics
- Slug: `xolum-demo-logistics`
- Contraseña común de usuarios demo: `XolumDemo2026!`

## Usuarios demo

| Usuario | Rol |
|---|---|
| admin@demo.xolum.mx | Administrador del contratante |
| logistica@demo.xolum.mx | Responsable de logística |
| torre@demo.xolum.mx | Torre de Control |
| planeador@demo.xolum.mx | Planificador |
| seguridad@demo.xolum.mx | Seguridad / Monitorista |
| finanzas@demo.xolum.mx | Finanzas / Fiscal |
| auditor@demo.xolum.mx | Auditor |
| operador1@demo.xolum.mx | Operador |
| operador2@demo.xolum.mx | Operador |
| cliente@demo.xolum.mx | Cliente contratante |

Existe una segunda organización ficticia (`Norte Demo Transportes`) para validar aislamiento multitenant. Sus datos nunca deben ser visibles desde usuarios de XOLUM Demo Logistics.

## Datos cargados

- 2 organizaciones
- 11 usuarios con roles diferentes
- 8 clientes
- 5 vehículos
- 5 operadores
- 12 embarques/entregas
- 5 rutas
- 9 paradas con direcciones ficticias/verosímiles de prueba
- Estados operativos mezclados: READY, PLANNED, LOADED, IN_TRANSIT, DELIVERED, PARTIAL y REJECTED

## Seguridad

El seed se bloquea si `APP_ENV=production` o `NODE_ENV=production`. Las credenciales demo no deben reutilizarse fuera del entorno local.
