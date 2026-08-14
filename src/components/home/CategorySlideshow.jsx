import { useEffect, useRef, useState } from "react";
import { cloudinaryUrl } from "../../lib/cloudinary";

const INTERVAL_MS = 3800;

/**
 * Crossfades through one category's images.
 *
 * Deliberately CSS-only for the fade: the parent card is under a GSAP
 * transform, and animating opacity on stacked <img>s avoids touching the
 * transform GSAP owns.
 *
 * Cycling only runs while the card is on screen — six simultaneous
 * slideshows of large photos is real work, and none of it is worth doing for
 * a card nobody is looking at.
 */
export default function CategorySlideshow({ images, alt, startDelayMs = 0, showDots = true }) {
  const [index, setIndex] = useState(0);
  const [visible, setVisible] = useState(false);
  const rootRef = useRef(null);

  useEffect(() => {
    const node = rootRef.current;
    if (!node) return undefined;

    const observer = new IntersectionObserver(
      ([entry]) => setVisible(entry.isIntersecting),
      { threshold: 0.15 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!visible || images.length < 2) return undefined;

    // Honour a reduced-motion preference by simply not cycling.
    const reduced =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reduced) return undefined;

    // Stagger the start so the six cards don't all flip on the same beat.
    let interval;
    const timeout = setTimeout(() => {
      setIndex((current) => (current + 1) % images.length);
      interval = setInterval(
        () => setIndex((current) => (current + 1) % images.length),
        INTERVAL_MS,
      );
    }, startDelayMs);

    return () => {
      clearTimeout(timeout);
      if (interval) clearInterval(interval);
    };
  }, [visible, images.length, startDelayMs]);

  return (
    <div className="cat-slideshow" ref={rootRef}>
      {images.map((src, i) => (
        <img
          key={src}
          // Local originals pass through; Cloudinary uploads get resized.
          src={cloudinaryUrl(src, { width: 900, height: 700 })}
          alt={i === 0 ? alt : ""}
          aria-hidden={i === 0 ? undefined : "true"}
          className={`cat-slideshow__frame ${i === index ? "is-active" : ""}`}
          // Only the first frame is worth fetching up front; the rest arrive
          // as the card scrolls into view.
          loading={i === 0 ? "eager" : "lazy"}
          decoding="async"
          draggable={false}
        />
      ))}

      {showDots && images.length > 1 && (
        <div className="cat-slideshow__dots" aria-hidden="true">
          {images.map((src, i) => (
            <span key={src} className={i === index ? "is-active" : ""} />
          ))}
        </div>
      )}
    </div>
  );
}
