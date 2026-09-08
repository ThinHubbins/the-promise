"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  getCurrentAuthUser,
  getStaffByEmail,
  staffSignOut,
} from "../../../lib/staffAuth";
import type { Staff } from "../../../lib/types";
import Link from "next/link";

export default function StaffDashboardPage() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [staff, setStaff] = useState<Staff | null>(null);
  const [error, setError] = useState<string | null>(null);

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
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </main>
  );
}
