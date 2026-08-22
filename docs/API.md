# API contract principles

- REST versionada `/api/v1` para integraciones externas.
- organization/tenant se deriva de credencial, nunca se acepta ciegamente del body.
- Idempotency-Key obligatoria para escrituras integrables.
- Correlation ID en toda operación.
- Paginación cursor-based para colecciones grandes.
- Webhooks firmados, reintentables y con delivery log.
- Errores con código estable y mensaje humano.

## Recursos previstos
organizations, customers, orders, shipments, routes, stops, vehicles, drivers, tracking-points, evidence, incidents, returns, fiscal-documents, materiality-files, settlements y webhooks.
