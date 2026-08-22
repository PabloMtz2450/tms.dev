export type BillingBlocker='POD_INCOMPLETE'|'CUSTOMER_RECEIPT_PENDING'|'FISCAL_ERROR'|'PRICE_MISMATCH'|'MISSING_PO'|'INCIDENT_OPEN'|'OTHER';
export interface RevenueRiskItem{shipmentId:string;amount:number;currency:string;blockers:BillingBlocker[];}
export function summarizeRevenueRisk(items:RevenueRiskItem[]){return items.reduce((a,x)=>({count:a.count+1,amount:a.amount+x.amount}),{count:0,amount:0});}
