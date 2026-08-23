import { Prisma } from '@prisma/client';
import { db } from '@/lib/db';

export function assertJsonRequest(request: Request, maxContentLength = 256_000): void {
  const contentType = request.headers.get('content-type') ?? '';
  if (!contentType.toLowerCase().includes('application/json')) throw new Error('UNSUPPORTED_CONTENT_TYPE');
  const length = Number(request.headers.get('content-length') ?? 0);
  if (Number.isFinite(length) && length > maxContentLength) throw new Error('PAYLOAD_TOO_LARGE');
}

export function assertTrustedOrigin(request: Request): void {
  const configured = process.env.APP_URL;
  if (!configured) {
    if (process.env.NODE_ENV === 'production') throw new Error('APP_URL_REQUIRED');
    return;
  }
  const origin = request.headers.get('origin');
  if (!origin) return;
  const allowed = new URL(configured).origin;
  if (origin !== allowed) throw new Error('CSRF_ORIGIN_REJECTED');
}

async function withSerializableRetry<T>(fn: () => Promise<T>, attempts = 3): Promise<T> {
  let last: unknown;
  for (let i = 0; i < attempts; i += 1) {
    try {
      return await fn();
    } catch (error) {
      last = error;
      if (!(error instanceof Prisma.PrismaClientKnownRequestError) || error.code !== 'P2034' || i === attempts - 1) throw error;
    }
  }
  throw last;
}

/**
 * Distributed rate limiter persisted in PostgreSQL. It works across multiple app instances.
 * Buckets are intentionally coarse; a periodic cleanup can delete expired rows.
 */
export async function enforceRateLimit(key: string, limit: number, windowMs: number): Promise<void> {
  const now = new Date();
  const resetAt = new Date(now.getTime() + windowMs);

  await withSerializableRetry(() => db.$transaction(async (tx) => {
    const current = await tx.rateLimitBucket.findUnique({ where: { key } });
    if (!current || current.resetAt <= now) {
      await tx.rateLimitBucket.upsert({
        where: { key },
        create: { key, count: 1, resetAt },
        update: { count: 1, resetAt },
      });
      return;
    }
    if (current.count >= limit) throw new Error('RATE_LIMITED');
    await tx.rateLimitBucket.update({ where: { key }, data: { count: { increment: 1 } } });
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable }));
}

/**
 * Only trust forwarded headers when the deployment explicitly says a trusted proxy rewrites them.
 * Otherwise use x-real-ip or a non-identifying fallback.
 */
export function clientAddress(request: Request): string {
  const trustProxy = process.env.TRUST_PROXY_HEADERS === 'true';
  if (trustProxy) {
    const forwarded = request.headers.get('x-forwarded-for');
    const candidate = forwarded?.split(',')[0]?.trim() || request.headers.get('x-real-ip');
    if (candidate) return candidate.slice(0, 128);
  }
  return request.headers.get('x-real-ip')?.slice(0, 128) || 'unknown';
}
