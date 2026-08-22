# Integración PAC Finkok — TMS XOLUM

## Decisión de integración

TMS XOLUM usa `stamp` como método principal de timbrado porque el flujo fiscal propio genera, valida y firma el CFDI antes de enviarlo al PAC. `sign_stamp` queda como alternativa operativa si se decide registrar los CSD del emisor dentro de Finkok para que el PAC selle y timbre.

## Endpoints oficiales

Timbrado Demo:
`https://demo-facturacion.finkok.com/servicios/soap/stamp.wsdl`

Timbrado Producción:
`https://facturacion.finkok.com/servicios/soap/stamp.wsdl`

Cancelación Demo:
`https://demo-facturacion.finkok.com/servicios/soap/cancel.wsdl`

Cancelación Producción:
`https://facturacion.finkok.com/servicios/soap/cancel.wsdl`

Documentación:
- https://wiki.finkok.com/home/webservices/ws_timbrado
- https://wiki.finkok.com/home/webservices/ws_timbrado/Sign_stamp
- https://wiki.finkok.com/home/webservices/ws_cancelacion
- https://wiki.finkok.com/home/complementos-cfdi
- https://wiki.finkok.com/home/certificados

## Reglas Finkok implementadas

- XML enviado en Base64 dentro de SOAP.
- Separación estricta Demo / Producción.
- Límite preventivo menor a 1 MB por XML.
- Credenciales fuera del repositorio mediante variables de entorno.
- Lectura de `CodEstatus`, UUID, XML timbrado, fecha, sello SAT y certificado SAT.
- Lectura de incidencias: `CodigoError`, `MensajeIncidencia`, `ExtraInfo`, `WorkProcessId` y fecha.
- El éxito se determina principalmente por `CodEstatus = Comprobante timbrado satisfactoriamente` más UUID/XML, no sólo por ausencia de incidencias.
- Timeout de red configurable.
- Errores SOAP se convierten a error de integración.
- El adaptador Finkok implementa el contrato `PacAdapter` del motor fiscal y sólo recibe XML que ya pasó matriz fiscal, firma y XSD SAT.

## Errores Finkok considerados explícitamente

- 300: usuario o contraseña inválidos.
- 301: XML mal formado.
- 702: RFC emisor no registrado en la cuenta Finkok.
- 703: cuenta suspendida.
- 705: estructura XML inválida / Base64 incorrecto / cabeceras incorrectas.
- 307: CFDI con timbre previo; debe tratarse como caso de recuperación/consulta y no volver a emitir indiscriminadamente.

## Carta Porte

Finkok declara soporte para Carta Porte 3.1 en Demo y Producción, además de validación propia. TMS XOLUM mantiene su validación previa contra CFDI 4.0 + Carta Porte 3.1 y XSD oficiales SAT antes de enviar al PAC.

## Variables de entorno

```env
FINKOK_ENV=demo
FINKOK_USERNAME=
FINKOK_PASSWORD=
FINKOK_TIMEOUT_MS=30000
```

Nunca almacenar usuario, contraseña, CSD o llave privada en GitHub.

## Prueba de integración requerida antes de producción

1. Crear/usar cuenta Demo Finkok.
2. Registrar un RFC emisor de pruebas en el panel Demo o mediante el servicio de registro.
3. Usar CSD de prueba publicado por Finkok; la contraseña documentada para sus llaves de prueba es `12345678a`.
4. Timbrar CFDI 4.0 tipo Traslado + Carta Porte 3.1 válido.
5. Verificar `CodEstatus`, UUID y XML con TimbreFiscalDigital.
6. Repetir intencionalmente con XML inválido para comprobar que TMS XOLUM muestra el error Finkok sin marcar el documento como timbrado.
7. Reenviar un XML ya timbrado para probar tratamiento del caso de timbre previo/recuperación.
8. Probar RFC no registrado para validar manejo del 702.
9. Probar credenciales incorrectas para validar 300 sin exponer contraseña en logs.
10. Probar cancelación en Demo. Finkok indica esperar aproximadamente 2–5 minutos después del timbrado antes de solicitarla.
11. Guardar XML timbrado, UUID, fecha, sello SAT, NoCertificadoSAT y trazabilidad del WorkProcessId.
12. Sólo después de aprobar el corpus Demo cambiar `FINKOK_ENV=production` con credenciales productivas en el gestor seguro del entorno.

## Criterio de salida a producción

No se considera terminada la integración sólo porque el WSDL responda. Se requiere al menos un timbrado Demo exitoso de Traslado + Carta Porte 3.1, un rechazo controlado, recuperación de un CFDI previamente timbrado y una cancelación Demo completa.
