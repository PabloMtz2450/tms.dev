import { randomUUID } from 'node:crypto';
import { z } from 'zod';

const uuidLike=z.string().min(16).max(64);
const salesLine=z.object({line_id:z.string().min(1).max(128),product_id:uuidLike,quantity:z.number().positive(),unit_code:z.string().min(1).max(32),customer_product_code:z.string().max(160).nullable().optional()}).strict();

export const salesOrderConfirmedPayloadSchema=z.object({
  sales_order_id:z.string().min(1).max(128),
  customer_organization_id:uuidLike,
  ship_to_address_id:z.string().max(64).nullable().optional(),
  currency:z.string().regex(/^[A-Z]{3}$/),
  purchase_order_reference:z.string().max(160).nullable().optional(),
  lines:z.array(salesLine).min(1).max(10_000),
}).strict();

export const deliveryCompletedPayloadSchema=z.object({
  shipment_id:z.string().min(1).max(128),
  delivery_id:z.string().min(1).max(128),
  sales_order_id:z.string().max(128).nullable().optional(),
  purchase_order_id:z.string().max(128).nullable().optional(),
  customer_organization_id:uuidLike,
  delivered_at:z.string().datetime(),
  evidence_status:z.enum(['COMPLETE','EXCEPTION_APPROVED']),
  pod_document_id:z.string().max(64).nullable().optional(),
  materiality_case_id:z.string().max(128).nullable().optional(),
}).strict();

export type SalesOrderConfirmedPayload=z.infer<typeof salesOrderConfirmedPayloadSchema>;
export type DeliveryCompletedPayload=z.infer<typeof deliveryCompletedPayloadSchema>;

export function salesOrderToShipmentDraft(payload:unknown){
  const order=salesOrderConfirmedPayloadSchema.parse(payload);
  if(!order.ship_to_address_id) throw new Error('SHIP_TO_ADDRESS_REQUIRED');
  return {
    source_type:'SALES_ORDER' as const,
    source_id:order.sales_order_id,
    customer_organization_id:order.customer_organization_id,
    destination_address_id:order.ship_to_address_id,
    lines:order.lines.map((line)=>({source_line_id:line.line_id,product_id:line.product_id,quantity:line.quantity,unit_code:line.unit_code})),
  };
}

export function buildDeliveryCompletedEvent(input:{tenantId:string;correlationId:string;payload:DeliveryCompletedPayload;eventId?:string;occurredAt?:string}){
  const payload=deliveryCompletedPayloadSchema.parse(input.payload);
  return {event_id:input.eventId??randomUUID(),event_type:'tms.delivery.completed.v1',schema_version:'1.0' as const,occurred_at:input.occurredAt??new Date().toISOString(),tenant_id:input.tenantId,entity_type:'delivery',entity_id:payload.delivery_id,correlation_id:input.correlationId,payload};
}

export async function publishDeliveryCompleted(args:{coreUrl:string;serviceToken:string;idempotencyKey:string;event:ReturnType<typeof buildDeliveryCompletedEvent>;fetcher?:typeof fetch}){
  if(!args.idempotencyKey) throw new Error('IDEMPOTENCY_KEY_REQUIRED');
  const response=await (args.fetcher??fetch)(`${args.coreUrl.replace(/\/$/,'')}/api/v1/events`,{method:'POST',headers:{'content-type':'application/json','x-service-token':args.serviceToken,'idempotency-key':args.idempotencyKey,'x-request-id':args.event.correlation_id},body:JSON.stringify(args.event)});
  if(response.status!==200&&response.status!==202) throw new Error(`XOLUM_CORE_EVENT_REJECTED_${response.status}`);
  return response.json() as Promise<{duplicate:boolean;event:{id:string;event_type:string;correlation_id:string}}>;
}
