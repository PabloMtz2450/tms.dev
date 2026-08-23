import type { MembershipRole } from '@prisma/client';
import type { AuthContext } from './session';

export type BackendCapability =
  | 'FISCAL_PREVALIDATE'
  | 'FISCAL_STAMP'
  | 'FISCAL_CANCEL'
  | 'AUDIT_READ'
  | 'TENANT_ADMIN';

const grants: Record<MembershipRole, readonly BackendCapability[]> = {
  OWNER: ['FISCAL_PREVALIDATE','FISCAL_STAMP','FISCAL_CANCEL','AUDIT_READ','TENANT_ADMIN'],
  ADMIN: ['FISCAL_PREVALIDATE','FISCAL_STAMP','FISCAL_CANCEL','AUDIT_READ','TENANT_ADMIN'],
  PLANNER: ['FISCAL_PREVALIDATE'],
  DISPATCHER: ['FISCAL_PREVALIDATE'],
  DRIVER: [],
  FINANCE: ['FISCAL_PREVALIDATE','FISCAL_STAMP','FISCAL_CANCEL','AUDIT_READ'],
  AUDITOR: ['FISCAL_PREVALIDATE','AUDIT_READ'],
  VIEWER: [],
};

export function authorize(context: AuthContext, capability: BackendCapability): void {
  if (!grants[context.role].includes(capability)) throw new Error('AUTH_FORBIDDEN');
}

export function assertTenant(context: AuthContext, requestedOrganizationId: string): void {
  if (context.organizationId !== requestedOrganizationId) throw new Error('TENANT_SCOPE_VIOLATION');
}
