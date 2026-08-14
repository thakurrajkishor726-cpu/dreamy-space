import { motion } from "framer-motion";

/**
 * Inner page banner: left-aligned over a darkened photo, with the eyebrow
 * above the title. `accent` italicises and colours the trailing words.
 */
export default function PageHeader({ title, accent, subtitle, description, image }) {
  return (
    <section className="page-header" aria-labelledby="page-header-title">
      {image && <img className="page-header__bg" src={image} alt="" aria-hidden="true" />}
      <span className="page-header__scrim" aria-hidden="true" />

      <div className="container">
        <motion.div
          className="page-header__inner"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
        >
          {subtitle && <span className="ds-eyebrow ds-eyebrow--light">{subtitle}</span>}

          <h1 id="page-header-title" className="page-header__title">
            {title}
            {accent && (
              <>
                {" "}
                <em>{accent}</em>
              </>
            )}
          </h1>

          {description && <p className="page-header__lead">{description}</p>}
        </motion.div>
      </div>
    </section>
  );
}
