'use client';

import { useEffect, useState } from 'react';
import { fetchStaff } from '../../lib/staff';
import type { Staff } from '../../lib/types';
import styles from '../../app/hr/dashboard/hr-dashboard.module.css';

function formatNaira(n: number | null): string {
  if (n == null) return '—';
  return '\u20A6' + n.toLocaleString('en-NG');
}

export default function StaffTab() {
  const [staff, setStaff] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deptFilter, setDeptFilter] = useState('all');
  const [search, setSearch] = useState('');
useEffect(() => {
  (async () => {
    try {
      const supabase = (await import('../../lib/supabase/client')).createClient();
      const { data: authData } = await supabase.auth.getUser();
      console.log('AUTH USER:', authData.user);

      const result = await fetchStaff();
      console.log('STAFF RESULT:', result);

      setStaff(result);
    } catch (err) {
      console.error('FETCH STAFF ERROR:', err);
      setError('Could not load staff.');
    } finally {
      setLoading(false);
    }
  })();
}, []);
  useEffect(() => {
    (async () => {
      try {
        setStaff(await fetchStaff());
      } catch (err) {
        console.error(err);
        setError('Could not load staff.');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const departments = Array.from(
    new Set(staff.map((s) => s.department).filter(Boolean))
  ) as string[];

  const filtered = staff.filter((s) => {
    if (deptFilter !== 'all' && s.department !== deptFilter) return false;
    if (search && !s.full_name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  if (loading) return <p>Loading staff…</p>;
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
        <select
          value={deptFilter}
          onChange={(e) => setDeptFilter(e.target.value)}
          className={styles.filterSelect}
        >
          <option value="all">All departments</option>
          {departments.map((d) => (
            <option key={d} value={d}>{d}</option>
          ))}
        </select>
      </div>

      {filtered.length === 0 ? (
        <p>No staff match this filter.</p>
      ) : (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Name</th>
                <th>Job Title</th>
                <th>Department</th>
                <th>Outlet</th>
                <th>Status</th>
                <th>Hire Date</th>
                <th>Salary</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((s) => (
                <tr key={s.id}>
                  <td>{s.full_name}</td>
                  <td>{s.job_title ?? '—'}</td>
                  <td>{s.department ?? '—'}</td>
                  <td>{s.outlet ?? '—'}</td>
                  <td>{s.status}</td>
                  <td>{s.hire_date}</td>
                  <td>{formatNaira(s.salary)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}