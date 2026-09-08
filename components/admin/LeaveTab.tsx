"use client";

import { useEffect, useState } from "react";
import {
  fetchAllLeaveRequests,
  updateLeaveStatus,
  getLeaveDocumentUrl,
} from "../../lib/leave";
import type { LeaveRequest } from "../../lib/types";
import { LEAVE_TYPE_LABELS } from "../../lib/types";

export default function LeaveTab() {
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "approved" | "rejected">("pending");

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
    const updated = await updateLeaveStatus(id, status);
    setRequests((prev) => prev.map((r) => (r.id === id ? updated : r)));
  }

  async function handleViewDocument(path: string) {
    const url = await getLeaveDocumentUrl(path);
    if (url) window.open(url, "_blank");
  }

  const filtered = requests.filter(
    (r) => statusFilter === "all" || r.status === statusFilter,
  );

  if (loading) return <p>Loading leave requests…</p>;

  return (
    <div>
      <div className="filterRow">
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as any)}>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
          <option value="all">All</option>
        </select>
      </div>

      {filtered.length === 0 ? (
        <p>No leave requests found.</p>
      ) : (
        <table className="table">
          <thead>
            <tr>
              <th>Staff</th>
              <th>Dept / Outlet</th>
              <th>Type</th>
              <th>Dates</th>
              <th>Days</th>
              <th>Reason</th>
              <th>Doc</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((r) => (
              <tr key={r.id}>
                <td>{r.staff_name} ({r.staff_code})</td>
                <td>{r.department ?? "—"} / {r.outlet ?? "—"}</td>
                <td>{LEAVE_TYPE_LABELS[r.leave_type]}</td>
                <td>{r.start_date} → {r.end_date}</td>
                <td>{r.days}</td>
                <td>{r.reason}</td>
                <td>
                  {r.document_url ? (
                    <button onClick={() => handleViewDocument(r.document_url!)}>View</button>
                  ) : "—"}
                </td>
                <td>{r.status}</td>
                <td>
                  {r.status === "pending" && (
                    <>
                      <button onClick={() => handleDecision(r.id, "approved")}>Approve</button>
                      <button onClick={() => handleDecision(r.id, "rejected")}>Reject</button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}