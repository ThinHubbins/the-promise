import crypto from 'crypto';

export const QR_WINDOW_SECONDS = 600; // 10 minutes

function getSecret(): string {
  const secret = process.env.ATTENDANCE_QR_SECRET;
  if (!secret) throw new Error('ATTENDANCE_QR_SECRET is not set');
  return secret;
}

export function currentTimeBucket(): number {
  return Math.floor(Date.now() / 1000 / QR_WINDOW_SECONDS);
}

export function computeToken(outletId: string, timeBucket: number): string {
  return crypto
    .createHmac('sha256', getSecret())
    .update(`${outletId}:${timeBucket}`)
    .digest('hex');
}

export function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}