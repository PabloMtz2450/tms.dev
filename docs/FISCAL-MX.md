# Fiscal México

El módulo fiscal debe ser versionado y parametrizable. No se deben fijar reglas fiscales eternas en código.

## Capacidades objetivo
- CFDI 4.0.
- CFDI de Ingreso/Traslado según escenario aplicable.
- Complemento Carta Porte vigente según reglas/catálogos configurados.
- Generación y validación XML antes de timbrado.
- Adapter desacoplado para PAC.
- UUID, IdCCP, QR y representación impresa.
- Cancelación/sustitución y trazabilidad.
- Contingencia, reintentos idempotentes y conciliación de timbrado.
- Catálogos SAT versionados.
- Vinculación documento-viaje-vehículo-operador-mercancía-ubicaciones.

Toda determinación automática debe conservar regla/version/fecha y permitir revisión humana para escenarios ambiguos.
