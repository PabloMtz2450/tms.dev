export type RuleContext={customerId?:string;routeId?:string;vehicleId?:string;shipmentValue?:number;attributes:Record<string,string|number|boolean>};
export type Rule={id:string;priority:number;enabled:boolean;when:(ctx:RuleContext)=>boolean;effect:string};
export function evaluateRules(rules:Rule[],ctx:RuleContext){return rules.filter(r=>r.enabled&&r.when(ctx)).sort((a,b)=>b.priority-a.priority).map(r=>({ruleId:r.id,effect:r.effect}));}
