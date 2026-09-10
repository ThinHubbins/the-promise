// app/order/confirmation/page.tsx
'use client';

import { Suspense, useEffect, useRef, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAuth } from '../../../context/AuthContext';
import { useCart } from '../../../context/CartContext';

type PollStatus = 'checking' | 'paid' | 'payment_failed' | 'timeout';

function ConfirmationInner() {
  const params = useSearchParams();
  const router = useRouter();
  const { user } = useAuth();
  const { clearCart } = useCart();
  const ref = params.get('ref');

  const [status, setStatus] = useState<PollStatus>('checking');
  const attempts = useRef(0);

  useEffect(() => {
    if (!ref) {
      setStatus('timeout');
      return;
    }
    let cancelled = false;

    async function poll() {
      attempts.current += 1;
      try {
        const res = await fetch(`/api/payments/opay/status?ref=${encodeURIComponent(ref!)}`);
        const data = await res.json();
        if (cancelled) return;

        if (res.ok && data.status === 'paid') {
          clearCart();
          if (user) {
            // Mirror the dashboard's notification shape so it shows up
            // once the user navigates back there.
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

      // Give the webhook up to ~30s to land before giving up.
      if (attempts.current >= 15) {
        setStatus('timeout');
        return;
      }
      setTimeout(poll, 2000);
    }

    poll();
    return () => {
      cancelled = true;
    };
  }, [ref, clearCart, user]);

  return (
    <div className="wrap" style={{ paddingTop: 64, textAlign: 'center' }}>
      {status === 'checking' && <p>Confirming your payment…</p>}

      {status === 'paid' && (
        <>
          <h2>Payment confirmed 🎉</h2>
          <p>Your order is being prepared.</p>
          <button className="btn btn-primary" onClick={() => router.push('/dashboard')}>
            Track your order
          </button>
        </>
      )}

      {status === 'payment_failed' && (
        <>
          <h2>Payment failed</h2>
          <p>Your card or wallet wasn&apos;t charged successfully.</p>
          <button className="btn btn-primary" onClick={() => router.push('/dashboard')}>
            Back to dashboard
          </button>
        </>
      )}

      {status === 'timeout' && (
        <>
          <h2>Still confirming…</h2>
          <p>This is taking longer than expected — check your orders in a minute.</p>
          <button className="btn btn-outline" onClick={() => router.push('/dashboard')}>
            Go to dashboard
          </button>
        </>
      )}
    </div>
  );
}

export default function OrderConfirmationPage() {
  // useSearchParams needs a Suspense boundary for the app router build.
  return (
    <main>
      <Suspense fallback={null}>
        <ConfirmationInner />
      </Suspense>
    </main>
  );
}