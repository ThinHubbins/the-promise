'use client';

import { useEffect, useState } from 'react';
import { fetchApprovedFeedbacks } from '../../lib/feedbacks';
import type { Feedback } from '../../lib/types';
import StarRating from '../../components/StarRating';
import FeedbackForm from '../../components/FeedBackForm';

function initials(name: string): string {
  return name.split(' ').filter(Boolean).slice(0, 2).map((p) => p[0]?.toUpperCase()).join('');
}

export default function FeedbacksPage() {
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      setFeedbacks(await fetchApprovedFeedbacks());
    } catch (err) {
      console.error('Failed to load feedback', err);
      setError('Could not load reviews right now. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const avg = feedbacks.length > 0 ? feedbacks.reduce((s, f) => s + f.rating, 0) / feedbacks.length : 0;

  return (
    <main>
      <div className="wrap feedbacks-wrap">
        <div className="section-head">
          <div>
            <span className="section-tag">Customer Feedback</span>
            <h2>What our customers say</h2>
            <p>Real experiences from people who&apos;ve ordered from The Promise.</p>
          </div>
        </div>

        {!loading && !error && feedbacks.length > 0 && (
          <div className="feedback-summary">
            <span className="feedback-summary-number">{avg.toFixed(1)}<span className="feedback-summary-out-of">/5</span></span>
            <StarRating value={Math.round(avg)} readOnly size="lg" />
            <span className="feedback-summary-count">
              Based on {feedbacks.length} {feedbacks.length === 1 ? 'review' : 'reviews'}
            </span>
          </div>
        )}

        <FeedbackForm onSubmitted={load} />

        <div className="dash-section-head-row"><h3>Recent Reviews</h3></div>

        {loading ? (
          <div className="reviews-loading">
            <span className="reviews-spinner" />
            Loading reviews...
          </div>
        ) : error ? (
          <div className="admin-error-banner">
            <p>{error}</p>
            <button className="btn btn-outline btn-sm" onClick={load}>Retry</button>
          </div>
        ) : feedbacks.length === 0 ? (
          <div className="reviews-empty">
            <span className="reviews-empty-icon">💬</span>
            <p>No reviews yet. Be the first to share your experience above.</p>
          </div>
        ) : (
          <div className="review-list">
            {feedbacks.map((f) => (
              <div className="review-card" key={f.id}>
                <div className="review-avatar">{initials(f.customerName)}</div>
                <div className="review-body">
                  <div className="review-card-head">
                    <span className="review-user">{f.customerName}</span>
                    <span className="review-date">
                      {new Date(f.createdAt).toLocaleDateString('en-NG', { dateStyle: 'medium' })}
                    </span>
                  </div>
                  <StarRating value={f.rating} readOnly size="sm" />
                  <p className="review-comment">{f.comment}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}