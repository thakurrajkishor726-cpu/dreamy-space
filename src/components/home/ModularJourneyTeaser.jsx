import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { JOURNEY_STEPS } from "../../data/modularJourney";
import stockU15 from "../../assets/images/stock/u15.jpg";

export default function ModularJourneyTeaser() {
  return (
    <section className="section-padding bg-brand-dark text-white position-relative overflow-hidden">
      <div className="container position-relative">
        <div className="row g-5 align-items-center">
          <div className="col-lg-5">
            <div className="position-relative overflow-hidden rounded">
              <motion.img
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 1 }}
                src={stockU15}
                alt="Manufacturing"
                className="img-fluid w-100 rounded shadow-soft"
              />
              <div className="position-absolute top-50 start-50 translate-middle bg-brand-dark bg-opacity-75 text-center p-4">
                <h4 className="font-serif fst-italic mb-2">Cut to the millimetre.</h4>
                <p className="text-white-50 small mb-0">
                  Panels are machined from the approved drawing, so what arrives on site is what
                  you signed off.
                </p>
              </div>
            </div>
          </div>

          <div className="col-lg-7">
            <span className="section-heading text-light d-block mb-3">Process Engineering</span>
            <h2 className="display-5 font-serif fw-semibold mb-4">The Modular Journey</h2>
            <p className="text-white-50 lead mb-4">
              Eleven steps from first visit to handover. You see the drawings, the finishes and
              the price before anything is cut, so there are no surprises on installation day.
            </p>
            <div className="d-grid gap-4 mb-4">
              {JOURNEY_STEPS.slice(0, 3).map((step) => (
                <div className="d-flex gap-3 align-items-start" key={step.id}>
                  <span className="h4 font-serif text-brand-muted mb-0">0{step.id}</span>
                  <div>
                    <h5 className="mb-1 text-white text-uppercase">{step.title}</h5>
                    <p className="small text-white-50 mb-0">{step.description}</p>
                  </div>
                </div>
              ))}
            </div>
            <Link to="/modular-journey" className="btn btn-brand text-uppercase px-4 py-3">
              Explore The Process
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
