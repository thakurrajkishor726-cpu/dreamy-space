import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { FiArrowUpRight, FiMapPin } from "react-icons/fi";
import { cloudinarySrcSet, cloudinaryUrl } from "../lib/cloudinary";

/**
 * One project, used by both the portfolio grid and the home page's recent
 * work. Those were two separate cards that drifted apart — the home one was
 * a bare image with a heading under it while the portfolio one had the full
 * treatment. Sharing the component keeps them identical by construction.
 *
 * Pass `to` for a link (home page, deep-linking into the portfolio) or
 * `onClick` for a button (portfolio grid, opening the lightbox).
 */
export default function ProjectCard({ project, index = 0, to, onClick, isTarget = false }) {
  const cover = project.images[0];
  const extra = project.images.length - 1;

  // Media and body always sit inside .project-card__inner, whether that is a
  // div or a Link. Without it the two variants nest differently and the
  // feature layout's row rules only bite on one of them.
  const Inner = to ? Link : "div";

  const inner = (
    <Inner
      className="project-card__inner"
      {...(to ? { to, "aria-label": `${project.title}${project.location ? `, ${project.location}` : ""}` } : {})}
    >
      <div className="project-card__media">
        {cover ? (
          <img
            src={cloudinaryUrl(cover.url, { width: 800, height: 600 })}
            srcSet={cloudinarySrcSet(cover.url, [400, 800, 1200])}
            sizes="(max-width: 576px) 92vw, (max-width: 992px) 46vw, 31vw"
            className="cover-image"
            alt={project.title}
            loading="lazy"
          />
        ) : (
          <div className="project-card__placeholder">No photos yet</div>
        )}

        <span className="project-card__scrim" aria-hidden="true" />
        <span className="project-card__index">{String(index + 1).padStart(2, "0")}</span>

        {extra > 0 && (
          <span className="project-card__count">
            +{extra} photo{extra === 1 ? "" : "s"}
          </span>
        )}

        <span className="project-card__go" aria-hidden="true">
          <FiArrowUpRight />
        </span>
      </div>

      <div className="project-card__body">
        <h3 className="project-card__title">{project.title}</h3>

        {project.location && (
          <p className="project-card__location">
            <FiMapPin aria-hidden="true" />
            {project.location}
          </p>
        )}

        {project.categories.length > 0 && (
          <p className="project-card__tags">{project.categories.join(" · ")}</p>
        )}
      </div>
    </Inner>
  );

  const label = `${project.title}${project.location ? `, ${project.location}` : ""}`;
  const className = `project-card ${isTarget ? "is-target" : ""}`;

  if (to) {
    return (
      <motion.div
        layout
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.2 }}
        transition={{ duration: 0.55, delay: (index % 3) * 0.08 }}
        className={className}
      >
        {inner}
      </motion.div>
    );
  }

  return (
    <motion.article
      layout
      id={`project-${project.id}`}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.5 }}
      className={className}
      role="button"
      tabIndex={0}
      aria-label={`${label} — view photos`}
      onClick={onClick}
      onKeyDown={(event) => (event.key === "Enter" || event.key === " ") && onClick?.()}
    >
      {inner}
    </motion.article>
  );
}
