"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  getCurrentAuthUser,
  getStaffByEmail,
  staffSignOut,
} from "../../../lib/staffAuth";
import {
  fetchBankAccountForStaff,
  submitBankAccount,
} from "../../../lib/bankAccount";
import type { BankAccount, BankAccountInput } from "../../../lib/types";
import {
  fetchAttendanceForStaff,
  subscribeToAttendance,
} from "../../../lib/attendance";
import {
  submitLeaveRequest,
  fetchLeaveRequestsForStaff,
  calculateLeaveDays,
  getLeaveDocumentUrl,
} from "../../../lib/leave";
import type {
  Staff,
  AttendanceRecord,
  LeaveRequest,
  LeaveRequestInput,
  LeaveType,
} from "../../../lib/types";
import { LEAVE_TYPE_LABELS } from "../../../lib/types";
import Link from "next/link";
import styles from "./staff-dashboard.module.css";

function formatDuration(clockIn: string, clockOut: string | null) {
  const start = new Date(clockIn).getTime();
  const end = clockOut ? new Date(clockOut).getTime() : Date.now();
  const mins = Math.max(0, Math.round((end - start) / 60000));
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

function formatNaira(n: number | null): string {
  if (n == null) return "—";
  return "\u20A6" + n.toLocaleString("en-NG");
}

function badgeClass(status: string) {
  if (status === "active" || status === "approved")
    return `${styles.badge} ${styles.badgeActive}`;
  if (status === "rejected") return `${styles.badge} ${styles.badgeRejected}`;
  if (status === "pending") return `${styles.badge} ${styles.badgePending}`;
  return `${styles.badge} ${styles.badgeInactive}`;
}

const EMPTY_LEAVE_FORM: LeaveRequestInput = {
  leave_type: "annual",
  start_date: "",
  end_date: "",
  reason: "",
  document: null,
};

export default function StaffDashboardPage() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [staff, setStaff] = useState<Staff | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [history, setHistory] = useState<AttendanceRecord[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);

  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [leaveLoading, setLeaveLoading] = useState(true);
  const [showLeaveForm, setShowLeaveForm] = useState(false);
  const [leaveForm, setLeaveForm] =
    useState<LeaveRequestInput>(EMPTY_LEAVE_FORM);
  const [leaveSaving, setLeaveSaving] = useState(false);
  const [leaveError, setLeaveError] = useState<string | null>(null);
  const [bankAccount, setBankAccount] = useState<BankAccount | null>(null);
  const [bankLoading, setBankLoading] = useState(true);
  const [showBankForm, setShowBankForm] = useState(false);
  const [bankForm, setBankForm] = useState<BankAccountInput>({
    bank_name: "",
    account_number: "",
    account_name: "",
  });
  const [bankSaving, setBankSaving] = useState(false);
  const [bankError, setBankError] = useState<string | null>(null);

  const loadBankAccount = useCallback(async (staffId: string) => {
    setBankLoading(true);
    try {
      const acct = await fetchBankAccountForStaff(staffId);
      setBankAccount(acct);
      if (acct) {
        setBankForm({
          bank_name: acct.bank_name,
          account_number: acct.account_number,
          account_name: acct.account_name,
        });
      }
    } catch (err) {
      console.error("Failed to load bank account", err);
    } finally {
      setBankLoading(false);
    }
  }, []);

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

  async function handleBankSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!staff) return;

    setBankError(null);
    if (
      !bankForm.bank_name.trim() ||
      !bankForm.account_number.trim() ||
      !bankForm.account_name.trim()
    ) {
      setBankError("All three fields are required.");
      return;
    }
    if (!/^\d{10}$/.test(bankForm.account_number.trim())) {
      setBankError("Account number should be 10 digits.");
      return;
    }

    setBankSaving(true);
    try {
      const saved = await submitBankAccount(staff.id, bankForm);
      setBankAccount(saved);
      setShowBankForm(false);
    } catch (err) {
      console.error("Failed to submit bank account", err);
      setBankError("Could not save bank details. Please try again.");
    } finally {
      setBankSaving(false);
    }
  }

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

  const loadLeaveRequests = useCallback(async (staffId: string) => {
    setLeaveLoading(true);
    try {
      setLeaveRequests(await fetchLeaveRequestsForStaff(staffId));
    } catch (err) {
      console.error("Failed to load leave requests", err);
    } finally {
      setLeaveLoading(false);
    }
  }, []);

  useEffect(() => {
    if (staff) {
      loadHistory(staff.id);
      loadLeaveRequests(staff.id);
      loadBankAccount(staff.id); // NEW
    }
  }, [staff, loadHistory, loadLeaveRequests, loadBankAccount]);

  useEffect(() => {
    if (!staff) return;
    const unsubscribe = subscribeToAttendance((changedStaffId) => {
      if (changedStaffId === staff.id) loadHistory(staff.id);
    });
    return unsubscribe;
  }, [staff, loadHistory]);

  async function handleSignOut() {
    await staffSignOut();
    router.replace("/staff/login");
  }

  function updateLeaveField<K extends keyof LeaveRequestInput>(
    key: K,
    value: LeaveRequestInput[K],
  ) {
    setLeaveForm((f) => ({ ...f, [key]: value }));
  }

  async function handleLeaveSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!staff) return;

    setLeaveError(null);

    if (!leaveForm.start_date || !leaveForm.end_date) {
      setLeaveError("Start date and end date are required.");
      return;
    }
    if (new Date(leaveForm.end_date) < new Date(leaveForm.start_date)) {
      setLeaveError("End date cannot be before start date.");
      return;
    }
    if (!leaveForm.reason.trim()) {
      setLeaveError("Please provide a reason for your leave.");
      return;
    }

    setLeaveSaving(true);
    try {
      const saved = await submitLeaveRequest(staff, leaveForm);
      setLeaveRequests((prev) => [saved, ...prev]);
      setLeaveForm(EMPTY_LEAVE_FORM);
      setShowLeaveForm(false);
    } catch (err) {
      console.error("Failed to submit leave request", err);
      setLeaveError("Could not submit leave request. Please try again.");
    } finally {
      setLeaveSaving(false);
    }
  }

  async function handleViewDocument(path: string) {
    const url = await getLeaveDocumentUrl(path);
    if (url) window.open(url, "_blank");
  }

  if (checking) {
    return (
      <main className={styles.page}>
        <div className={styles.loadingWrap}>
          <p>Checking access…</p>
        </div>
      </main>
    );
  }

  if (error || !staff) {
    return (
      <main className={styles.page}>
        <div className={styles.loadingWrap}>
          <p>{error ?? "No staff record found."}</p>
        </div>
      </main>
    );
  }

  const openSession = history.find((r) => r.clock_out === null) ?? null;
  const isClockedIn = !!openSession;
  const previewDays = calculateLeaveDays(
    leaveForm.start_date,
    leaveForm.end_date,
  );

  return (
    <main className={styles.page}>
      <div className={styles.shell}>
        <div className={styles.header}>
          <div>
            <span className={styles.tag}>The Promise Staff</span>
            <h1 className={styles.headerTitle}>Welcome, {staff.full_name}</h1>
            <p className={styles.headerSub}>
              Your staff details, attendance and leave.
            </p>
          </div>
          <div className={styles.headerActions}>
            <Link
              href="/staff/scan-attendance"
              className={`${styles.btn} ${styles.btnPrimary}`}
            >
              Scan attendance QR
            </Link>
            <button
              className={`${styles.btn} ${styles.btnOutline}`}
              onClick={handleSignOut}
            >
              Sign out
            </button>
          </div>
        </div>

        <div className={styles.grid}>
          {/* ---------- Left: profile summary ---------- */}
          <aside className={styles.profile}>
            <h2 className={styles.profileName}>{staff.full_name}</h2>
            <p className={styles.profileMeta}>
              {staff.job_title || "Staff member"} · {staff.staff_id}
            </p>

            <div className={styles.profileRow}>
              <span className={styles.profileLabel}>Email</span>
              <span className={styles.profileValue}>{staff.email}</span>
            </div>
            <div className={styles.profileRow}>
              <span className={styles.profileLabel}>Phone</span>
              <span className={styles.profileValue}>{staff.phone || "—"}</span>
            </div>
            <div className={styles.profileRow}>
              <span className={styles.profileLabel}>Department</span>
              <span className={styles.profileValue}>
                {staff.department || "—"}
              </span>
            </div>
            <div className={styles.profileRow}>
              <span className={styles.profileLabel}>Outlet</span>
              <span className={styles.profileValue}>{staff.outlet || "—"}</span>
            </div>
            <div className={styles.profileRow}>
              <span className={styles.profileLabel}>Hire date</span>
              <span className={styles.profileValue}>
                {staff.hire_date || "—"}
              </span>
            </div>
            <div className={styles.profileRow}>
              <span className={styles.profileLabel}>Salary</span>
              <span className={`${styles.profileValue} ${styles.salaryValue}`}>
                {formatNaira(staff.salary)}
              </span>
            </div>
            <div className={styles.profileRow}>
              <span className={styles.profileLabel}>Status</span>
              <span className={badgeClass(staff.status)}>{staff.status}</span>
            </div>

            <div className={styles.clockRow}>
              <span className={badgeClass(isClockedIn ? "active" : "inactive")}>
                {isClockedIn ? "Clocked in" : "Clocked out"}
              </span>
              {isClockedIn && openSession && (
                <span className={styles.sinceNote}>
                  Since {new Date(openSession.clock_in).toLocaleTimeString()}
                </span>
              )}
            </div>
          </aside>

          {/* ---------- Right: attendance + leave ---------- */}
          <div>
            <section className={styles.section}>
              <div className={styles.sectionHead}>
                <h2 className={styles.sectionTitle}>Attendance history</h2>
              </div>

              {historyLoading && (
                <p className={styles.emptyNote}>Loading history…</p>
              )}
              {!historyLoading && history.length === 0 && (
                <p className={styles.emptyNote}>No attendance records yet.</p>
              )}
              {!historyLoading && history.length > 0 && (
                <div className={styles.tableWrap}>
                  <table className={styles.table}>
                    <thead>
                      <tr>
                        <th>Clock in</th>
                        <th>Clock out</th>
                        <th>Duration</th>
                      </tr>
                    </thead>
                    <tbody>
                      {history.map((rec) => (
                        <tr key={rec.id}>
                          <td data-label="Clock in">
                            {new Date(rec.clock_in).toLocaleString()}
                          </td>
                          <td data-label="Clock out">
                            {rec.clock_out
                              ? new Date(rec.clock_out).toLocaleString()
                              : "Still clocked in"}
                          </td>
                          <td data-label="Duration">
                            {formatDuration(rec.clock_in, rec.clock_out)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>

            <section className={styles.section}>
              <div className={styles.sectionHead}>
                <h2 className={styles.sectionTitle}>Leave requests</h2>
                {!showLeaveForm && (
                  <button
                    className={`${styles.btn} ${styles.btnPrimary} ${styles.btnSmall}`}
                    onClick={() => setShowLeaveForm(true)}
                  >
                    Request leave
                  </button>
                )}
              </div>

              {showLeaveForm && (
                <form onSubmit={handleLeaveSubmit} className={styles.form}>
                  {leaveError && (
                    <p className={styles.errorText}>{leaveError}</p>
                  )}

                  <div className={styles.field}>
                    <label>Leave type</label>
                    <select
                      value={leaveForm.leave_type}
                      onChange={(e) =>
                        updateLeaveField(
                          "leave_type",
                          e.target.value as LeaveType,
                        )
                      }
                    >
                      {Object.entries(LEAVE_TYPE_LABELS).map(([key, label]) => (
                        <option key={key} value={key}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className={styles.formGrid}>
                    <div className={styles.field}>
                      <label>Start date</label>
                      <input
                        type="date"
                        value={leaveForm.start_date}
                        onChange={(e) =>
                          updateLeaveField("start_date", e.target.value)
                        }
                        required
                      />
                    </div>
                    <div className={styles.field}>
                      <label>End date</label>
                      <input
                        type="date"
                        value={leaveForm.end_date}
                        onChange={(e) =>
                          updateLeaveField("end_date", e.target.value)
                        }
                        required
                      />
                    </div>
                  </div>

                  <div className={styles.field}>
                    <label>Number of days</label>
                    <input
                      type="text"
                      value={previewDays || ""}
                      disabled
                      readOnly
                    />
                  </div>

                  <div className={styles.field}>
                    <label>Reason</label>
                    <textarea
                      value={leaveForm.reason}
                      onChange={(e) =>
                        updateLeaveField("reason", e.target.value)
                      }
                      rows={3}
                      placeholder="Briefly explain why you need this leave…"
                      required
                    />
                  </div>

                  <div className={styles.field}>
                    <label>Supporting document (optional)</label>
                    <input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={(e) =>
                        updateLeaveField(
                          "document",
                          e.target.files?.[0] ?? null,
                        )
                      }
                    />
                  </div>

                  <div className={styles.formActions}>
                    <button
                      type="button"
                      className={`${styles.btn} ${styles.btnOutline}`}
                      onClick={() => {
                        setShowLeaveForm(false);
                        setLeaveForm(EMPTY_LEAVE_FORM);
                        setLeaveError(null);
                      }}
                      disabled={leaveSaving}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className={`${styles.btn} ${styles.btnPrimary}`}
                      disabled={leaveSaving}
                    >
                      {leaveSaving ? "Submitting…" : "Submit request"}
                    </button>
                  </div>
                </form>
              )}

              {leaveLoading && (
                <p className={styles.emptyNote}>Loading leave requests…</p>
              )}
              {!leaveLoading && leaveRequests.length === 0 && (
                <p className={styles.emptyNote}>
                  You haven't submitted any leave requests yet.
                </p>
              )}
              {!leaveLoading && leaveRequests.length > 0 && (
                <div className={styles.tableWrap}>
                  <table className={styles.table}>
                    <thead>
                      <tr>
                        <th>Type</th>
                        <th>Dates</th>
                        <th>Days</th>
                        <th>Status</th>
                        <th>Document</th>
                      </tr>
                    </thead>
                    <tbody>
                      {leaveRequests.map((lr) => (
                        <tr key={lr.id}>
                          <td data-label="Type">
                            {LEAVE_TYPE_LABELS[lr.leave_type]}
                          </td>
                          <td data-label="Dates">
                            {lr.start_date} → {lr.end_date}
                          </td>
                          <td data-label="Days">{lr.days}</td>
                          <td data-label="Status">
                            <span className={badgeClass(lr.status)}>
                              {lr.status}
                            </span>
                          </td>
                          <td data-label="Document">
                            {lr.document_url ? (
                              <button
                                className={`${styles.btn} ${styles.btnOutline} ${styles.btnSmall}`}
                                onClick={() =>
                                  handleViewDocument(lr.document_url!)
                                }
                              >
                                View
                              </button>
                            ) : (
                              "—"
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>

            <section className={styles.section}>
              <div className={styles.sectionHead}>
                <h2 className={styles.sectionTitle}>
                  Bank account for payment
                </h2>
                {!showBankForm && (
                  <button
                    className={`${styles.btn} ${styles.btnPrimary} ${styles.btnSmall}`}
                    onClick={() => setShowBankForm(true)}
                  >
                    {bankAccount ? "Update details" : "Add bank account"}
                  </button>
                )}
              </div>

              {bankLoading && (
                <p className={styles.emptyNote}>Loading bank details…</p>
              )}

              {!bankLoading &&
                !showBankForm &&
                (bankAccount ? (
                  <div className={styles.profileRow}>
                    <span className={styles.profileValue}>
                      {bankAccount.account_name} · {bankAccount.bank_name} ·{" "}
                      {bankAccount.account_number}
                    </span>
                  </div>
                ) : (
                  <p className={styles.emptyNote}>
                    You haven't added a bank account yet — HR needs this to pay
                    you.
                  </p>
                ))}

              {showBankForm && (
                <form onSubmit={handleBankSubmit} className={styles.form}>
                  {bankError && <p className={styles.errorText}>{bankError}</p>}

                  <div className={styles.field}>
                    <label>Bank name</label>
                    <input
                      type="text"
                      value={bankForm.bank_name}
                      onChange={(e) =>
                        setBankForm((f) => ({
                          ...f,
                          bank_name: e.target.value,
                        }))
                      }
                      placeholder="e.g. GTBank"
                      required
                    />
                  </div>

                  <div className={styles.field}>
                    <label>Account number</label>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={bankForm.account_number}
                      onChange={(e) =>
                        setBankForm((f) => ({
                          ...f,
                          account_number: e.target.value,
                        }))
                      }
                      placeholder="10-digit NUBAN"
                      required
                    />
                  </div>

                  <div className={styles.field}>
                    <label>Account name</label>
                    <input
                      type="text"
                      value={bankForm.account_name}
                      onChange={(e) =>
                        setBankForm((f) => ({
                          ...f,
                          account_name: e.target.value,
                        }))
                      }
                      placeholder="Name on the account"
                      required
                    />
                  </div>

                  <div className={styles.formActions}>
                    <button
                      type="button"
                      className={`${styles.btn} ${styles.btnOutline}`}
                      onClick={() => {
                        setShowBankForm(false);
                        if (bankAccount) {
                          setBankForm({
                            bank_name: bankAccount.bank_name,
                            account_number: bankAccount.account_number,
                            account_name: bankAccount.account_name,
                          });
                        }
                        setBankError(null);
                      }}
                      disabled={bankSaving}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className={`${styles.btn} ${styles.btnPrimary}`}
                      disabled={bankSaving}
                    >
                      {bankSaving ? "Saving…" : "Save bank details"}
                    </button>
                  </div>
                </form>
              )}
            </section>
          </div>
        </div>
      </div>
    </main>
  );
}
