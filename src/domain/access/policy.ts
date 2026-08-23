import type { MembershipRole } from '@prisma/client';

export type AccessRole = MembershipRole;

export type SensitiveCapability =
  | 'VIEW_PRECISE_GPS' | 'VIEW_OTHER_ROUTES' | 'VIEW_CARGO_DETAILS'
  | 'VIEW_FINANCIALS' | 'MANAGE_USERS' | 'ACK_EMERGENCY' | 'EMERGENCY_ELEVATION';

const roleCapabilities: Record<MembershipRole, readonly SensitiveCapability[]> = {
  XOLUM_SUPERADMIN: ['MANAGE_USERS'],
  OWNER: ['VIEW_PRECISE_GPS','VIEW_OTHER_ROUTES','VIEW_CARGO_DETAILS','VIEW_FINANCIALS','MANAGE_USERS','ACK_EMERGENCY','EMERGENCY_ELEVATION'],
  TENANT_ADMIN: ['VIEW_FINANCIALS','MANAGE_USERS'],
  ADMIN: ['VIEW_FINANCIALS','MANAGE_USERS'],
  LOGISTICS_MANAGER: ['VIEW_PRECISE_GPS','VIEW_OTHER_ROUTES','VIEW_CARGO_DETAILS','VIEW_FINANCIALS'],
  CONTROL_TOWER: ['VIEW_PRECISE_GPS','VIEW_OTHER_ROUTES','VIEW_CARGO_DETAILS','ACK_EMERGENCY'],
  REGIONAL_SUPERVISOR: ['VIEW_PRECISE_GPS','VIEW_OTHER_ROUTES'],
  PLANNER: ['VIEW_OTHER_ROUTES'],
  DISPATCHER: ['VIEW_OTHER_ROUTES'],
  SECURITY_MONITOR: ['VIEW_PRECISE_GPS','ACK_EMERGENCY','EMERGENCY_ELEVATION'],
  DRIVER: [],
  FINANCE: ['VIEW_FINANCIALS'],
  AUDITOR: ['VIEW_FINANCIALS'],
  CONTRACTING_CUSTOMER: [],
  FINAL_RECIPIENT: [],
  XOLUM_SUPPORT: [],
  VIEWER: [],
};

export function hasCapability(role: MembershipRole, capability: SensitiveCapability): boolean {
  return roleCapabilities[role].includes(capability);
}

export function canRecipientSeePreciseGps(): false { return false; }

export function canDriverSeeRoute(role: MembershipRole, requestedRouteId: string, assignedRouteId: string | null): boolean {
  return role === 'DRIVER' ? !!assignedRouteId && requestedRouteId === assignedRouteId : hasCapability(role, 'VIEW_OTHER_ROUTES');
}
