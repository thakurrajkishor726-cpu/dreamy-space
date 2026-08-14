import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useSearchParams } from "react-router-dom";
import PageHeader from "../components/PageHeader";
import { innerBanner } from "../data/banners";
import { loadPublicProjects } from "../lib/publicCatalogue";
import { cloudinaryUrl } from "../lib/cloudinary";
import ProjectCard from "../components/ProjectCard";

function Lightbox({ isOpen, items = [], currentIndex = 0, onClose, onPrev, onNext }) {
  const [zoomed, setZoomed] = useState(false);
  const index = useMemo(
    () => Math.min(currentIndex, Math.max(items.length - 1, 0)),
    [currentIndex, items.length],
  );
  const item = items[index];
  const hasPrev = items.length > 1 && index > 0;
  const hasNext = items.length > 1 && index < items.length - 1;

  useEffect(() => {
    if (!isOpen) return undefined;
    const onKey = (event) => {
      if (event.key === "Escape") onClose();
      if (event.key === "ArrowLeft" && hasPrev) onPrev();
      if (event.key === "ArrowRight" && hasNext) onNext();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, hasPrev, hasNext, onClose, onPrev, onNext]);

  return (
    <AnimatePresence>
      {isOpen && item && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="lightbox-overlay position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center bg-black bg-opacity-95 p-3 p-md-5"
          onClick={onClose}
        >
          <motion.button
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            className="position-absolute top-0 end-0 m-4 btn btn-light rounded-circle z-1 shadow"
            style={{ width: 44, height: 44, padding: 0 }}
            onClick={(event) => {
              event.stopPropagation();
              onClose();
            }}
            aria-label="Close preview"
          >
            ×
          </motion.button>

          <div className="position-absolute top-50 start-0 translate-middle-y">
            <button
              className="btn btn-outline-light"
              disabled={!hasPrev}
              onClick={(event) => {
                event.stopPropagation();
                if (hasPrev) onPrev();
              }}
            >
              ‹
            </button>
          </div>
          <div className="position-absolute top-50 end-0 translate-middle-y">
            <button
              className="btn btn-outline-light"
              disabled={!hasNext}
              onClick={(event) => {
                event.stopPropagation();
                if (hasNext) onNext();
              }}
            >
              ›
            </button>
          </div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="position-relative w-100 h-100 d-flex align-items-center justify-content-center"
            onClick={(event) => event.stopPropagation()}
          >
            {item.url ? (
              <motion.img
                src={cloudinaryUrl(item.url, { width: 1600, crop: "limit" })}
                alt={item.description || item.title || "Preview"}
                className="img-fluid h-100 w-100"
                style={{ objectFit: zoomed ? "contain" : "cover", transition: "transform 0.2s ease" }}
                animate={{ scale: zoomed ? 1.1 : 1 }}
              />
            ) : (
              <div className="d-flex align-items-center justify-content-center w-100 h-100 text-white-50">
                Image unavailable
              </div>
            )}

            <div className="position-absolute bottom-0 start-0 end-0 p-3 text-center text-white bg-gradient">
              <div className="small text-uppercase">{item.category}</div>
              <div className="fw-bold">{item.title}</div>
              {item.description && (
                <div className="small text-white-50 mt-1 mx-auto" style={{ maxWidth: 680 }}>
                  {item.description}
                </div>
              )}
              {item.imageCount > 1 && (
                <div className="small text-white-50 mt-1">
                  {item.imageIndex + 1} / {item.imageCount}
                </div>
              )}
            </div>

            <button
              type="button"
              className="btn btn-light position-absolute bottom-0 end-0 m-3"
              onClick={() => setZoomed((value) => !value)}
            >
              {zoomed ? "Fit" : "Zoom"}
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default function Projects() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeCategory, setActiveCategory] = useState("All");
  const [targetId, setTargetId] = useState(null);
  const [lightboxIndex, setLightboxIndex] = useState(null);
  const [visibleCount, setVisibleCount] = useState(12);
  const [projects, setProjects] = useState(null);
  const [allCategories, setAllCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const fetchedRef = useRef(false);

  useEffect(() => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;

    loadPublicProjects().then((result) => {
      setProjects(result.projects);
      setAllCategories(result.categories);
      // Logged, not surfaced: a visitor can do nothing about it and the page
      // already renders whatever it managed to load.
      if (result.error) console.error("Projects load failed:", result.error);
      setLoading(false);
    });
  }, []);

  const categories = useMemo(() => {
    const present = allCategories.length
      ? allCategories
      : [...new Set((projects || []).flatMap((project) => project.categories))];
    return ["All", ...present];
  }, [allCategories, projects]);

  const filtered = useMemo(() => {
    if (!projects) return [];
    return activeCategory === "All"
      ? projects
      : projects.filter((project) => project.categories.includes(activeCategory));
  }, [activeCategory, projects]);

  useEffect(() => {
    setVisibleCount(12);
    setLightboxIndex(null);
  }, [activeCategory]);

  const visible = useMemo(() => filtered.slice(0, visibleCount), [filtered, visibleCount]);

  /**
   * Cards elsewhere on the site link to /projects?project=<id>. Land on the
   * page, page in far enough for that card to exist, scroll to it and mark it
   * briefly — better than dropping someone at the top of the grid and letting
   * them hunt for the one they clicked.
   */
  useEffect(() => {
    if (loading || !projects) return undefined;

    const requested = Number(searchParams.get("project"));
    if (!requested) return undefined;

    const index = filtered.findIndex((project) => project.id === requested);
    if (index === -1) return undefined;

    // The card has to be rendered before it can be scrolled to.
    if (index >= visibleCount) {
      setVisibleCount(Math.ceil((index + 1) / 12) * 12);
      return undefined;
    }

    const node = document.getElementById(`project-${requested}`);
    if (!node) return undefined;

    setTargetId(requested);
    node.scrollIntoView({ behavior: "smooth", block: "center" });

    // Drop the marker and the query param so a refresh or a share of the URL
    // afterwards is just the portfolio.
    const timer = setTimeout(() => {
      setTargetId(null);
      setSearchParams({}, { replace: true });
    }, 2600);
    return () => clearTimeout(timer);
  }, [loading, projects, filtered, visibleCount, searchParams, setSearchParams]);

  // Flatten every visible project's images into one strip so the lightbox can
  // page through a multi-image project and then straight on to the next one.
  const { lightboxItems, offsets } = useMemo(() => {
    const items = [];
    const starts = [];
    visible.forEach((project) => {
      starts.push(items.length);
      project.images.forEach((image, imageIndex) => {
        items.push({
          url: image.url,
          description: "",
          title: project.title,
          category: image.category || project.categories[0] || "",
          imageIndex,
          imageCount: project.images.length,
        });
      });
    });
    return { lightboxItems: items, offsets: starts };
  }, [visible]);

  return (
    <div className="bg-white min-vh-100">
      <PageHeader
        title="Recent"
        accent="Projects"
        subtitle="Portfolio"
        description="Jobs we have finished around Bengaluru. Tap any card to page through the photos."
        image={innerBanner}
      />

      <section className="section-padding">
        <div className="container">
          {loading ? (
            <div className="py-5 text-center">
              <div
                className="spinner-border text-brand-muted"
                role="status"
                aria-label="Loading projects"
              />
              <p className="text-brand-muted small mt-3 mb-0">Loading projects...</p>
            </div>
          ) : (
            <>
              <div className="ds-filters">
                {categories.map((category) => (
                  <button
                    key={category}
                    type="button"
                    onClick={() => setActiveCategory(category)}
                    className={`ds-filter ${activeCategory === category ? "is-active" : ""}`}
                  >
                    {category}
                  </button>
                ))}
              </div>

              <motion.div
                key={activeCategory}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25 }}
                className="projects-grid"
              >
                <AnimatePresence mode="popLayout">
                  {visible.map((project, index) => (
                    <ProjectCard
                      key={project.id}
                      project={project}
                      index={index}
                      isTarget={project.id === targetId}
                      onClick={() => setLightboxIndex(offsets[index])}
                    />
                  ))}
                </AnimatePresence>
              </motion.div>

              {visible.length === 0 && (
                <div className="py-5 text-center">
                  <p className="font-serif text-brand-muted h4 mb-4">
                    {(projects?.length ?? 0) === 0
                      ? "No projects published yet."
                      : "Nothing in this category yet."}
                  </p>
                  {(projects?.length ?? 0) > 0 && (
                    <button
                      type="button"
                      onClick={() => setActiveCategory("All")}
                      className="btn-ghost"
                    >
                      View all projects
                    </button>
                  )}
                </div>
              )}

              {visible.length < filtered.length && (
                <div className="text-center mt-5">
                  <button
                    type="button"
                    className="btn-ghost"
                    onClick={() => setVisibleCount((count) => Math.min(count + 12, filtered.length))}
                  >
                    Show more
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </section>

      {!loading && (
        <Lightbox
          isOpen={lightboxIndex !== null}
          items={lightboxItems}
          currentIndex={lightboxIndex ?? 0}
          onClose={() => setLightboxIndex(null)}
          onPrev={() =>
            setLightboxIndex((index) => (index === null ? null : Math.max(index - 1, 0)))
          }
          onNext={() =>
            setLightboxIndex((index) =>
              index === null ? null : Math.min(index + 1, lightboxItems.length - 1),
            )
          }
        />
      )}
    </div>
  );
}
