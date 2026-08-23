export type EmergencyKind = 'VISIBLE_SOS' | 'SILENT_SOS' | 'ACCIDENT' | 'MEDICAL' | 'SECURITY_RISK';
export type EmergencyState = 'OPEN' | 'ACKNOWLEDGED' | 'RESOLVED';

export interface EmergencyAlert {
  id: string; organizationId: string; routeId: string; vehicleId: string; driverId: string;
  kind: EmergencyKind; state: EmergencyState; preciseLat: number; preciseLng: number;
  triggeredAt: string; acknowledgedAt?: string; acknowledgedBy?: string;
}

export type EscalationStep = { afterMinutes: number; audience: 'SECURITY'|'CONTROL_TOWER'|'SUPERVISOR'|'LOGISTICS_MANAGER' };

export const DEFAULT_ESCALATION: readonly EscalationStep[] = [
  { afterMinutes: 0, audience: 'SECURITY' },
  { afterMinutes: 0, audience: 'CONTROL_TOWER' },
  { afterMinutes: 2, audience: 'SUPERVISOR' },
  { afterMinutes: 5, audience: 'LOGISTICS_MANAGER' },
];

export function pendingEscalations(minutesOpen: number, acknowledged: boolean) {
  if (acknowledged) return [];
  return DEFAULT_ESCALATION.filter(step => step.afterMinutes <= minutesOpen);
}
