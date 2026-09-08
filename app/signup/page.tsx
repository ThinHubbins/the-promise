'use client';

import { useState, useEffect, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '../../context/AuthContext';

export default function SignupPage() {
  const { signup, user, session, loading } = useAuth();
  const router = useRouter();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [checkEmail, setCheckEmail] = useState(false);

  useEffect(() => {
    if (!loading && user && session) {
      router.replace('/dashboard');
    }
  }, [loading, user, session, router]);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setSubmitting(true);
    try {
      await signup(name, email, password);
      // If your Supabase project has "Confirm email" enabled, signUp
      // returns a user but no session — there's nothing to redirect
      // into yet, so show a "check your inbox" message instead.
      // AuthContext's onAuthStateChange will pick up the session and
      // redirect automatically once the user confirms and signs in.
      setCheckEmail(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create your account.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="auth-shell">
      <div className="auth-bg" aria-hidden="true" />

      <div className="auth-grid">
        {/* Brand panel — sits on the left for signup, desktop only */}
        <section className="auth-brand-panel">
          <div className="auth-brand-pattern" aria-hidden="true" />
          <div className="auth-brand-content">
            <span className="auth-brand-eyebrow">Since 2000</span>
            <div className="auth-brand-number">25</div>
            <p className="auth-brand-line">years of feeding Nigeria, one promise at a time.</p>
          </div>
        </section>

        {/* Form panel — on the right for signup */}
        <section className="auth-form-panel">
          <div className="auth-form-inner">
            <span className="section-tag">Join us</span>
            <h2 style={{ marginBottom: 10 }}>Create your account</h2>
            <p style={{ color: 'var(--ink-soft)', marginBottom: 32 }}>
              Sign up to place orders, track delivery in real time and save your details for next time.
            </p>

            {checkEmail ? (
              <p style={{ color: 'var(--ink-soft)' }}>
                Almost there — we&apos;ve sent a confirmation link to{' '}
                <strong>{email}</strong>. Click it to activate your account, then log in.
              </p>
            ) : (
              <form onSubmit={handleSubmit}>
                <div className="field">
                  <label htmlFor="name">Full name</label>
                  <input
                    id="name"
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your name"
                  />
                </div>
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
                    minLength={8}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                  />
                </div>
                <div className="field">
                  <label htmlFor="confirmPassword">Confirm password</label>
                  <input
                    id="confirmPassword"
                    type="password"
                    required
                    minLength={8}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                  />
                </div>

                {error && (
                  <p style={{ color: 'var(--red)', fontSize: '0.85rem', marginBottom: 16 }}>{error}</p>
                )}

                <button type="submit" className="btn btn-primary btn-full" disabled={submitting}>
                  {submitting ? 'Creating account…' : 'Sign up'}
                </button>
              </form>
            )}

            <p style={{ fontSize: '0.85rem', marginTop: 22 }}>
              Already have an account? <Link href="/login" style={{ textDecoration: 'underline' }}>Log in</Link>
            </p>
            <p style={{ fontSize: '0.85rem', marginTop: 12 }}>
              <Link href="/" style={{ textDecoration: 'underline' }}>&larr; Back to the menu</Link>
            </p>
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
          /* mirrored from login: brand column first, form column second */
          grid-template-columns: 1fr minmax(0, 560px);
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
          /* margin flipped: gap sits on the right side of the panel now */
          margin: 16px 0 16px 16px;
          border-radius: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: radial-gradient(120% 140% at 85% 10%, #C4293B 0%, #8A1826 55%, #5C0F1A 100%);
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
            grid-template-columns: 42vw 1fr;
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