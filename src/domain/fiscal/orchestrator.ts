import type { Cfdi40CartaPorteDocument } from './model';
import type { CfdiSigner, PacAdapter } from './pac';
import { FiscalStampingBlockedError, prepareAndStampCartaPorte } from './pac';
import type { SatXsdValidator } from './xsd';
import { acquireFiscalOperation, markFiscalFailed, markFiscalRecoveryRequired, markFiscalStamped } from './state';
import { sha256 } from '@/domain/evidence/integrity';
import { appendAuditEvent } from '@/domain/audit/store';

function stableJson(value: unknown): string {
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(stableJson).join(',')}]`;
  return `{${Object.entries(value as Record<string, unknown>)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, val]) => `${JSON.stringify(key)}:${stableJson(val)}`).join(',')}}`;
}

export function fiscalFingerprint(document: Cfdi40CartaPorteDocument): string {
  return sha256(stableJson(document));
}

function safeErrorCode(error: unknown): string {
  if (error instanceof FiscalStampingBlockedError) return 'FISCAL_VALIDATION_BLOCKED';
  if (error instanceof Error && error.name === 'FinkokStampError') return 'PAC_REJECTED';
  if (error instanceof Error && error.name === 'AbortError') return 'PAC_TIMEOUT_UNCERTAIN';
  if (error instanceof Error && error.message.startsWith('FINKOK_HTTP_')) return 'PAC_HTTP_UNCERTAIN';
  return 'PAC_RESULT_UNCERTAIN';
}

function isDefinitiveFailure(error: unknown): boolean {
  return error instanceof FiscalStampingBlockedError || (error instanceof Error && error.name === 'FinkokStampError');
}

export async function stampCartaPorteIdempotent(input: {
  organizationId: string;
  actorId?: string;
  idempotencyKey: string;
  document: Cfdi40CartaPorteDocument;
  signer: CfdiSigner;
  xsd: SatXsdValidator;
  pac: PacAdapter;
}) {
  const fingerprint = fiscalFingerprint(input.document);
  const acquired = await acquireFiscalOperation({
    organizationId: input.organizationId,
    idempotencyKey: input.idempotencyKey,
    documentType: `CFDI_${input.document.type}_CARTA_PORTE_3_1`,
    sourceFingerprint: fingerprint,
  });

  if (acquired.alreadyStamped) {
    return { status: 'ALREADY_STAMPED' as const, fiscalDocument: acquired.document };
  }
  if (!acquired.acquired) {
    return { status: 'IN_PROGRESS' as const, fiscalDocument: acquired.document };
  }

  await appendAuditEvent({
    organizationId: input.organizationId,
    actorId: input.actorId,
    action: 'FISCAL_STAMP_STARTED',
    resourceType: 'FiscalDocument',
    resourceId: acquired.document.id,
    metadata: { idempotencyKey: input.idempotencyKey, fingerprint },
  });

  try {
    const result = await prepareAndStampCartaPorte(input.document, { signer: input.signer, xsd: input.xsd, pac: input.pac });
    await markFiscalStamped({
      id: acquired.document.id,
      organizationId: input.organizationId,
      uuid: result.uuid,
      stampedXmlHash: sha256(result.stampedXml),
      stampedAt: new Date(result.stampedAt),
    });
    await appendAuditEvent({
      organizationId: input.organizationId,
      actorId: input.actorId,
      action: 'FISCAL_STAMP_SUCCEEDED',
      resourceType: 'FiscalDocument',
      resourceId: acquired.document.id,
      metadata: { uuid: result.uuid, pacRfc: result.pacRfc ?? null },
    });
    return { status: 'STAMPED' as const, result, fiscalDocumentId: acquired.document.id };
  } catch (error) {
    const code = safeErrorCode(error);
    const safeMessage = error instanceof FiscalStampingBlockedError
      ? 'Validación fiscal bloqueó el timbrado antes de enviar al PAC.'
      : error instanceof Error && error.name === 'FinkokStampError'
        ? 'El PAC rechazó el CFDI con una respuesta definitiva.'
        : 'Resultado del PAC incierto; se requiere recuperación antes de reintentar.';

    if (isDefinitiveFailure(error)) {
      await markFiscalFailed({ id: acquired.document.id, organizationId: input.organizationId, errorCode: code, safeMessage });
    } else {
      await markFiscalRecoveryRequired({ id: acquired.document.id, organizationId: input.organizationId, errorCode: code, safeMessage });
    }

    await appendAuditEvent({
      organizationId: input.organizationId,
      actorId: input.actorId,
      action: isDefinitiveFailure(error) ? 'FISCAL_STAMP_FAILED' : 'FISCAL_STAMP_RECOVERY_REQUIRED',
      resourceType: 'FiscalDocument',
      resourceId: acquired.document.id,
      metadata: { code },
    });
    throw error;
  }
}
