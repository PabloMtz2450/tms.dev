# TMS.dev

**Logistics Operating System para México.**

TMS.dev se está construyendo como SaaS multiempresa para administrar el ciclo completo de distribución: pedido, validación, planeación, carga, cumplimiento fiscal, ejecución de última milla, tracking, POD, materialidad, liquidación y liberación financiera.

## Núcleo actual
- Next.js + TypeScript.
- PostgreSQL/PostGIS + Prisma.
- Modelo multi-tenant.
- Clientes, embarques, rutas, paradas, vehículos y operadores.
- Políticas de liberación de rutas.
- POD configurable y excepciones autorizadas.
- Integridad SHA-256 y base de auditoría encadenada.
- Dominio fiscal MX preparado para CFDI/Carta Porte mediante reglas versionadas y adapter de PAC.
- Expediente/testigos de materialidad.
- Tracking y detección inicial de anomalías.
- Logística inversa e incidencias.
- Cadena de custodia.
- Costos/liquidaciones y Revenue at Risk.
- API/webhooks e idempotencia offline.
- Docker local y CI inicial.

## Documentación
Consulta `docs/ARCHITECTURE.md`, `docs/PRODUCT-SCOPE.md`, `docs/FISCAL-MX.md`, `docs/SECURITY.md`, `docs/API.md`, `docs/ROADMAP.md` y `docs/THREE-PASS-REVIEW.md`.

## Estado
Construcción activa. Todavía no es software listo para producción. Los pendientes deliberados están documentados y no se presentan como capacidades terminadas.
