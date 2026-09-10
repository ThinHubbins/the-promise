// app/order/confirmation/page.tsx
'use client';

import { Suspense, useEffect, useRef, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAuth } from '../../../context/AuthContext';
import { useCart } from '../../../context/CartContext';

type PollStatus = 'checking' | 'paid' | 'payment_failed' | 'timeout';

const MAX_ATTEMPTS = 15;
const POLL_INTERVAL_MS = 2000;

function CheckIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="11" fill="currentColor" opacity="0.12" />
      <path d="M7 12.5l3.2 3.2L17 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function AlertIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="11" fill="currentColor" opacity="0.12" />
      <path d="M12 7.5v5.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <circle cx="12" cy="16.3" r="1.15" fill="currentColor" />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="11" fill="currentColor" opacity="0.12" />
      <path d="M12 7v5.2l3.4 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function Spinner() {
  return (
    <svg className="spinner" width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="9.5" stroke="currentColor" strokeWidth="2" opacity="0.15" />
      <path d="M21.5 12a9.5 9.5 0 0 0-9.5-9.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function StatusCard({
  tone,
  icon,
  title,
  message,
  ref,
  children,
}: {
  tone: 'neutral' | 'success' | 'danger' | 'warning';
  icon: React.ReactNode;
  title: string;
  message: string;
  ref: string | null;
  children?: React.ReactNode;
}) {
  return (
    <div className={`status-card status-card--${tone}`}>
      <div className="status-icon">{icon}</div>
      <h2 className="status-title">{title}</h2>
      <p className="status-message">{message}</p>
      {ref && (
        <p className="status-ref">
          Reference <span>{ref}</span>
        </p>
      )}
      {children && <div className="status-actions">{children}</div>}

      <style jsx>{`
        .status-card {
          max-width: 420px;
          margin: 0 auto;
          padding: 40px 32px 32px;
          border-radius: 16px;
          background: var(--card-bg, #fff);
          border: 1px solid var(--card-border, rgba(0, 0, 0, 0.08));
          box-shadow: 0 1px 2px rgba(16, 24, 40, 0.04), 0 8px 24px rgba(16, 24, 40, 0.06);
          animation: rise 0.35s ease-out;
        }
        .status-icon {
          width: 56px;
          height: 56px;
          margin: 0 auto 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
        }
        .status-card--neutral .status-icon { color: #6b7280; background: rgba(107, 114, 128, 0.08); }
        .status-card--success .status-icon { color: #16a34a; background: rgba(22, 163, 74, 0.1); }
        .status-card--danger .status-icon { color: #dc2626; background: rgba(220, 38, 38, 0.1); }
        .status-card--warning .status-icon { color: #d97706; background: rgba(217, 119, 6, 0.1); }

        .status-title {
          margin: 0 0 8px;
          font-size: 1.25rem;
          font-weight: 600;
          letter-spacing: -0.01em;
        }
        .status-message {
          margin: 0;
          color: var(--text-muted, #667085);
          font-size: 0.95rem;
          line-height: 1.5;
        }
        .status-ref {
          margin: 16px 0 0;
          font-size: 0.8rem;
          color: var(--text-muted, #98a2b3);
        }
        .status-ref span {
          font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
          color: var(--text-secondary, #475467);
        }
        .status-actions {
          margin-top: 24px;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        @keyframes rise {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @media (prefers-reduced-motion: reduce) {
          .status-card { animation: none; }
        }
      `}</style>
    </div>
  );
}

function ConfirmationInner() {
  const params = useSearchParams();
  const router = useRouter();
  const { user } = useAuth();
  const { clearCart } = useCart();
  const ref = params.get('ref');

  const [status, setStatus] = useState<PollStatus>('checking');
  const [attemptCount, setAttemptCount] = useState(0);
  const attempts = useRef(0);

  useEffect(() => {
    if (!ref) {
      setStatus('timeout');
      return;
    }
    let cancelled = false;

    async function poll() {
      attempts.current += 1;
      setAttemptCount(attempts.current);
      try {
        const res = await fetch(`/api/payments/opay/status?ref=${encodeURIComponent(ref!)}`);
        const data = await res.json();
        if (cancelled) return;

        if (res.ok && data.status === 'paid') {
          clearCart();
          if (user) {
            try {
              const key = `notifications:${user.id}`;
              const raw = localStorage.getItem(key);
              const prev = raw ? JSON.parse(raw) : [];
              localStorage.setItem(
                key,
                JSON.stringify([
                  {
                    id: `${ref}-${Date.now()}`,
                    orderId: ref,
                    message: 'Your payment was confirmed and your order has been placed.',
                    date: new Date().toISOString(),
                    read: false,
                  },
                  ...prev,
                ])
              );
            } catch {}
          }
          setStatus('paid');
          return;
        }
        if (res.ok && data.status === 'payment_failed') {
          setStatus('payment_failed');
          return;
        }
      } catch (err) {
        console.error('Status check failed', err);
      }

      if (attempts.current >= MAX_ATTEMPTS) {
        setStatus('timeout');
        return;
      }
      setTimeout(poll, POLL_INTERVAL_MS);
    }

    poll();
    return () => {
      cancelled = true;
    };
  }, [ref, clearCart, user]);

  const progress = Math.min(attemptCount / MAX_ATTEMPTS, 1);

  return (
    <div className="confirmation-wrap">
      {status === 'checking' && (
        <StatusCard
          tone="neutral"
          icon={<Spinner />}
          title="Confirming your payment"
          message="This usually takes a few seconds. Please don't close this page."
          ref={ref}
        >
          <div className="progress-track" role="progressbar" aria-valuenow={Math.round(progress * 100)} aria-valuemin={0} aria-valuemax={100}>
            <div className="progress-fill" style={{ width: `${progress * 100}%` }} />
          </div>
        </StatusCard>
      )}

      {status === 'paid' && (
        <StatusCard
          tone="success"
          icon={<CheckIcon />}
          title="Payment confirmed"
          message="Your order has been placed and is being prepared."
          ref={ref}
        >
          <button className="btn btn-primary" onClick={() => router.push('/dashboard')}>
            Track your order
          </button>
        </StatusCard>
      )}

      {status === 'payment_failed' && (
        <StatusCard
          tone="danger"
          icon={<AlertIcon />}
          title="Payment failed"
          message="Your card or wallet wasn't charged successfully. No order was placed."
          ref={ref}
        >
          <button className="btn btn-primary" onClick={() => router.push('/dashboard')}>
            Back to dashboard
          </button>
        </StatusCard>
      )}

      {status === 'timeout' && (
        <StatusCard
          tone="warning"
          icon={<ClockIcon />}
          title="Still confirming"
          message="This is taking longer than expected. Check your orders in a minute — we'll update it as soon as we hear back."
          ref={ref}
        >
          <button className="btn btn-outline" onClick={() => router.push('/dashboard')}>
            Go to dashboard
          </button>
        </StatusCard>
      )}

      <style jsx>{`
        .confirmation-wrap {
          min-height: 70vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 32px 16px;
        }
        .progress-track {
          width: 100%;
          height: 4px;
          border-radius: 999px;
          background: rgba(0, 0, 0, 0.06);
          overflow: hidden;
        }
        .progress-fill {
          height: 100%;
          background: currentColor;
          color: #6b7280;
          border-radius: 999px;
          transition: width 0.4s ease;
        }
        :global(.spinner) {
          animation: spin 0.9s linear infinite;
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @media (prefers-reduced-motion: reduce) {
          :global(.spinner) { animation-duration: 2.4s; }
          .progress-fill { transition: none; }
        }
      `}</style>
    </div>
  );
}

export default function OrderConfirmationPage() {
  return (
    <main>
      <Suspense fallback={null}>
        <ConfirmationInner />
      </Suspense>
    </main>
  );
}