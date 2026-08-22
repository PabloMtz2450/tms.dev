export type CustodyAction='PICKED'|'LOADED'|'TRANSFERRED'|'UNLOADED'|'DELIVERED'|'RETURNED';
export interface CustodyEvent{shipmentId:string;action:CustodyAction;fromActorId?:string;toActorId?:string;vehicleId?:string;sealNumber?:string;occurredAt:string;evidenceIds:string[];}
