# Seguridad

## Controles mínimos
- Aislamiento multi-tenant obligatorio.
- RBAC y autorización por recurso.
- MFA/SSO en planes aplicables.
- Secretos fuera del repositorio.
- CSD y credenciales fiscales cifrados y administrados mediante vault/KMS.
- Evidencias con hash y almacenamiento no sobrescribible cuando aplique.
- Auditoría append-only para acciones sensibles.
- URLs firmadas y temporales para archivos privados.
- Rate limiting, protección contra replay e idempotency keys en APIs de escritura.
- Backups cifrados y pruebas periódicas de restauración.
- Retención documental parametrizable y legal hold.

## Prohibiciones
No confiar en organizationId enviado por frontend; no registrar secretos en logs; no permitir cierre de POD inválido; no borrar evidencia fiscal mediante eliminación ordinaria; no liberar rutas con controles críticos fallidos.
