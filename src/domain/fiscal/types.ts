export type FiscalScenario = {
  ownsGoods: boolean;
  ownsVehicle: boolean;
  receivesTransportPayment: boolean;
  dedicatedTransport: boolean;
  federalJurisdiction: boolean;
  foreignTrade: boolean;
};

export type FiscalRequirement = {
  requiresCfdi: boolean;
  requiresCartaPorte: boolean;
  suggestedType: 'INGRESO' | 'TRASLADO' | 'REVIEW';
  reasons: string[];
};

// El motor final debe parametrizarse con reglas fiscales vigentes y versionadas.
export function preliminaryFiscalAssessment(s: FiscalScenario): FiscalRequirement {
  const reasons: string[] = [];
  if (s.federalJurisdiction) reasons.push('Operación reportada con tránsito en jurisdicción federal.');
  if (s.foreignTrade) reasons.push('Operación vinculada con comercio exterior.');
  if (s.receivesTransportPayment) return { requiresCfdi:true, requiresCartaPorte:s.federalJurisdiction || s.foreignTrade, suggestedType:'INGRESO', reasons };
  if (s.ownsGoods) return { requiresCfdi:true, requiresCartaPorte:s.federalJurisdiction || s.foreignTrade, suggestedType:'TRASLADO', reasons };
  return { requiresCfdi:true, requiresCartaPorte:s.federalJurisdiction || s.foreignTrade, suggestedType:'REVIEW', reasons:[...reasons,'Escenario requiere determinación fiscal adicional.'] };
}
