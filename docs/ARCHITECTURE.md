# Arquitectura TMS.dev

## Principios
1. Multi-tenant desde origen.
2. Modular monolith con eventos; extraer servicios solo por escala real.
3. API-first y reglas configurables.
4. Evidencia inmutable y auditable.
5. Fiscal México desacoplado por proveedor/PAC.
6. Offline-first para operación móvil.

## Dominios
IAM, Organizations, Subscription, Customers, Orders, Shipments, Planning, Routes, Fleet, Drivers, Tracking, POD, Evidence, Materiality, Fiscal, Billing, Settlements, Integrations, Notifications, Rules, Audit, Intelligence y Reporting.

## Flujo maestro
Pedido -> validación -> planeación -> carga -> documento fiscal -> liberación -> ruta -> tracking -> POD -> expediente de materialidad -> facturación/liquidación -> auditoría.

## Reglas críticas
- Nunca confiar en tenant_id recibido del cliente sin validarlo contra sesión.
- Una entrega no se cierra sin política de evidencia o excepción autorizada.
- Un viaje sujeto a requisitos fiscales no se libera con documento inválido.
- Evidencias se almacenan con hash SHA-256 y metadatos de captura.
- Cambios sensibles generan eventos de auditoría append-only.
- FiscalDocument no asume un PAC específico.
