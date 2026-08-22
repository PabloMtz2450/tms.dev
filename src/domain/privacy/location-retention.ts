export interface LocationRetentionPolicy{activeRouteDays:number;completedRouteDays:number;aggregateAfterExpiry:boolean;}
export function shouldRetainRawLocation(completedAt:Date|null,pointAt:Date,policy:LocationRetentionPolicy,now=new Date()){const days=(now.getTime()-(completedAt??pointAt).getTime())/86400000;return days<=(completedAt?policy.completedRouteDays:policy.activeRouteDays);}
