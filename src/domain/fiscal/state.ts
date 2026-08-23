import { FiscalDocumentStatus, Prisma } from '@prisma/client';
import { db } from '@/lib/db';

const retryable = new Set<FiscalDocumentStatus>(['DRAFT','VALIDATED','SIGNED','FAILED','RECOVERY_REQUIRED']);

export async function acquireFiscalOperation(input: {
  organizationId: string;
  idempotencyKey: string;
  documentType: string;
  sourceFingerprint: string;
}) {
  return db.$transaction(async (tx) => {
    const existing = await tx.fiscalDocument.findUnique({
      where: { organizationId_idempotencyKey: { organizationId: input.organizationId, idempotencyKey: input.idempotencyKey } },
    });
    if (existing) {
      if (existing.sourceFingerprint && existing.sourceFingerprint !== input.sourceFingerprint) {
        throw new Error('IDEMPOTENCY_KEY_REUSED_WITH_DIFFERENT_PAYLOAD');
      }
      if (existing.status === 'STAMPED') return { document: existing, acquired: false, alreadyStamped: true };
      if (existing.status === 'STAMPING') return { document: existing, acquired: false, alreadyStamped: false };
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
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
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
  return db.fiscalDocument.updateMany({
    where: { id: input.id, organizationId: input.organizationId, status: 'STAMPING' },
    data: {
      status: 'STAMPED', uuid: input.uuid, stampedXmlHash: input.stampedXmlHash,
      stampedAt: input.stampedAt, xmlObjectKey: input.xmlObjectKey,
      finkokWorkProcessId: input.finkokWorkProcessId,
    },
  });
}

export async function markFiscalRecoveryRequired(input: {
  id: string;
  organizationId: string;
  errorCode: string;
  safeMessage: string;
}) {
  return db.fiscalDocument.updateMany({
    where: { id: input.id, organizationId: input.organizationId, status: 'STAMPING' },
    data: {
      status: 'RECOVERY_REQUIRED',
      recoveryAttempts: { increment: 1 },
      lastErrorCode: input.errorCode,
      lastErrorMessage: input.safeMessage.slice(0, 500),
    },
  });
}

export async function markFiscalFailed(input: {
  id: string;
  organizationId: string;
  errorCode: string;
  safeMessage: string;
}) {
  return db.fiscalDocument.updateMany({
    where: { id: input.id, organizationId: input.organizationId },
    data: { status: 'FAILED', lastErrorCode: input.errorCode, lastErrorMessage: input.safeMessage.slice(0, 500) },
  });
}
