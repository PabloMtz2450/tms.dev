import { validTrasladoCartaPorte31 } from './fixtures';
import { validateFiscalDocument } from './validate';
import { generateCfdi40CartaPorte31Xml } from './xml';

export type FiscalSelfTestResult = { ok:true; rulesChecked:number; xmlBytes:number; negativeControls:number };

export function runFiscalSelfTest(): FiscalSelfTestResult {
  const positive = validateFiscalDocument(validTrasladoCartaPorte31);
  const positiveErrors = positive.issues.filter(i=>i.severity==='ERROR');
  if (positiveErrors.length) throw new Error(`Fiscal self-test: fixture válida rechazada: ${positiveErrors.map(x=>x.code).join(',')}`);
  const xml = generateCfdi40CartaPorte31Xml(validTrasladoCartaPorte31);
  for (const token of ['Version="4.0"','TipoDeComprobante="T"','Moneda="XXX"','<cartaporte31:CartaPorte Version="3.1"','IdCCP="CCC12345-1234-1234-1234-123456789ABC"','<cartaporte31:Autotransporte','<cartaporte31:TiposFigura']) {
    if (!xml.includes(token)) throw new Error(`Fiscal self-test: XML incompleto, falta ${token}`);
  }
  const invalidTotal = { ...validTrasladoCartaPorte31, total: 1 };
  const badTotal = validateFiscalDocument(invalidTotal);
  if (!badTotal.issues.some(i=>i.code==='XCFDI011')) throw new Error('Fiscal self-test: CFDI Traslado con Total distinto de cero no fue bloqueado.');
  const invalidCcp = { ...validTrasladoCartaPorte31, cartaPorte:{ ...validTrasladoCartaPorte31.cartaPorte, idCCP:'INVALIDO' } };
  if (!validateFiscalDocument(invalidCcp).issues.some(i=>i.code==='XCCP002')) throw new Error('Fiscal self-test: IdCCP inválido no fue bloqueado.');
  const invalidPodWeight = { ...validTrasladoCartaPorte31, cartaPorte:{ ...validTrasladoCartaPorte31.cartaPorte, merchandise:[{...validTrasladoCartaPorte31.cartaPorte.merchandise[0], weightKg:0}] } };
  if (!validateFiscalDocument(invalidPodWeight).issues.some(i=>i.code==='XCCP024')) throw new Error('Fiscal self-test: mercancía sin peso no fue bloqueada.');
  return { ok:true, rulesChecked: positive.issues.length + 43, xmlBytes:new TextEncoder().encode(xml).length, negativeControls:3 };
}
