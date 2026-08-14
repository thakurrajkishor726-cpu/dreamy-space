import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import PageHeader from "../components/PageHeader";
import { innerBanner } from "../data/banners";
import { useCategories } from "../lib/useCategories";
import { cloudinaryUrl } from "../lib/cloudinary";

/**
 * Standalone showcase, separate from the project portfolio.
 *
 * Images come from the category_images table. The originals are local paths
 * under public/images/categories/ and anything added through the admin since
 * is a Cloudinary URL; cloudinaryUrl() resizes the latter and leaves the
 * former alone, so both render from the same list.
 */
export default function Categories() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [active, setActive] = useState("All");
  const [lightbox, setLightbox] = useState(null);
  const { categories, settled } = useCategories();

  // Every category is listed here regardless of show_in_dashboard — that flag
  // only governs the home page grid.
  const withImages = useMemo(
    () => categories.filter((category) => category.images.length > 0),
    [categories],
  );
  const names = useMemo(() => ["All", ...withImages.map((c) => c.name)], [withImages]);

  // Cards on the home page deep-link here with ?category=…
  useEffect(() => {
    const requested = searchParams.get("category");
    setActive(requested && names.includes(requested) ? requested : "All");
  }, [searchParams, names]);

  const choose = (name) => {
    setActive(name);
    // Keep the URL shareable, without stacking history entries per click.
    if (name === "All") setSearchParams({}, { replace: true });
    else setSearchParams({ category: name }, { replace: true });
  };

  const shown = useMemo(
    () =>
      active === "All"
        ? withImages
        : withImages.filter((category) => category.name === active),
    [active, withImages],
  );

  const flat = useMemo(
    () =>
      shown.flatMap((category) =>
        category.images.map((src) => ({ src, category: category.name })),
      ),
    [shown],
  );

  return (
    <div className="bg-brand-light min-vh-100">
      <PageHeader
        title="Our"
        accent="Work"
        subtitle="Categories"
        description="Wardrobes, media walls, shoe racks and panelling, photographed as built."
        image={innerBanner}
      />

      <section className="section-padding">
        <div className="container">
          <div className="ds-filters">
            {names.map((name) => (
              <button
                key={name}
                type="button"
                onClick={() => choose(name)}
                className={`ds-filter ${active === name ? "is-active" : ""}`}
              >
                {name}
              </button>
            ))}
          </div>

          {shown.map((category) => (
            <div className="mb-5" key={category.id}>
              {active === "All" && (
                <h2 className="ds-title h3 mb-4">{category.name}</h2>
              )}
              <div className="row g-3">
                {category.images.map((src) => (
                  <div className="col-6 col-md-4 col-lg-3" key={src}>
                    <motion.div
                      className="gallery-tile project-card__media"
                      initial={{ opacity: 0, y: 16 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.45 }}
                      role="button"
                      tabIndex={0}
                      onClick={() => setLightbox(flat.findIndex((item) => item.src === src))}
                      onKeyDown={(event) =>
                        event.key === "Enter" &&
                        setLightbox(flat.findIndex((item) => item.src === src))
                      }
                    >
                      <img
                        src={cloudinaryUrl(src, { width: 600, height: 450 })}
                        alt={category.name}
                        loading="lazy"
                        className="cover-image"
                      />
                    </motion.div>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {settled && withImages.length === 0 && (
            <p className="text-brand-muted text-center mb-0">
              No category images yet. Add them under Categories in the admin.
            </p>
          )}
        </div>
      </section>

      <AnimatePresence>
        {lightbox !== null && flat[lightbox] && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="lightbox-overlay position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center bg-black bg-opacity-95 p-3 p-md-5"
            onClick={() => setLightbox(null)}
          >
            <button
              className="position-absolute top-0 end-0 m-4 btn btn-light rounded-circle shadow"
              style={{ width: 44, height: 44, padding: 0 }}
              onClick={() => setLightbox(null)}
              aria-label="Close preview"
            >
              ×
            </button>

            <div className="position-absolute top-50 start-0 translate-middle-y">
              <button
                className="btn btn-outline-light"
                disabled={lightbox === 0}
                onClick={(event) => {
                  event.stopPropagation();
                  setLightbox((index) => Math.max(0, index - 1));
                }}
              >
                ‹
              </button>
            </div>
            <div className="position-absolute top-50 end-0 translate-middle-y">
              <button
                className="btn btn-outline-light"
                disabled={lightbox === flat.length - 1}
                onClick={(event) => {
                  event.stopPropagation();
                  setLightbox((index) => Math.min(flat.length - 1, index + 1));
                }}
              >
                ›
              </button>
            </div>

            <motion.img
              key={flat[lightbox].src}
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              src={cloudinaryUrl(flat[lightbox].src, { width: 1600, crop: "limit" })}
              alt={flat[lightbox].category}
              className="img-fluid"
              style={{ maxHeight: "85vh", objectFit: "contain" }}
              onClick={(event) => event.stopPropagation()}
            />

            <div className="position-absolute bottom-0 start-0 end-0 p-3 text-center text-white">
              <div className="fw-bold">{flat[lightbox].category}</div>
              <div className="small text-white-50">
                {lightbox + 1} / {flat.length}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
