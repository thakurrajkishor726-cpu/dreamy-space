import { CATEGORY_IMAGES } from "../../data/categoryImages";

/**
 * Continuous band of category names under the hero.
 *
 * Two identical tracks sit side by side and each slides -100% of its own
 * width, so the second lands exactly where the first started and the loop is
 * seamless. Each track is padded out to at least 12 names, otherwise six short
 * labels leave a visible gap on a wide monitor.
 */

const MIN_ITEMS = 12;

export default function CategoryMarquee() {
  if (!CATEGORY_IMAGES.length) return null;

  const names = CATEGORY_IMAGES.map((category) => category.name);
  const items = Array.from({ length: Math.max(MIN_ITEMS, names.length) }, (_, i) => ({
    key: i,
    name: names[i % names.length],
  }));

  return (
    <div className="ds-marquee" aria-hidden="true">
      {[0, 1].map((copy) => (
        <div className="ds-marquee__track" key={copy}>
          {items.map((item) => (
            <span className="ds-marquee__item" key={`${copy}-${item.key}`}>
              {item.name}
            </span>
          ))}
        </div>
      ))}
    </div>
  );
}
