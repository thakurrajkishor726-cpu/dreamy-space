import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { JOURNEY_STEPS } from "../data/modularJourney";

function JourneyStep({ step, index }) {
  const imageRight = index % 2 === 0;

  return (
    <div className="section-padding position-relative overflow-hidden">
      <div className="container">
        <div className="row align-items-center gy-4">
          <motion.div
            initial={{ opacity: 0, x: imageRight ? -30 : 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className={`col-lg-6 ${imageRight ? "" : "order-lg-2"}`}
          >
            <div className="d-flex align-items-center gap-3 mb-4">
              <span className="display-4 font-serif text-brand-muted">
                {String(step.id).padStart(2, "0")}
              </span>
              <div className="flex-grow-1 border-top muted-border" />
            </div>

            {step.badge && (
              <div className="imos-highlight mb-4">
                <span className="imos-chip">ENGINEERED WITH</span>
                <h6 className="imos-title">{step.badge}</h6>
                <p className="imos-sub">
                  Production-grade software converting designs into machine-ready precision.
                </p>
              </div>
            )}

            <h3 className="display-6 font-serif text-brand mb-3">{step.title}</h3>
            <p className="text-brand-muted lead">{step.description}</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className={`col-lg-6 ${imageRight ? "" : "order-lg-1"}`}
          >
            <div className="ratio ratio-4x3 shadow-soft overflow-hidden">
              {step.image && step.image.trim() !== "" ? (
                <img src={step.image} className="cover-image" alt={step.title} loading="lazy" />
              ) : (
                <div className="w-100 h-100 d-flex align-items-center justify-content-center bg-brand-mid text-brand-muted small">
                  Image unavailable
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

export default function ModularJourney() {
  return (
    <div className="bg-white">
      <section className="section-padding d-flex align-items-center justify-content-center text-center bg-brand-dark text-white">
        <div className="container">
          <motion.div
            className="d-flex align-items-center flex-column gap-3"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.2, ease: "easeOut" }}
          >
            <span className="section-heading text-light d-block">The Creative Choreography</span>
            <h1 className="display-3 font-serif mb-0">
              The Modular <span className="fst-italic text-brand-muted">Journey</span>
            </h1>
            <p className="lead text-white-50 mb-0">
              Eleven steps, from the first look at your rooms to the day we hand back the keys.
              Here is exactly what happens at each one.
            </p>
            <div className="mt-4 text-uppercase small text-brand-muted">Scroll to begin ↓</div>
          </motion.div>
        </div>
      </section>

      <div className="bg-white">
        {JOURNEY_STEPS.map((step, index) => (
          <JourneyStep step={step} index={index} key={step.id} />
        ))}
      </div>

      <section className="section-padding bg-brand-dark text-white text-center">
        <div className="container">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 1 }}
          >
            <h2 className="display-5 font-serif mb-4">
              The result is always{" "}
              <span className="fst-italic text-brand-muted">Exceptional</span>.
            </h2>
            <Link to="/contact" className="btn btn-light px-4 py-3 text-uppercase fw-bold">
              Start Your Journey
            </Link>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
