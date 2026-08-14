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
    <section className="section-padding bg-brand-light">
      <div className="container">
        <header className="ds-head ds-head--split">
          <div className="ds-head__title-block">
            <span className="ds-eyebrow">Recent work</span>
            <h2 className="ds-title">
              Finished jobs, <em>around Bengaluru</em>
            </h2>
          </div>
          <p className="ds-lead">
            A few of the rooms we have handed back lately. The full portfolio has the rest.
          </p>
        </header>

        <div className="row g-4">
          {projects.map((project, index) => {
            const cover = project.images[0];
            return (
              <div className="col-12 col-md-6 col-lg-4" key={project.id}>
                <motion.article
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.25 }}
                  transition={{ duration: 0.65, delay: index * 0.1 }}
                  className="project-card card-lift"
                >
                  {/* Deep-link so the portfolio scrolls to this exact job rather than
                      dropping the visitor at the top of the grid. */}
                  <Link to={`/projects?project=${project.id}`} aria-label={project.title}>
                    <div className="project-card__media mb-3">
                      {cover && (
                        <img
                          src={cloudinaryUrl(cover.url, { width: 800, height: 600 })}
                          alt={project.title}
                          loading="lazy"
                        />
                      )}
                    </div>
                    <h3 className="h5 mb-1">{project.title}</h3>
                    <p className="info-subheading mb-0">
                      {[project.categories[0], project.location].filter(Boolean).join(" · ")}
                    </p>
                  </Link>
                </motion.article>
              </div>
            );
          })}
        </div>

        <div className="text-center mt-5">
          <Link className="ds-link" to="/projects">
            See the full portfolio
            <span className="ds-link__arrow" aria-hidden="true">
              →
            </span>
          </Link>
        </div>
      </div>
    </section>
  );
}
