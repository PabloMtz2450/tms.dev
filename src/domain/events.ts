export type DomainEventName =
  | 'shipment.created' | 'shipment.loaded' | 'route.released'
  | 'route.started' | 'stop.arrived' | 'delivery.completed'
  | 'delivery.partial' | 'delivery.rejected' | 'evidence.created'
  | 'fiscal.stamped' | 'fiscal.cancelled' | 'incident.created';

export interface DomainEvent<T = unknown> {
  id: string;
  organizationId: string;
  name: DomainEventName;
  occurredAt: Date;
  actorId?: string;
  payload: T;
}
