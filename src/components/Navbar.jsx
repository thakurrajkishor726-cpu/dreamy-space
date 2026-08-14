import { useEffect, useMemo, useRef, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { FiChevronDown, FiClock, FiMail, FiPhone } from "react-icons/fi";
import { FaFacebookF, FaInstagram, FaLinkedinIn } from "react-icons/fa";
import { COMPANY, mailHref, telHref } from "../data/company";
import { CATEGORY_IMAGES } from "../data/categoryImages";
import Wordmark from "./Wordmark";

const EXPAND_AT = 1200;

const LINKS = [
  { label: "Home", to: "/", end: true },
  { label: "Our Work", to: "/our-work" },
  { label: "Projects", to: "/projects" },
  { label: "Modular Journey", to: "/modular-journey" },
  { label: "Testimonials", to: "/testimonials" },
];

const SOCIAL_ICONS = {
  facebook: FaFacebookF,
  instagram: FaInstagram,
  linkedin: FaLinkedinIn,
};

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [servicesOpen, setServicesOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [isDesktop, setIsDesktop] = useState(
    typeof window !== "undefined" ? window.innerWidth >= EXPAND_AT : true,
  );
  const location = useLocation();
  const headerRef = useRef(null);

  const services = useMemo(
    () =>
      CATEGORY_IMAGES.map((category) => ({
        name: category.name,
        thumb: category.images[0],
        to: `/our-work?category=${encodeURIComponent(category.name)}`,
      })),
    [],
  );

  const socials = useMemo(
    () =>
      COMPANY.socials
        .map((link) => ({ ...link, Icon: SOCIAL_ICONS[(link.platform || "").toLowerCase()] }))
        .filter((link) => link.Icon && link.url && link.url !== "#"),
    [],
  );

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const onResize = () => setIsDesktop(window.innerWidth >= EXPAND_AT);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // The collapsed panel hangs off the bottom of the whole header (utility bar
  // included), and that height changes with the viewport. Measure it rather
  // than hardcoding a value that only holds at one width.
  useEffect(() => {
    const node = headerRef.current;
    if (!node) return undefined;

    const sync = () => {
      const height = Math.round(node.getBoundingClientRect().height);
      if (height) document.documentElement.style.setProperty("--header-height", `${height}px`);
    };

    sync();
    const observer = new ResizeObserver(sync);
    observer.observe(node);
    // The webfont swap changes the wordmark's height after first paint, and
    // the observer can miss that beat. Re-measure once the fonts land.
    document.fonts?.ready.then(sync);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    setMenuOpen(false);
    setServicesOpen(false);
  }, [location]);

  useEffect(() => {
    document.body.classList.toggle("no-scroll", menuOpen && !isDesktop);
    return () => document.body.classList.remove("no-scroll");
  }, [menuOpen, isDesktop]);

  // Desktop: close the mega menu on outside click or Escape.
  useEffect(() => {
    if (!servicesOpen) return undefined;
    const onKey = (event) => event.key === "Escape" && setServicesOpen(false);
    const onClick = (event) => {
      if (!headerRef.current?.contains(event.target)) setServicesOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onClick);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onClick);
    };
  }, [servicesOpen]);

  const servicesActive = new URLSearchParams(location.search).has("category");

  return (
    <header className="ds-header" ref={headerRef}>
      <div className="ds-topbar">
        <div className="container ds-topbar__inner">
          <a className="ds-topbar__item" href={telHref}>
            <FiPhone aria-hidden="true" />
            {COMPANY.phone}
          </a>
          <a className="ds-topbar__item ds-topbar__item--mail" href={mailHref}>
            <FiMail aria-hidden="true" />
            {COMPANY.email}
          </a>
          <span className="ds-topbar__item ds-topbar__item--hours">
            <FiClock aria-hidden="true" />
            {COMPANY.hours}
          </span>
          {socials.length > 0 && (
            <div className="ds-topbar__socials ds-topbar__spacer">
              {socials.map(({ Icon, url, platform }) => (
                <a
                  key={platform}
                  href={url}
                  className="ds-topbar__social"
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
      </div>

      <nav className={`ds-nav ${scrolled ? "ds-nav--scrolled" : ""}`} aria-label="Main">
        <div className="container ds-nav__inner">
          <Link className="ds-nav__brand" to="/" aria-label={`${COMPANY.name} home`}>
            <Wordmark />
          </Link>

          {!isDesktop && (
            <button
              type="button"
              className="ds-nav__burger"
              aria-label={menuOpen ? "Close menu" : "Open menu"}
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((open) => !open)}
            >
              <span />
              <span />
              <span />
            </button>
          )}

          <div className={`ds-nav__panel ${menuOpen ? "is-open" : ""}`}>
            <ul className="ds-nav__links">
              <li className="ds-nav__item">
                <NavLink
                  className={({ isActive }) => `ds-nav__link ${isActive ? "is-active" : ""}`}
                  to="/"
                  end
                >
                  Home
                </NavLink>
              </li>

              <li
                className={`ds-nav__item ds-nav__item--has-menu ${servicesOpen ? "is-open" : ""}`}
                onMouseEnter={() => isDesktop && setServicesOpen(true)}
                onMouseLeave={() => isDesktop && setServicesOpen(false)}
              >
                <button
                  type="button"
                  className={`ds-nav__link ${servicesActive ? "is-active" : ""}`}
                  aria-expanded={servicesOpen}
                  onClick={() => setServicesOpen((open) => !open)}
                >
                  Services
                  <FiChevronDown className="ds-nav__caret" aria-hidden="true" />
                </button>

                <div className="ds-mega">
                  <ul className="ds-mega__grid">
                    {services.map((service) => (
                      <li key={service.name}>
                        <Link className="ds-mega__link" to={service.to}>
                          <span className="ds-mega__thumb">
                            {service.thumb && (
                              <img src={service.thumb} alt="" loading="lazy" aria-hidden="true" />
                            )}
                          </span>
                          <span className="ds-mega__label">{service.name}</span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                  <div className="ds-mega__foot">
                    <Link className="ds-link" to="/our-work">
                      See everything
                      <span className="ds-link__arrow" aria-hidden="true">
                        →
                      </span>
                    </Link>
                  </div>
                </div>
              </li>

              {LINKS.slice(1).map((link) => (
                <li className="ds-nav__item" key={link.to}>
                  <NavLink
                    className={({ isActive }) => `ds-nav__link ${isActive ? "is-active" : ""}`}
                    to={link.to}
                  >
                    {link.label}
                  </NavLink>
                </li>
              ))}
            </ul>

            {/* Kept short: "Book a Consultation" pushed the row 25px past the
                container at 1280, a very common laptop width. */}
            <Link className="btn-clay ds-nav__cta" to="/contact">
              Get a Quote
            </Link>
          </div>
        </div>
      </nav>
    </header>
  );
}
