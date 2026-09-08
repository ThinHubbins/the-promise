'use client';

import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { submitFeedback } from '../lib/feedbacks';
import StarRating from './StarRating';

export default function FeedbackForm({ onSubmitted }: { onSubmitted: () => void }) {
  const { user } = useAuth();
  const accountName = (user?.user_metadata?.full_name as string | undefined) ?? user?.email ?? '';

  const [name, setName] = useState('');
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<'success' | 'error' | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setResult(null);

    const finalName = user ? accountName : name.trim();

    if (!finalName) {
      setError('Please tell us your name.');
      return;
    }
    if (rating === 0) {
      setError('Please select a star rating.');
      return;
    }
    if (!comment.trim()) {
      setError('Please share a few words about your experience.');
      return;
    }

    setSubmitting(true);
   try {
  await submitFeedback({
    userId: user?.id ?? null,
    customerName: finalName,
    rating,
    comment: comment.trim(),
  });
  setResult('success');
  setRating(0);
  setComment('');
  setName('');
  onSubmitted();
} catch (err: any) {
  console.error('Failed to submit feedback:', {
    message: err?.message,
    details: err?.details,
    hint: err?.hint,
    code: err?.code,
  });
  setResult('error');
} finally {
  setSubmitting(false);
}
  }

  return (
    <form className="review-form feedback-form" onSubmit={handleSubmit}>
      <h3>Share your experience</h3>

      {!user && (
        <div className="field">
          <label htmlFor="fb-name">Your name</label>
          <input id="fb-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Amaka O." />
        </div>
      )}

      <div className="review-form-head">
        <label>Your rating</label>
        <StarRating value={rating} onChange={setRating} size="lg" />
      </div>

      <textarea
        placeholder="Tell us about your experience with The Promise..."
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        rows={4}
      />

      {error && <p className="review-error">{error}</p>}
      {result === 'success' && (
        <p className="feedback-success">
          Thank you! Your review has been submitted and will appear once approved.
        </p>
      )}
      {result === 'error' && (
        <p className="review-error">Something went wrong submitting your review. Please try again.</p>
      )}

      <button className="btn btn-primary" type="submit" disabled={submitting}>
        {submitting ? 'Submitting...' : 'Submit review'}
      </button>
    </form>
  );
}