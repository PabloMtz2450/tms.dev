import type { Cfdi40CartaPorteDocument, FiscalIssue } from './model';

const SAT_CODE = /^\d{8}$/;
const UNIT = /^[A-Z0-9]{2,3}$/i;
const SAT_RFC = /^[A-Z&Ñ]{3,4}[0-9]{2}(0[1-9]|1[0-2])(0[1-9]|[12][0-9]|3[01])[A-Z0-9]{2}[0-9A]$/i;
const add = (code:string, field:string, message:string, source: FiscalIssue['source']='CFDI40'): FiscalIssue => ({ code, field, message, source, severity:'ERROR' });

export function validateCrossFieldMatrix(doc: Cfdi40CartaPorteDocument): FiscalIssue[] {
  const out: FiscalIssue[] = [];
  if (!doc.issueDate || Number.isNaN(Date.parse(doc.issueDate))) out.push(add('XCFDI100','issueDate','Fecha del comprobante debe ser una fecha/hora válida.'));
  if (!SAT_RFC.test(doc.issuer.rfc)) out.push(add('XCFDI109','issuer.rfc','RFC del emisor no cumple el patrón SAT CFDI 4.0.'));
  if (!SAT_RFC.test(doc.receiver.rfc) && doc.receiver.rfc !== 'XAXX010101000' && doc.receiver.rfc !== 'XEXX010101000') out.push(add('XCFDI110','receiver.rfc','RFC del receptor no cumple el patrón SAT CFDI 4.0.'));
  if (doc.type === 'I') {
    const c = doc.transportService;
    if (!c) out.push(add('XCFDI101','transportService','CFDI de Ingreso con Carta Porte requiere el concepto del servicio de transporte.'));
    else {
      if (!SAT_CODE.test(c.productServiceCode)) out.push(add('XCFDI102','transportService.productServiceCode','ClaveProdServ debe contener 8 dígitos.'));
      if (!(c.quantity > 0)) out.push(add('XCFDI103','transportService.quantity','Cantidad del servicio debe ser mayor a 0.'));
      if (!UNIT.test(c.unitCode)) out.push(add('XCFDI104','transportService.unitCode','ClaveUnidad del servicio no tiene formato válido.'));
      if (!c.description.trim()) out.push(add('XCFDI105','transportService.description','Descripción del servicio es obligatoria.'));
      if (c.unitValue < 0 || c.amount < 0) out.push(add('XCFDI106','transportService.amount','ValorUnitario e Importe no pueden ser negativos.'));
      if (Math.abs(c.amount - doc.subtotal) > 0.01) out.push(add('XCFDI107','subtotal','SubTotal debe cuadrar con el importe del concepto del servicio.'));
      if (doc.currency === 'XXX') out.push(add('XCFDI108','currency','CFDI de Ingreso no debe usar XXX como moneda del servicio.'));
    }
  }
  for (const [i,loc] of doc.cartaPorte.locations.entries()) if (loc.rfc && !SAT_RFC.test(loc.rfc) && loc.rfc !== 'XAXX010101000' && loc.rfc !== 'XEXX010101000') out.push(add('XCCP103',`cartaPorte.locations[${i}].rfc`,'RFC de la ubicación no cumple el patrón SAT.','CARTAPORTE31'));
  for (const [i,fig] of doc.cartaPorte.figures.entries()) if (fig.rfc && !SAT_RFC.test(fig.rfc)) out.push(add('XCCP104',`cartaPorte.figures[${i}].rfc`,'RFCFigura no cumple el patrón SAT.','CARTAPORTE31'));
  const road = doc.cartaPorte.roadTransport;
  if (!(Number(road.grossVehicleWeightKg) > 0)) out.push(add('XCCP100','cartaPorte.roadTransport.grossVehicleWeightKg','PesoBrutoVehicular debe ser mayor a 0 y corresponder a la configuración vehicular.','CARTAPORTE31'));
  const destinationDistance = doc.cartaPorte.locations.filter(x=>x.type==='Destino').reduce((s,x)=>s+(x.distanceKm ?? 0),0);
  if (destinationDistance > 0 && Math.abs(destinationDistance - doc.cartaPorte.totalDistanceKm) > 1) out.push(add('XCCP101','cartaPorte.totalDistanceKm','TotalDistRec no cuadra con la suma de DistanciaRecorrida de destinos (tolerancia 1 km).','CARTAPORTE31'));
  const hasForeignGoods = doc.cartaPorte.merchandise.some(m=>Boolean(m.uuidForeignTrade || m.tariffFraction));
  if (hasForeignGoods && doc.cartaPorte.internationalTransport !== 'Sí') out.push(add('XCCP102','cartaPorte.internationalTransport','Se detectaron datos de comercio exterior; revisar TranspInternac y datos aduaneros.','CARTAPORTE31'));
  return out;
}
