import { NextResponse } from 'next/server';
import type { Cfdi40CartaPorteDocument } from '@/domain/fiscal/model';
import { fiscalDocumentHttpSchema } from '@/domain/fiscal/http-schema';
import { validateFiscalDocument } from '@/domain/fiscal/validate';
import { generateCfdi40CartaPorte31Xml } from '@/domain/fiscal/xml';
import { requireAuth } from '@/lib/auth/session';
import { assertTenant, authorize } from '@/lib/auth/authorize';
import { assertJsonRequest, assertTrustedOrigin, clientAddress, enforceRateLimit } from '@/lib/security/request-guard';

function errorStatus(message: string): number {
  if (message === 'AUTH_REQUIRED') return 401;
  if (message === 'AUTH_FORBIDDEN' || message === 'TENANT_SCOPE_VIOLATION' || message === 'CSRF_ORIGIN_REJECTED') return 403;
  if (message === 'RATE_LIMITED') return 429;
  if (message === 'PAYLOAD_TOO_LARGE') return 413;
  if (message === 'UNSUPPORTED_CONTENT_TYPE') return 415;
  return 400;
}

export async function POST(request: Request) {
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
    if (!validation.valid) return NextResponse.json({ ok:false, validation }, { status:422 });

    const xml = generateCfdi40CartaPorte31Xml(document);
    return NextResponse.json({
      ok:true,
      validation,
      xml,
      note:'XML prevalidado por reglas XOLUM. Antes de PAC debe firmarse con CSD y validarse contra XSD SAT.',
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'REQUEST_REJECTED';
    return NextResponse.json({ ok:false, error:message }, { status:errorStatus(message) });
  }
}
