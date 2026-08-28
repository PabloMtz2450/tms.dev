# TMS.dev → XOLUM Universal Core

TMS consumes canonical Sales facts and emits canonical logistics facts without accessing Sales/Fiscal databases.

## Inbound
`src/integration/xolum-core.ts` validates `sales.order.confirmed.v1` before deriving a shipment draft. A ship-to address is mandatory to create a shipment. Canonical organization/product/address IDs remain references to Core master data.

## Outbound
After the existing TMS delivery close policy succeeds, TMS builds `tms.delivery.completed.v1` with evidence state and publishes it using a tenant-bound service token plus a stable idempotency key such as `tms:<delivery-id>:completed`.

`evidence_status` is restricted to `COMPLETE` or `EXCEPTION_APPROVED`; an incomplete delivery is not represented as completed merely to satisfy a downstream invoice flow.

TMS continues to own shipments, routes, POD, evidence and materiality. Fiscal remains owner of CFDI and PAC operations.
