'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentUser, checkIsHR, hrSignOut } from '../../../lib/hrAuth';
import StaffTab from '../../../components/hr/staffTab';
import AttendanceTab from '../../../components/hr/AttendanceTab';
import PayrollTab from '../../../components/hr/PayrollTab';
import { fetchStaff } from '../../../lib/staff';
import { fetchOpenAttendance } from '../../../lib/attendance';
import { fetchAllLeaveRequests } from '../../../lib/leave';


import styles from './hr-dashboard.module.css';
import LeaveTab from '../../../components/hr/LeaveTab';

type HRSection = 'overview' | 'staff' | 'attendance' | 'payroll' | 'leave';

const NAV_ITEMS: { key: HRSection; label: string }[] = [
  { key: 'overview', label: 'Overview' },
  { key: 'staff', label: 'Staff' },
  { key: 'attendance', label: 'Attendance' },
  { key: 'payroll', label: 'Payroll' },
  { key: 'leave', label: 'Leave Requests' },
];

function OverviewPanel() {
  const [activeStaff, setActiveStaff] = useState<number | null>(null);
  const [clockedIn, setClockedIn] = useState<number | null>(null);
  const [pendingLeave, setPendingLeave] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      setLoading(true);
      setError(null);
      try {
        const [staff, openSessions, leaveRequests] = await Promise.all([
          fetchStaff(),
          fetchOpenAttendance(),
          fetchAllLeaveRequests(),
        ]);
        if (cancelled) return;
        setActiveStaff(staff.filter((s) => s.status === 'active').length);
        setClockedIn(openSessions.length);
        setPendingLeave(leaveRequests.filter((lr) => lr.status === 'pending').length);
      } catch (err) {
        console.error('Failed to load overview stats', err);
        if (!cancelled) setError('Could not load live stats.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div>
      <div className={styles.kpiRow}>
        <div className={styles.kpiCell}>
          <div className={styles.kpiValue}>{loading ? '—' : activeStaff}</div>
          <div className={styles.kpiLabel}>Active staff</div>
        </div>
        <div className={styles.kpiCell}>
          <div className={styles.kpiValue}>{loading ? '—' : clockedIn}</div>
          <div className={styles.kpiLabel}>Clocked in now</div>
        </div>
        <div className={styles.kpiCell}>
          <div className={styles.kpiValue}>{loading ? '—' : pendingLeave}</div>
          <div className={styles.kpiLabel}>Pending leave requests</div>
        </div>
      </div>
      {error && <p className={styles.errorText}>{error}</p>}
    </div>
  );
}

function HRSectionContent({ section }: { section: HRSection }) {
  switch (section) {
    case 'overview':
      return <OverviewPanel />;
    case 'staff':
      return <StaffTab />;
    case 'attendance':
      return <AttendanceTab />;
    case 'payroll':
      return <PayrollTab />;
    case 'leave':
      return <LeaveTab />;
    default:
      return null;
  }
}

export default function HRDashboardPage() {
  const router = useRouter();
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [section, setSection] = useState<HRSection>('overview');
  const [hrEmail, setHrEmail] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const user = await getCurrentUser();
        if (!user) {
          router.replace('/hr/login');
          return;
        }
        const ok = await checkIsHR(user.id, user.email ?? null);
        if (!ok) {
          await hrSignOut();
          router.replace('/hr/login');
          return;
        }
        if (!cancelled) {
          setHrEmail(user.email ?? null);
          setCheckingAuth(false);
        }
      } catch {
        router.replace('/hr/login');
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [router]);

  async function handleSignOut() {
    await hrSignOut();
    router.push('/hr/login');
  }

  if (checkingAuth) {
    return (
      <main className={styles.page}>
        <div className={styles.loadingWrap}>
          <p>Checking access…</p>
        </div>
      </main>
    );
  }

  const activeLabel = NAV_ITEMS.find((item) => item.key === section)?.label ?? '';

  return (
    <main className={styles.page}>
      <div className={styles.shell}>
        <aside className={styles.sidebar}>
          <div className={styles.brand}>
            <span className={styles.brandTag}>The Promise</span>
            <h2 className={styles.brandTitle}>HR Portal</h2>
          </div>

          <nav className={styles.nav}>
            {NAV_ITEMS.map((item) => (
              <button
                key={item.key}
                type="button"
                className={`${styles.navItem} ${section === item.key ? styles.navItemActive : ''}`}
                onClick={() => setSection(item.key)}
              >
                {item.label}
              </button>
            ))}
          </nav>

          <button type="button" className={styles.logoutBtn} onClick={handleSignOut}>
            Log out
          </button>
        </aside>

        <section className={styles.content}>
          <header className={styles.contentHeader}>
            <h1>{activeLabel}</h1>
            {hrEmail && <span className={styles.hrEmail}>{hrEmail}</span>}
          </header>

          <div className={styles.panel}>
            <HRSectionContent section={section} />
          </div>
        </section>
      </div>
    </main>
  );
}