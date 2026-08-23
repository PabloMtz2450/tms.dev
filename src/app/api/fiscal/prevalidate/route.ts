import { NextResponse } from 'next/server';
import { ZodError } from 'zod';
import type { Cfdi40CartaPorteDocument } from '@/domain/fiscal/model';
import { fiscalDocumentHttpSchema } from '@/domain/fiscal/http-schema';
import { validateFiscalDocument } from '@/domain/fiscal/validate';
import { generateCfdi40CartaPorte31Xml } from '@/domain/fiscal/xml';
import { requireAuth } from '@/lib/auth/session';
import { assertTenant, authorize } from '@/lib/auth/authorize';
import { assertJsonRequest, assertTrustedOrigin, clientAddress, enforceRateLimit } from '@/lib/security/request-guard';
import { logEvent, requestId } from '@/lib/observability/logger';

function errorStatus(message: string): number {
  if (message === 'AUTH_REQUIRED') return 401;
  if (message === 'AUTH_FORBIDDEN' || message === 'TENANT_SCOPE_VIOLATION' || message === 'CSRF_ORIGIN_REJECTED') return 403;
  if (message === 'RATE_LIMITED') return 429;
  if (message === 'PAYLOAD_TOO_LARGE') return 413;
  if (message === 'UNSUPPORTED_CONTENT_TYPE') return 415;
  return 400;
}

function publicError(error: unknown): { code: string; status: number; details?: unknown } {
  if (error instanceof ZodError) return {
    code: 'VALIDATION_ERROR', status: 422,
    details: error.issues.slice(0, 50).map((i) => ({ path: i.path.join('.'), code: i.code, message: i.message })),
  };
  const message = error instanceof Error ? error.message : 'REQUEST_REJECTED';
  const known = ['AUTH_REQUIRED','AUTH_FORBIDDEN','TENANT_SCOPE_VIOLATION','CSRF_ORIGIN_REJECTED','RATE_LIMITED','PAYLOAD_TOO_LARGE','UNSUPPORTED_CONTENT_TYPE'];
  return { code: known.includes(message) ? message : 'REQUEST_REJECTED', status: errorStatus(message) };
}

export async function POST(request: Request) {
  const traceId = requestId(request);
  const started = Date.now();
  try {
    assertJsonRequest(request);
    assertTrustedOrigin(request);
    const auth = await requireAuth(request);
    authorize(auth, 'FISCAL_PREVALIDATE');
    enforceRateLimit(`fiscal:prevalidate:${auth.organizationId}:${auth.userId}:${clientAddress(request)}`, 60, 60_000);

    const payload = fiscalDocumentHttpSchema.parse(await request.json());
    assertTenant(auth, payload.organizationId);

    const document = payload.document as Cfdi40CartaPorteDocument;
    const validation = validateFiscalDocument(document);
    if (!validation.valid) {
      logEvent('warn', 'fiscal.prevalidate.rejected', { traceId, organizationId: auth.organizationId, userId: auth.userId, issueCount: validation.issues.length, durationMs: Date.now() - started });
      return NextResponse.json({ ok:false, validation, traceId }, { status:422, headers:{ 'X-Request-Id': traceId } });
    }

    const xml = generateCfdi40CartaPorte31Xml(document);
    logEvent('info', 'fiscal.prevalidate.success', { traceId, organizationId: auth.organizationId, userId: auth.userId, durationMs: Date.now() - started });
    return NextResponse.json({
      ok:true, validation, xml, traceId,
      note:'XML prevalidado por reglas XOLUM. Antes de PAC debe firmarse con CSD y validarse contra XSD SAT.',
    }, { headers:{ 'X-Request-Id': traceId } });
  } catch (error) {
    const safe = publicError(error);
    logEvent(safe.status >= 500 ? 'error' : 'warn', 'fiscal.prevalidate.error', { traceId, code: safe.code, durationMs: Date.now() - started });
    return NextResponse.json({ ok:false, error:safe.code, details:safe.details, traceId }, { status:safe.status, headers:{ 'X-Request-Id': traceId } });
  }
}
