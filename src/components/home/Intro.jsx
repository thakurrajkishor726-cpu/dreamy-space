import { Link } from "react-router-dom";
import stockU08 from "../../assets/images/stock/u08.jpg";
import stockU02 from "../../assets/images/stock/u02.jpg";

/**
 * This block used to carry "100+ Design Awards" and "1000+ Happy Clients".
 * Both came from the site this project was modelled on and neither is a claim
 * Dreamy Space can support, so they are gone. What is here instead describes
 * how the work is done, which is true on day one.
 */

const POINTS = [
  {
    title: "We start with your routine",
    copy: "Where the atta box lives, which side the door swings, who reaches the top shelf. The drawing follows the answers.",
  },
  {
    title: "Sized to what goes inside",
    copy: "Shelf heights and drawer depths are set around the things you actually own, not a standard module sheet.",
  },
  {
    title: "Finishes picked for wear",
    copy: "A surface near the hob and a surface behind a wardrobe door take very different punishment. They are specced differently.",
  },
];

export default function Intro() {
  return (
    <section className="intro section-padding">
      <div className="container intro__grid">
        <div className="intro__copy">
          <span className="ds-eyebrow">Our approach</span>
          <h2 className="ds-title">
            Good rooms begin with <em>how you use them</em>
          </h2>
          <p className="ds-lead">
            We start with your routine rather than a mood board. Every unit is sized to what goes
            inside it, every surface picked for the wear it will take, and every light placed
            where you actually need to see.
          </p>

          <ul className="intro__points">
            {POINTS.map((point, index) => (
              <li className="intro__point" key={point.title}>
                <span className="intro__point-num">{String(index + 1).padStart(2, "0")}</span>
                <div>
                  <h3 className="intro__point-title">{point.title}</h3>
                  <p className="intro__point-copy">{point.copy}</p>
                </div>
              </li>
            ))}
          </ul>

          <Link className="ds-link" to="/modular-journey">
            How we work
            <span className="ds-link__arrow" aria-hidden="true">
              →
            </span>
          </Link>
        </div>

        <div className="intro__stage">
          <figure className="intro__figure intro__figure--tall">
            <img src={stockU08} alt="Fitted joinery detail" loading="lazy" />
          </figure>
          <figure className="intro__figure intro__figure--short">
            <img src={stockU02} alt="Kitchen storage detail" loading="lazy" />
          </figure>
          <div className="intro__note">
            <h3 className="intro__note-title">Drawn, made and fitted by one team</h3>
            <p className="intro__note-copy">
              No handover between designer, fabricator and installer, so there is nobody to point
              at when something does not line up.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
