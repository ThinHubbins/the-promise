'use client';

import { useState, useEffect, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '../../context/AuthContext';

export default function LoginPage() {
  const { login, user, loading } = useAuth();
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && user) {
      router.replace('/dashboard');
    }
  }, [loading, user, router]);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await login(email, password);
      router.push('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not log in.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main>
      <section style={{ paddingTop: 64 }}>
        <div className="wrap" style={{ maxWidth: 440 }}>
          <span className="section-tag">Welcome back</span>
          <h2 style={{ marginBottom: 10 }}>Log in to The Promise</h2>
          <p style={{ color: 'var(--ink-soft)', marginBottom: 30 }}>
            Log in to check out your order, track delivery in real time and view your payment history.
          </p>

          <form onSubmit={handleSubmit}>
            <div className="field">
              <label htmlFor="email">Email address</label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
              />
            </div>
            <div className="field">
              <label htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
              />
            </div>

            {error && (
              <p style={{ color: 'var(--red)', fontSize: '0.85rem', marginBottom: 16 }}>{error}</p>
            )}

            <button type="submit" className="btn btn-primary btn-full" disabled={submitting}>
              {submitting ? 'Logging in…' : 'Log in'}
            </button>
          </form>

          <p style={{ fontSize: '0.8rem', color: 'var(--ink-soft)', marginTop: 22 }}>
            Demo auth — any email/password combination works against the local API route.
            Try <strong>demo@thepromise.ng</strong> for a pre-filled profile.
          </p>
          <p style={{ fontSize: '0.85rem', marginTop: 12 }}>
            <Link href="/" style={{ textDecoration: 'underline' }}>&larr; Back to the menu</Link>
          </p>
        </div>
      </section>
    </main>
  );
}
