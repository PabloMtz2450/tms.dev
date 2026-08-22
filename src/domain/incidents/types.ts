export type IncidentType='DELAY'|'DAMAGE'|'SHORTAGE'|'SURPLUS'|'REJECTION'|'ACCIDENT'|'BREAKDOWN'|'DOCUMENT'|'SECURITY'|'OTHER';
export type IncidentSeverity='LOW'|'MEDIUM'|'HIGH'|'CRITICAL';
export interface Incident { id:string; organizationId:string; routeId?:string; stopId?:string; type:IncidentType; severity:IncidentSeverity; description:string; occurredAt:Date; }
