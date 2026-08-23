import { createHash, randomBytes } from 'node:crypto';
import type { MembershipRole } from '@prisma/client';
import { db } from '@/lib/db';

export const SESSION_COOKIE = 'xolum_session';
const DEFAULT_TTL_SECONDS = 60 * 60 * 8;

export type AuthContext = {
  sessionId: string;
  userId: string;
  organizationId: string;
  role: MembershipRole;
};

function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

function readCookie(request: Request, name: string): string | undefined {
  const cookie = request.headers.get('cookie') ?? '';
  for (const part of cookie.split(';')) {
    const [key, ...rest] = part.trim().split('=');
    if (key === name) return decodeURIComponent(rest.join('='));
  }
  return undefined;
}

export async function createSession(userId: string, organizationId: string, ttlSeconds = DEFAULT_TTL_SECONDS) {
  const membership = await db.membership.findUnique({
    where: { organizationId_userId: { organizationId, userId } },
    select: { role: true },
  });
  if (!membership) throw new Error('AUTH_MEMBERSHIP_REQUIRED');

  const token = randomBytes(32).toString('base64url');
  const expiresAt = new Date(Date.now() + ttlSeconds * 1000);
  const session = await db.session.create({
    data: { tokenHash: hashToken(token), userId, organizationId, expiresAt },
    select: { id: true },
  });
  return { token, sessionId: session.id, expiresAt, role: membership.role };
}

export async function revokeSession(token: string): Promise<void> {
  await db.session.updateMany({
    where: { tokenHash: hashToken(token), revokedAt: null },
    data: { revokedAt: new Date() },
  });
}

export async function authenticateRequest(request: Request): Promise<AuthContext | null> {
  const token = readCookie(request, SESSION_COOKIE);
  if (!token) return null;

  const session = await db.session.findUnique({
    where: { tokenHash: hashToken(token) },
    select: { id: true, userId: true, organizationId: true, expiresAt: true, revokedAt: true },
  });
  if (!session || session.revokedAt || session.expiresAt <= new Date()) return null;

  const membership = await db.membership.findUnique({
    where: { organizationId_userId: { organizationId: session.organizationId, userId: session.userId } },
    select: { role: true },
  });
  if (!membership) return null;

  await db.session.update({ where: { id: session.id }, data: { lastSeenAt: new Date() } });
  return { sessionId: session.id, userId: session.userId, organizationId: session.organizationId, role: membership.role };
}

export async function requireAuth(request: Request): Promise<AuthContext> {
  const context = await authenticateRequest(request);
  if (!context) throw new Error('AUTH_REQUIRED');
  return context;
}

export function sessionCookie(token: string, expiresAt: Date): string {
  return `${SESSION_COOKIE}=${encodeURIComponent(token)}; Path=/; HttpOnly; Secure; SameSite=Lax; Expires=${expiresAt.toUTCString()}`;
}
