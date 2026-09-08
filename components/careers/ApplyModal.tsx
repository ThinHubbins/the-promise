"use client";

import { useState } from "react";
import { submitApplication, markAppliedLocally, type JobRole } from "../../lib/careers";

const MAX_FILE_BYTES = 5 * 1024 * 1024; // 5MB

export default function ApplyModal({
  role,
  onClose,
  onApplied,
}: {
  role: JobRole;
  onClose: () => void;
  onApplied: () => void;
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [coverLetter, setCoverLetter] = useState("");
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    setFileError("");
    if (file && file.size > MAX_FILE_BYTES) {
      setFileError("CV must be under 5MB.");
      setCvFile(null);
      return;
    }
    setCvFile(file);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!cvFile) {
      setFileError("Please attach your CV.");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      await submitApplication({
        roleId: role.id,
        roleTitle: role.title,
        name,
        email,
        phone,
        coverLetter,
        cvFile,
      });
      markAppliedLocally(role.id);
      setSubmitted(true);
    } catch (err) {
      console.error("Application failed", err);
      setError("Something went wrong submitting your application. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="modal-overlay show" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <h3>{submitted ? "Application Sent" : `Apply — ${role.title}`}</h3>
          <button className="modal-close" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>

        {submitted ? (
          <div className="modal-body">
            <div className="confirm-body">
              <div className="confirm-icon">✓</div>
              <h4>Thanks, {name.split(" ")[0]}!</h4>
              <p>
                Your application for {role.title} has been received. Our team
                will reach out if you&apos;re shortlisted.
              </p>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="modal-body">
              <div className="field">
                <label htmlFor="apply-name">Full Name</label>
                <input
                  id="apply-name"
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div className="field">
                <label htmlFor="apply-email">Email</label>
                <input
                  id="apply-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div className="field">
                <label htmlFor="apply-phone">Phone</label>
                <input
                  id="apply-phone"
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>
              <div className="field">
                <label htmlFor="apply-cover">Cover Letter</label>
                <textarea
                  id="apply-cover"
                  required
                  rows={4}
                  value={coverLetter}
                  onChange={(e) => setCoverLetter(e.target.value)}
                />
              </div>
              <div className={`field${fileError ? " has-error" : ""}`}>
                <label htmlFor="apply-cv">CV (PDF or Word, max 5MB)</label>
                <input
                  id="apply-cv"
                  type="file"
                  accept=".pdf,.doc,.docx"
                  required
                  onChange={handleFileChange}
                />
                {fileError && <p className="field-error">{fileError}</p>}
              </div>
              {error && <p className="field-error" style={{ display: "block" }}>{error}</p>}
            </div>
            <div className="modal-foot">
              <button
                type="button"
                className="btn btn-outline"
                onClick={onClose}
                disabled={submitting}
              >
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" disabled={submitting}>
                {submitting ? "Submitting…" : "Submit Application"}
              </button>
            </div>
          </form>
        )}

        {submitted && (
          <div className="modal-foot">
            <button className="btn btn-primary btn-full" onClick={onApplied}>
              Done
            </button>
          </div>
        )}
      </div>
    </div>
  );
}