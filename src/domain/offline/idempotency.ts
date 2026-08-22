export type IdempotentCommand<T>={idempotencyKey:string;organizationId:string;deviceId:string;createdAt:string;payload:T};
export function commandFingerprint<T>(command:IdempotentCommand<T>){return `${command.organizationId}:${command.deviceId}:${command.idempotencyKey}`;}
