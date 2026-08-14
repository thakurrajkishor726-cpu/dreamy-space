import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import PageHeader from "../components/PageHeader";
import { JOURNEY_STEPS } from "../data/modularJourney";
import { innerBanner } from "../data/banners";

function JourneyStep({ step, index }) {
  const flip = index % 2 === 1;

  return (
    <li className={`jstep ${flip ? "jstep--flip" : ""}`}>
      <div className="container">
        <div className="jstep__grid">
          <motion.div
            className="jstep__copy"
            initial={{ opacity: 0, y: 26 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.25 }}
            transition={{ duration: 0.65, ease: "easeOut" }}
          >
            <span className="jstep__num">{String(step.id).padStart(2, "0")}</span>

            {step.badge && (
              <div className="jstep__badge">
                <span>Engineered with</span>
                <strong>{step.badge}</strong>
                <p>Production software that turns the approved drawing into machine-ready cuts.</p>
              </div>
            )}

            <h2 className="jstep__title">{step.title}</h2>
            <p>{step.description}</p>
          </motion.div>

          <motion.div
            className="jstep__media"
            initial={{ opacity: 0, scale: 0.97 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, amount: 0.25 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
          >
            {step.image ? (
              <img src={step.image} alt={step.title} loading="lazy" />
            ) : (
              <div className="d-flex align-items-center justify-content-center h-100 text-brand-muted small">
                Image unavailable
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </li>
  );
}

export default function ModularJourney() {
  return (
    <div className="bg-brand-light">
      <PageHeader
        title="The Modular"
        accent="Journey"
        subtitle="How we work"
        description="Eleven steps, from the first look at your rooms to the day we hand back the keys. Here is exactly what happens at each one."
        image={innerBanner}
      />

      <ol className="list-unstyled mb-0">
        {JOURNEY_STEPS.map((step, index) => (
          <JourneyStep step={step} index={index} key={step.id} />
        ))}
      </ol>

      <section className="why section-padding">
        <div className="container text-center">
          <motion.div
            className="d-flex flex-column align-items-center gap-4"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
          >
            <span className="ds-eyebrow ds-eyebrow--light">Step twelve</span>
            <h2 className="ds-title ds-title--light">
              You get your rooms <em>back</em>
            </h2>
            <p className="ds-lead ds-lead--light mx-auto">
              Snag list closed, surfaces cleaned, packaging out. Then we leave you to it.
            </p>
            <Link to="/contact" className="btn-clay">
              Start your journey
            </Link>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
