import { useEffect, useState } from "react";
import { api } from "../lib/apiClient";
import { invalidateCategories } from "../lib/useCategories";
import ImageManager from "./ImageManager";

/**
 * Categories, their home-page visibility, and their showcase images.
 *
 * The originals are local paths under public/images/categories/ seeded by
 * scripts/seed_categories.py. Anything added here uploads to Cloudinary and
 * stores the delivery URL in the same column, so the two kinds sit together in
 * one ordered list.
 */
export default function Categories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState(null);
  const [openImages, setOpenImages] = useState(null);
  // Unsaved image lists, keyed by category id.
  const [drafts, setDrafts] = useState({});
  const [saving, setSaving] = useState(null);

  const refresh = async () => {
    setLoading(true);
    try {
      const rows = await api.listCategories();
      setCategories(rows);
      setDrafts({});
      // The public site keeps its own snapshot; drop it so an editor sees the
      // change on the site immediately rather than waiting out the cache TTL.
      invalidateCategories();
    } catch (loadError) {
      setError(loadError.message);
    }
    setLoading(false);
  };

  useEffect(() => {
    refresh();
  }, []);

  const handleCreate = async (event) => {
    event.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;

    setBusy(true);
    setError("");
    try {
      await api.createCategory(trimmed);
      setName("");
      await refresh();
    } catch (createError) {
      setError(createError.message);
    }
    setBusy(false);
  };

  const handleRename = async (category, nextName) => {
    const trimmed = nextName.trim();
    setEditing(null);
    if (!trimmed || trimmed === category.name) return;
    try {
      await api.updateCategory(category.id, { name: trimmed });
      await refresh();
    } catch (renameError) {
      setError(renameError.message);
    }
  };

  const toggleDashboard = async (category) => {
    const next = !category.show_in_dashboard;
    // Optimistic: the switch should not lag behind the click.
    setCategories((current) =>
      current.map((row) => (row.id === category.id ? { ...row, show_in_dashboard: next } : row)),
    );
    try {
      await api.updateCategory(category.id, { show_in_dashboard: next });
      invalidateCategories();
    } catch (toggleError) {
      setError(toggleError.message);
      setCategories((current) =>
        current.map((row) =>
          row.id === category.id ? { ...row, show_in_dashboard: !next } : row,
        ),
      );
    }
  };

  const handleDelete = async (category) => {
    const parts = [`Delete "${category.name}"?`];
    if (category.images?.length) {
      parts.push(`Its ${category.images.length} showcase image(s) go with it.`);
    }
    if (category.project_count) {
      parts.push(
        `It is used by ${category.project_count} project(s). Those projects stay, but lose this category and any images filed under it.`,
      );
    }
    if (!window.confirm(parts.join("\n\n"))) return;

    try {
      await api.deleteCategory(category.id);
      await refresh();
    } catch (deleteError) {
      setError(deleteError.message);
    }
  };

  const imagesFor = (category) => drafts[category.id] ?? category.images ?? [];
  const isDirty = (category) => drafts[category.id] !== undefined;

  const saveImages = async (category) => {
    setSaving(category.id);
    setError("");
    try {
      const saved = await api.replaceCategoryImages(
        category.id,
        imagesFor(category).map((image) => ({ image_url: image.image_url })),
      );
      setCategories((current) =>
        current.map((row) => (row.id === category.id ? { ...row, images: saved } : row)),
      );
      setDrafts((current) => {
        const next = { ...current };
        delete next[category.id];
        return next;
      });
      invalidateCategories();
    } catch (saveError) {
      setError(saveError.message);
    }
    setSaving(null);
  };

  const discardImages = (category) =>
    setDrafts((current) => {
      const next = { ...current };
      delete next[category.id];
      return next;
    });

  return (
    <div className="admin-page">
      <header className="admin-page__header">
        <div>
          <h1>Categories</h1>
          <p className="admin-muted">
            Rooms and unit types. A project can belong to several and keeps a separate set of
            photos for each. The showcase images below are the category&apos;s own, shown on the
            site under Our Work.
          </p>
        </div>
      </header>

      <form className="admin-card admin-inline-form" onSubmit={handleCreate}>
        <label className="admin-field admin-field--grow">
          <span>Name</span>
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Shoe Rack"
          />
        </label>
        <button className="admin-btn admin-btn--primary" disabled={busy || !name.trim()}>
          Add category
        </button>
      </form>

      {error && <div className="admin-alert admin-alert--error">{error}</div>}

      {loading ? (
        <p className="admin-muted">Loading…</p>
      ) : categories.length === 0 ? (
        <div className="admin-card admin-empty">
          <p>No categories yet. Add your first one above.</p>
        </div>
      ) : (
        <ul className="admin-list">
          {categories.map((category) => {
            const images = imagesFor(category);
            const open = openImages === category.id;

            return (
              <li className="admin-cat" key={category.id}>
                <div className="admin-cat__row">
                  <div className="admin-list__main">
                    {editing === category.id ? (
                      <input
                        className="admin-inline-input"
                        defaultValue={category.name}
                        autoFocus
                        onBlur={(event) => handleRename(category, event.target.value)}
                        onKeyDown={(event) => {
                          if (event.key === "Enter") handleRename(category, event.target.value);
                          if (event.key === "Escape") setEditing(null);
                        }}
                      />
                    ) : (
                      <button className="admin-linkish" onClick={() => setEditing(category.id)}>
                        {category.name}
                      </button>
                    )}
                    <div className="admin-muted small">
                      {category.project_count || 0} project
                      {category.project_count === 1 ? "" : "s"} ·{" "}
                      {category.images?.length || 0} image
                      {category.images?.length === 1 ? "" : "s"}
                    </div>

                    {/* The home grid is photo tiles, so a category with no
                        images has nothing to draw and is skipped. Say so here
                        rather than let the toggle look broken. */}
                    {category.show_in_dashboard && !category.images?.length && (
                      <button
                        type="button"
                        className="admin-hint"
                        onClick={() => setOpenImages(category.id)}
                      >
                        Needs at least one image before it appears on the home page. Add one →
                      </button>
                    )}
                  </div>

                  <label
                    className="admin-switch"
                    title={
                      category.show_in_dashboard
                        ? "Showing on the home page"
                        : "Hidden from the home page"
                    }
                  >
                    <input
                      type="checkbox"
                      checked={!!category.show_in_dashboard}
                      onChange={() => toggleDashboard(category)}
                    />
                    <span className="admin-switch__track" aria-hidden="true">
                      <span className="admin-switch__thumb" />
                    </span>
                    <span className="admin-switch__label">Home page</span>
                  </label>

                  <button
                    className="admin-btn admin-btn--ghost"
                    onClick={() => setOpenImages(open ? null : category.id)}
                    aria-expanded={open}
                  >
                    {open ? "Close images" : "Images"}
                  </button>

                  <button
                    className="admin-btn admin-btn--danger"
                    onClick={() => handleDelete(category)}
                  >
                    Delete
                  </button>
                </div>

                {open && (
                  <div className="admin-cat__images">
                    <ImageManager
                      images={images}
                      folder={`dreamyspaces/categories/${category.name}`}
                      onChange={(next) =>
                        setDrafts((current) => ({ ...current, [category.id]: next }))
                      }
                    />

                    <div className="admin-cat__actions">
                      <button
                        className="admin-btn admin-btn--primary"
                        onClick={() => saveImages(category)}
                        disabled={!isDirty(category) || saving === category.id}
                      >
                        {saving === category.id ? "Saving…" : "Save images"}
                      </button>
                      {isDirty(category) && (
                        <button
                          className="admin-btn admin-btn--ghost"
                          onClick={() => discardImages(category)}
                          disabled={saving === category.id}
                        >
                          Discard changes
                        </button>
                      )}
                      <span className="admin-muted small">
                        {isDirty(category)
                          ? "Unsaved changes. Drag to reorder; the first image is the cover."
                          : "Drag to reorder. The first image is the cover."}
                      </span>
                    </div>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
