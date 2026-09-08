'use client';

import { useEffect, useState } from 'react';
import { fetchOpenAttendanceWithStaff } from '../../lib/attendance';
import type { OpenAttendanceWithStaff } from '../../lib/types';
import styles from '../../app/hr/dashboard/hr-dashboard.module.css';

export default function AttendanceTab() {
  const [rows, setRows] = useState<OpenAttendanceWithStaff[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    (async () => {
      try {
        setRows(await fetchOpenAttendanceWithStaff());
      } catch (err) {
        console.error(err);
        setError('Could not load attendance.');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filtered = rows.filter(
    (r) => !search || r.staff?.full_name?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <p>Loading attendance…</p>;
  if (error) return <p className={styles.errorText}>{error}</p>;

  return (
    <div>
      <div className={styles.filterRow}>
        <input
          type="text"
          placeholder="Search by name…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className={styles.filterInput}
        />
      </div>

      {filtered.length === 0 ? (
        <p>No one is currently clocked in.</p>
      ) : (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Name</th>
                <th>Department</th>
                <th>Clock In</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <tr key={r.id}>
                  <td>{r.staff?.full_name ?? 'Unknown'}</td>
                  <td>{r.staff?.department ?? '—'}</td>
                  <td>{new Date(r.clock_in).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}