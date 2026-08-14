import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { loadPublicProjects } from "../../lib/publicCatalogue";
import ProjectCard from "../ProjectCard";

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

        <div className="projects-grid">
          {projects.map((project, index) => (
            <ProjectCard
              key={project.id}
              project={project}
              index={index}
              to={`/projects?project=${project.id}`}
            />
          ))}
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
