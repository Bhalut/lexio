import { randomBytes, scryptSync, timingSafeEqual } from 'crypto';

const DEFAULT_KEY_LENGTH = 64;

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString('hex');
  const hash = scryptSync(password, salt, DEFAULT_KEY_LENGTH).toString('hex');
  return `${salt}:${hash}`;
}

export function verifyPassword(
  password: string,
  storedHash: string,
): boolean {
  const [salt, hash] = storedHash.split(':');
  if (!salt || !hash) {
    return false;
  }

  const candidate = scryptSync(password, salt, hash.length / 2);
  const expected = Buffer.from(hash, 'hex');

  if (candidate.length !== expected.length) {
    return false;
  }

  return timingSafeEqual(candidate, expected);
}
