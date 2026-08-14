import { useEffect, useState } from "react";
import { api } from "../lib/apiClient";

export default function Categories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState(null);

  const refresh = async () => {
    setLoading(true);
    try {
      setCategories(await api.listCategories());
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
      await api.updateCategory(category.id, trimmed);
      await refresh();
    } catch (renameError) {
      setError(renameError.message);
    }
  };

  const handleDelete = async (category) => {
    const warning = category.project_count
      ? `Delete "${category.name}"?\n\nIt is used by ${category.project_count} project(s). Those projects stay, but lose this category and any images filed under it.`
      : `Delete "${category.name}"?`;
    if (!window.confirm(warning)) return;

    try {
      await api.deleteCategory(category.id);
      await refresh();
    } catch (deleteError) {
      setError(deleteError.message);
    }
  };

  return (
    <div className="admin-page">
      <header className="admin-page__header">
        <div>
          <h1>Categories</h1>
          <p className="admin-muted">
            Rooms and unit types. A project can belong to several, and keeps a separate set of
            photos for each.
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
          {categories.map((category) => (
            <li className="admin-list__row" key={category.id}>
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
                  {category.project_count === 1 ? "" : "s"}
                </div>
              </div>

              <button className="admin-btn admin-btn--danger" onClick={() => handleDelete(category)}>
                Delete
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
