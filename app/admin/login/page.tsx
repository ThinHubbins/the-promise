'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { adminSignIn, checkIsAdmin, adminSignOut } from '../../../lib/admin';

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const user = await adminSignIn(email, password);
      if (!user) throw new Error('Login failed.');
      const isAdmin = await checkIsAdmin(user.id);
      if (!isAdmin) {
        await adminSignOut();
        setError('This account is not authorized to access the admin dashboard.');
        return;
      }
      router.push('/admin');
    } catch (err: any) {
      setError(err?.message ?? 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main>
      <div className="wrap admin-login-wrap">
        <div className="admin-login-card">
          <span className="section-tag">The Promise Admin</span>
          <h2>Admin Login</h2>
          <p>Sign in to view sales analytics.</p>

          <form onSubmit={handleSubmit} className="admin-login-form">
            <div className="field">
              <label htmlFor="admin-email">Email</label>
              <input id="admin-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div className="field">
              <label htmlFor="admin-password">Password</label>
              <input id="admin-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>
            {error && <p className="review-error">{error}</p>}
            <button className="btn btn-primary btn-full" type="submit" disabled={loading}>
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}