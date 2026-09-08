'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getCurrentUser, checkIsAdmin } from '../../../lib/admin';
import { outlets } from '../../../lib/outlets';

export default function QrIndexPage() {
  const router = useRouter();
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    (async () => {
      const user = await getCurrentUser();
      if (!user) return router.replace('/admin/login');
      const ok = await checkIsAdmin(user.id);
      if (!ok) return router.replace('/admin/login');
      setCheckingAuth(false);
    })();
  }, [router]);

  if (checkingAuth) {
    return <main><div className="wrap admin-loading-wrap"><p>Checking access…</p></div></main>;
  }

  return (
    <main>
      <div className="wrap admin-wrap">
        <div className="admin-header">
          <div>
            <span className="section-tag">The Promise Admin</span>
            <h2>Attendance QR Codes</h2>
            <p>Select an outlet to display its rotating QR code.</p>
          </div>
        </div>
        <div className="admin-card">
          <div className="admin-table-wrap">
            <table className="admin-table">
              <tbody>
                {outlets.map((o) => (
                  <tr key={o.id}>
                    <td>{o.name}</td>
                    <td>
                      <Link href={`/admin/qr/${o.id}`} className="btn btn-outline btn-sm">
                        View QR
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </main>
  );
}