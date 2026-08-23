import { FiscalDocumentStatus, Prisma } from '@prisma/client';
import { db } from '@/lib/db';

const retryable = new Set<FiscalDocumentStatus>(['DRAFT','VALIDATED','SIGNED','FAILED','RECOVERY_REQUIRED']);

async function serializable<T>(fn: () => Promise<T>, attempts = 3): Promise<T> {
  let last: unknown;
  for (let i = 0; i < attempts; i += 1) {
    try { return await fn(); }
    catch (error) {
      last = error;
      if (!(error instanceof Prisma.PrismaClientKnownRequestError) || error.code !== 'P2034' || i === attempts - 1) throw error;
    }
  }
  throw last;
}

export async function acquireFiscalOperation(input: {
  organizationId: string;
  idempotencyKey: string;
  documentType: string;
  sourceFingerprint: string;
}) {
  return serializable(() => db.$transaction(async (tx) => {
    const existing = await tx.fiscalDocument.findUnique({
      where: { organizationId_idempotencyKey: { organizationId: input.organizationId, idempotencyKey: input.idempotencyKey } },
    });
    if (existing) {
      if (existing.sourceFingerprint && existing.sourceFingerprint !== input.sourceFingerprint) {
        throw new Error('IDEMPOTENCY_KEY_REUSED_WITH_DIFFERENT_PAYLOAD');
      }
      if (existing.status === 'STAMPED') return { document: existing, acquired: false, alreadyStamped: true };
      if (existing.status === 'STAMPING') return { document: existing, acquired: false, alreadyStamped: false };
      if (existing.status === 'CANCEL_PENDING' || existing.status === 'CANCELLED') throw new Error(`FISCAL_STATE_TERMINAL:${existing.status}`);
      if (!retryable.has(existing.status)) throw new Error(`FISCAL_STATE_NOT_RETRYABLE:${existing.status}`);
      const updated = await tx.fiscalDocument.update({
        where: { id: existing.id },
        data: { status: 'STAMPING', lastErrorCode: null, lastErrorMessage: null },
      });
      return { document: updated, acquired: true, alreadyStamped: false };
    }

    const created = await tx.fiscalDocument.create({
      data: {
        organizationId: input.organizationId,
        idempotencyKey: input.idempotencyKey,
        documentType: input.documentType,
        sourceFingerprint: input.sourceFingerprint,
        status: 'STAMPING',
      },
    });
    return { document: created, acquired: true, alreadyStamped: false };
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable }));
}

async function expectSingleUpdate(count: number, transition: string): Promise<void> {
  if (count !== 1) throw new Error(`FISCAL_STATE_CONFLICT:${transition}`);
}

export async function markFiscalStamped(input: {
  id: string;
  organizationId: string;
  uuid: string;
  stampedXmlHash: string;
  stampedAt: Date;
  xmlObjectKey?: string;
  finkokWorkProcessId?: string;
}) {
  const result = await db.fiscalDocument.updateMany({
    where: { id: input.id, organizationId: input.organizationId, status: 'STAMPING' },
    data: {
      status: 'STAMPED', uuid: input.uuid, stampedXmlHash: input.stampedXmlHash,
      stampedAt: input.stampedAt, xmlObjectKey: input.xmlObjectKey,
      finkokWorkProcessId: input.finkokWorkProcessId,
      lastErrorCode: null, lastErrorMessage: null,
    },
  });
  await expectSingleUpdate(result.count, 'STAMPING->STAMPED');
}

export async function markFiscalRecoveryRequired(input: {
  id: string;
  organizationId: string;
  errorCode: string;
  safeMessage: string;
}) {
  const result = await db.fiscalDocument.updateMany({
    where: { id: input.id, organizationId: input.organizationId, status: 'STAMPING' },
    data: {
      status: 'RECOVERY_REQUIRED',
      recoveryAttempts: { increment: 1 },
      lastErrorCode: input.errorCode,
      lastErrorMessage: input.safeMessage.slice(0, 500),
    },
  });
  await expectSingleUpdate(result.count, 'STAMPING->RECOVERY_REQUIRED');
}

export async function markFiscalFailed(input: {
  id: string;
  organizationId: string;
  errorCode: string;
  safeMessage: string;
}) {
  const result = await db.fiscalDocument.updateMany({
    where: {
      id: input.id,
      organizationId: input.organizationId,
      status: { in: ['DRAFT','VALIDATED','SIGNING','SIGNED','STAMPING','RECOVERY_REQUIRED'] },
    },
    data: { status: 'FAILED', lastErrorCode: input.errorCode, lastErrorMessage: input.safeMessage.slice(0, 500) },
  });
  await expectSingleUpdate(result.count, 'NON_TERMINAL->FAILED');
}

export async function markCancelPending(id: string, organizationId: string): Promise<void> {
  const result = await db.fiscalDocument.updateMany({
    where: { id, organizationId, status: 'STAMPED' },
    data: { status: 'CANCEL_PENDING' },
  });
  await expectSingleUpdate(result.count, 'STAMPED->CANCEL_PENDING');
}

export async function markCancelled(id: string, organizationId: string): Promise<void> {
  const result = await db.fiscalDocument.updateMany({
    where: { id, organizationId, status: 'CANCEL_PENDING' },
    data: { status: 'CANCELLED' },
  });
  await expectSingleUpdate(result.count, 'CANCEL_PENDING->CANCELLED');
}
