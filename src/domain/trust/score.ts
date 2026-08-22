export type TrustSignal={code:string;penalty:number;triggered:boolean};
export function calculateTrustScore(signals:TrustSignal[]){const penalty=signals.filter(s=>s.triggered).reduce((n,s)=>n+s.penalty,0);return Math.max(0,Math.min(100,100-penalty));}
