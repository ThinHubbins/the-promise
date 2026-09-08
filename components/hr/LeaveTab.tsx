"use client";

import { useEffect, useState } from "react";
import {
  fetchAllLeaveRequests,
  updateLeaveStatus,
  getLeaveDocumentUrl,
} from "../../lib/leave";
import type { LeaveRequest, LeaveStatus } from "../../lib/types";
import { LEAVE_TYPE_LABELS } from "../../lib/types";
import styles from "./leave-tab.module.css";

type FilterKey = "pending" | "approved" | "rejected" | "all";

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: "pending", label: "Pending" },
  { key: "approved", label: "Approved" },
  { key: "rejected", label: "Rejected" },
  { key: "all", label: "All" },
];

function badgeClass(status: LeaveStatus) {
  if (status === "approved") return `${styles.badge} ${styles.badgeApproved}`;
  if (status === "rejected") return `${styles.badge} ${styles.badgeRejected}`;
  return `${styles.badge} ${styles.badgePending}`;
}

export default function LeaveTab() {
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterKey>("pending");
  const [actingId, setActingId] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        setRequests(await fetchAllLeaveRequests());
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  async function handleDecision(id: string, status: "approved" | "rejected") {
    setActingId(id);
    try {
      const updated = await updateLeaveStatus(id, status);
      setRequests((prev) => prev.map((r) => (r.id === id ? updated : r)));
    } catch (err) {
      console.error("Failed to update leave status", err);
    } finally {
      setActingId(null);
    }
  }

  async function handleViewDocument(path: string) {
    const url = await getLeaveDocumentUrl(path);
    if (url) window.open(url, "_blank");
  }

  const filtered = requests.filter((r) => filter === "all" || r.status === filter);

  if (loading) return <p className={styles.emptyNote}>Loading leave requests…</p>;

  return (
    <div className={styles.wrap}>
      <div className={styles.toolbar}>
        {FILTERS.map((f) => (
          <button
            key={f.key}
            type="button"
            className={`${styles.filterBtn} ${filter === f.key ? styles.filterBtnActive : ""}`}
            onClick={() => setFilter(f.key)}
          >
            {f.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <p className={styles.emptyNote}>No {filter === "all" ? "" : filter} leave requests.</p>
      ) : (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Staff</th>
                <th>Dept / Outlet</th>
                <th>Type</th>
                <th>Dates</th>
                <th>Days</th>
                <th>Reason</th>
                <th>Document</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <tr key={r.id}>
                  <td data-label="Staff">{r.staff_name} ({r.staff_code})</td>
                  <td data-label="Dept / Outlet">{r.department ?? "—"} / {r.outlet ?? "—"}</td>
                  <td data-label="Type">{LEAVE_TYPE_LABELS[r.leave_type]}</td>
                  <td data-label="Dates">{r.start_date} → {r.end_date}</td>
                  <td data-label="Days">{r.days}</td>
                  <td data-label="Reason" className={styles.reasonCell}>{r.reason}</td>
                  <td data-label="Document">
                    {r.document_url ? (
                      <button
                        type="button"
                        className={`${styles.btn} ${styles.viewBtn}`}
                        onClick={() => handleViewDocument(r.document_url!)}
                      >
                        View
                      </button>
                    ) : "—"}
                  </td>
                  <td data-label="Status">
                    <span className={badgeClass(r.status)}>{r.status}</span>
                  </td>
                  <td data-label="Actions">
                    {r.status === "pending" ? (
                      <div className={styles.actions}>
                        <button
                          type="button"
                          className={`${styles.btn} ${styles.approveBtn}`}
                          disabled={actingId === r.id}
                          onClick={() => handleDecision(r.id, "approved")}
                        >
                          Approve
                        </button>
                        <button
                          type="button"
                          className={`${styles.btn} ${styles.rejectBtn}`}
                          disabled={actingId === r.id}
                          onClick={() => handleDecision(r.id, "rejected")}
                        >
                          Reject
                        </button>
                      </div>
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
    </div>
  );
}