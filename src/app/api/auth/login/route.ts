import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { createSession, sessionCookie } from '@/lib/auth/session';
import { verifyUserPassword } from '@/lib/auth/password';
import { assertJsonRequest, assertTrustedOrigin, clientAddress, enforceRateLimit } from '@/lib/security/request-guard';
import { logEvent, requestId } from '@/lib/observability/logger';

const loginSchema = z.object({
  email: z.string().trim().email().max(254),
  password: z.string().min(1).max(256),
  organizationId: z.string().min(1).max(64),
}).strict();

export async function POST(request: Request) {
  const traceId = requestId(request);
  try {
    assertJsonRequest(request, 16_384);
    assertTrustedOrigin(request);
    await enforceRateLimit(`auth:login:${clientAddress(request)}`, 10, 15 * 60_000);

    const input = loginSchema.parse(await request.json());
    const verified = await verifyUserPassword(input.email, input.password);
    if (!verified) {
      logEvent('warn', 'auth.login.failed', { traceId, email: input.email.toLowerCase(), organizationId: input.organizationId });
      return NextResponse.json({ ok: false, error: 'INVALID_CREDENTIALS', traceId }, { status: 401, headers: { 'X-Request-Id': traceId } });
    }

    const membership = await db.membership.findUnique({
      where: { organizationId_userId: { organizationId: input.organizationId, userId: verified.id } },
      select: { role: true },
    });
    if (!membership) {
      logEvent('warn', 'auth.login.tenant_denied', { traceId, userId: verified.id, organizationId: input.organizationId });
      return NextResponse.json({ ok: false, error: 'INVALID_CREDENTIALS', traceId }, { status: 401, headers: { 'X-Request-Id': traceId } });
    }

    const session = await createSession(verified.id, input.organizationId);
    logEvent('info', 'auth.login.success', { traceId, userId: verified.id, organizationId: input.organizationId, role: membership.role });
    return NextResponse.json(
      { ok: true, expiresAt: session.expiresAt.toISOString(), role: session.role, traceId },
      { status: 200, headers: { 'Set-Cookie': sessionCookie(session.token, session.expiresAt), 'X-Request-Id': traceId, 'Cache-Control': 'no-store' } },
    );
  } catch (error) {
    const code = error instanceof Error && error.message === 'AUTH_ACCOUNT_LOCKED' ? 'AUTH_ACCOUNT_LOCKED' : 'AUTH_REQUEST_REJECTED';
    const status = code === 'AUTH_ACCOUNT_LOCKED' ? 423 : 400;
    logEvent('warn', 'auth.login.error', { traceId, code });
    return NextResponse.json({ ok: false, error: code, traceId }, { status, headers: { 'X-Request-Id': traceId } });
  }
}
