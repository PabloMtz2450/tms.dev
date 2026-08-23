import { randomUUID } from 'node:crypto';

const SENSITIVE_KEYS = /(password|secret|token|authorization|cookie|certificate|private.?key|seal|xml|soap|csd)/i;

function redact(value: unknown, depth = 0): unknown {
  if (depth > 6) return '[TRUNCATED]';
  if (Array.isArray(value)) return value.slice(0, 100).map((item) => redact(item, depth + 1));
  if (!value || typeof value !== 'object') return typeof value === 'string' && value.length > 1000 ? `${value.slice(0, 200)}…[TRUNCATED]` : value;
  return Object.fromEntries(Object.entries(value as Record<string, unknown>).map(([key, val]) => [
    key,
    SENSITIVE_KEYS.test(key) ? '[REDACTED]' : redact(val, depth + 1),
  ]));
}

export function requestId(request: Request): string {
  return request.headers.get('x-request-id')?.slice(0, 100) || randomUUID();
}

export function logEvent(level: 'info'|'warn'|'error', event: string, data: Record<string, unknown> = {}): void {
  const line = JSON.stringify({ timestamp: new Date().toISOString(), level, event, ...redact(data) as object });
  if (level === 'error') console.error(line);
  else if (level === 'warn') console.warn(line);
  else console.info(line);
}
