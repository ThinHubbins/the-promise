"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { getCurrentUser, checkIsAdmin, adminSignOut } from "../../../lib/admin";
import { fetchBankAccountsForStaffIds } from "../../../lib/bankAccount";
import type { BankAccount } from "../../../lib/types";
import {
  fetchAllFundRequests,
  updateFundRequestStatus,
  getFundRequestDocumentUrl,
} from "../../../lib/fundRequests";
import type { FundRequest, FundRequestStatus } from "../../../lib/types";
import { FUND_REQUEST_TYPE_LABELS } from "../../../lib/types";
import Link from "next/link";

function formatNaira(n: number): string {
  return "\u20A6" + n.toLocaleString("en-NG");
}

const STATUS_OPTIONS: { value: "all" | FundRequestStatus; label: string }[] = [
  { value: "all", label: "All statuses" },
  { value: "pending", label: "Pending" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
  { value: "paid", label: "Paid" },
];

export default function AdminFundRequestsPage() {
  const router = useRouter();
  const [checkingAuth, setCheckingAuth] = useState(true);

  const [requests, setRequests] = useState<FundRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<"all" | FundRequestStatus>("all");
  const [actingId, setActingId] = useState<string | null>(null);
  const [bankAccounts, setBankAccounts] = useState<Record<string, BankAccount>>({});

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

 const loadRequests = useCallback(async () => {
  setLoading(true);
  setLoadError(null);
  try {
    const reqs = await fetchAllFundRequests();
    const banks = await fetchBankAccountsForStaffIds(reqs.map((r) => r.staff_id));
    setRequests(reqs);
    setBankAccounts(banks);
  } catch (err) {
    console.error("Failed to load fund requests", err);
    setLoadError("Could not load fund requests. Please try again.");
  } finally {
    setLoading(false);
  }
}, []);

  useEffect(() => {
    if (!checkingAuth) loadRequests();
  }, [checkingAuth, loadRequests]);

  async function handleStatusChange(id: string, status: FundRequestStatus) {
    setActingId(id);
    try {
      await updateFundRequestStatus(id, status);
      await loadRequests();
    } catch (err: any) {
      alert(err?.message ?? "Could not update request.");
    } finally {
      setActingId(null);
    }
  }

  async function handleViewDocument(path: string) {
    const url = await getFundRequestDocumentUrl(path);
    if (url) window.open(url, "_blank");
  }

  async function handleSignOut() {
    await adminSignOut();
    router.push("/admin/login");
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

  const filtered = requests.filter(
    (r) => statusFilter === "all" || r.status === statusFilter,
  );

  return (
    <main>
      <div className="wrap admin-wrap">
        <div className="admin-header">
          <div>
            <span className="section-tag">The Promise Admin</span>
            <h2>Fund Requests</h2>
            <p>Review, approve, and pay staff fund requests.</p>
          </div>
          <div className="admin-header-actions">
            <Link href="/admin" className="btn btn-outline btn-sm">Sales Analytics</Link>
            <button
              className="btn btn-outline btn-sm"
              onClick={loadRequests}
              disabled={loading}
            >
              {loading ? "Refreshing…" : "Refresh"}
            </button>
            <button className="btn btn-outline btn-sm" onClick={handleSignOut}>
              Sign out
            </button>
          </div>
        </div>

        {loadError && (
          <div className="admin-error-banner">
            <p>{loadError}</p>
            <button className="btn btn-outline btn-sm" onClick={loadRequests}>
              Retry
            </button>
          </div>
        )}

        <div className="dash-section-head-row admin-filter-row">
          <h3>Requests</h3>
          <div className="admin-filter-controls">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as "all" | FundRequestStatus)}
            >
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
        </div>

        {loading ? (
          <div className="admin-loading-block">
            <span className="reviews-spinner" />
            <p>Loading fund requests…</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="dash-empty-card">
            <p>No fund requests match this filter.</p>
          </div>
        ) : (
          <div className="admin-card">
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Staff</th>
<th>Staff ID</th>
<th>Outlet</th>
<th>Type</th>
<th>Amount</th>
<th>Reason</th>
<th>Date</th>
<th>Status</th>
<th>Bank Account</th>
<th>Receipt</th>
<th></th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((r) => {
  const bank = bankAccounts[r.staff_id];
  return (
    <tr key={r.id}>
  <td data-label="Staff">{r.staff_name}</td>
  <td data-label="Staff ID">{r.staff_code}</td>
  <td data-label="Outlet">{r.outlet ?? "—"}</td>
  <td data-label="Type">{FUND_REQUEST_TYPE_LABELS[r.request_type]}</td>
  <td data-label="Amount">{formatNaira(r.amount)}</td>
  <td data-label="Reason">{r.reason}</td>
  <td data-label="Date">{new Date(r.submitted_at).toLocaleDateString()}</td>
  <td data-label="Status">
    <span className={`admin-badge admin-badge-${r.status}`}>{r.status}</span>
  </td>
  <td data-label="Bank Account">
    {bank ? (
      <span className="admin-bank-cell">
        {bank.account_name} · {bank.bank_name} · {bank.account_number}
      </span>
    ) : (
      <span className="admin-bank-missing">Not on file</span>
    )}
  </td>
  <td data-label="Receipt">
    {r.document_url ? (
      <button className="btn btn-outline btn-sm" onClick={() => handleViewDocument(r.document_url!)}>
        View
      </button>
    ) : "—"}
  </td>
  <td data-label="Actions">
    <div className="admin-row-actions">
      <button className="btn btn-outline btn-sm" disabled={r.status !== "pending" || actingId === r.id} onClick={() => handleStatusChange(r.id, "approved")}>Approve</button>
      <button className="btn btn-outline btn-sm" disabled={r.status !== "pending" || actingId === r.id} onClick={() => handleStatusChange(r.id, "rejected")}>Reject</button>
      <button className="btn btn-outline btn-sm" disabled={r.status !== "approved" || actingId === r.id} onClick={() => handleStatusChange(r.id, "paid")}>
        {actingId === r.id ? "Working…" : "Mark as Paid"}
      </button>
    </div>
  </td>
</tr>
  );
})}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}