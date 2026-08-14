import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { bannerImages } from "../../data/banners";

/**
 * Editorial split: copy on the left, an offset image composition on the right.
 * The two frames crossfade through their own image sets, so the page still
 * moves without a full-bleed carousel behind the text.
 */

const CHIPS = ["Design · Make · Install", "Measured to your walls", "One team, start to finish"];

const TALL = [bannerImages[0], bannerImages[1], bannerImages[2]].filter(Boolean);
const INSET = [bannerImages[3], bannerImages[4], bannerImages[5]].filter(Boolean);

const MARKS = ["Own workshop", "Fixed written quotes", "Bengaluru"];

export default function Hero() {
  const [index, setIndex] = useState(0);
  const count = Math.max(TALL.length, 1);

  useEffect(() => {
    if (count < 2) return undefined;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return undefined;
    const timer = setInterval(() => setIndex((current) => (current + 1) % count), 6500);
    return () => clearInterval(timer);
  }, [count]);

  return (
    <section className="hero">
      <div className="container hero__inner">
        <div className="hero__copy">
          <span className="ds-eyebrow">Interiors made to measure</span>

          <h1 className="hero__title">
            Rooms built around <em>the way you live</em>
          </h1>

          <p className="hero__lead">
            Wardrobes, media walls, shoe racks and panelling for homes and offices across
            Bengaluru. We draw it, make it in our own workshop and fit it ourselves, so one
            team answers for the whole job.
          </p>

          <div className="hero__actions">
            <Link className="btn-clay" to="/contact">
              Book a free consultation
            </Link>
            <Link className="btn-ghost" to="/our-work">
              See the work
            </Link>
          </div>

          <ul className="hero__marks">
            {MARKS.map((mark) => (
              <li className="hero__mark" key={mark}>
                {mark}
              </li>
            ))}
          </ul>
        </div>

        <div className="hero__stage">
          <span className="hero__chip">{CHIPS[index % CHIPS.length]}</span>

          <figure className="hero__frame hero__frame--tall">
            {TALL.map((src, i) => (
              <img
                key={src}
                src={src}
                alt=""
                aria-hidden="true"
                className={`hero__slide ${i === index % TALL.length ? "is-active" : ""}`}
                loading={i === 0 ? "eager" : "lazy"}
                fetchPriority={i === 0 ? "high" : "auto"}
              />
            ))}
          </figure>

          {INSET.length > 0 && (
            <figure className="hero__frame hero__frame--inset">
              {INSET.map((src, i) => (
                <img
                  key={src}
                  src={src}
                  alt=""
                  aria-hidden="true"
                  className={`hero__slide ${i === index % INSET.length ? "is-active" : ""}`}
                  loading="lazy"
                />
              ))}
            </figure>
          )}

          {count > 1 && (
            <div className="hero__dots">
              {TALL.map((src, i) => (
                <button
                  type="button"
                  key={src}
                  className={`hero__dot ${i === index ? "is-active" : ""}`}
                  aria-label={`Show image ${i + 1}`}
                  onClick={() => setIndex(i)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
