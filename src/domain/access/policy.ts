export type AccessRole =
  | 'XOLUM_SUPERADMIN' | 'TENANT_ADMIN' | 'LOGISTICS_MANAGER' | 'CONTROL_TOWER'
  | 'REGIONAL_SUPERVISOR' | 'PLANNER' | 'SECURITY_MONITOR' | 'DRIVER'
  | 'AUDITOR' | 'CONTRACTING_CUSTOMER' | 'FINAL_RECIPIENT' | 'XOLUM_SUPPORT';

export type SensitiveCapability =
  | 'VIEW_PRECISE_GPS' | 'VIEW_OTHER_ROUTES' | 'VIEW_CARGO_DETAILS'
  | 'VIEW_FINANCIALS' | 'MANAGE_USERS' | 'ACK_EMERGENCY' | 'EMERGENCY_ELEVATION';

const roleCapabilities: Record<AccessRole, readonly SensitiveCapability[]> = {
  XOLUM_SUPERADMIN: ['MANAGE_USERS'],
  TENANT_ADMIN: ['VIEW_FINANCIALS','MANAGE_USERS'],
  LOGISTICS_MANAGER: ['VIEW_PRECISE_GPS','VIEW_OTHER_ROUTES','VIEW_CARGO_DETAILS','VIEW_FINANCIALS'],
  CONTROL_TOWER: ['VIEW_PRECISE_GPS','VIEW_OTHER_ROUTES','VIEW_CARGO_DETAILS','ACK_EMERGENCY'],
  REGIONAL_SUPERVISOR: ['VIEW_PRECISE_GPS','VIEW_OTHER_ROUTES'],
  PLANNER: ['VIEW_OTHER_ROUTES'],
  SECURITY_MONITOR: ['VIEW_PRECISE_GPS','ACK_EMERGENCY','EMERGENCY_ELEVATION'],
  DRIVER: [],
  AUDITOR: ['VIEW_FINANCIALS'],
  CONTRACTING_CUSTOMER: [],
  FINAL_RECIPIENT: [],
  XOLUM_SUPPORT: [],
};

export function hasCapability(role: AccessRole, capability: SensitiveCapability): boolean {
  return roleCapabilities[role].includes(capability);
}

export function canRecipientSeePreciseGps(): false { return false; }

export function canDriverSeeRoute(role: AccessRole, requestedRouteId: string, assignedRouteId: string | null): boolean {
  return role === 'DRIVER' ? !!assignedRouteId && requestedRouteId === assignedRouteId : hasCapability(role, 'VIEW_OTHER_ROUTES');
}
