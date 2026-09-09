'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { hrSignIn, hrSignOut, checkIsHR } from '../../../lib/hrAuth';

export default function HRLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const user = await hrSignIn(email.trim(), password);

      const ok = await checkIsHR(user.id, user.email ?? null);
      if (!ok) {
        await hrSignOut();
        setError('This account is not authorized for HR access.');
        return;
      }

      router.replace('/hr/dashboard');
    } catch (err) {
      console.error('HR sign-in failed', err);
      setError('Invalid email or password.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="admin-login-wrap">
      <div className="admin-login-card">
        <span className="section-tag">The Promise</span>
        <h2>HR Portal Login</h2>
        <p style={{ color: 'var(--ink-soft)', fontSize: '0.9rem', marginTop: 6 }}>
          Sign in with your authorized HR account.
        </p>

        <form className="admin-login-form" onSubmit={handleSubmit}>
          <div className="field">
            <label htmlFor="hr-email">Email</label>
            <input
              id="hr-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="username"
              disabled={loading}
            />
          </div>

          <div className="field">
            <label htmlFor="hr-password">Password</label>
            <input
              id="hr-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              disabled={loading}
            />
          </div>

          {error && <p className="admin-error-text">{error}</p>}

          <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>
      </div>
    </main>
  );
}