'use client';

import { useEffect, useState } from 'react';
import { fetchStaff } from '../../lib/staff';
import { fetchPayrollOverview, markStaffPaid } from '../../lib/payroll';
import type { StaffPayrollInfo, PayrollStatus } from '../../lib/types';
import styles from '../../app/hr/dashboard/hr-dashboard.module.css';

function formatNaira(n: number | null): string {
  if (n == null) return '—';
  return '\u20A6' + n.toLocaleString('en-NG');
}

const STATUS_LABEL: Record<PayrollStatus, string> = {
  in_progress: 'In progress',
  almost_due: 'Almost due',
  ready: 'Ready to pay',
};

const STATUS_CLASS: Record<PayrollStatus, string> = {
  in_progress: styles.badgeNeutral,
  almost_due: styles.badgeWarning,
  ready: styles.badgeReady,
};

export default function PayrollTab() {
  const [rows, setRows] = useState<StaffPayrollInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<'all' | PayrollStatus>('all');
  const [search, setSearch] = useState('');
  const [payingId, setPayingId] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const staff = await fetchStaff();
      setRows(await fetchPayrollOverview(staff));
    } catch (err) {
      console.error(err);
      setError('Could not load payroll data.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handlePay(info: StaffPayrollInfo) {
    setPayingId(info.staff.id);
    try {
      await markStaffPaid(info);
      await load();
    } catch (err: any) {
      alert(err?.message ?? 'Could not mark as paid.');
    } finally {
      setPayingId(null);
    }
  }

  const filtered = rows.filter((r) => {
    if (statusFilter !== 'all' && r.status !== statusFilter) return false;
    if (search && !r.staff.full_name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  if (loading) return <p>Loading payroll…</p>;
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
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as any)}
          className={styles.filterSelect}
        >
          <option value="all">All statuses</option>
          <option value="ready">Ready to pay</option>
          <option value="almost_due">Almost due (25+ days)</option>
          <option value="in_progress">In progress</option>
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
                <th>Department</th>
                <th>Salary</th>
                <th>Days into cycle</th>
                <th>Next due</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <tr key={r.staff.id}>
                  <td>{r.staff.full_name}</td>
                  <td>{r.staff.department ?? '—'}</td>
                  <td>{formatNaira(r.staff.salary)}</td>
                  <td>{r.daysIntoCycle} / 30</td>
                  <td>{r.nextDueDate}</td>
                  <td>
                    <span className={STATUS_CLASS[r.status]}>{STATUS_LABEL[r.status]}</span>
                  </td>
                  <td>
                    <button
                      className={styles.payBtn}
                      disabled={r.status !== 'ready' || payingId === r.staff.id}
                      onClick={() => handlePay(r)}
                    >
                      {payingId === r.staff.id ? 'Paying…' : 'Mark as Paid'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}