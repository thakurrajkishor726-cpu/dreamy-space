import { useMemo } from "react";
import { Link } from "react-router-dom";
import {
  FaFacebookF,
  FaInstagram,
  FaLinkedinIn,
} from "react-icons/fa";
import { FiClock, FiMail, FiMapPin, FiPhone } from "react-icons/fi";
import { COMPANY, addressText, mailHref, telHref } from "../data/company";
import { CATEGORY_IMAGES } from "../data/categoryImages";
import Wordmark from "./Wordmark";

const QUICK_LINKS = [
  { label: "Home", to: "/" },
  { label: "Our Work", to: "/our-work" },
  { label: "Projects", to: "/projects" },
  { label: "Modular Journey", to: "/modular-journey" },
  { label: "Testimonials", to: "/testimonials" },
  { label: "Contact", to: "/contact" },
];

const SOCIAL_ICONS = {
  facebook: FaFacebookF,
  instagram: FaInstagram,
  linkedin: FaLinkedinIn,
};

export default function Footer() {
  const socials = useMemo(
    () =>
      COMPANY.socials
        .map((link) => ({ ...link, Icon: SOCIAL_ICONS[(link.platform || "").toLowerCase()] }))
        .filter((link) => link.Icon && link.url && link.url !== "#"),
    [],
  );

  // Four is enough to show the range without turning the footer into a menu.
  const services = useMemo(() => CATEGORY_IMAGES.slice(0, 4), []);

  return (
    <footer className="ds-footer">
      <div className="container">
        <div className="ds-footer__grid">
          <div className="ds-footer__brand">
            <Wordmark tone="light" className="mb-4" />
            <p className="ds-footer__blurb">
              Made-to-measure interiors for homes and offices in Bengaluru. We handle the
              drawings, the making and the fitting, so one team is answerable from start to
              finish.
            </p>
            {socials.length > 0 && (
              <div className="ds-footer__socials">
                {socials.map(({ Icon, url, platform }) => (
                  <a
                    href={url}
                    className="footer-social"
                    key={platform}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={`${COMPANY.name} on ${platform}`}
                  >
                    <Icon />
                  </a>
                ))}
              </div>
            )}
          </div>

          <div>
            <h2 className="ds-footer__heading">Explore</h2>
            <ul className="ds-footer__links">
              {QUICK_LINKS.map((link) => (
                <li key={link.label}>
                  <Link className="ds-footer__link" to={link.to}>
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>

            {services.length > 0 && (
              <>
                <h2 className="ds-footer__heading" style={{ marginTop: "2rem" }}>
                  What we make
                </h2>
                <ul className="ds-footer__links">
                  {services.map((service) => (
                    <li key={service.folder}>
                      <Link
                        className="ds-footer__link"
                        to={`/our-work?category=${encodeURIComponent(service.name)}`}
                      >
                        {service.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>

          <div>
            <h2 className="ds-footer__heading">Get in touch</h2>
            <ul className="ds-footer__contact">
              <li>
                <FiMapPin aria-hidden="true" />
                <a href={COMPANY.mapsUrl} target="_blank" rel="noreferrer">
                  {addressText}
                </a>
              </li>
              <li>
                <FiPhone aria-hidden="true" />
                <a href={telHref}>{COMPANY.phone}</a>
              </li>
              <li>
                <FiMail aria-hidden="true" />
                <a href={mailHref}>{COMPANY.email}</a>
              </li>
              <li>
                <FiClock aria-hidden="true" />
                <span>{COMPANY.hours}</span>
              </li>
            </ul>

            <Link className="btn-clay btn-sm-pill" to="/contact" style={{ marginTop: "1.5rem" }}>
              Book a consultation
            </Link>
          </div>
        </div>

        <div className="ds-footer__bar">
          <p>
            © {new Date().getFullYear()} {COMPANY.name}. All rights reserved.
          </p>
          <p>Designed and built in Bengaluru.</p>
        </div>
      </div>
    </footer>
  );
}
