export type PodRequirement = 'PHOTO'|'SIGNATURE'|'STAMP'|'DOCUMENT'|'BARCODE'|'GPS'|'TEMPERATURE';
export type PodPolicy = { requirements: readonly PodRequirement[]; allowException: boolean; exceptionRequiresSupervisor: boolean };
export type PodSubmission = { captured: readonly PodRequirement[]; exceptionReason?: string; supervisorApproved?: boolean };

export function validatePod(policy: PodPolicy, submission: PodSubmission) {
  const missing = policy.requirements.filter(r => !submission.captured.includes(r));
  if (!missing.length) return { ok:true, missing, mode:'NORMAL' as const };
  const exceptionOk = policy.allowException && !!submission.exceptionReason && (!policy.exceptionRequiresSupervisor || submission.supervisorApproved === true);
  return { ok:exceptionOk, missing, mode:exceptionOk ? 'EXCEPTION' as const : 'BLOCKED' as const };
}
