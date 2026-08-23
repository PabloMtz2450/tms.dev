import { NextResponse } from 'next/server';
import { assertTrustedOrigin } from '@/lib/security/request-guard';
import { clearSessionCookie, readSessionToken, revokeSession } from '@/lib/auth/session';
import { logEvent, requestId } from '@/lib/observability/logger';

export async function POST(request: Request) {
  const traceId = requestId(request);
  try {
    assertTrustedOrigin(request);
    const token = readSessionToken(request);
    if (token) await revokeSession(token);
    logEvent('info', 'auth.logout', { traceId });
    return NextResponse.json(
      { ok: true, traceId },
      { headers: { 'Set-Cookie': clearSessionCookie(), 'X-Request-Id': traceId, 'Cache-Control': 'no-store' } },
    );
  } catch {
    return NextResponse.json(
      { ok: false, error: 'AUTH_LOGOUT_REJECTED', traceId },
      { status: 400, headers: { 'X-Request-Id': traceId } },
    );
  }
}
