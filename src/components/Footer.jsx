import { useMemo } from "react";
import { Link } from "react-router-dom";
import {
  FaClock,
  FaEnvelope,
  FaFacebookF,
  FaInstagram,
  FaLinkedinIn,
  FaMapMarkerAlt,
  FaPhoneAlt,
} from "react-icons/fa";
import { COMPANY, addressText, mailHref, telHref } from "../data/company";

const LOGO = "/images/logo/logo.png";

const QUICK_LINKS = [
  { label: "Home", to: "/" },
  { label: "Services", to: "/our-work" },
  { label: "Our Work", to: "/our-work" },
  { label: "Journey", to: "/modular-journey" },
  { label: "Projects", to: "/projects" },
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
        .filter((link) => link.Icon),
    [],
  );

  return (
    <footer className="bg-brand-dark text-white mt-auto footer-section">
      <div className="container">
        <div className="row g-5 mb-4">
          <div className="col-12 col-lg-5">
            <div className="d-flex align-items-center gap-3 mb-3">
              <img
                src={LOGO}
                alt={`${COMPANY.name} logo`}
                className="footer-logo"
                loading="lazy"
                onError={(event) => {
                  event.currentTarget.src = "/images/logo.png";
                }}
              />
            </div>
            <p className="text-light small mb-4 pe-lg-4">
              Dreamy Spaces designs and builds interiors for homes and offices in Bengaluru.
              We handle the drawings, the making and the fitting, so one team is answerable from
              start to finish.
            </p>
            <ul className="list-unstyled small text-light-emphasis footer-contact">
              <li className="d-flex align-items-start gap-3">
                <FaMapMarkerAlt className="footer-icon mt-1" />
                <p>
                  <a href={COMPANY.mapsUrl} target="_blank" rel="noreferrer">
                    {addressText}
                  </a>
                </p>
              </li>
              <li className="d-flex align-items-center gap-3">
                <FaPhoneAlt className="footer-icon" />
                <p>
                  <a href={telHref}>
                    {COMPANY.phone}
                  </a>
                </p>
              </li>
              <li className="d-flex align-items-center gap-3">
                <FaEnvelope className="footer-icon" />
                <p>
                  <a href={mailHref}>
                    {COMPANY.email}
                  </a>
                </p>
              </li>
              <li className="d-flex align-items-center gap-3">
                <FaClock className="footer-icon" />
                <p>{COMPANY.hours}</p>
              </li>
            </ul>
            <div className="d-flex gap-2 mt-3">
              {socials.map(({ Icon, url, platform }, index) => (
                <a href={url || "#"} className="footer-social" key={`${platform}-${index}`}>
                  <Icon />
                </a>
              ))}
            </div>
          </div>

          <div className="col-12 col-lg-7">
            <div className="footer-quicklinks">
              <h6 className="text-uppercase small fw-bold mb-3">Quick Links</h6>
              <ul className="list-unstyled small text-light-emphasis footer-links footer-links--split">
                {QUICK_LINKS.map((link) => (
                  <li key={link.label}>
                    <Link className="footer-link" to={link.to}>
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        <div className="d-flex justify-content-center align-items-center pt-4 mt-2 footer-bar text-uppercase small text-light-emphasis">
          <p className="mb-0 footer-subtle">© 2026 Dreamy Spaces. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
