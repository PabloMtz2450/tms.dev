import type { MembershipRole } from '@prisma/client';
import type { AuthContext } from './session';

export type BackendCapability =
  | 'FISCAL_PREVALIDATE'
  | 'FISCAL_STAMP'
  | 'FISCAL_CANCEL'
  | 'AUDIT_READ'
  | 'TENANT_ADMIN';

const allFiscal: readonly BackendCapability[] = ['FISCAL_PREVALIDATE','FISCAL_STAMP','FISCAL_CANCEL','AUDIT_READ','TENANT_ADMIN'];

const grants: Record<MembershipRole, readonly BackendCapability[]> = {
  XOLUM_SUPERADMIN: ['AUDIT_READ'],
  OWNER: allFiscal,
  TENANT_ADMIN: allFiscal,
  ADMIN: allFiscal,
  LOGISTICS_MANAGER: ['FISCAL_PREVALIDATE','AUDIT_READ'],
  CONTROL_TOWER: ['FISCAL_PREVALIDATE'],
  REGIONAL_SUPERVISOR: ['FISCAL_PREVALIDATE'],
  PLANNER: ['FISCAL_PREVALIDATE'],
  DISPATCHER: ['FISCAL_PREVALIDATE'],
  SECURITY_MONITOR: [],
  DRIVER: [],
  FINANCE: ['FISCAL_PREVALIDATE','FISCAL_STAMP','FISCAL_CANCEL','AUDIT_READ'],
  AUDITOR: ['FISCAL_PREVALIDATE','AUDIT_READ'],
  CONTRACTING_CUSTOMER: [],
  FINAL_RECIPIENT: [],
  XOLUM_SUPPORT: [],
  VIEWER: [],
};

export function authorize(context: AuthContext, capability: BackendCapability): void {
  if (!grants[context.role].includes(capability)) throw new Error('AUTH_FORBIDDEN');
}

export function assertTenant(context: AuthContext, requestedOrganizationId: string): void {
  if (context.organizationId !== requestedOrganizationId) throw new Error('TENANT_SCOPE_VIOLATION');
}
