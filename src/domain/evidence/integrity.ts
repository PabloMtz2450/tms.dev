import { createHash } from 'node:crypto';

export function sha256(content: Buffer | string): string {
  return createHash('sha256').update(content).digest('hex');
}

export function chainEventHash(previousHash: string | null, canonicalEvent: string): string {
  return sha256(`${previousHash ?? 'GENESIS'}:${canonicalEvent}`);
}
