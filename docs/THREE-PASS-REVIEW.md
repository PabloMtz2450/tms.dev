# Revisión de diseño en tres pasadas

## 1. Cobertura funcional
Se cubre ciclo pedido-a-entrega: captura, validación, planeación, carga, ruta, tracking, POD, incidencias, devoluciones, fiscal y cierre.

## 2. Riesgos y omisiones
Añadidos: offline/idempotencia, cambios de vehículo/operador, 3PL, documentos vencidos, parciales/rechazos, logística inversa, contingencia fiscal, reglas configurables, aislamiento tenant y evidencia con integridad.

## 3. Diferenciación y cierre
Añadidos: expediente de materialidad, Trust Score, detección de anomalías, Revenue at Risk, API/webhooks, auditoría encadenada, determinación fiscal versionada y políticas de liberación.

## Pendientes deliberados antes de producción
Motor real de optimización; autenticación; migraciones PostgreSQL/PostGIS; almacenamiento de objetos; proveedor de mapas/geocoding; PAC real; catálogos fiscales vigentes; PWA móvil; colas/event bus; observabilidad; pruebas automáticas; CI/CD; threat model y pruebas de recuperación.

Ninguno de esos pendientes debe fingirse como terminado: son las siguientes fases de implementación.
