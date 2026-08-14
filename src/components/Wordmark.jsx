/**
 * Dreamy Spaces wordmark.
 *
 * The build was still shipping the logo of the studio this project was
 * modelled on — their mark, in the header, the footer and the admin. This
 * replaces it.
 *
 * It is set in the site's own display face rather than exported as an image,
 * so it stays sharp at any size and picks up the palette. The glyph is a
 * nested arch, echoing the arched frame in the hero.
 *
 * Swap in a real logo file when you have one: point `src` at it in Navbar,
 * Footer and admin/AdminApp instead of rendering this.
 */
export default function Wordmark({ tone = "dark", showTag = true, className = "" }) {
  return (
    <span className={`ds-wordmark ds-wordmark--${tone} ${className}`.trim()}>
      <svg
        className="ds-wordmark__mark"
        viewBox="0 0 28 32"
        fill="none"
        aria-hidden="true"
        focusable="false"
      >
        <path
          d="M2 30.5V14C2 7.4 7.4 2 14 2s12 5.4 12 12v16.5"
          stroke="currentColor"
          strokeWidth="2.6"
          strokeLinecap="round"
        />
        <path
          d="M9.2 30.5V17.2c0-2.65 2.15-4.8 4.8-4.8s4.8 2.15 4.8 4.8V30.5"
          stroke="currentColor"
          strokeWidth="2.6"
          strokeLinecap="round"
        />
      </svg>

      <span className="ds-wordmark__text">
        <span className="ds-wordmark__name">Dreamy Spaces</span>
        {showTag && <span className="ds-wordmark__tag">Interiors · Bengaluru</span>}
      </span>
    </span>
  );
}
