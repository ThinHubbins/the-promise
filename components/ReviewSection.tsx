'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import { fetchReviews, createReview } from '../lib/reviews';
import type { Review } from '../lib/types';

function StarRating({
  value,
  onChange,
  readOnly = false,
  size = 'md',
}: {
  value: number;
  onChange?: (v: number) => void;
  readOnly?: boolean;
  size?: 'sm' | 'md' | 'lg';
}) {
  const [hovered, setHovered] = useState(0);
  const active = hovered || value;

  return (
    <div
      className={`star-rating star-rating-${size}${readOnly ? ' readonly' : ''}`}
      onMouseLeave={() => setHovered(0)}
    >
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          disabled={readOnly}
          className={`star${n <= active ? ' filled' : ''}`}
          onClick={() => onChange?.(n)}
          onMouseEnter={() => !readOnly && setHovered(n)}
          aria-label={`${n} star${n > 1 ? 's' : ''}`}
        >
          ★
        </button>
      ))}
    </div>
  );
}

function initials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('');
}

function ratingBreakdown(reviews: Review[]) {
  const counts = [0, 0, 0, 0, 0]; // index 0 = 1 star ... index 4 = 5 star
  reviews.forEach((r) => {
    if (r.rating >= 1 && r.rating <= 5) counts[r.rating - 1]++;
  });
  return counts;
}

export default function ReviewsSection({ dishId }: { dishId: string })  {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [reviews, setReviews] = useState<Review[]>([]);
  const [fetching, setFetching] = useState(true);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const data = await fetchReviews(dishId);
        setReviews(data);
      } catch (err) {
        console.error('Failed to load reviews', err);
      } finally {
        setFetching(false);
      }
    })();
  }, [dishId]);

  const avgRating =
    reviews.length > 0 ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length : 0;
  const breakdown = ratingBreakdown(reviews);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    if (rating === 0) {
      setError('Please select a star rating.');
      return;
    }
    if (!comment.trim()) {
      setError('Please write a short comment.');
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const userName =
        (user.user_metadata?.full_name as string | undefined) ?? user.email ?? 'Anonymous';
      const newReview = await createReview(user.id, userName, dishId, rating, comment.trim());
      setReviews((prev) => [newReview, ...prev]);
      setRating(0);
      setComment('');
      setShowForm(false);
    } catch (err) {
      console.error('Failed to submit review', err);
      setError('Something went wrong submitting your review. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="reviews-section">
      <div className="reviews-summary">
        <div className="reviews-summary-score">
          <span className="reviews-summary-number">{avgRating.toFixed(1)}</span>
          <StarRating value={Math.round(avgRating)} readOnly size="lg" />
          <span className="reviews-summary-count">
            {reviews.length} {reviews.length === 1 ? 'review' : 'reviews'}
          </span>
        </div>

        {reviews.length > 0 && (
          <div className="reviews-summary-bars">
            {[5, 4, 3, 2, 1].map((star) => {
              const count = breakdown[star - 1];
              const pct = reviews.length > 0 ? (count / reviews.length) * 100 : 0;
              return (
                <div className="reviews-bar-row" key={star}>
                  <span className="reviews-bar-label">{star}★</span>
                  <div className="reviews-bar-track">
                    <div className="reviews-bar-fill" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="reviews-bar-count">{count}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Write a review — only for logged-in users */}
      {loading ? null : user ? (
        showForm ? (
          <form className="review-form" onSubmit={handleSubmit}>
            <div className="review-form-head">
              <label>Your rating</label>
              <StarRating value={rating} onChange={setRating} size="lg" />
            </div>
            <textarea
              placeholder="What did you think of this dish?"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={3}
              autoFocus
            />
            {error && <p className="review-error">{error}</p>}
            <div className="review-form-actions">
              <button
                type="button"
                className="btn btn-outline btn-sm"
                onClick={() => {
                  setShowForm(false);
                  setError(null);
                }}
              >
                Cancel
              </button>
              <button className="btn btn-primary btn-sm" type="submit" disabled={submitting}>
                {submitting ? 'Posting...' : 'Post review'}
              </button>
            </div>
          </form>
        ) : (
          <button
  className="btn btn-outline review-write-btn"
  onClick={() => setShowForm(true)}
>
  <svg
    className="review-write-icon"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M12 20h9" />
    <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L8 18l-4 1 1-4Z" />
  </svg>

  Write a review
</button>
        )
      ) : (
        <div className="review-login-prompt">
          <p>Log in to share your experience with this dish.</p>
          <button className="btn btn-primary btn-sm" onClick={() => router.push('/login')}>
            Log in
          </button>
        </div>
      )}

      {/* Review list — visible to everyone */}
      <div className="review-list">
        {fetching ? (
          <div className="reviews-loading">
            <span className="reviews-spinner" />
            Loading reviews...
          </div>
        ) : reviews.length === 0 ? (
          <div className="reviews-empty">
            <span className="reviews-empty-icon" aria-hidden="true">
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5Z" />
    <path d="M8 12h.01" />
    <path d="M12 12h.01" />
    <path d="M16 12h.01" />
  </svg>
</span>

<p>No reviews yet. Be the first to share your thoughts.</p>
          </div>
        ) : (
          reviews.map((r) => (
            <div className="review-card" key={r.id}>
              <div className="review-avatar">{initials(r.userName)}</div>
              <div className="review-body">
                <div className="review-card-head">
                  <span className="review-user">{r.userName}</span>
                  <span className="review-date">
                    {new Date(r.date).toLocaleDateString('en-NG', { dateStyle: 'medium' })}
                  </span>
                </div>
                <StarRating value={r.rating} readOnly size="sm" />
                <p className="review-comment">{r.comment}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}