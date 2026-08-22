export type ReturnReason='REJECTED'|'DAMAGED'|'WRONG_ITEM'|'EXCESS'|'PACKAGING_RECOVERY'|'CUSTOMER_RETURN'|'OTHER';
export interface ReturnMovement { shipmentId:string; reason:ReturnReason; items:{sku:string;quantity:number;unit:string}[]; evidenceRequired:boolean; destinationId:string; }
