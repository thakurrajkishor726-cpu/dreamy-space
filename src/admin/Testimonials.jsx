import { useEffect, useState } from "react";
import { api } from "../lib/apiClient";

/**
 * Client testimonials: name, designation, rating out of 5, and the comment.
 *
 * Order here is the order they appear on the site — the home page rotates
 * through them and the Testimonials page lists them in the same sequence.
 */

const EMPTY = { name: "", designation: "", rating: 5, comment: "" };

function Stars({ value, onChange }) {
  return (
    <div className="admin-stars" role="radiogroup" aria-label="Rating out of 5">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          role="radio"
          aria-checked={value === n}
          aria-label={`${n} star${n === 1 ? "" : "s"}`}
          className={`admin-star ${n <= value ? "is-on" : ""}`}
          onClick={() => onChange(n)}
        >
          ★
        </button>
      ))}
      <span className="admin-muted small">{value} / 5</span>
    </div>
  );
}

export default function Testimonials() {
  const [rows, setRows] = useState(null);
  const [error, setError] = useState("");
  const [form, setForm] = useState(EMPTY);
  const [editingId, setEditingId] = useState(null);
  const [busy, setBusy] = useState(false);

  const refresh = async () => {
    try {
      setRows(await api.listTestimonials());
    } catch (loadError) {
      setError(loadError.message);
      setRows([]);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  const startEdit = (row) => {
    setEditingId(row.id);
    setForm({
      name: row.name,
      designation: row.designation || "",
      rating: row.rating,
      comment: row.comment,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const cancel = () => {
    setEditingId(null);
    setForm(EMPTY);
  };

  const submit = async (event) => {
    event.preventDefault();
    if (!form.name.trim() || !form.comment.trim()) return;

    setBusy(true);
    setError("");
    try {
      const payload = {
        name: form.name.trim(),
        designation: form.designation.trim(),
        rating: Number(form.rating),
        comment: form.comment.trim(),
      };
      if (editingId) await api.updateTestimonial(editingId, payload);
      else await api.createTestimonial(payload);
      cancel();
      await refresh();
    } catch (saveError) {
      setError(saveError.message);
    }
    setBusy(false);
  };

  const move = async (row, direction) => {
    setBusy(true);
    try {
      setRows(await api.moveTestimonial(row.id, direction));
    } catch (moveError) {
      setError(moveError.message);
    }
    setBusy(false);
  };

  const remove = async (row) => {
    if (!window.confirm(`Delete the testimonial from ${row.name}? This cannot be undone.`)) return;
    setBusy(true);
    try {
      await api.deleteTestimonial(row.id);
      if (editingId === row.id) cancel();
      await refresh();
    } catch (deleteError) {
      setError(deleteError.message);
    }
    setBusy(false);
  };

  return (
    <div className="admin-page">
      <header className="admin-page__header">
        <div>
          <h1>Testimonials</h1>
          <p className="admin-muted">
            Shown on the home page and the Testimonials page, in the order below. Only publish
            feedback a client actually gave you.
          </p>
        </div>
      </header>

      {error && <div className="admin-alert admin-alert--error">{error}</div>}

      <form className="admin-card" onSubmit={submit}>
        <h2 className="admin-card__title">{editingId ? "Edit testimonial" : "Add testimonial"}</h2>

        <div className="admin-row">
          <label className="admin-field">
            <span>Name</span>
            <input
              value={form.name}
              onChange={(event) => setForm((f) => ({ ...f, name: event.target.value }))}
              placeholder="Ananya Sharma"
              maxLength={120}
            />
          </label>
          <label className="admin-field">
            <span>Designation</span>
            <input
              value={form.designation}
              onChange={(event) => setForm((f) => ({ ...f, designation: event.target.value }))}
              placeholder="Homeowner, Whitefield"
              maxLength={160}
            />
          </label>
        </div>

        <div className="admin-field">
          <span>Rating</span>
          <Stars value={Number(form.rating)} onChange={(n) => setForm((f) => ({ ...f, rating: n }))} />
        </div>

        <label className="admin-field">
          <span>Comment</span>
          <textarea
            rows={4}
            value={form.comment}
            onChange={(event) => setForm((f) => ({ ...f, comment: event.target.value }))}
            placeholder="What they said about the work."
            maxLength={2000}
          />
          <span className="admin-muted small">{form.comment.length} / 2000</span>
        </label>

        <div className="admin-toolbar">
          <button
            className="admin-btn admin-btn--primary"
            disabled={busy || !form.name.trim() || !form.comment.trim()}
          >
            {editingId ? "Save changes" : "Add testimonial"}
          </button>
          {editingId && (
            <button type="button" className="admin-btn admin-btn--ghost" onClick={cancel}>
              Cancel
            </button>
          )}
        </div>
      </form>

      {rows === null ? (
        <p className="admin-muted">Loading…</p>
      ) : rows.length === 0 ? (
        <div className="admin-card admin-empty">
          <p>
            No testimonials yet. Add one above, or seed the starter set with{" "}
            <code>python scripts/seed_testimonials.py</code>.
          </p>
        </div>
      ) : (
        <ul className="admin-list">
          {rows.map((row, index) => (
            <li className="admin-list__row" key={row.id}>
              <div className="admin-list__reorder">
                <button
                  className="admin-btn admin-btn--ghost"
                  onClick={() => move(row, "up")}
                  disabled={busy || index === 0}
                  aria-label="Move up"
                >
                  ↑
                </button>
                <button
                  className="admin-btn admin-btn--ghost"
                  onClick={() => move(row, "down")}
                  disabled={busy || index === rows.length - 1}
                  aria-label="Move down"
                >
                  ↓
                </button>
              </div>

              <div className="admin-list__main">
                <div className="admin-quote__head">
                  <strong>{row.name}</strong>
                  <span className="admin-quote__stars" aria-label={`${row.rating} out of 5`}>
                    {"★".repeat(row.rating)}
                    <span className="admin-quote__stars-off">{"★".repeat(5 - row.rating)}</span>
                  </span>
                </div>
                {row.designation && (
                  <div className="admin-muted small">{row.designation}</div>
                )}
                <p className="admin-quote__body">{row.comment}</p>
              </div>

              <button className="admin-btn admin-btn--ghost" onClick={() => startEdit(row)}>
                Edit
              </button>
              <button className="admin-btn admin-btn--danger" onClick={() => remove(row)}>
                Delete
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
