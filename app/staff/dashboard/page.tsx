"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  getCurrentAuthUser,
  getStaffByEmail,
  staffSignOut,
} from "../../../lib/staffAuth";
import { fetchAttendanceForStaff, subscribeToAttendance } from "../../../lib/attendance";
import type { Staff, AttendanceRecord } from "../../../lib/types";
import Link from "next/link";

function formatDuration(clockIn: string, clockOut: string | null) {
  const start = new Date(clockIn).getTime();
  const end = clockOut ? new Date(clockOut).getTime() : Date.now();
  const mins = Math.max(0, Math.round((end - start) / 60000));
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

export default function StaffDashboardPage() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [staff, setStaff] = useState<Staff | null>(null);
  const [error, setError] = useState<string | null>(null);

  // --- Attendance state ---
  const [history, setHistory] = useState<AttendanceRecord[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const user = await getCurrentAuthUser();
        if (!user || !user.email) {
          router.replace("/staff/login");
          return;
        }
        const matched = await getStaffByEmail(user.email);
        if (!matched) {
          await staffSignOut();
          router.replace("/staff/login");
          return;
        }
        setStaff(matched);
      } catch (err) {
        console.error("Staff dashboard load failed", err);
        setError("Could not load your staff record.");
      } finally {
        setChecking(false);
      }
    })();
  }, [router]);

  const loadHistory = useCallback(async (staffId: string) => {
    setHistoryLoading(true);
    try {
      setHistory(await fetchAttendanceForStaff(staffId));
    } catch (err) {
      console.error("Failed to load attendance history", err);
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  // Initial history load once we know who the staff member is
  useEffect(() => {
    if (staff) loadHistory(staff.id);
  }, [staff, loadHistory]);

  // Live sync: refetch this staff member's history the instant their attendance row changes
  // (e.g. right after they scan the QR on /staff/scan-attendance).
  useEffect(() => {
    if (!staff) return;
    const unsubscribe = subscribeToAttendance((changedStaffId) => {
      if (changedStaffId === staff.id) {
        loadHistory(staff.id);
      }
    });
    return unsubscribe;
  }, [staff, loadHistory]);

  async function handleSignOut() {
    await staffSignOut();
    router.replace("/staff/login");
  }

  if (checking) {
    return (
      <main>
        <div className="wrap admin-loading-wrap">
          <p>Checking access…</p>
        </div>
      </main>
    );
  }

  if (error || !staff) {
    return (
      <main>
        <div className="wrap admin-loading-wrap">
          <p>{error ?? "No staff record found."}</p>
        </div>
      </main>
    );
  }

  const openSession = history.find((r) => r.clock_out === null) ?? null;
  const isClockedIn = !!openSession;

  return (
    <main>
      <div className="wrap admin-wrap">
        <div className="admin-header">
          <div>
            <span className="section-tag">The Promise Staff</span>
            <h2>Welcome, {staff.full_name}</h2>
            <p>Your staff details.</p>
          </div>
          <div className="admin-header-actions">
            <Link
              href="/staff/scan-attendance"
              className="btn btn-primary btn-sm"
            >
              Scan Attendance QR
            </Link>
          </div>
          <div className="admin-header-actions">
            <button className="btn btn-outline btn-sm" onClick={handleSignOut}>
              Sign out
            </button>
          </div>
        </div>

        <div className="admin-card">
          <div className="admin-table-wrap">
            <table className="admin-table">
              <tbody>
                <tr>
                  <th>Full name</th>
                  <td>{staff.full_name}</td>
                </tr>
                <tr>
                  <th>Staff ID</th>
                  <td>{staff.staff_id}</td>
                </tr>
                <tr>
                  <th>Email</th>
                  <td>{staff.email}</td>
                </tr>
                <tr>
                  <th>Phone</th>
                  <td>{staff.phone || "—"}</td>
                </tr>
                <tr>
                  <th>Job title</th>
                  <td>{staff.job_title || "—"}</td>
                </tr>
                <tr>
                  <th>Department</th>
                  <td>{staff.department || "—"}</td>
                </tr>
                <tr>
                  <th>Outlet</th>
                  <td>{staff.outlet || "—"}</td>
                </tr>
                <tr>
                  <th>Status</th>
                  <td>
                    <span
                      className={`status-badge ${staff.status === "active" ? "status-active" : "status-inactive"}`}
                    >
                      {staff.status}
                    </span>
                  </td>
                </tr>
                <tr>
                  <th>Attendance</th>
                  <td>
                    <span
                      className={`status-badge ${isClockedIn ? "status-active" : "status-inactive"}`}
                    >
                      {isClockedIn ? "Clocked In" : "Clocked Out"}
                    </span>
                    {isClockedIn && openSession && (
                      <span style={{ marginLeft: "0.75rem", opacity: 0.75 }}>
                        since {new Date(openSession.clock_in).toLocaleTimeString()}
                      </span>
                    )}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div className="admin-card">
          <h3>Attendance History</h3>
          {historyLoading && <p>Loading history…</p>}
          {!historyLoading && history.length === 0 && (
            <p>No attendance records yet.</p>
          )}
          {!historyLoading && history.length > 0 && (
            <div className="admin-table-wrap">
              <table className="attendance-history-table">
                <thead>
                  <tr>
                    <th>Clock In</th>
                    <th>Clock Out</th>
                    <th>Duration</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((rec) => (
                    <tr key={rec.id}>
                      <td>{new Date(rec.clock_in).toLocaleString()}</td>
                      <td>
                        {rec.clock_out
                          ? new Date(rec.clock_out).toLocaleString()
                          : "— still clocked in —"}
                      </td>
                      <td>{formatDuration(rec.clock_in, rec.clock_out)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}