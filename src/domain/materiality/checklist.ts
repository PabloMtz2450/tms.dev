export const MATERIALITY_WITNESSES = [
  'COMMERCIAL_ORDER','PURCHASE_ORDER','CONTRACT','WAREHOUSE_PICK','PACKING_LIST',
  'LOAD_SCAN','CFDI_XML','CARTA_PORTE','ORIGIN_GPS','LOAD_PHOTO','ROUTE_TRACE',
  'DESTINATION_GEOFENCE','POD','SIGNATURE','DELIVERY_PHOTO','RECEIPT','INVOICE','PAYMENT'
] as const;

export type MaterialityWitness = typeof MATERIALITY_WITNESSES[number];

export function materialityCoverage(present: MaterialityWitness[]) {
  const unique = new Set(present);
  const missing = MATERIALITY_WITNESSES.filter(x => !unique.has(x));
  return { present: unique.size, total: MATERIALITY_WITNESSES.length, missing, percentage: Math.round((unique.size / MATERIALITY_WITNESSES.length) * 100) };
}
