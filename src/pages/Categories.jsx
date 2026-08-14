import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import PageHeader from "../components/PageHeader";
import { innerBanner } from "../data/banners";
import { CATEGORY_IMAGES } from "../data/categoryImages";

/**
 * Standalone showcase, separate from the project portfolio. These images ship
 * with the frontend under public/images/categories/<Folder_Name>/ and are
 * served from that path directly — no CDN, no database. The manifest is
 * generated at build time because a browser can't list a directory.
 */
export default function Categories() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [active, setActive] = useState("All");
  const [lightbox, setLightbox] = useState(null);

  const names = useMemo(() => ["All", ...CATEGORY_IMAGES.map((c) => c.name)], []);

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
        ? CATEGORY_IMAGES
        : CATEGORY_IMAGES.filter((category) => category.name === active),
    [active],
  );

  const flat = useMemo(
    () =>
      shown.flatMap((category) =>
        category.images.map((src) => ({ src, category: category.name })),
      ),
    [shown],
  );

  return (
    <div className="bg-white min-vh-100">
      <PageHeader
        title="Our Work"
        image={innerBanner}
        imagePosition="center center"
        overlay
        showSubtitle={false}
        showDescription={false}
      />

      <section className="section-padding">
        <div className="container">
          <div className="d-flex flex-column gap-3 justify-content-center align-items-center mb-4">
            <span className="section-heading d-block">Categories</span>
            <h2 className="display-5 fw-semibold font-serif text-brand mb-0 text-center">
              Wardrobes, units and panelling
            </h2>
          </div>

          <div className="d-flex flex-wrap justify-content-center gap-2 mb-5">
            {names.map((name) => (
              <button
                key={name}
                onClick={() => choose(name)}
                className={`btn ${
                  active === name ? "btn-brand text-white" : "btn-outline-brand"
                } text-uppercase small px-3`}
              >
                {name}
              </button>
            ))}
          </div>

          {shown.map((category) => (
            <div className="mb-5" key={category.name}>
              {active === "All" && (
                <h3 className="h4 font-serif text-brand mb-3">{category.name}</h3>
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
                      <img src={src} alt={category.name} loading="lazy" className="cover-image" />
                    </motion.div>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {CATEGORY_IMAGES.length === 0 && (
            <p className="text-brand-muted text-center mb-0">
              No category images found. Add folders under{" "}
              <code>public/images/categories/</code> and run{" "}
              <code>npm run categories:manifest</code>.
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
              src={flat[lightbox].src}
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
