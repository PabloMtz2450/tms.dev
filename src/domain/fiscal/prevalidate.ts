import type { Cfdi40CartaPorteDocument, FiscalIssue, FiscalValidationResult } from './model';

const RFC = /^([A-Z&Ñ]{3,4})\d{6}[A-Z0-9]{3}$/i;
const CP = /^\d{5}$/;
const SAT_CODE = /^\d{8}$/;
const UNIT = /^[A-Z0-9]{2,3}$/i;
const LOCATION_ID = /^(OR|DE)\d{6}$/;
const ID_CCP = /^CCC[0-9A-F]{5}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{12}$/i;
const PLATE = /^[A-Z0-9-]{5,12}$/i;

function issue(code: string, field: string, message: string, source: FiscalIssue['source'] = 'CARTAPORTE31', severity: FiscalIssue['severity'] = 'ERROR'): FiscalIssue {
  return { code, field, message, source, severity };
}

export function prevalidateCfdiCartaPorte(doc: Cfdi40CartaPorteDocument): FiscalValidationResult {
  const issues: FiscalIssue[] = [];

  if (doc.cfdiVersion !== '4.0') issues.push(issue('XCFDI001', 'cfdiVersion', 'TMS XOLUM sólo emite CFDI 4.0.', 'CFDI40'));
  if (doc.cartaPorte.version !== '3.1') issues.push(issue('XCCP001', 'cartaPorte.version', 'La versión vigente implementada es Carta Porte 3.1.'));
  if (!['I', 'T'].includes(doc.type)) issues.push(issue('XCFDI002', 'type', 'Carta Porte debe incorporarse a CFDI tipo Ingreso o Traslado.', 'CFDI40'));
  if (!CP.test(doc.expeditionPostalCode)) issues.push(issue('XCFDI003', 'expeditionPostalCode', 'LugarExpedicion debe ser un código postal de 5 dígitos.', 'CFDI40'));
  if (!RFC.test(doc.issuer.rfc)) issues.push(issue('XCFDI004', 'issuer.rfc', 'RFC del emisor no tiene formato válido.', 'CFDI40'));
  if (!RFC.test(doc.receiver.rfc)) issues.push(issue('XCFDI005', 'receiver.rfc', 'RFC del receptor no tiene formato válido.', 'CFDI40'));
  if (!CP.test(doc.receiver.postalCode)) issues.push(issue('XCFDI006', 'receiver.postalCode', 'DomicilioFiscalReceptor debe contener un CP de 5 dígitos.', 'CFDI40'));
  if (!doc.issuer.fiscalRegime) issues.push(issue('XCFDI007', 'issuer.fiscalRegime', 'RegimenFiscal del emisor es obligatorio.', 'CFDI40'));
  if (!doc.receiver.fiscalRegime) issues.push(issue('XCFDI008', 'receiver.fiscalRegime', 'RegimenFiscalReceptor es obligatorio.', 'CFDI40'));
  if (!doc.receiver.cfdiUse) issues.push(issue('XCFDI009', 'receiver.cfdiUse', 'UsoCFDI es obligatorio.', 'CFDI40'));
  if (!doc.exportCode) issues.push(issue('XCFDI010', 'exportCode', 'Exportacion es obligatorio en CFDI 4.0.', 'CFDI40'));

  if (doc.type === 'T') {
    if (doc.subtotal !== 0 || doc.total !== 0) issues.push(issue('XCFDI011', 'total', 'En CFDI de Traslado SubTotal y Total deben ser 0.', 'CFDI40'));
    if (doc.currency !== 'XXX') issues.push(issue('XCFDI012', 'currency', 'En CFDI de Traslado la moneda debe registrarse como XXX.', 'CFDI40'));
  }
  if (doc.type === 'I' && (doc.subtotal < 0 || doc.total < 0)) issues.push(issue('XCFDI013', 'total', 'Importes de CFDI de Ingreso no pueden ser negativos.', 'CFDI40'));

  const ccp = doc.cartaPorte;
  if (!ID_CCP.test(ccp.idCCP)) issues.push(issue('XCCP002', 'cartaPorte.idCCP', 'IdCCP debe iniciar con CCC y cumplir la estructura UUID establecida por Carta Porte.'));
  if (!['Sí', 'No'].includes(ccp.internationalTransport)) issues.push(issue('XCCP003', 'cartaPorte.internationalTransport', 'TranspInternac debe ser Sí o No.'));
  if (ccp.internationalTransport === 'Sí') {
    if (!ccp.entryExit) issues.push(issue('XCCP004', 'cartaPorte.entryExit', 'EntradaSalidaMerc es obligatorio cuando TranspInternac=Sí.'));
    if (!ccp.countryOriginDestination) issues.push(issue('XCCP005', 'cartaPorte.countryOriginDestination', 'PaisOrigenDestino es obligatorio cuando TranspInternac=Sí.'));
    if (!ccp.transportVia) issues.push(issue('XCCP006', 'cartaPorte.transportVia', 'ViaEntradaSalida es obligatoria cuando TranspInternac=Sí.'));
  }
  if (!(ccp.totalDistanceKm > 0)) issues.push(issue('XCCP007', 'cartaPorte.totalDistanceKm', 'TotalDistRec debe ser mayor a 0 para autotransporte.'));

  const origins = ccp.locations.filter((x) => x.type === 'Origen');
  const destinations = ccp.locations.filter((x) => x.type === 'Destino');
  if (origins.length < 1) issues.push(issue('XCCP008', 'cartaPorte.locations', 'Debe existir al menos una ubicación de Origen.'));
  if (destinations.length < 1) issues.push(issue('XCCP009', 'cartaPorte.locations', 'Debe existir al menos una ubicación de Destino.'));

  const locationIds = new Set<string>();
  for (const [index, location] of ccp.locations.entries()) {
    const p = `cartaPorte.locations[${index}]`;
    if (!LOCATION_ID.test(location.id)) issues.push(issue('XCCP010', `${p}.id`, 'IDUbicacion debe usar OR/DE seguido de 6 dígitos.'));
    if ((location.type === 'Origen' && !location.id.startsWith('OR')) || (location.type === 'Destino' && !location.id.startsWith('DE'))) issues.push(issue('XCCP011', `${p}.id`, 'IDUbicacion no corresponde con TipoUbicacion.'));
    if (locationIds.has(location.id)) issues.push(issue('XCCP012', `${p}.id`, 'IDUbicacion no puede repetirse.'));
    locationIds.add(location.id);
    if (!location.dateTime || Number.isNaN(Date.parse(location.dateTime))) issues.push(issue('XCCP013', `${p}.dateTime`, 'FechaHoraSalidaLlegada debe contener una fecha/hora válida.'));
    if (!CP.test(location.address.postalCode)) issues.push(issue('XCCP014', `${p}.address.postalCode`, 'CodigoPostal de la ubicación debe contener 5 dígitos.'));
    if (!location.address.country) issues.push(issue('XCCP015', `${p}.address.country`, 'Pais de la ubicación es obligatorio.'));
    if (!location.address.state) issues.push(issue('XCCP016', `${p}.address.state`, 'Estado de la ubicación es obligatorio.'));
    if (location.rfc && !RFC.test(location.rfc)) issues.push(issue('XCCP017', `${p}.rfc`, 'RFC del remitente/destinatario tiene formato inválido.'));
    if (location.type === 'Destino' && !(Number(location.distanceKm) > 0)) issues.push(issue('XCCP018', `${p}.distanceKm`, 'DistanciaRecorrida debe ser mayor a 0 en ubicaciones Destino.'));
  }

  if (ccp.merchandise.length < 1) issues.push(issue('XCCP019', 'cartaPorte.merchandise', 'Debe registrarse al menos una mercancía.'));
  let calculatedWeight = 0;
  for (const [index, merch] of ccp.merchandise.entries()) {
    const p = `cartaPorte.merchandise[${index}]`;
    if (!SAT_CODE.test(merch.goodsCode)) issues.push(issue('XCCP020', `${p}.goodsCode`, 'BienesTransp debe contener una clave SAT de 8 dígitos.'));
    if (!merch.description?.trim()) issues.push(issue('XCCP021', `${p}.description`, 'Descripcion de la mercancía es obligatoria.'));
    if (!(merch.quantity > 0)) issues.push(issue('XCCP022', `${p}.quantity`, 'Cantidad debe ser mayor a 0.'));
    if (!UNIT.test(merch.unitCode)) issues.push(issue('XCCP023', `${p}.unitCode`, 'ClaveUnidad no tiene formato válido.'));
    if (!(merch.weightKg > 0)) issues.push(issue('XCCP024', `${p}.weightKg`, 'PesoEnKg debe ser mayor a 0.'));
    calculatedWeight += Math.max(0, merch.weightKg || 0);
    if (merch.hazardous === 'Sí' && !merch.hazardousMaterialCode) issues.push(issue('XCCP025', `${p}.hazardousMaterialCode`, 'MaterialPeligroso requiere CveMaterialPeligroso.'));
    if (merch.hazardous === 'Sí' && !merch.packagingCode) issues.push(issue('XCCP026', `${p}.packagingCode`, 'MaterialPeligroso requiere Embalaje cuando corresponda al catálogo SAT.'));
  }
  if (!(calculatedWeight > 0)) issues.push(issue('XCCP027', 'cartaPorte.merchandise', 'PesoBrutoTotal calculado debe ser mayor a 0.'));

  const road = ccp.roadTransport;
  if (!road.permitType) issues.push(issue('XCCP028', 'cartaPorte.roadTransport.permitType', 'PermSCT es obligatorio para Autotransporte.'));
  if (!road.permitNumber) issues.push(issue('XCCP029', 'cartaPorte.roadTransport.permitNumber', 'NumPermisoSCT es obligatorio.'));
  if (!road.vehicleConfiguration) issues.push(issue('XCCP030', 'cartaPorte.roadTransport.vehicleConfiguration', 'ConfigVehicular es obligatoria.'));
  if (!PLATE.test(road.plate)) issues.push(issue('XCCP031', 'cartaPorte.roadTransport.plate', 'PlacaVM no tiene formato válido.'));
  const currentYear = new Date().getUTCFullYear() + 1;
  if (road.modelYear < 1900 || road.modelYear > currentYear) issues.push(issue('XCCP032', 'cartaPorte.roadTransport.modelYear', 'AnioModeloVM está fuera de rango.'));
  if (!road.civilLiabilityInsurer) issues.push(issue('XCCP033', 'cartaPorte.roadTransport.civilLiabilityInsurer', 'AseguraRespCivil es obligatoria.'));
  if (!road.civilLiabilityPolicy) issues.push(issue('XCCP034', 'cartaPorte.roadTransport.civilLiabilityPolicy', 'PolizaRespCivil es obligatoria.'));
  for (const [index, trailer] of (road.trailers ?? []).entries()) {
    if (!trailer.subtype) issues.push(issue('XCCP035', `cartaPorte.roadTransport.trailers[${index}].subtype`, 'SubTipoRem es obligatorio cuando existe remolque.'));
    if (!PLATE.test(trailer.plate)) issues.push(issue('XCCP036', `cartaPorte.roadTransport.trailers[${index}].plate`, 'Placa del remolque no tiene formato válido.'));
  }

  const operators = ccp.figures.filter((f) => f.figureType === '01');
  if (operators.length < 1) issues.push(issue('XCCP037', 'cartaPorte.figures', 'Autotransporte requiere al menos una figura Operador (TipoFigura=01).'));
  for (const [index, figure] of ccp.figures.entries()) {
    const p = `cartaPorte.figures[${index}]`;
    if (figure.rfc && !RFC.test(figure.rfc)) issues.push(issue('XCCP038', `${p}.rfc`, 'RFC de FiguraTransporte no tiene formato válido.'));
    if (!figure.rfc && !figure.foreignTaxId) issues.push(issue('XCCP039', p, 'FiguraTransporte requiere RFC o NumRegIdTrib extranjero.'));
    if (figure.figureType === '01' && !figure.licenseNumber) issues.push(issue('XCCP040', `${p}.licenseNumber`, 'El Operador requiere NumLicencia.'));
  }

  const firstOrigin = origins[0];
  const firstDestination = destinations[0];
  if (firstOrigin && firstDestination && !Number.isNaN(Date.parse(firstOrigin.dateTime)) && !Number.isNaN(Date.parse(firstDestination.dateTime)) && Date.parse(firstDestination.dateTime) < Date.parse(firstOrigin.dateTime)) {
    issues.push(issue('XCCP041', 'cartaPorte.locations', 'La llegada al destino no puede ser anterior a la salida del origen.'));
  }

  if (!doc.certificateNumber || !doc.certificateBase64) {
    issues.push(issue('XCFDI014', 'certificate', 'Falta CSD: el XML puede prevalidarse pero no está listo para firmarse/timbrarse.', 'XOLUM', 'WARNING'));
  }
  if (!doc.seal) issues.push(issue('XCFDI015', 'seal', 'El CFDI aún no contiene Sello; debe firmarse con el CSD antes del PAC.', 'XOLUM', 'WARNING'));

  const hardErrors = issues.filter((x) => x.severity === 'ERROR');
  const readyForSigning = hardErrors.length === 0 && Boolean(doc.certificateNumber && doc.certificateBase64);
  const readyForPac = readyForSigning && Boolean(doc.seal);
  return { valid: hardErrors.length === 0, readyForSigning, readyForPac, issues, standards: { cfdi: '4.0', cartaPorte: '3.1' } };
}
