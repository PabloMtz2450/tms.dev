type Bucket = { count: number; resetAt: number };
const buckets = new Map<string, Bucket>();

export function assertJsonRequest(request: Request, maxContentLength = 256_000): void {
  const contentType = request.headers.get('content-type') ?? '';
  if (!contentType.toLowerCase().includes('application/json')) throw new Error('UNSUPPORTED_CONTENT_TYPE');
  const length = Number(request.headers.get('content-length') ?? 0);
  if (Number.isFinite(length) && length > maxContentLength) throw new Error('PAYLOAD_TOO_LARGE');
}

export function assertTrustedOrigin(request: Request): void {
  const configured = process.env.APP_URL;
  if (!configured) return;
  const origin = request.headers.get('origin');
  if (!origin) return;
  const allowed = new URL(configured).origin;
  if (origin !== allowed) throw new Error('CSRF_ORIGIN_REJECTED');
}

export function enforceRateLimit(key: string, limit: number, windowMs: number): void {
  const now = Date.now();
  const current = buckets.get(key);
  if (!current || current.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return;
  }
  if (current.count >= limit) throw new Error('RATE_LIMITED');
  current.count += 1;
}

export function clientAddress(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  return forwarded?.split(',')[0]?.trim() || request.headers.get('x-real-ip') || 'unknown';
}
