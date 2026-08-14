import { Link } from "react-router-dom";
import { motion } from "framer-motion";

export default function FinalCta() {
  return (
    <section className="section-padding bg-brand-dark text-white position-relative overflow-hidden text-center">
      <div className="container position-relative">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="d-flex align-items-center flex-column"
        >
          <span className="section-heading d-block text-light mb-3">
            Thinking about your space?
          </span>
          <h2 className="display-5 fw-bold font-serif mb-4">
            Design <span className="fst-italic text-brand-muted">Without</span> Compromise
          </h2>
          <div className="d-flex flex-column flex-sm-row justify-content-center gap-3">
            <Link to="/contact" className="btn btn-light px-4 py-3 text-uppercase fw-bold">
              Book Free Consultation
            </Link>
            <Link to="/projects" className="btn btn-outline-light px-4 py-3 text-uppercase fw-bold">
              Explore Portfolio
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
