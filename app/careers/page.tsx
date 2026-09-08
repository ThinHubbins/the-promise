"use client";

import { useEffect, useState } from "react";
import {
  fetchOpenRoles,
  hasAppliedLocally,
  type JobRole,
} from "../../lib/careers";
import ApplyModal from "../../components/careers/ApplyModal";

export default function CareersPage() {
  const [roles, setRoles] = useState<JobRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeRole, setActiveRole] = useState<JobRole | null>(null);
  const [appliedIds, setAppliedIds] = useState<Set<string>>(new Set());

  async function load() {
    setLoading(true);
    setError("");
    try {
      const data = await fetchOpenRoles();
      setRoles(data);
      setAppliedIds(new Set(data.filter((r) => hasAppliedLocally(r.id)).map((r) => r.id)));
    } catch (err) {
      console.error("Failed to load open roles", err);
      setError("Could not load open positions. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  function handleApplied() {
    if (activeRole) {
      setAppliedIds((prev) => new Set(prev).add(activeRole.id));
    }
    setActiveRole(null);
  }

  return (
    <main>
      <section>
        <div className="wrap">
          <div className="section-head">
            <div>
              <span className="section-tag">Careers</span>
              <h2>Open Positions</h2>
              <p>Join our team. Below are the roles we&apos;re currently hiring for.</p>
            </div>
          </div>

          {loading ? (
            <div className="reviews-loading">
              <span className="reviews-spinner" />
              <p>Loading open positions…</p>
            </div>
          ) : error ? (
            <div className="admin-error-banner">
              <p>{error}</p>
              <button className="btn btn-outline btn-sm" onClick={load}>
                Retry
              </button>
            </div>
          ) : roles.length === 0 ? (
            <div className="dash-empty-card">
              <h3>No Open Positions</h3>
              <p>There are currently no open positions. Please check back later.</p>
            </div>
          ) : (
            <div className="dash-orders-list">
              {roles.map((role) => {
                const applied = appliedIds.has(role.id);
                return (
                  <div className="dash-order-card" key={role.id}>
                    <div className="dash-order-main">
                      <span className="dash-order-id">{role.title}</span>
                    </div>
                    <div className="dash-order-side">
                      {applied ? (
                        <span className="status-pill status-approved">Applied</span>
                      ) : (
                        <button
                          className="btn btn-primary btn-sm"
                          onClick={() => setActiveRole(role)}
                        >
                          Apply
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {activeRole && (
        <ApplyModal
          role={activeRole}
          onClose={() => setActiveRole(null)}
          onApplied={handleApplied}
        />
      )}
    </main>
  );
}