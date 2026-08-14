import { useLayoutEffect, useMemo, useRef } from "react";
import { Link } from "react-router-dom";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useCategories } from "../../lib/useCategories";
import CategorySlideshow from "./CategorySlideshow";

/**
 * The categories flagged "show on home page" in the admin, with the images
 * filed against each one. Toggle a category off and its tile disappears from
 * here without affecting the nav, Our Work, or project tagging.
 *
 * The grid runs 7/5 and 5/7 across twelve columns so the rows alternate rather
 * than reading as an even three-across block, and the caption sits over the
 * image instead of in a panel beneath it.
 *
 * Column spans are pure CSS (nth-child), not computed here, so adding or
 * removing a category can never leave the layout and the data disagreeing.
 */

export default function WhatWeOffer() {
  const rootRef = useRef(null);
  const tilesRef = useRef([]);
  const { categories, settled } = useCategories();

  const shown = useMemo(
    () => categories.filter((category) => category.showInDashboard && category.images.length > 0),
    [categories],
  );

  useLayoutEffect(() => {
    gsap.registerPlugin(ScrollTrigger);

    const ctx = gsap.context(() => {
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

      tilesRef.current.forEach((tile, index) => {
        if (!tile) return;

        // Tiles rise into place, staggered along each row.
        gsap.fromTo(
          tile,
          { y: 44, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 0.9,
            ease: "power3.out",
            delay: (index % 2) * 0.12,
            scrollTrigger: { trigger: tile, start: "top 88%", once: true },
          },
        );

        // Slow counter-drift on the media so the grid has depth on scroll.
        const media = tile.querySelector(".work__media");
        if (media) {
          gsap.fromTo(
            media,
            { yPercent: -4 },
            {
              yPercent: 4,
              ease: "none",
              scrollTrigger: { trigger: tile, start: "top bottom", end: "bottom top", scrub: 1 },
            },
          );
        }
      });
    }, rootRef);

    ScrollTrigger.refresh();
    return () => ctx.revert();
    // Re-run once the real list arrives: the tiles the triggers were built
    // against are gone by then.
  }, [shown.length]);

  // Hold the section back until we know the real flags, otherwise a category
  // the owner has hidden flashes up on a first visit before the API answers.
  if (!settled || !shown.length) return null;

  return (
    <section ref={rootRef} className="work section-padding">
      <div className="container">
        <header className="ds-head ds-head--split">
          <div className="ds-head__title-block">
            <span className="ds-eyebrow">What we make</span>
            <h2 className="ds-title">
              What we build, <em>properly</em>
            </h2>
          </div>
          <p className="ds-lead">
            Every unit is sized to what goes inside it and cut from the drawing you signed off.
            Pick a category to see the work up close.
          </p>
        </header>

        <div className="work__grid">
          {shown.map((category, index) => (
            <article
              className="work__tile"
              key={category.id}
              ref={(node) => {
                tilesRef.current[index] = node;
              }}
            >
              <div className="work__media">
                {/* Dots would land under the caption and the index number,
                    so the tile carries the crossfade on its own. */}
                <CategorySlideshow
                  images={category.images}
                  alt={category.name}
                  startDelayMs={index * 700}
                  showDots={false}
                />
              </div>

              <span className="work__scrim" aria-hidden="true" />
              <span className="work__index">{String(index + 1).padStart(2, "0")}</span>

              <div className="work__caption">
                <h3 className="work__name">{category.name}</h3>
                <span className="work__go" aria-hidden="true">
                  →
                </span>
              </div>

              <Link
                className="work__link"
                to={`/our-work?category=${encodeURIComponent(category.name)}`}
                aria-label={`View ${category.name}`}
              />
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
