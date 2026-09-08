'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Html5Qrcode, Html5QrcodeScannerState } from 'html5-qrcode';

export default function ScanAttendancePage() {
  const router = useRouter();
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const isRunningRef = useRef(false);
  const [status, setStatus] = useState<'scanning' | 'submitting' | 'success' | 'error'>('scanning');
  const [message, setMessage] = useState('Point your camera at the outlet QR code.');

  useEffect(() => {
    const scanner = new Html5Qrcode('qr-reader');
    scannerRef.current = scanner;
    let stopped = false;
    let cancelled = false;

    async function safeStop() {
      if (!isRunningRef.current) return;
      try {
        // Extra guard: some versions expose getState(); only stop if actually scanning.
        if (
          typeof scanner.getState === 'function' &&
          scanner.getState() !== Html5QrcodeScannerState.SCANNING
        ) {
          isRunningRef.current = false;
          return;
        }
        await scanner.stop();
      } catch (err) {
        // stop() can throw synchronously if the scanner isn't actually running.
        console.warn('Scanner stop skipped:', err);
      } finally {
        isRunningRef.current = false;
      }
    }

    scanner
      .start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: 250 },
        async (decodedText) => {
          if (stopped || cancelled) return;
          stopped = true;
          await safeStop();
          if (!cancelled) await handleScan(decodedText);
        },
        () => {}
      )
      .then(() => {
        if (cancelled) {
          // Effect was cleaned up before start() resolved — stop immediately.
          isRunningRef.current = true;
          safeStop();
          return;
        }
        isRunningRef.current = true;
      })
      .catch((err) => {
        console.error('Camera start failed', err);
        if (!cancelled) {
          setStatus('error');
          setMessage('Could not access camera. Please allow camera permission and try again.');
        }
      });

    return () => {
      cancelled = true;
      safeStop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleScan(decodedText: string) {
    setStatus('submitting');
    setMessage('Checking…');
    try {
      const res = await fetch('/api/attendance/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ payload: decodedText }),
      });
      const body = await res.json();
      if (!res.ok) {
        setStatus('error');
        setMessage(body.error || 'Could not record attendance.');
        return;
      }
      setStatus('success');
      setMessage(body.message);
    } catch (err) {
      console.error(err);
      setStatus('error');
      setMessage('Something went wrong. Please try again.');
    }
  }

  return (
    <main>
      <div className="wrap admin-wrap">
        <div className="admin-header">
          <div>
            <span className="section-tag">The Promise Staff</span>
            <h2>Scan Attendance QR</h2>
          </div>
        </div>
        <div className="admin-card" style={{ padding: '1.5rem', textAlign: 'center' }}>
          {status === 'scanning' && (
            <div id="qr-reader" style={{ width: '100%', maxWidth: 360, margin: '0 auto' }} />
          )}
          <p style={{ marginTop: '1rem' }}>{message}</p>
          {(status === 'success' || status === 'error') && (
            <button
              className="btn btn-primary btn-sm"
              style={{ marginTop: '1rem' }}
              onClick={() => router.push('/staff/dashboard')}
            >
              Back to dashboard
            </button>
          )}
        </div>
      </div>
    </main>
  );
}