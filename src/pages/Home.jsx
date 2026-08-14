import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import Hero from "../components/home/Hero";
import WhatWeOffer from "../components/home/WhatWeOffer";
import Deliverables from "../components/home/Deliverables";
import ModularJourneyTeaser from "../components/home/ModularJourneyTeaser";
import ProjectHighlights from "../components/home/ProjectHighlights";
import FinalCta from "../components/home/FinalCta";
import stockU08 from "../assets/images/stock/u08.jpg";
import stockU02 from "../assets/images/stock/u02.jpg";

export default function Home() {
  return (
    <div className="bg-brand-light overflow-hidden">
      <Hero />

      <section className="section-padding bg-white">
        <div className="container">
          <div className="row align-items-center g-4">
            <div className="col-lg-6">
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8 }}
              >
                <span className="section-heading d-block mb-3">Our Ethos</span>
                <h2 className="display-5 fw-semibold font-serif text-brand mb-3">
                  Good rooms begin with how you use them.
                </h2>
                <p className="lead text-brand-muted mb-4">
                  We start with your routine rather than a mood board. Every unit is sized to
                  what goes inside it, every surface picked for the wear it will take, and every
                  light placed where you actually need to see.
                </p>
                <Link to="/modular-journey" className="btn btn-outline-brand px-4 py-3">
                  How We Work
                </Link>
              </motion.div>
            </div>

            <div className="col-lg-6">
              <div className="row g-3">
                <div className="col-6 d-flex flex-column gap-3">
                  <img
                    src={stockU08}
                    className="img-fluid shadow-soft rounded"
                    alt="Design detail"
                    loading="lazy"
                  />
                  <div className="bg-brand-dark text-white text-center py-4 rounded shadow-soft">
                    <div className="h2 font-serif mb-1 text-brand-muted">100+</div>
                    <div className="small text-uppercase">Design Awards</div>
                  </div>
                </div>
                <div className="col-6 d-flex flex-column gap-3">
                  <div className="bg-brand-mid text-brand text-center py-4 rounded shadow-soft">
                    <div className="h2 font-serif mb-1">1000+</div>
                    <div className="small text-uppercase">Happy Clients</div>
                  </div>
                  <img
                    src={stockU02}
                    className="img-fluid shadow-soft rounded"
                    alt="Kitchen detail"
                    loading="lazy"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <WhatWeOffer />
      <Deliverables />
      <ModularJourneyTeaser />
      <ProjectHighlights />
      <FinalCta />
    </div>
  );
}
