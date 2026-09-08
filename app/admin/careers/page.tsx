"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getCurrentUser, checkIsAdmin, adminSignOut } from "../../../lib/admin";
import {
  fetchAllRoles,
  setRoleOpen,
  fetchApplications,
  getCvSignedUrl,
  type JobRole,
  type JobApplication,
} from "../../../lib/careers";
import Link from "next/link";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function AdminCareersPage() {
  const router = useRouter();

  const [checkingAuth, setCheckingAuth] = useState(true);
  const [roles, setRoles] = useState<JobRole[]>([]);
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const [activeApplication, setActiveApplication] = useState<JobApplication | null>(null);
  const [cvLoading, setCvLoading] = useState(false);
  const [cvError, setCvError] = useState("");

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

  async function loadAll() {
    setLoading(true);
    setLoadError("");
    try {
      const [rolesData, applicationsData] = await Promise.all([
        fetchAllRoles(),
        fetchApplications(),
      ]);
      setRoles(rolesData);
      setApplications(applicationsData);
    } catch (err) {
      console.error("Failed to load careers data", err);
      setLoadError("Could not load careers data. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!checkingAuth) loadAll();
  }, [checkingAuth]);

  async function handleToggle(role: JobRole) {
    setTogglingId(role.id);
    try {
      await setRoleOpen(role.id, !role.is_open);
      setRoles((prev) =>
        prev.map((r) => (r.id === role.id ? { ...r, is_open: !r.is_open } : r)),
      );
    } catch (err) {
      console.error("Failed to update role", err);
      alert("Could not update this role. Please try again.");
    } finally {
      setTogglingId(null);
    }
  }

  async function handleDownloadCv(application: JobApplication) {
    setCvLoading(true);
    setCvError("");
    try {
      const url = await getCvSignedUrl(application.cv_path);
      window.open(url, "_blank", "noopener,noreferrer");
    } catch (err) {
      console.error("Failed to get CV link", err);
      setCvError("Could not open this CV. Please try again.");
    } finally {
      setCvLoading(false);
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

  const openCount = roles.filter((r) => r.is_open).length;

  return (
    <main>
      <div className="wrap admin-wrap">
        <div className="admin-header">
          <div>
            <span className="section-tag">Admin</span>
            <h2>Careers</h2>
            <p>Open or close roles, and review submitted applications.</p>
          </div>
          <div className="admin-header-actions">
            <Link href="/admin" className="btn btn-outline btn-sm">
              Back to Dashboard
            </Link>
            <button className="btn btn-outline btn-sm" onClick={loadAll} disabled={loading}>
              {loading ? "Refreshing…" : "Refresh"}
            </button>
          </div>
        </div>

        {loadError && (
          <div className="admin-error-banner">
            <p>{loadError}</p>
            <button className="btn btn-outline btn-sm" onClick={loadAll}>
              Retry
            </button>
          </div>
        )}

        {loading ? (
          <div className="admin-loading-block">
            <span className="reviews-spinner" />
            <p>Loading careers data…</p>
          </div>
        ) : (
          <>
            <div className="dash-stats admin-stats-2">
              <div className="dash-stat-card">
                <span className="dash-stat-label">Open Roles</span>
                <span className="dash-stat-value">{openCount}</span>
              </div>
              <div className="dash-stat-card">
                <span className="dash-stat-label">Applications</span>
                <span className="dash-stat-value">{applications.length}</span>
              </div>
            </div>

            <div className="dash-section-head-row">
              <h3>Job Roles</h3>
            </div>
            <div className="admin-card">
              <div className="admin-table-wrap">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Role</th>
                      <th>Status</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {roles.map((role) => (
                      <tr key={role.id}>
                        <td>{role.title}</td>
                        <td>
                          <span
                            className={`status-pill ${
                              role.is_open ? "status-approved" : "status-rejected"
                            }`}
                          >
                            {role.is_open ? "Open" : "Closed"}
                          </span>
                        </td>
                        <td>
                          <button
                            className="btn btn-outline btn-sm"
                            onClick={() => handleToggle(role)}
                            disabled={togglingId === role.id}
                          >
                            {togglingId === role.id
                              ? "Saving…"
                              : role.is_open
                                ? "Close Role"
                                : "Open Role"}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="dash-section-head-row">
              <h3>Applications</h3>
            </div>
            <div className="admin-card">
              {applications.length === 0 ? (
                <p className="reviews-empty">No applications yet.</p>
              ) : (
                <div className="admin-table-wrap">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Applicant</th>
                        <th>Role</th>
                        <th>Contact</th>
                        <th>Applied</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {applications.map((app) => (
                        <tr key={app.id}>
                          <td>{app.name}</td>
                          <td>{app.role_title}</td>
                          <td>{app.email}</td>
                          <td>{formatDate(app.created_at)}</td>
                          <td>
                            <button
                              className="btn btn-outline btn-sm"
                              onClick={() => setActiveApplication(app)}
                            >
                              View
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {activeApplication && (
        <div className="modal-overlay show" onClick={() => setActiveApplication(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-head">
              <h3>{activeApplication.name}</h3>
              <button
                className="modal-close"
                onClick={() => setActiveApplication(null)}
                aria-label="Close"
              >
                ✕
              </button>
            </div>
            <div className="modal-body">
              <div className="order-summary">
                <div className="order-summary-line">
                  <span>Role</span>
                  <span>{activeApplication.role_title}</span>
                </div>
                <div className="order-summary-line">
                  <span>Email</span>
                  <span>{activeApplication.email}</span>
                </div>
                <div className="order-summary-line">
                  <span>Phone</span>
                  <span>{activeApplication.phone}</span>
                </div>
                <div className="order-summary-line">
                  <span>Applied</span>
                  <span>{formatDate(activeApplication.created_at)}</span>
                </div>
              </div>
              <div className="field">
                <label>Cover Letter</label>
                <p style={{ whiteSpace: "pre-wrap" }}>{activeApplication.cover_letter}</p>
              </div>
              {cvError && <p className="field-error" style={{ display: "block" }}>{cvError}</p>}
            </div>
            <div className="modal-foot">
              <button
                className="btn btn-primary btn-full"
                onClick={() => handleDownloadCv(activeApplication)}
                disabled={cvLoading}
              >
                {cvLoading ? "Opening…" : `Download CV (${activeApplication.cv_filename})`}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}