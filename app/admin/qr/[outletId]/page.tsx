'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import QRCode from 'qrcode';
import { getCurrentUser, checkIsAdmin } from '../../../../lib/admin';
import { outlets } from '../../../../lib/outlets';

export default function OutletQrPage() {
  const router = useRouter();
  const params = useParams<{ outletId: string }>();
  const outletId = params.outletId;
  const outlet = outlets.find((o) => o.id === outletId);

  const [checkingAuth, setCheckingAuth] = useState(true);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<number | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const user = await getCurrentUser();
      if (!user) return router.replace('/admin/login');
      const ok = await checkIsAdmin(user.id);
      if (!ok) return router.replace('/admin/login');
      setCheckingAuth(false);
    })();
  }, [router]);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch(`/api/qr/${outletId}`);
      if (!res.ok) {
        const text = await res.text();
        let message = 'Could not load QR';
        try { message = JSON.parse(text).error || message; } catch {}
        setError(message);
        return;
      }
      const body = await res.json();
      const dataUrl = await QRCode.toDataURL(body.payload, { width: 320 });
      setQrDataUrl(dataUrl);
      setExpiresAt(body.expiresAt);
      setError(null);
    } catch (err) {
      console.error(err);
      setError('Could not load QR');
    }
  }, [outletId]);

  useEffect(() => {
    if (!checkingAuth) refresh();
  }, [checkingAuth, refresh]);

  useEffect(() => {
    if (!expiresAt) return;
    const tick = () => {
      const left = Math.max(0, Math.round((expiresAt - Date.now()) / 1000));
      setSecondsLeft(left);
      if (left <= 0) refresh();
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [expiresAt, refresh]);

  if (checkingAuth) {
    return <main><div className="wrap admin-loading-wrap"><p>Checking access…</p></div></main>;
  }
  if (!outlet) {
    return <main><div className="wrap admin-loading-wrap"><p>Unknown outlet.</p></div></main>;
  }

  return (
    <main>
      <div className="wrap admin-wrap">
        <div className="admin-header">
          <div>
            <span className="section-tag">The Promise Admin</span>
            <h2>{outlet.name} — Attendance QR</h2>
            <p>Refreshes automatically every 10 minutes.</p>
          </div>
        </div>
        <div className="admin-card" style={{ textAlign: 'center', padding: '2rem' }}>
          {error && <p className="review-error">{error}</p>}
          {qrDataUrl && (
            <>
              <img src={qrDataUrl} alt={`${outlet.name} attendance QR`} style={{ margin: '0 auto' }} />
              <p style={{ marginTop: '1rem' }}>Refreshes in {secondsLeft}s</p>
            </>
          )}
        </div>
      </div>
    </main>
  );
}