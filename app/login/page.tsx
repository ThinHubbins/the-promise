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
    <main className="auth-shell">
      <div className="auth-bg" aria-hidden="true" />

      <div className="auth-grid">
        <section className="auth-form-panel">
          <div className="auth-form-inner">
            <span className="section-tag">Welcome back</span>
            <h2 style={{ marginBottom: 10 }}>Log in to The Promise</h2>
            <p style={{ color: 'var(--ink-soft)', marginBottom: 32 }}>
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

            <p style={{ fontSize: '0.85rem', marginTop: 22 }}>
              Don&apos;t have an account? <Link href="/signup" style={{ textDecoration: 'underline' }}>Sign up</Link>
            </p>
            <p style={{ fontSize: '0.8rem', color: 'var(--ink-soft)', marginTop: 10 }}>
              Demo auth — any email/password combination works against the local API route.
              Try <strong>demo@thepromise.ng</strong> for a pre-filled profile.
            </p>
            <p style={{ fontSize: '0.85rem', marginTop: 12 }}>
              <Link href="/" style={{ textDecoration: 'underline' }}>&larr; Back to the menu</Link>
            </p>
          </div>
        </section>

        <section className="auth-brand-panel">
          <div className="auth-brand-pattern" aria-hidden="true" />
          <div className="auth-brand-content">
            <span className="auth-brand-eyebrow">Since 2000</span>
            <div className="auth-brand-number">25</div>
            <p className="auth-brand-line">years of feeding Nigeria, one promise at a time.</p>
          </div>
        </section>
      </div>

      <style jsx>{`
        .auth-shell {
          position: relative;
          min-height: 100vh;
          background: #fafaf8;
        }

        .auth-bg {
          display: none;
        }

        .auth-grid {
          display: grid;
          grid-template-columns: minmax(0, 560px) 1fr;
          min-height: 100vh;
        }

        .auth-form-panel {
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 48px;
        }

        .auth-form-inner {
          width: 100%;
          max-width: 400px;
        }

        .auth-brand-panel {
          position: relative;
          overflow: hidden;
          margin: 16px 16px 16px 0;
          border-radius: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: radial-gradient(120% 140% at 15% 10%, #C4293B 0%, #8A1826 55%, #5C0F1A 100%);
        }

        .auth-brand-pattern {
          position: absolute;
          inset: 0;
          opacity: 0.08;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='140' height='140' viewBox='0 0 140 140'%3E%3Cg fill='none' stroke='%23FFFFFF' stroke-width='1.4'%3E%3Ccircle cx='40' cy='40' r='22'/%3E%3Cline x1='95' y1='20' x2='95' y2='60'/%3E%3Cline x1='102' y1='20' x2='102' y2='45'/%3E%3Cline x1='109' y1='20' x2='109' y2='45'/%3E%3Cpath d='M95 45c0 8 14 8 14 0'/%3E%3C/g%3E%3C/svg%3E");
          background-size: 140px 140px;
        }

        .auth-brand-content {
          position: relative;
          z-index: 1;
          max-width: 340px;
          padding: 0 48px;
          text-align: left;
        }

        .auth-brand-eyebrow {
          display: inline-block;
          font-size: 0.85rem;
          letter-spacing: 0.02em;
          color: #F2C879;
          margin-bottom: 12px;
        }

        .auth-brand-number {
          font-family: Georgia, 'Times New Roman', serif;
          font-size: 9rem;
          line-height: 0.85;
          color: #F2C879;
          font-weight: 500;
          margin-bottom: 20px;
        }

        .auth-brand-line {
          font-family: Georgia, 'Times New Roman', serif;
          font-size: 1.35rem;
          line-height: 1.4;
          color: #FBEFE3;
        }

        @media (max-width: 1024px) {
          .auth-grid {
            grid-template-columns: 1fr 42vw;
          }

          .auth-brand-number {
            font-size: 6.5rem;
          }

          .auth-brand-line {
            font-size: 1.1rem;
          }

          .auth-brand-content {
            padding: 0 32px;
          }
        }

        @media (max-width: 860px) {
          .auth-grid {
            grid-template-columns: 1fr;
          }

          .auth-brand-panel {
            display: none;
          }

          .auth-bg {
            display: block;
            position: fixed;
            inset: 0;
            z-index: -1;
            background: radial-gradient(140% 100% at 20% 0%, #C4293B 0%, #8A1826 55%, #4A0C15 100%);
          }

          .auth-form-panel {
            min-height: 100vh;
            padding: 24px 20px;
          }

          .auth-form-inner {
            background: rgba(255, 255, 255, 0.97);
            border-radius: 20px;
            padding: 32px 24px;
            box-shadow: 0 24px 60px rgba(0, 0, 0, 0.4);
          }
        }
      `}</style>
    </main>
  );
}