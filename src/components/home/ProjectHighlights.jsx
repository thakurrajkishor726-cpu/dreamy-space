import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { loadPublicProjects } from "../../lib/publicCatalogue";
import { cloudinaryUrl } from "../../lib/cloudinary";

/**
 * Real projects from the catalogue, not stock photography.
 *
 * This section makes a claim about work you have done, so it only ever shows
 * what is actually in the database. With nothing published yet it renders
 * nothing at all, rather than filling the space with someone else's rooms.
 */
export default function ProjectHighlights() {
  const [projects, setProjects] = useState([]);

  useEffect(() => {
    loadPublicProjects().then(({ projects: rows }) => setProjects(rows.slice(0, 3)));
  }, []);

  if (projects.length === 0) return null;

  return (
    <section className="section-padding project-hero">
      <div className="container">
        <div className="d-flex flex-column gap-3 justify-content-center align-items-center mb-4">
          <span className="section-heading d-block">Our Project</span>
          <h2 className="display-5 fw-semibold font-serif text-brand mb-0">
            Recent work around Bengaluru
          </h2>
        </div>

        <div className="project-hero__grid">
          {projects.map((project, index) => {
            const cover = project.images[0];
            return (
              <motion.article
                className="project-hero__card"
                key={project.id}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.8, delay: index * 0.12 }}
              >
                <div className="project-hero__image">
                  {cover && (
                    <img
                      src={cloudinaryUrl(cover.url, { width: 600, height: 600 })}
                      alt={project.title}
                      loading="lazy"
                    />
                  )}
                </div>
                <div className="project-hero__body">
                  <h5 className="project-hero__title">{project.title}</h5>
                  <p className="project-hero__meta text-uppercase small mb-2">
                    {[project.categories[0], project.location].filter(Boolean).join(" · ")}
                  </p>
                  <Link to="/projects" className="project-hero__link">
                    Explore More →
                  </Link>
                </div>
              </motion.article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
