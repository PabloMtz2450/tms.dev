export interface PlanningStop { id:string; lat:number; lng:number; serviceMinutes:number; demandKg:number; priority:number; windowStart?:string; windowEnd?:string; }
export interface PlanningVehicle { id:string; capacityKg:number; startLat:number; startLng:number; availableFrom?:string; availableTo?:string; skills?:string[]; }
export interface PlanningScenario { id:string; objective:'COST'|'BALANCED'|'SLA'; vehicleCount:number; totalKm:number; estimatedCost:number; expectedOtif:number; }
