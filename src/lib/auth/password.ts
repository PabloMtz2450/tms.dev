import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';
import { db } from '@/lib/db';

const scrypt = promisify(scryptCallback);
const KEY_LENGTH = 64;
const MAX_FAILURES = 5;
const LOCK_MINUTES = 15;

async function derive(password: string, salt: string): Promise<Buffer> {
  return (await scrypt(password, salt, KEY_LENGTH)) as Buffer;
}

export async function hashPassword(password: string): Promise<{ hash: string; salt: string }> {
  if (password.length < 12 || password.length > 256) throw new Error('PASSWORD_POLICY_FAILED');
  const salt = randomBytes(16).toString('base64url');
  const hash = (await derive(password, salt)).toString('base64url');
  return { hash, salt };
}

export async function setUserPassword(userId: string, password: string): Promise<void> {
  const { hash, salt } = await hashPassword(password);
  await db.user.update({
    where: { id: userId },
    data: { passwordHash: hash, passwordSalt: salt, failedLoginCount: 0, lockedUntil: null },
  });
}

export async function verifyUserPassword(email: string, password: string) {
  const normalizedEmail = email.trim().toLowerCase();
  const user = await db.user.findUnique({
    where: { email: normalizedEmail },
    select: { id: true, email: true, passwordHash: true, passwordSalt: true, failedLoginCount: true, lockedUntil: true },
  });

  // Keep the expensive hash path even for unknown users to reduce user-enumeration timing differences.
  if (!user?.passwordHash || !user.passwordSalt) {
    await derive(password.slice(0, 256), 'xolum-dummy-auth-salt');
    return null;
  }

  if (user.lockedUntil && user.lockedUntil > new Date()) throw new Error('AUTH_ACCOUNT_LOCKED');

  const expected = Buffer.from(user.passwordHash, 'base64url');
  const candidate = await derive(password.slice(0, 256), user.passwordSalt);
  const valid = expected.length === candidate.length && timingSafeEqual(expected, candidate);

  if (!valid) {
    const failures = user.failedLoginCount + 1;
    const lock = failures >= MAX_FAILURES ? new Date(Date.now() + LOCK_MINUTES * 60_000) : null;
    await db.user.update({
      where: { id: user.id },
      data: { failedLoginCount: lock ? 0 : failures, lockedUntil: lock },
    });
    return null;
  }

  await db.user.update({ where: { id: user.id }, data: { failedLoginCount: 0, lockedUntil: null } });
  return { id: user.id, email: user.email };
}
