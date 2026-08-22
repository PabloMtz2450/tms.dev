export type CostType='BASE_FREIGHT'|'DISTANCE'|'STOP'|'TOLL'|'FUEL'|'MANEUVER'|'PER_DIEM'|'EXTRA';
export interface TripCost{type:CostType;amount:number;currency:string;source:'PLANNED'|'ACTUAL';reference?:string;}
export function tripCostVariance(costs:TripCost[]){const planned=costs.filter(x=>x.source==='PLANNED').reduce((n,x)=>n+x.amount,0);const actual=costs.filter(x=>x.source==='ACTUAL').reduce((n,x)=>n+x.amount,0);return {planned,actual,variance:actual-planned};}
