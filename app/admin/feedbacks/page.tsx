'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getCurrentUser, checkIsAdmin, adminSignOut } from '../../../lib/admin';
import { fetchAllFeedbacks, updateFeedbackStatus, deleteFeedback } from '../../../lib/feedbacks';
import type { Feedback } from '../../../lib/types';
import StarRating from '../../../components/StarRating';

type StatusFilter = 'all' | 'pending' | 'approved' | 'rejected';
type RatingFilter = 'all' | '1' | '2' | '3' | '4' | '5';

export default function AdminFeedbacksPage() {
  const router = useRouter();

  const [checkingAuth, setCheckingAuth] = useState(true);
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [ratingFilter, setRatingFilter] = useState<RatingFilter>('all');

  useEffect(() => {
    (async () => {
      try {
        const user = await getCurrentUser();
        if (!user) return router.replace('/admin/login');
        const ok = await checkIsAdmin(user.id);
        if (!ok) {
          await adminSignOut();
          return router.replace('/admin/login');
        }
        setCheckingAuth(false);
      } catch {
        router.replace('/admin/login');
      }
    })();
  }, [router]);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      setFeedbacks(await fetchAllFeedbacks());
    } catch (err) {
      console.error('Failed to load feedback', err);
      setError('Could not load reviews. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!checkingAuth) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [checkingAuth]);

  if (checkingAuth) {
    return (
      <main>
        <div className="wrap admin-loading-wrap"><p>Checking access…</p></div>
      </main>
    );
  }

  const total = feedbacks.length;
  const pending = feedbacks.filter((f) => f.status === 'pending').length;
  const approved = feedbacks.filter((f) => f.status === 'approved');
  const avgRating = approved.length > 0 ? approved.reduce((s, f) => s + f.rating, 0) / approved.length : 0;

  const visible = feedbacks.filter(
    (f) =>
      (statusFilter === 'all' || f.status === statusFilter) &&
      (ratingFilter === 'all' || f.rating === Number(ratingFilter))
  );

  async function handleApprove(id: string) {
    setBusyId(id);
    try {
      await updateFeedbackStatus(id, 'approved');
      setFeedbacks((prev) => prev.map((f) => (f.id === id ? { ...f, status: 'approved' } : f)));
    } catch (err) {
      console.error('Failed to approve', err);
    } finally {
      setBusyId(null);
    }
  }

  async function handleReject(id: string) {
    setBusyId(id);
    try {
      await updateFeedbackStatus(id, 'rejected');
      setFeedbacks((prev) => prev.map((f) => (f.id === id ? { ...f, status: 'rejected' } : f)));
    } catch (err) {
      console.error('Failed to reject', err);
    } finally {
      setBusyId(null);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this review permanently?')) return;
    setBusyId(id);
    try {
      await deleteFeedback(id);
      setFeedbacks((prev) => prev.filter((f) => f.id !== id));
    } catch (err) {
      console.error('Failed to delete', err);
    } finally {
      setBusyId(null);
    }
  }

  async function handleSignOut() {
    await adminSignOut();
    router.push('/admin/login');
  }

  return (
    <main>
      <div className="wrap admin-wrap">
        <div className="admin-header">
          <div>
            <span className="section-tag">The Promise Admin</span>
            <h2>Customer Reviews</h2>
            <p>Moderate and monitor customer feedback.</p>
          </div>
          <div className="admin-header-actions">
            <Link href="/admin" className="btn btn-outline btn-sm">Sales Analytics</Link>
            <button className="btn btn-outline btn-sm" onClick={load} disabled={loading}>
              {loading ? 'Refreshing…' : 'Refresh'}
            </button>
            <button className="btn btn-outline btn-sm" onClick={handleSignOut}>Sign out</button>
          </div>
        </div>

        {error && (
          <div className="admin-error-banner">
            <p>{error}</p>
            <button className="btn btn-outline btn-sm" onClick={load}>Retry</button>
          </div>
        )}

        {loading ? (
          <div className="admin-loading-block">
            <span className="reviews-spinner" />
            <p>Loading reviews…</p>
          </div>
        ) : (
          <>
            <div className="dash-stats admin-stats-3">
              <div className="dash-stat-card">
                <span className="dash-stat-label">Average Rating</span>
                <span className="dash-stat-value">{approved.length > 0 ? avgRating.toFixed(1) : '—'}</span>
              </div>
              <div className="dash-stat-card">
                <span className="dash-stat-label">Total Reviews</span>
                <span className="dash-stat-value">{total}</span>
              </div>
              <div className="dash-stat-card">
                <span className="dash-stat-label">Pending</span>
                <span className="dash-stat-value">{pending}</span>
              </div>
            </div>

            <div className="dash-section-head-row admin-filter-row">
              <h3>All Reviews</h3>
              <div className="admin-filter-controls">
                <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}>
                  <option value="all">All statuses</option>
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                </select>
                <select value={ratingFilter} onChange={(e) => setRatingFilter(e.target.value as RatingFilter)}>
                  <option value="all">All ratings</option>
                  {[5, 4, 3, 2, 1].map((r) => (
                    <option key={r} value={r}>{r} star{r > 1 ? 's' : ''}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="admin-card">
              {visible.length === 0 ? (
                <p className="reviews-empty">No reviews match this filter.</p>
              ) : (
                <div className="admin-table-wrap">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Customer</th>
                        <th>Rating</th>
                        <th>Review</th>
                        <th>Date</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {visible.map((f) => (
                        <tr key={f.id}>
                          <td>{f.customerName}</td>
                          <td><StarRating value={f.rating} readOnly size="sm" /></td>
                          <td className="admin-feedback-comment">{f.comment}</td>
                          <td>{new Date(f.createdAt).toLocaleDateString('en-NG', { dateStyle: 'medium' })}</td>
                          <td><span className={`status-badge status-${f.status}`}>{f.status}</span></td>
                          <td>
                            <div className="admin-row-actions">
                              {f.status !== 'approved' && (
                                <button className="btn btn-outline btn-sm" disabled={busyId === f.id} onClick={() => handleApprove(f.id)}>
                                  Approve
                                </button>
                              )}
                              {f.status !== 'rejected' && (
                                <button className="btn btn-outline btn-sm" disabled={busyId === f.id} onClick={() => handleReject(f.id)}>
                                  Reject
                                </button>
                              )}
                              <button className="dash-cart-remove" disabled={busyId === f.id} onClick={() => handleDelete(f.id)}>
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </main>
  );
}