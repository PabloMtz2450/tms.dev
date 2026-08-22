export const WEBHOOK_EVENTS=['shipment.created','shipment.loaded','route.released','route.started','stop.arrived','delivery.completed','delivery.partial','delivery.rejected','evidence.created','fiscal.stamped','fiscal.cancelled','incident.created'] as const;
export type WebhookEvent=typeof WEBHOOK_EVENTS[number];
export interface WebhookEnvelope<T=unknown>{id:string;event:WebhookEvent;organizationId:string;occurredAt:string;data:T;}
