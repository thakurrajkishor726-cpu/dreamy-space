import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import ImageManager from "./ImageManager";
import { api } from "../lib/apiClient";

const slugish = (value) =>
  (value || "untitled")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "untitled";

export default function ProjectEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isNew = id === "new";

  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  // { [categoryId]: [{ image_url }] } — only the keys present are linked.
  const [blocks, setBlocks] = useState({});
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const [cats, project] = await Promise.all([
          api.listCategories(),
          isNew ? Promise.resolve(null) : api.getProject(id),
        ]);
        setCategories(cats);

        if (project) {
          setName(project.name);
          setLocation(project.location || "");
          setBlocks(
            Object.fromEntries(
              project.categories.map((block) => [
                block.category_id,
                block.images.map((image) => ({ image_url: image.image_url })),
              ]),
            ),
          );
        }
      } catch (loadError) {
        setError(loadError.message);
      }
      setLoading(false);
    })();
  }, [id, isNew]);

  const toggleCategory = (categoryId) =>
    setBlocks((current) => {
      const next = { ...current };
      if (categoryId in next) {
        if (
          next[categoryId].length &&
          !window.confirm("Remove this category? Its images will be detached from the project.")
        ) {
          return current;
        }
        delete next[categoryId];
      } else {
        next[categoryId] = [];
      }
      return next;
    });

  const setImages = (categoryId, images) =>
    setBlocks((current) => ({ ...current, [categoryId]: images }));

  const handleSave = async (event) => {
    event.preventDefault();
    if (!name.trim()) {
      setError("Give the project a name.");
      return;
    }
    if (Object.keys(blocks).length === 0) {
      setError("Pick at least one category.");
      return;
    }

    setSaving(true);
    setError("");
    try {
      const payload = {
        name: name.trim(),
        location: location.trim(),
        categories: Object.entries(blocks).map(([categoryId, images]) => ({
          category_id: Number(categoryId),
          images,
        })),
      };
      if (isNew) {
        const created = await api.createProject(payload);
        navigate(`/admin/projects/${created.id}`, { replace: true });
      } else {
        await api.updateProject(id, payload);
      }
    } catch (saveError) {
      setError(saveError.message);
    }
    setSaving(false);
  };

  const handleDelete = async () => {
    if (!window.confirm(`Delete "${name}"? This can't be undone.`)) return;
    try {
      await api.deleteProject(id);
      navigate("/admin/projects");
    } catch (deleteError) {
      setError(deleteError.message);
    }
  };

  if (loading) return <p className="admin-muted admin-page">Loading…</p>;

  const selected = categories.filter((category) => category.id in blocks);
  const totalImages = Object.values(blocks).reduce((sum, list) => sum + list.length, 0);

  return (
    <form className="admin-page" onSubmit={handleSave}>
      <header className="admin-page__header">
        <div>
          <h1>{isNew ? "New project" : name || "Untitled project"}</h1>
          <p className="admin-muted">
            {selected.length} categor{selected.length === 1 ? "y" : "ies"} · {totalImages} image
            {totalImages === 1 ? "" : "s"}
          </p>
        </div>
        <div className="admin-page__actions">
          <button
            type="button"
            className="admin-btn admin-btn--ghost"
            onClick={() => navigate("/admin/projects")}
          >
            Back
          </button>
          {!isNew && (
            <button type="button" className="admin-btn admin-btn--danger" onClick={handleDelete}>
              Delete
            </button>
          )}
          <button className="admin-btn admin-btn--primary" disabled={saving}>
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </header>

      {error && <div className="admin-alert admin-alert--error">{error}</div>}

      <section className="admin-card">
        <h2 className="admin-card__title">Details</h2>
        <div className="admin-row">
          <label className="admin-field">
            <span>Name</span>
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Whitefield Apartment"
            />
          </label>
          <label className="admin-field">
            <span>Location</span>
            <input
              value={location}
              onChange={(event) => setLocation(event.target.value)}
              placeholder="Bengaluru"
            />
          </label>
        </div>
      </section>

      <section className="admin-card">
        <h2 className="admin-card__title">Categories</h2>
        <p className="admin-muted">
          Each category keeps its own set of photos, so the wardrobe shots and the TV unit shots of
          this job stay separate.
        </p>
        {categories.length === 0 ? (
          <p className="admin-muted">No categories yet, create some first.</p>
        ) : (
          <div className="admin-chips">
            {categories.map((category) => (
              <button
                type="button"
                key={category.id}
                className={`admin-chip ${category.id in blocks ? "is-on" : ""}`}
                onClick={() => toggleCategory(category.id)}
              >
                {category.name}
                {blocks[category.id]?.length ? ` · ${blocks[category.id].length}` : ""}
              </button>
            ))}
          </div>
        )}
      </section>

      {selected.map((category) => (
        <section className="admin-card" key={category.id}>
          <h2 className="admin-card__title">Images for {category.name}</h2>
          <ImageManager
            images={blocks[category.id] || []}
            onChange={(images) => setImages(category.id, images)}
            folder={`dreamyspaces/projects/${slugish(name)}/${slugish(category.name)}`}
          />
        </section>
      ))}
    </form>
  );
}
