import { useLayoutEffect, useRef } from "react";
import { Link } from "react-router-dom";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { CATEGORY_IMAGES } from "../../data/categoryImages";
import CategorySlideshow from "./CategorySlideshow";

/**
 * Driven entirely by public/images/categories/<Folder_Name>/ — the card title
 * is the folder name with underscores replaced, and the cover is the first
 * image in that folder. Add a folder, run `npm run categories:manifest`, and
 * it shows up here with no code change.
 */
export default function WhatWeOffer() {
  const rootRef = useRef(null);
  const cardsRef = useRef([]);

  useLayoutEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    const ctx = gsap.context(() => {
      cardsRef.current.forEach((card) => {
        if (!card) return;
        gsap.set(card, {
          transformOrigin: "center bottom",
          transformPerspective: 500,
          willChange: "transform",
        });
        gsap.fromTo(
          card,
          { rotateX: -26, z: -260, y: 40 },
          {
            rotateX: 0,
            z: 0,
            y: -20,
            ease: "none",
            scrollTrigger: {
              trigger: card,
              start: "top 96%",
              end: "top 34%",
              scrub: 1.1,
              invalidateOnRefresh: true,
            },
          },
        );
      });
    }, rootRef);

    ScrollTrigger.refresh();
    return () => ctx.revert();
  }, []);

  if (!CATEGORY_IMAGES.length) return null;

  return (
    <section ref={rootRef} className="section-padding bg-brand-light what-we-offer">
      <div className="container">
        <div className="what-we-offer__header text-center">
          <span className="section-heading d-block mb-3">What We Offer</span>
          <h2 className="display-5 font-serif fw-semibold mb-3">Architectural Design Solutions</h2>
          <p className="architecture-description mx-auto mb-4">
            Wardrobes, media walls, shoe racks and panelling, drawn to your dimensions and
            built in our own workshop.
          </p>
        </div>

        <div className="what-we-offer__grid">
          {CATEGORY_IMAGES.map((category, index) => (
            <div className="arch-offer-slot" key={category.folder}>
              <article
                className="arch-offer-card"
                ref={(node) => {
                  cardsRef.current[index] = node;
                }}
              >
                <div className="arch-offer-card__image">
                  <CategorySlideshow
                    images={category.images}
                    alt={category.name}
                    startDelayMs={index * 600}
                  />
                </div>
                <div className="arch-offer-card__caption">
                  <span className="arch-offer-card__eyebrow">Our Work</span>
                  <h5 className="arch-offer-card__title">{category.name}</h5>
                  <Link
                    to={`/our-work?category=${encodeURIComponent(category.name)}`}
                    className="arch-offer-card__cover"
                    aria-label={`View ${category.name}`}
                  >
                    <span aria-hidden="true" />
                  </Link>
                </div>
              </article>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
