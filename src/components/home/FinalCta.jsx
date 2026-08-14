import { Link } from "react-router-dom";
import { FiMail, FiPhone } from "react-icons/fi";
import { bannerImages } from "../../data/banners";
import { COMPANY, mailHref, phone, telHref } from "../../data/company";

/**
 * Closing band: a full-bleed photo with the card offset to one side, rather
 * than centred text on a flat dark panel.
 */
export default function FinalCta() {
  return (
    <section className="closing">
      {bannerImages[6] && (
        <img className="closing__bg" src={bannerImages[6]} alt="" aria-hidden="true" loading="lazy" />
      )}

      <div className="container closing__inner">
        <div className="closing__card">
          <span className="ds-eyebrow">Ready when you are</span>
          <h2 className="ds-title">
            Tell us about <em>the room</em>
          </h2>
          <p className="ds-lead">
            Send the rooms, a rough budget and when you would like it done. You get a plan and a
            price back, not a sales call.
          </p>

          <div className="closing__actions">
            <Link className="btn-clay" to="/contact">
              Book a free consultation
            </Link>
            <Link className="btn-ghost" to="/projects">
              See the portfolio
            </Link>
          </div>

          <div className="closing__contact">
            <a href={telHref}>
              <FiPhone aria-hidden="true" />
              {phone}
            </a>
            <a href={mailHref}>
              <FiMail aria-hidden="true" />
              {COMPANY.email}
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
