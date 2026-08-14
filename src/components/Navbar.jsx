import { useEffect, useMemo, useRef, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { FaChevronDown } from "react-icons/fa";
import { apiGet } from "../lib/api";
import { CATEGORY_IMAGES } from "../data/categoryImages";

const DEFAULT_COMPANY = { brandName: "Dreamy Spaces" };
const DEFAULT_LOGO = "/images/logo/logo.png";

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [servicesOpen, setServicesOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [isDesktop, setIsDesktop] = useState(
    typeof window !== "undefined" ? window.innerWidth >= 1400 : true,
  );
  const [desktopDropdown, setDesktopDropdown] = useState(null);
  const [company, setCompany] = useState(DEFAULT_COMPANY);
  const [companyError, setCompanyError] = useState(null);
  const [logo, setLogo] = useState(DEFAULT_LOGO);
  const location = useLocation();
  const navRef = useRef(null);

  const serviceGroups = useMemo(
    () =>
      CATEGORY_IMAGES.map((category) => ({
        label: category.name,
        to: `/our-work?category=${encodeURIComponent(category.name)}`,
      })),
    [],
  );

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const onResize = () => setIsDesktop(window.innerWidth >= 1400);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // The mobile menu is positioned at top: var(--header-height). That was a
  // hardcoded 82px while the bar is actually taller once the logo grows at
  // >=992px, so the panel tucked under the header. Measure it instead.
  useEffect(() => {
    const bar = navRef.current;
    if (!bar) return undefined;

    const sync = () => {
      const height = Math.round(bar.getBoundingClientRect().height);
      if (height) document.documentElement.style.setProperty("--header-height", `${height}px`);
    };

    sync();
    const observer = new ResizeObserver(sync);
    observer.observe(bar);
    window.addEventListener("resize", sync);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", sync);
    };
  }, []);

  useEffect(() => {
    closeAll();
  }, [location]);

  useEffect(() => {
    if (menuOpen && !isDesktop) document.body.classList.add("no-scroll");
    else document.body.classList.remove("no-scroll");
    return () => document.body.classList.remove("no-scroll");
  }, [menuOpen, isDesktop]);

  useEffect(() => {
    apiGet("/api/v1/company-settings").then(({ data, error }) => {
      if (data) {
        const brandName = data.brandName || data.brand_name || data.name || DEFAULT_COMPANY.brandName;
        setCompany({ ...DEFAULT_COMPANY, ...data, brandName });
        if (data.logo_url) setLogo(data.logo_url);
      }
      if (error) {
        console.error("Company settings error:", error);
        setCompanyError("Unable to load company details");
      }
    });
  }, []);

  function closeAll() {
    setMenuOpen(false);
    setServicesOpen(false);
    setMoreOpen(false);
    setDesktopDropdown(null);
  }

  const isActive = (path) =>
    path === "/" ? location.pathname === "/" : location.pathname.startsWith(path);

  const enterDesktop = (key) => isDesktop && setDesktopDropdown(key);
  const leaveDesktop = () => isDesktop && setDesktopDropdown(null);

  const toggleServices = () =>
    isDesktop ? setDesktopDropdown("services") : setServicesOpen((v) => !v);
  const toggleMore = () => (isDesktop ? setDesktopDropdown("more") : setMoreOpen((v) => !v));

  return (
    <header>
      <nav
        ref={navRef}
        className={`navbar navbar-expand-xxl navbar-light fixed-top bg-white header-nav ${
          scrolled ? "shadow-sm" : ""
        }`}
      >
        <div className="container d-flex align-items-center">
          <Link className="navbar-brand d-flex align-items-center gap-2 text-brand" to="/">
            <img
              src={logo}
              alt={`${company.brandName || DEFAULT_COMPANY.brandName} logo`}
              className="site-logo"
              loading="lazy"
              onError={(event) => {
                event.currentTarget.src = "/images/logo.png";
              }}
            />
          </Link>

          <button
            className="navbar-toggler"
            type="button"
            aria-label="Toggle navigation"
            onClick={() =>
              setMenuOpen((open) => {
                const next = !open;
                if (!next) {
                                setServicesOpen(false);
                              }
                return next;
              })
            }
          >
            <span className="navbar-toggler-icon" />
          </button>

          <div className={`collapse navbar-collapse flex-lg-grow-1 ${menuOpen ? "show" : ""}`}>
            <div className="navbar-links-cta d-flex flex-column flex-xxl-row align-items-lg-center w-100">
              <ul className="navbar-nav align-items-lg-center gap-lg-2 text-uppercase fw-semibold small mx-lg-auto">
                <li className="nav-item">
                  <NavLink className="nav-link" to="/" end onClick={closeAll}>
                    Home
                  </NavLink>
                </li>

                <li
                  className="nav-item dropdown services-dropdown"
                  onMouseEnter={() => enterDesktop("services")}
                  onMouseLeave={leaveDesktop}
                >
                  <button
                    type="button"
                    className={`nav-link dropdown-toggle border-0 bg-transparent services-toggle ${
                      isActive("/services") ? "active" : ""
                    }`}
                    onClick={toggleServices}
                    aria-expanded={servicesOpen}
                  >
                    <span className="d-inline-flex align-items-center gap-1">
                      Services
                      <FaChevronDown className="nav-caret" />
                    </span>
                  </button>
                  <div
                    className={`dropdown-menu services-menu ${
                      servicesOpen && !isDesktop ? "show d-block position-static mt-2 w-100" : ""
                    } ${isDesktop && desktopDropdown === "services" ? "desktop-open show" : ""}`}
                  >
                    <ul className="services-categories list-unstyled mb-0">
                      {serviceGroups.map((item) => (
                        <li key={item.label}>
                          <NavLink className="services-item-link" to={item.to} onClick={closeAll}>
                            {item.label}
                          </NavLink>
                        </li>
                      ))}
                    </ul>
                  </div>
                </li>

                <li className="nav-item">
                  <NavLink className="nav-link" to="/modular-journey" onClick={closeAll}>
                    Modular Journey
                  </NavLink>
                </li>
                <li className="nav-item">
                  <NavLink className="nav-link" to="/our-work" onClick={closeAll}>
                    Our Work
                  </NavLink>
                </li>
                <li className="nav-item">
                  <NavLink className="nav-link" to="/projects" onClick={closeAll}>
                    Projects
                  </NavLink>
                </li>

                <li
                  className="nav-item dropdown more-dropdown"
                  onMouseEnter={() => enterDesktop("more")}
                  onMouseLeave={leaveDesktop}
                >
                  <button
                    type="button"
                    className={`nav-link dropdown-toggle border-0 bg-transparent ${
                      isActive("/testimonials") || isActive("/contact") ? "active" : ""
                    }`}
                    onClick={toggleMore}
                    aria-expanded={moreOpen}
                  >
                    <span className="d-inline-flex align-items-center gap-1">
                      More
                      <FaChevronDown className="nav-caret" />
                    </span>
                  </button>
                  <ul
                    className={`dropdown-menu ${
                      moreOpen && !isDesktop ? "show d-block position-static mt-2" : ""
                    } ${isDesktop && desktopDropdown === "more" ? "desktop-open show" : ""}`}
                  >
                    <li>
                      <NavLink className="dropdown-item" to="/testimonials" onClick={closeAll}>
                        Testimonials
                      </NavLink>
                    </li>
                    <li>
                      <NavLink className="dropdown-item" to="/contact" onClick={closeAll}>
                        Contact
                      </NavLink>
                    </li>
                  </ul>
                </li>
              </ul>

              <div className="navbar-cta mt-3 mt-lg-0 ms-lg-3">
                <Link className="btn btn-brand w-100 w-lg-auto" to="/contact" onClick={closeAll}>
                  Book Consultation
                </Link>
                {companyError && (
                  <p className="text-warning small mt-2 mb-0">
                    ⚠️ Some content may be outdated. Please try again later.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </nav>
    </header>
  );
}
