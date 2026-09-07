import { NextRequest, NextResponse } from 'next/server';
import { createToken } from '../../../../lib/auth';
import type { User } from '../../../../lib/types';

// DEMO BACKEND — accepts any non-empty email/password pair.
// One seeded account gets a friendlier pre-filled profile; everything else
// gets a generic profile derived from the email. Replace this with a real
// database + password hashing when you wire up production auth.
const DEMO_USERS: Record<string, { name: string; phone: string }> = {
  'demo@thepromise.ng': { name: 'Chidinma Okafor', phone: '0803 000 0000' },
};

interface LoginBody {
  email?: string;
  password?: string;
}

export async function POST(request: NextRequest) {
  let body: LoginBody;
  try {
    body = (await request.json()) as LoginBody;
  } catch {
    return NextResponse.json({ message: 'Invalid request body.' }, { status: 400 });
  }

  const { email, password } = body;

  if (!email || !password) {
    return NextResponse.json({ message: 'Email and password are required.' }, { status: 400 });
  }

  const key = email.toLowerCase().trim();
  const seed = DEMO_USERS[key] || { name: key.split('@')[0], phone: '' };

  const user: User = {
    email: key,
    name: seed.name,
    phone: seed.phone,
  };

  const token = createToken(user);

  return NextResponse.json({ token, user });
}
