'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { staffSignIn, staffSignUp, staffSignOut, getStaffByEmail } from '../../../lib/staffAuth';

export default function StaffLoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
  e.preventDefault();
  setError(null);
  setLoading(true);
  try {
    if (mode === 'signup') {
      const { user, session } = await staffSignUp(email, password);
      if (!user) {
        setError('Sign up failed. Please try again.');
        return;
      }
      if (!session) {
        // Email confirmation required — no active session yet.
        setError('Check your inbox and confirm your email, then come back and sign in.');
        setMode('signin');
        return;
      }
      // Confirmation not required — session exists immediately.
      const staff = await getStaffByEmail(user.email ?? email);
      if (!staff) {
        await staffSignOut();
        setError('No staff record found for this email. Contact your admin.');
        return;
      }
      router.push('/staff/dashboard');
      return;
    }

    // Sign in
    const user = await staffSignIn(email, password);
    if (!user) {
      setError('Login failed.');
      return;
    }
    const staff = await getStaffByEmail(user.email ?? email);
    if (!staff) {
      await staffSignOut();
      setError('No staff record found for this email. Contact your admin.');
      return;
    }
    router.push('/staff/dashboard');
  } catch (err: any) {
    setError(err?.message ?? 'Something went wrong. Please try again.');
  } finally {
    setLoading(false);
  }
}

  return (
    <main>
      <div className="wrap admin-login-wrap">
        <div className="admin-login-card">
          <span className="section-tag">The Promise Staff</span>
          <h2>{mode === 'signin' ? 'Staff Login' : 'Staff Sign Up'}</h2>
          <p>Sign in with the email your admin added you with.</p>

          <form onSubmit={handleSubmit} className="admin-login-form">
            <div className="field">
              <label htmlFor="staff-email">Email</label>
              <input
                id="staff-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="field">
              <label htmlFor="staff-password">Password</label>
              <input
                id="staff-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>
            {error && <p className="review-error">{error}</p>}
            <button className="btn btn-primary btn-full" type="submit" disabled={loading}>
              {loading ? 'Please wait…' : mode === 'signin' ? 'Sign in' : 'Sign up'}
            </button>
          </form>

          <button
            type="button"
            className="btn btn-outline btn-full"
            style={{ marginTop: '0.75rem' }}
            onClick={() => {
              setMode(mode === 'signin' ? 'signup' : 'signin');
              setError(null);
            }}
          >
            {mode === 'signin' ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
          </button>
        </div>
      </div>
    </main>
  );
}