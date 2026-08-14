import { useLayoutEffect, useRef } from "react";
import { Link } from "react-router-dom";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { JOURNEY_STEPS } from "../../data/modularJourney";

/**
 * A horizontal step rail under one cinematic band, rather than the dark
 * image-beside-text split the first build used. The rail collapses to a
 * vertical timeline below 768px.
 */
export default function ModularJourneyTeaser() {
  const rootRef = useRef(null);
  const imageRef = useRef(null);

  useLayoutEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return undefined;

    gsap.registerPlugin(ScrollTrigger);
    const ctx = gsap.context(() => {
      if (!imageRef.current) return;
      gsap.fromTo(
        imageRef.current,
        { yPercent: -6 },
        {
          yPercent: 6,
          ease: "none",
          scrollTrigger: {
            trigger: imageRef.current.parentElement,
            start: "top bottom",
            end: "bottom top",
            scrub: 1,
          },
        },
      );
    }, rootRef);

    return () => ctx.revert();
  }, []);

  const steps = JOURNEY_STEPS.slice(0, 3);

  return (
    <section className="journey section-padding" ref={rootRef}>
      <div className="container">
        <header className="ds-head ds-head--split">
          <div className="ds-head__title-block">
            <span className="ds-eyebrow">How it works</span>
            <h2 className="ds-title">
              Eleven steps, <em>no surprises</em>
            </h2>
          </div>
          <p className="ds-lead">
            From the first look at your rooms to the day we hand back the keys. You approve the
            drawings, the finishes and the price before anything is cut.
          </p>
        </header>

        <div className="journey__media">
          <img ref={imageRef} src={JOURNEY_STEPS[4]?.image} alt="" aria-hidden="true" loading="lazy" />
          <span className="journey__media-tag">Cut to the millimetre</span>
        </div>

        <ol className="journey__rail">
          {steps.map((step) => (
            <li className="journey__step" key={step.id}>
              <span className="journey__step-num">Step {String(step.id).padStart(2, "0")}</span>
              <h3 className="journey__step-title">{step.title}</h3>
              <p className="journey__step-copy">{step.description}</p>
            </li>
          ))}
        </ol>

        <Link className="ds-link" to="/modular-journey">
          See all eleven steps
          <span className="ds-link__arrow" aria-hidden="true">
            →
          </span>
        </Link>
      </div>
    </section>
  );
}
