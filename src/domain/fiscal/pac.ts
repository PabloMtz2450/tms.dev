import type { Cfdi40CartaPorteDocument } from './model';
import { validateFiscalDocument } from './validate';
import { generateCfdi40CartaPorte31Xml } from './xml';
import type { SatXsdValidator } from './xsd';

export type SignResult = { xml: string; seal: string; certificateNumber: string; certificateBase64: string };
export interface CfdiSigner { sign(unsignedXml: string, document: Cfdi40CartaPorteDocument): Promise<SignResult>; }
export type PacStampResult = { uuid: string; stampedXml: string; stampedAt: string; pacRfc?: string };
export interface PacAdapter { stamp(signedXml: string): Promise<PacStampResult>; }

export class FiscalStampingBlockedError extends Error {
  constructor(public details: unknown){ super('Timbrado bloqueado por validación fiscal.'); }
}

export async function prepareAndStampCartaPorte(input: Cfdi40CartaPorteDocument, deps: { signer: CfdiSigner; xsd: SatXsdValidator; pac: PacAdapter }): Promise<PacStampResult> {
  const initial = validateFiscalDocument(input);
  const hard = initial.issues.filter(i=>i.severity==='ERROR');
  if (hard.length) throw new FiscalStampingBlockedError({ stage:'MATRIX', issues:hard });

  // Genera XML sin inventar sello/certificado. El firmador CSD es responsable de insertar los datos criptográficos reales.
  const unsignedXml = generateCfdi40CartaPorte31Xml(input);
  const signed = await deps.signer.sign(unsignedXml, input);
  const signedDoc: Cfdi40CartaPorteDocument = { ...input, seal:signed.seal, certificateNumber:signed.certificateNumber, certificateBase64:signed.certificateBase64 };
  const afterSign = validateFiscalDocument(signedDoc);
  if (!afterSign.readyForPac) throw new FiscalStampingBlockedError({ stage:'SIGNATURE', issues:afterSign.issues });

  const xsdResult = await deps.xsd.validate(signed.xml);
  if (!xsdResult.valid) throw new FiscalStampingBlockedError({ stage:'XSD', issues:xsdResult.messages });

  return deps.pac.stamp(signed.xml);
}
