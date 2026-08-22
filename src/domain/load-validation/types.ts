export interface LoadUnit{sku:string;expectedQty:number;scannedQty:number;lot?:string;serial?:string;weightKg?:number;}
export function validateLoad(items:LoadUnit[]){const differences=items.filter(x=>x.expectedQty!==x.scannedQty).map(x=>({sku:x.sku,expected:x.expectedQty,scanned:x.scannedQty,difference:x.scannedQty-x.expectedQty}));return {ok:differences.length===0,differences};}
