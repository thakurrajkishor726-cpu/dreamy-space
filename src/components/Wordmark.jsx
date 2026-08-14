/**
 * The Dreamy Space logo.
 *
 * Assets are derived from public/images/logo/logo.jpeg by
 * scripts/build_logo.py — re-run it after replacing that source file.
 *
 * The supplied lockup stacks the wordmark under the monogram, so it is nearly
 * square. At header height that leaves "DREAMY SPACE" about 8px tall, and
 * setting the two halves side by side instead gives a 5:1 strip too wide for a
 * nav bar. So the header takes the monogram and sets the name in the site's
 * display face beside it, which stays sharp at any size.
 *
 * `variant="lockup"` uses the supplied artwork whole, for the places with room
 * for it. `tone="light"` swaps to the variant whose navy has been relit for
 * dark backgrounds — the original navy is close to unreadable on the ink the
 * footer uses.
 */

const ASSETS = {
  mark: { dark: "/images/logo/logo-mark.png", light: "/images/logo/logo-mark-light.png" },
  lockup: { dark: "/images/logo/logo.png", light: "/images/logo/logo-light.png" },
};

export default function Wordmark({
  tone = "dark",
  variant = "mark",
  showTag = true,
  className = "",
}) {
  const light = tone === "light";
  const src = ASSETS[variant][light ? "light" : "dark"];

  if (variant === "lockup") {
    return (
      <span className={`ds-logo ds-logo--lockup ${light ? "ds-logo--light" : ""} ${className}`.trim()}>
        <img src={src} alt="Dreamy Space" className="ds-logo__img" loading="lazy" />
      </span>
    );
  }

  return (
    <span className={`ds-logo ${light ? "ds-logo--light" : ""} ${className}`.trim()}>
      <img
        src={src}
        alt=""
        aria-hidden="true"
        className="ds-logo__mark"
        // Part of the first paint, above the fold.
        loading="eager"
        fetchPriority="high"
      />
      <span className="ds-logo__text">
        <span className="ds-logo__name">Dreamy Space</span>
        {showTag && <span className="ds-logo__tag">Interiors · Bengaluru</span>}
      </span>
    </span>
  );
}
