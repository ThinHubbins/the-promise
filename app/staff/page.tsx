"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getCurrentUser, checkIsAdmin, adminSignOut } from "../../lib/admin";
import { fetchStaff, setStaffStatus } from "../../lib/staff";
import type { Staff } from "../../lib/types";
import StaffFormModal from "../../components/admin/StaffformModal";

type ModalState =
  | { mode: "add"; staff: null }
  | { mode: "edit" | "view"; staff: Staff }
  | null;

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

  useEffect(() => {
    if (!checkingAuth) loadStaff();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [checkingAuth]);

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
                    <th>Email</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStaff.map((s) => (
                    <tr key={s.id}>
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
                      <td>{s.email}</td>
                      <td>
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
                    </tr>
                  ))}
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