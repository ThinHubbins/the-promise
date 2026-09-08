"use client";

import { useEffect, useMemo, useState, useCallback, Fragment } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getCurrentUser, checkIsAdmin, adminSignOut } from "../../lib/admin";
import { fetchStaff, setStaffStatus } from "../../lib/staff";
import {
  fetchOpenAttendance,
  fetchAttendanceForStaff,
  subscribeToAttendance,
} from "../../lib/attendance";
import type { Staff, AttendanceRecord } from "../../lib/types";
import StaffFormModal from "../../components/admin/StaffformModal";

type ModalState =
  | { mode: "add"; staff: null }
  | { mode: "edit" | "view"; staff: Staff }
  | null;

function formatDuration(clockIn: string, clockOut: string | null) {
  const start = new Date(clockIn).getTime();
  const end = clockOut ? new Date(clockOut).getTime() : Date.now();
  const mins = Math.max(0, Math.round((end - start) / 60000));
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

export default function AdminStaffPage() {
  const router = useRouter();

  const [checkingAuth, setCheckingAuth] = useState(true);
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");

  const [modal, setModal] = useState<ModalState>(null);
  const [statusUpdatingId, setStatusUpdatingId] = useState<string | null>(null);

  // --- Attendance state ---
  const [clockedInIds, setClockedInIds] = useState<Set<string>>(new Set());
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [historyByStaff, setHistoryByStaff] = useState<Record<string, AttendanceRecord[]>>({});
  const [historyLoadingId, setHistoryLoadingId] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const user = await getCurrentUser();
        if (!user) return router.replace("/admin/login");
        const ok = await checkIsAdmin(user.id);
        if (!ok) {
          await adminSignOut();
          return router.replace("/admin/login");
        }
        setCheckingAuth(false);
      } catch {
        router.replace("/admin/login");
      }
    })();
  }, [router]);

  async function loadStaff() {
    setLoading(true);
    setLoadError(null);
    try {
      setStaffList(await fetchStaff());
    } catch (err) {
      console.error("Failed to load staff", err);
      setLoadError("Could not load staff. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const loadClockedIn = useCallback(async () => {
    try {
      const open = await fetchOpenAttendance();
      setClockedInIds(new Set(open.map((r) => r.staff_id)));
    } catch (err) {
      console.error("Failed to load clock-in status", err);
    }
  }, []);

  // Refresh an expanded staff member's history (used by the realtime callback too)
  const refreshHistory = useCallback(async (staffId: string) => {
    setHistoryLoadingId(staffId);
    try {
      const records = await fetchAttendanceForStaff(staffId);
      setHistoryByStaff((prev) => ({ ...prev, [staffId]: records }));
    } catch (err) {
      console.error("Failed to load attendance history", err);
    } finally {
      setHistoryLoadingId((prev) => (prev === staffId ? null : prev));
    }
  }, []);

  useEffect(() => {
    if (checkingAuth) return;
    loadStaff();
    loadClockedIn();
  }, [checkingAuth]); // eslint-disable-line react-hooks/exhaustive-deps

  // Live sync: any insert/update on attendance refreshes the clocked-in set,
  // and if that staff member's row is currently expanded, refreshes their history too.
  useEffect(() => {
    if (checkingAuth) return;
    const unsubscribe = subscribeToAttendance((staffId) => {
      loadClockedIn();
      if (staffId && staffId === expandedId) {
        refreshHistory(staffId);
      }
    });
    return unsubscribe;
  }, [checkingAuth, expandedId, loadClockedIn, refreshHistory]);

  const filteredStaff = useMemo(() => {
    const term = search.trim().toLowerCase();
    return staffList.filter((s) => {
      const matchesStatus = statusFilter === "all" || s.status === statusFilter;
      if (!matchesStatus) return false;
      if (!term) return true;
      return (
        s.full_name.toLowerCase().includes(term) ||
        s.email.toLowerCase().includes(term) ||
        s.staff_id.toLowerCase().includes(term) ||
        (s.department ?? "").toLowerCase().includes(term) ||
        (s.job_title ?? "").toLowerCase().includes(term) ||
        (s.outlet ?? "").toLowerCase().includes(term)
      );
    });
  }, [staffList, search, statusFilter]);

  function handleSaved(saved: Staff) {
    setStaffList((prev) => {
      const exists = prev.some((s) => s.id === saved.id);
      return exists
        ? prev.map((s) => (s.id === saved.id ? saved : s))
        : [saved, ...prev];
    });
    setModal(null);
  }

  async function handleToggleStatus(staff: Staff) {
    const nextStatus = staff.status === "active" ? "inactive" : "active";
    setStatusUpdatingId(staff.id);
    try {
      const updated = await setStaffStatus(staff.id, nextStatus);
      setStaffList((prev) => prev.map((s) => (s.id === staff.id ? updated : s)));
    } catch (err) {
      console.error("Failed to update staff status", err);
      alert("Could not update status. Please try again.");
    } finally {
      setStatusUpdatingId(null);
    }
  }

  function handleToggleExpand(staff: Staff) {
    const next = expandedId === staff.id ? null : staff.id;
    setExpandedId(next);
    if (next && !historyByStaff[staff.id]) {
      refreshHistory(staff.id);
    }
  }

  if (checkingAuth) {
    return (
      <main>
        <div className="wrap admin-loading-wrap">
          <p>Checking access…</p>
        </div>
      </main>
    );
  }

  return (
    <main>
      <div className="wrap admin-wrap">
        <div className="admin-header">
          <div>
            <span className="section-tag">The Promise Admin</span>
            <h2>Staff Management</h2>
            <p>View, add, and manage your staff records.</p>
          </div>
          <div className="admin-header-actions">
            <Link href="/admin/analytics" className="btn btn-outline btn-sm">
              Analytics
            </Link>
            <button
              className="btn btn-primary btn-sm"
              onClick={() => setModal({ mode: "add", staff: null })}
            >
              Add Staff
            </button>
          </div>
        </div>

        {loadError && (
          <div className="admin-error-banner">
            <p>{loadError}</p>
            <button className="btn btn-outline btn-sm" onClick={loadStaff}>
              Retry
            </button>
          </div>
        )}

        <div className="admin-search-row">
          <input
            type="text"
            placeholder="Search by name, email, staff ID, department…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select
            value={statusFilter}
            onChange={(e) =>
              setStatusFilter(e.target.value as "all" | "active" | "inactive")
            }
          >
            <option value="all">All statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>

        <div className="admin-card">
          {loading ? (
            <div className="admin-loading-block">
              <span className="reviews-spinner" />
              <p>Loading staff…</p>
            </div>
          ) : staffList.length === 0 ? (
            <div className="dash-empty-card" style={{ margin: 0 }}>
              <p>No staff added yet. Click "Add Staff" to create your first record.</p>
            </div>
          ) : filteredStaff.length === 0 ? (
            <p className="reviews-empty">No staff match your search.</p>
          ) : (
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Staff ID</th>
                    <th>Job Title</th>
                    <th>Department</th>
                    <th>Outlet</th>
                    <th>Status</th>
                    <th>Attendance</th>
                    <th>Email</th>
                    <th>Actions</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStaff.map((s) => {
                    const isClockedIn = clockedInIds.has(s.id);
                    const isExpanded = expandedId === s.id;
                    const history = historyByStaff[s.id];
                    const historyLoading = historyLoadingId === s.id;

                      return (
                      <Fragment key={s.id}>
                        <tr
                          onClick={() => handleToggleExpand(s)}
                          style={{ cursor: "pointer" }}
                        >
                          <td>{s.full_name}</td>
                          <td>{s.staff_id}</td>
                          <td>{s.job_title || "—"}</td>
                          <td>{s.department || "—"}</td>
                          <td>{s.outlet || "—"}</td>
                          <td>
                            <span
                              className={`status-badge ${
                                s.status === "active" ? "status-active" : "status-inactive"
                              }`}
                            >
                              {s.status}
                            </span>
                          </td>
                          <td>
                            <span
                              className={`status-badge ${
                                isClockedIn ? "status-active" : "status-inactive"
                              }`}
                            >
                              {isClockedIn ? "Clocked In" : "Clocked Out"}
                            </span>
                          </td>
                          <td>{s.email}</td>
                          <td onClick={(e) => e.stopPropagation()}>
                            <div className="admin-row-actions">
                              <button
                                className="btn btn-outline btn-sm"
                                onClick={() => setModal({ mode: "view", staff: s })}
                              >
                                View
                              </button>
                              <button
                                className="btn btn-outline btn-sm"
                                onClick={() => setModal({ mode: "edit", staff: s })}
                              >
                                Edit
                              </button>
                              <button
                                className="btn btn-outline btn-sm"
                                onClick={() => handleToggleStatus(s)}
                                disabled={statusUpdatingId === s.id}
                              >
                                {statusUpdatingId === s.id
                                  ? "Updating…"
                                  : s.status === "active"
                                    ? "Deactivate"
                                    : "Activate"}
                              </button>
                            </div>
                          </td>
                          <td>{isExpanded ? "▲" : "▼"}</td>
                        </tr>
                        {isExpanded && (
                          <tr key={`${s.id}-history`} className="staff-row-expanded">
                            <td colSpan={10}>
                              {historyLoading && <p>Loading history…</p>}
                              {!historyLoading && history?.length === 0 && (
                                <p>No attendance records yet.</p>
                              )}
                              {!historyLoading && history && history.length > 0 && (
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
                              )}
                            </td>
                          </tr>
                        )}
                 </Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {modal && (
        <StaffFormModal
          mode={modal.mode}
          staff={modal.staff}
          onClose={() => setModal(null)}
          onSaved={handleSaved}
        />
      )}
    </main>
  );
}