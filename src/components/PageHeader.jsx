import { motion } from "framer-motion";

export default function PageHeader({
  title,
  subtitle,
  description,
  image,
  imagePosition = "center",
  overlay = true,
  showSubtitle = true,
  showDescription = true,
}) {
  const style = image
    ? {
        backgroundImage: `url(${image})`,
        backgroundSize: "cover",
        backgroundPosition: imagePosition,
        backgroundRepeat: "no-repeat",
      }
    : undefined;

  return (
    <section
      className="bg-brand-light section-padding border-bottom position-relative inner-pages-banner overflow-hidden"
      style={style}
      aria-labelledby="page-header-title"
      role="region"
    >
      {image && overlay && (
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(180deg, rgba(25, 35, 36, 0) 0%, rgba(25, 35, 36, 0.4) 80.94%)",
          }}
        />
      )}
      <div className="container position-relative">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="col-lg-9"
        >
          {showSubtitle && subtitle && (
            <span className="section-heading d-block mb-3">{subtitle}</span>
          )}
          <h1 id="page-header-title" className="display-4 fw-bold font-serif text-white mb-3">
            {title}
          </h1>
          {showDescription && description && (
            <p className="lead text-brand-muted">{description}</p>
          )}
        </motion.div>
      </div>
    </section>
  );
}
