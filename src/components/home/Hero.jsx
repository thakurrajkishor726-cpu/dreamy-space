import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";
import { bannerImages } from "../../data/banners";

const SLIDES = [
  {
    image: bannerImages[0],
    eyebrow: "Interiors Made To Measure",
    title: "Dreamy Spaces",
    subtitle: "Rooms that work as well as they look.",
  },
  {
    image: bannerImages[1],
    eyebrow: "Wardrobes, Units, Panelling",
    title: "Built Around Your Day",
    subtitle: "Storage, surfaces and lighting planned for how you actually live.",
  },
  {
    image: bannerImages[2],
    eyebrow: "Drawing To Handover",
    title: "Finished To The Millimetre",
    subtitle: "Considered detail, honest materials, work that lasts.",
  },
];

export default function Hero() {
  const [index, setIndex] = useState(0);
  const [animationKey, setAnimationKey] = useState(0);

  const goTo = useCallback((next) => {
    setIndex((next + SLIDES.length) % SLIDES.length);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => setIndex((current) => (current + 1) % SLIDES.length), 8000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    setAnimationKey((key) => key + 1);
  }, [index]);

  const slide = SLIDES[index];

  return (
    <section className="hero-section position-relative text-white overflow-hidden d-flex align-items-center">
      <div className="hero-slides position-absolute top-0 start-0 w-100 h-100">
        {SLIDES.map((item, i) => (
          <motion.div
            key={item.image || i}
            className="hero-slide"
            initial={{ opacity: 0, scale: 1.05 }}
            animate={i === index ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 1.02 }}
            transition={{ duration: 1.6, ease: "easeOut" }}
          >
            <img src={item.image} className="cover-image" alt={item.title} loading="lazy" />
          </motion.div>
        ))}
        <div className="position-absolute top-0 start-0 w-100 h-100 hero-overlay" />
      </div>

      <div className="container position-relative py-5">
        <div className="row justify-content-center">
          <div className="col-lg-10 text-center">
            <div className="hero-copy" key={animationKey}>
              <span className="eyebrow d-block text-light mb-4 hero-anim hero-anim-1">
                {slide.eyebrow}
              </span>
              <h1 className="display-3 fw-bold font-serif mb-3 hero-anim hero-anim-2">
                {slide.title}
              </h1>
              <p className="lead text-light mb-4 text-uppercase hero-anim hero-anim-3">
                {slide.subtitle}
              </p>
              <div className="d-flex flex-column flex-sm-row align-items-center justify-content-center gap-3 hero-anim hero-anim-4">
                <Link to="/contact" className="btn btn-light px-4 py-3 text-uppercase fw-bold">
                  Book Free Consultation
                </Link>
                <Link
                  to="/projects"
                  className="btn btn-outline-light px-4 py-3 text-uppercase fw-bold"
                >
                  View Portfolio
                </Link>
              </div>
            </div>

            <div className="hero-controls d-none d-md-flex">
              <button
                type="button"
                className="hero-control-btn"
                aria-label="Previous slide"
                onClick={() => goTo(index - 1)}
              >
                <FaChevronLeft />
              </button>
              <button
                type="button"
                className="hero-control-btn"
                aria-label="Next slide"
                onClick={() => goTo(index + 1)}
              >
                <FaChevronRight />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
