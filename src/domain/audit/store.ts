import { Prisma } from '@prisma/client';
import { db } from '@/lib/db';
import { chainEventHash } from '@/domain/evidence/integrity';

function canonicalJson(value: unknown): string {
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(',')}]`;
  const entries = Object.entries(value as Record<string, unknown>)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, val]) => `${JSON.stringify(key)}:${canonicalJson(val)}`);
  return `{${entries.join(',')}}`;
}

export async function appendAuditEvent(input: {
  organizationId: string;
  actorId?: string;
  action: string;
  resourceType: string;
  resourceId: string;
  metadata?: Record<string, unknown>;
}) {
  return db.$transaction(async (tx) => {
    const previous = await tx.auditEvent.findFirst({
      where: { organizationId: input.organizationId },
      orderBy: [{ occurredAt: 'desc' }, { id: 'desc' }],
      select: { eventHash: true },
    });
    const occurredAt = new Date();
    const canonical = canonicalJson({
      organizationId: input.organizationId,
      actorId: input.actorId ?? null,
      action: input.action,
      resourceType: input.resourceType,
      resourceId: input.resourceId,
      occurredAt: occurredAt.toISOString(),
      metadata: input.metadata ?? {},
    });
    const eventHash = chainEventHash(previous?.eventHash ?? null, canonical);
    return tx.auditEvent.create({
      data: {
        organizationId: input.organizationId,
        actorId: input.actorId,
        action: input.action,
        resourceType: input.resourceType,
        resourceId: input.resourceId,
        occurredAt,
        previousHash: previous?.eventHash,
        eventHash,
        metadata: (input.metadata ?? {}) as Prisma.InputJsonValue,
      },
    });
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
}
