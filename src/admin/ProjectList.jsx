import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { cloudinaryUrl } from "../lib/cloudinary";
import { api } from "../lib/apiClient";

/** First image of the first category that has one. */
export const coverOf = (project) =>
  project.categories?.find((block) => block.images?.length)?.images[0]?.image_url || null;

export default function ProjectList() {
  const [projects, setProjects] = useState([]);
  const [categories, setCategories] = useState([]);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const [cats, items] = await Promise.all([api.listCategories(), api.listProjects()]);
        setCategories(cats);
        setProjects(items);
      } catch (loadError) {
        setError(loadError.message);
      }
      setLoading(false);
    })();
  }, []);

  const visible = useMemo(() => {
    const term = search.trim().toLowerCase();
    return projects.filter((project) => {
      const inCategory =
        filter === "all" ||
        project.categories?.some((block) => String(block.category_id) === String(filter));
      const matches =
        !term ||
        project.name?.toLowerCase().includes(term) ||
        project.location?.toLowerCase().includes(term);
      return inCategory && matches;
    });
  }, [projects, filter, search]);

  const countImages = (project) =>
    project.categories?.reduce((sum, block) => sum + (block.images?.length || 0), 0) || 0;

  return (
    <div className="admin-page">
      <header className="admin-page__header">
        <div>
          <h1>Projects</h1>
          <p className="admin-muted">{projects.length} total</p>
        </div>
        <Link className="admin-btn admin-btn--primary" to="/admin/projects/new">
          New project
        </Link>
      </header>

      {error && <div className="admin-alert admin-alert--error">{error}</div>}

      <div className="admin-toolbar">
        <input
          className="admin-search"
          placeholder="Search projects…"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
        <div className="admin-chips">
          <button
            className={`admin-chip ${filter === "all" ? "is-on" : ""}`}
            onClick={() => setFilter("all")}
          >
            All
          </button>
          {categories.map((category) => (
            <button
              key={category.id}
              className={`admin-chip ${String(filter) === String(category.id) ? "is-on" : ""}`}
              onClick={() => setFilter(category.id)}
            >
              {category.name}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <p className="admin-muted">Loading…</p>
      ) : visible.length === 0 ? (
        <div className="admin-card admin-empty">
          <p>{projects.length === 0 ? "No projects yet." : "Nothing matches that filter."}</p>
          {projects.length === 0 && (
            <Link className="admin-btn admin-btn--primary" to="/admin/projects/new">
              Create the first one
            </Link>
          )}
        </div>
      ) : (
        <div className="admin-cards">
          {visible.map((project) => {
            const cover = coverOf(project);
            return (
              <Link className="admin-tile" to={`/admin/projects/${project.id}`} key={project.id}>
                <div className="admin-tile__media">
                  {cover ? (
                    <img
                      src={cloudinaryUrl(cover, { width: 420, height: 300 })}
                      alt={project.name}
                      loading="lazy"
                    />
                  ) : (
                    <div className="admin-tile__placeholder">No image</div>
                  )}
                </div>
                <div className="admin-tile__body">
                  <h3>{project.name}</h3>
                  <p className="admin-muted small">
                    {project.categories?.map((block) => block.category_name).join(", ") ||
                      "Uncategorised"}
                  </p>
                  <p className="admin-muted small">
                    {countImages(project)} image{countImages(project) === 1 ? "" : "s"}
                    {project.location ? ` · ${project.location}` : ""}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
