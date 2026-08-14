import { Link } from "react-router-dom";

/**
 * Replaces the fixed-attachment parallax panel the first build inherited.
 * That pattern is broken on iOS anyway, and a numbered list on a flat ink
 * ground reads better on a phone.
 *
 * Every line here is a statement about how the work is run, not a number —
 * nothing on this page claims a track record the business has not built yet.
 */

const REASONS = [
  {
    title: "Drawings before decisions",
    copy: "You see a measured drawing and a written price before anything is cut. If the plan changes, the price is redone in front of you rather than added at the end.",
  },
  {
    title: "Made in our own workshop",
    copy: "Panels are machined from the drawing you approved, so what turns up on site is what you signed off. No third-party fabricator in the middle to blame.",
  },
  {
    title: "One team, start to finish",
    copy: "The people who measured your rooms are the people who install them. Nothing gets handed to a subcontractor halfway through.",
  },
  {
    title: "Nothing to pay to start",
    copy: "The first visit, the measuring and the quote cost you nothing. You decide once you can see the drawing and the number.",
  },
];

export default function WhyUs() {
  return (
    <section className="why section-padding">
      <div className="container why__grid">
        <div className="why__aside">
          <span className="ds-eyebrow ds-eyebrow--light">Why Dreamy Space</span>
          <h2 className="ds-title ds-title--light">
            How the job is <em>actually run</em>
          </h2>
          <p className="ds-lead ds-lead--light">
            Most of what goes wrong in an interiors job goes wrong in the handovers. We removed
            them.
          </p>
          <Link className="btn-clay" to="/contact">
            Book a free consultation
          </Link>
        </div>

        <ol className="why__list">
          {REASONS.map((reason) => (
            <li className="why__row" key={reason.title}>
              <span className="why__num" aria-hidden="true" />
              <div>
                <h3 className="why__row-title">{reason.title}</h3>
                <p className="why__row-copy">{reason.copy}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
