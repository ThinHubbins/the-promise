import type { User } from './types';

// Demo-only "backend" helpers.
// This encodes a plain JSON payload as base64 — it is NOT a secure JWT.
// Swap this out for real session/JWT handling + a database before going to production.

interface TokenPayload extends User {
  iat: number;
}

export function createToken(payload: User): string {
  const body = JSON.stringify({ ...payload, iat: Date.now() } satisfies TokenPayload);
  return Buffer.from(body, 'utf-8').toString('base64');
}

export function verifyToken(token: string): User | null {
  try {
    const json = Buffer.from(token, 'base64').toString('utf-8');
    const parsed = JSON.parse(json) as TokenPayload;
    const { email, name, phone } = parsed;
    if (!email) return null;
    return { email, name, phone };
  } catch {
    return null;
  }
}
