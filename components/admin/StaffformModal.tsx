"use client";

import { useEffect, useState } from "react";
import type { Staff, StaffInput, StaffStatus } from "../../lib/types";
import { addStaff, updateStaff } from "../../lib/staff";
import { outlets } from "../../lib/outlets";

type Mode = "add" | "edit" | "view";

const EMPTY_FORM: StaffInput = {
  full_name: "",
  email: "",
  phone: "",
  staff_id: "",
  job_title: "",
  department: "",
  outlet: "",
  status: "active",
  salary: "",
  hire_date: "",
};

export default function StaffFormModal({
  mode,
  staff,
  onClose,
  onSaved,
}: {
  mode: Mode;
  staff: Staff | null;
  onClose: () => void;
  onSaved: (staff: Staff) => void;
}) {
  const [currentMode, setCurrentMode] = useState<Mode>(mode);
  const [form, setForm] = useState<StaffInput>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
  if (staff) {
    setForm({
      full_name: staff.full_name,
      email: staff.email,
      phone: staff.phone ?? "",
      staff_id: staff.staff_id,
      job_title: staff.job_title ?? "",
      department: staff.department ?? "",
      outlet: staff.outlet ?? "",
      status: staff.status,
      salary: staff.salary != null ? String(staff.salary) : "",
      hire_date: staff.hire_date ?? "",
    });
  } else {
    setForm(EMPTY_FORM);
  }

  setCurrentMode(mode);
  setError(null);
}, [staff, mode]);

  function update<K extends keyof StaffInput>(
    key: K,
    value: StaffInput[K],
  ) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (
      !form.full_name.trim() ||
      !form.email.trim() ||
      !form.staff_id.trim()
    ) {
      setError("Full name, email, and Staff ID are required.");
      return;
    }

    setSaving(true);

    try {
      const result =
        currentMode === "edit" && staff
          ? await updateStaff(staff.id, form)
          : await addStaff(form);

      onSaved(result);
    } catch (err: any) {
      console.error("Failed to save staff", err);

      setError(
        err?.message?.includes("duplicate")
          ? "A staff member with this email or Staff ID already exists."
          : "Could not save staff member. Please try again.",
      );
    } finally {
      setSaving(false);
    }
  }

  const isView = currentMode === "view";

  const title =
    currentMode === "add"
      ? "Add Staff"
      : currentMode === "edit"
        ? "Edit Staff"
        : "Staff Details";

  return (
    <div className="modal-overlay show" onClick={onClose}>
      <div
        className="modal-card staff-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-head">
          <h3>{title}</h3>

          <button
            type="button"
            className="modal-close"
            onClick={onClose}
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="staff-modal-form">
          <div className="modal-body staff-modal-body">
            {error && (
              <p
                className="field-error"
                style={{
                  display: "block",
                  marginBottom: 14,
                  gridColumn: "1 / -1",
                }}
              >
                {error}
              </p>
            )}

            <div className="field">
              <label>Full Name</label>
              <input
                type="text"
                value={form.full_name}
                disabled={isView}
                onChange={(e) => update("full_name", e.target.value)}
                required
              />
            </div>

            <div className="field">
              <label>Email</label>
              <input
                type="email"
                value={form.email}
                disabled={isView}
                onChange={(e) => update("email", e.target.value)}
                required
              />
            </div>

            <div className="field">
              <label>Phone</label>
              <input
                type="tel"
                value={form.phone}
                disabled={isView}
                onChange={(e) => update("phone", e.target.value)}
              />
            </div>

            <div className="field">
              <label>Staff ID</label>
              <input
                type="text"
                value={form.staff_id}
                disabled={isView}
                onChange={(e) => update("staff_id", e.target.value)}
                required
              />
            </div>

            <div className="field">
              <label>Job Title</label>
              <input
                type="text"
                value={form.job_title}
                disabled={isView}
                onChange={(e) => update("job_title", e.target.value)}
              />
            </div>

            <div className="field">
  <label>Salary</label>
  <input
    type="number"
    value={form.salary}
    disabled={isView}
    onChange={(e) => update("salary", e.target.value)}
    placeholder="e.g. 150000"
  />
</div>

<div className="field">
  <label>Hire Date</label>
  <input
    type="date"
    value={form.hire_date}
    disabled={isView}
    onChange={(e) => update("hire_date", e.target.value)}
  />
</div>

            <div className="field">
              <label>Department</label>
              <input
                type="text"
                value={form.department}
                disabled={isView}
                onChange={(e) => update("department", e.target.value)}
              />
            </div>

            <div className="field">
              <label>Outlet / Branch</label>
              <select
                value={form.outlet}
                disabled={isView}
                onChange={(e) => update("outlet", e.target.value)}
                required
              >
                <option value="">Select branch</option>

                {outlets.map((outlet) => (
                  <option key={outlet.id} value={outlet.id}>
                    {outlet.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="field">
              <label>Status</label>

              <select
                value={form.status}
                disabled={isView}
                onChange={(e) =>
                  update("status", e.target.value as StaffStatus)
                }
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>

          <div className="modal-foot">
            {isView ? (
              <>
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={onClose}
                >
                  Close
                </button>

                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => setCurrentMode("edit")}
                >
                  Edit
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={onClose}
                  disabled={saving}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={saving}
                >
                  {saving ? "Saving…" : "Save"}
                </button>
              </>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}