import type { Cfdi40CartaPorteDocument, FiscalValidationResult } from './model';
import { prevalidateCfdiCartaPorte } from './prevalidate';
import { validateCrossFieldMatrix } from './matrix';

export function validateFiscalDocument(doc: Cfdi40CartaPorteDocument): FiscalValidationResult {
  const base = prevalidateCfdiCartaPorte(doc);
  const matrix = validateCrossFieldMatrix(doc);
  const issues = [...base.issues, ...matrix];
  const hardErrors = issues.filter(i => i.severity === 'ERROR');
  const readyForSigning = hardErrors.length === 0 && Boolean(doc.certificateNumber && doc.certificateBase64);
  const readyForPac = readyForSigning && Boolean(doc.seal);
  return { ...base, valid: hardErrors.length === 0, readyForSigning, readyForPac, issues };
}
