"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { getCurrentUser, checkIsAdmin, adminSignOut } from "../../../lib/admin";
import { fetchDishes, createDish, deleteDish } from "../../../lib/dishes";
import { categories } from "../../../lib/dishCategories";
import type { Dish, DishInput, IconType } from "../../../lib/types";
import Link from "next/link";

const ICON_OPTIONS: IconType[] = ['rice', 'burger', 'shawarma', 'soup', 'snack', 'drink'];

const EMPTY_FORM: DishInput = {
  name: "",
  cat: categories[0]?.key ?? "",
  desc: "",
  fullDesc: "",
  price: "",
  icon: "rice",
  tone: "yellow",
  tag: "",
};

function formatNaira(n: number): string {
  return "\u20A6" + n.toLocaleString("en-NG");
}

export default function AdminMenuPage() {
  const router = useRouter();
  const [checkingAuth, setCheckingAuth] = useState(true);

  const [dishes, setDishes] = useState<Dish[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<DishInput>(EMPTY_FORM);
  const [imageFiles, setImageFiles] = useState<(File | null)[]>([null, null, null]);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

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

  const loadDishes = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      setDishes(await fetchDishes());
    } catch (err) {
      console.error("Failed to load dishes", err);
      setLoadError("Could not load menu. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!checkingAuth) loadDishes();
  }, [checkingAuth, loadDishes]);

  function updateField<K extends keyof DishInput>(key: K, value: DishInput[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function updateImage(index: number, file: File | null) {
    setImageFiles((prev) => {
      const next = [...prev];
      next[index] = file;
      return next;
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);

    if (!form.name.trim() || !form.desc.trim() || !form.fullDesc.trim()) {
      setFormError("Name, description and full description are required.");
      return;
    }
    const priceNum = parseFloat(form.price);
    if (!form.price || isNaN(priceNum) || priceNum <= 0) {
      setFormError("Enter a valid price greater than 0.");
      return;
    }

    const files = imageFiles.filter((f): f is File => f !== null);

    setSaving(true);
    try {
      const created = await createDish(form, files);
      setDishes((prev) => [...prev, created]);
      setForm(EMPTY_FORM);
      setImageFiles([null, null, null]);
      setShowForm(false);
    } catch (err) {
      console.error("Failed to create dish", err);
      setFormError("Could not save dish. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this dish from the menu?")) return;
    setDeletingId(id);
    try {
      await deleteDish(id);
      setDishes((prev) => prev.filter((d) => d.id !== id));
    } catch (err) {
      console.error("Failed to delete dish", err);
      alert("Could not delete dish.");
    } finally {
      setDeletingId(null);
    }
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

  return (
    <main>
      <div className="wrap admin-wrap">
        <div className="admin-header">
          <div>
            <span className="section-tag">The Promise Admin</span>
            <h2>Menu</h2>
            <p>Add and manage dishes shown on the public menu.</p>
          </div>
          <div className="admin-header-actions">
            <Link href="/admin" className="btn btn-outline btn-sm">Sales Analytics</Link>
            {!showForm && (
              <button className="btn btn-primary btn-sm" onClick={() => setShowForm(true)}>
                Add dish
              </button>
            )}
            <button className="btn btn-outline btn-sm" onClick={handleSignOut}>
              Sign out
            </button>
          </div>
        </div>

        {showForm && (
  <div className="admin-card">
    <form onSubmit={handleSubmit} className="admin-form">
      {formError && <p className="admin-error-text">{formError}</p>}

      <div className="admin-form-grid">
        <div className="admin-field">
          <label>Dish name</label>
          <input
            type="text"
            value={form.name}
            onChange={(e) => updateField("name", e.target.value)}
            required
          />
        </div>

        <div className="admin-field">
          <label>Category</label>
          <select
            value={form.cat}
            onChange={(e) => updateField("cat", e.target.value)}
          >
            {categories.map((c) => (
              <option key={c.key} value={c.key}>{c.label}</option>
            ))}
          </select>
        </div>

        <div className="admin-field admin-field-full">
          <label>Short description</label>
          <input
            type="text"
            value={form.desc}
            onChange={(e) => updateField("desc", e.target.value)}
            placeholder="Shown on the menu card"
            required
          />
        </div>

        <div className="admin-field admin-field-full">
          <label>Full description</label>
          <textarea
            value={form.fullDesc}
            onChange={(e) => updateField("fullDesc", e.target.value)}
            rows={4}
            placeholder="Shown on the dish detail page"
            required
          />
        </div>

        <div className="admin-field">
          <label>Price (₦)</label>
          <input
            type="number"
            min="0"
            step="1"
            value={form.price}
            onChange={(e) => updateField("price", e.target.value)}
            required
          />
        </div>

        <div className="admin-field">
          <label>Icon</label>
          <select
            value={form.icon}
            onChange={(e) => updateField("icon", e.target.value as IconType)}
          >
            {ICON_OPTIONS.map((i) => (
              <option key={i} value={i}>{i}</option>
            ))}
          </select>
        </div>

        <div className="admin-field">
          <label>Tone</label>
          <select
            value={form.tone}
            onChange={(e) => updateField("tone", e.target.value as "yellow" | "red")}
          >
            <option value="yellow">Yellow</option>
            <option value="red">Red</option>
          </select>
        </div>

        <div className="admin-field">
          <label>Tag (optional)</label>
          <input
            type="text"
            value={form.tag}
            onChange={(e) => updateField("tag", e.target.value)}
            placeholder="e.g. Bestseller"
          />
        </div>

        <div className="admin-field admin-field-full">
          <label>Photos (up to 3)</label>
          <div className="admin-image-inputs">
            {[0, 1, 2].map((i) => (
              <label key={i} className="admin-image-slot">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => updateImage(i, e.target.files?.[0] ?? null)}
                />
                <span>{imageFiles[i] ? imageFiles[i]!.name : `Photo ${i + 1}`}</span>
              </label>
            ))}
          </div>
        </div>
      </div>

      <div className="admin-form-actions">
        <button
          type="button"
          className="btn btn-outline"
          onClick={() => {
            setShowForm(false);
            setForm(EMPTY_FORM);
            setImageFiles([null, null, null]);
            setFormError(null);
          }}
          disabled={saving}
        >
          Cancel
        </button>
        <button type="submit" className="btn btn-primary" disabled={saving}>
          {saving ? "Saving…" : "Add dish"}
        </button>
      </div>
    </form>
  </div>
)}

        {loadError && (
          <div className="admin-error-banner">
            <p>{loadError}</p>
            <button className="btn btn-outline btn-sm" onClick={loadDishes}>Retry</button>
          </div>
        )}

        {loading ? (
          <div className="admin-loading-block">
            <span className="reviews-spinner" />
            <p>Loading menu…</p>
          </div>
        ) : dishes.length === 0 ? (
          <div className="dash-empty-card">
            <p>No dishes yet. Add your first one above.</p>
          </div>
        ) : (
          <div className="admin-card">
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Photo</th>
                    <th>Name</th>
                    <th>Category</th>
                    <th>Price</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {dishes.map((d) => (
                    <tr key={d.id}>
                      <td data-label="Photo">
  {d.images[0] ? (
    <img src={d.images[0]} alt={d.name} className="admin-dish-thumb" />
  ) : "—"}
</td>
                      <td data-label="Name">{d.name}</td>
                      <td data-label="Category">{d.cat}</td>
                      <td data-label="Price">{formatNaira(d.price)}</td>
                      <td data-label="Actions">
                        <button
                          className="btn btn-outline btn-sm"
                          disabled={deletingId === d.id}
                          onClick={() => handleDelete(d.id)}
                        >
                          {deletingId === d.id ? "Deleting…" : "Delete"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}