import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { loadTestimonials } from "../../lib/publicCatalogue";

/**
 * One quote at a time, crossfading. Content comes from the testimonials table
 * and is managed in the admin; the section renders nothing until it has some.
 */

const HOLD_MS = 7000;
const FADE_MS = 400;

export default function Voices() {
  const [items, setItems] = useState([]);
  const [index, setIndex] = useState(0);
  const [fading, setFading] = useState(false);

  useEffect(() => {
    loadTestimonials().then(({ testimonials }) => setItems(testimonials || []));
  }, []);

  const count = items.length;

  useEffect(() => {
    if (count < 2) return undefined;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return undefined;

    const timer = setInterval(() => {
      setFading(true);
      setTimeout(() => {
        setIndex((current) => (current + 1) % count);
        setFading(false);
      }, FADE_MS);
    }, HOLD_MS);

    return () => clearInterval(timer);
  }, [count]);

  if (!count) return null;

  const quote = items[index];
  const stars = Math.max(1, Math.min(5, quote.rating || 5));

  const jumpTo = (next) => {
    if (next === index) return;
    setFading(true);
    setTimeout(() => {
      setIndex(next);
      setFading(false);
    }, FADE_MS);
  };

  return (
    <section className="voices section-padding">
      <div className="container voices__inner">
        <span className="ds-eyebrow">In their words</span>
        <span className="voices__mark" aria-hidden="true">
          &ldquo;
        </span>

        <blockquote className={`voices__quote ${fading ? "is-fading" : ""}`}>
          {quote.content}
        </blockquote>

        <span className="voices__stars" aria-label={`${stars} out of 5`}>
          {"★".repeat(stars)}
        </span>

        <p className="voices__who mb-0">
          <b>{quote.name}</b>
          {quote.role ? ` · ${quote.role}` : ""}
        </p>

        {count > 1 && (
          <div className="voices__dots">
            {items.map((item, i) => (
              <button
                type="button"
                key={item.id ?? item.name}
                className={`voices__dot ${i === index ? "is-active" : ""}`}
                aria-label={`Read what ${item.name} said`}
                onClick={() => jumpTo(i)}
              />
            ))}
          </div>
        )}

        <Link className="ds-link" to="/testimonials">
          Read them all
          <span className="ds-link__arrow" aria-hidden="true">
            →
          </span>
        </Link>
      </div>
    </section>
  );
}
