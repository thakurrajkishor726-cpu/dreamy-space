import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { FiMail, FiPhone } from "react-icons/fi";
import { FaWhatsapp } from "react-icons/fa";
import PageHeader from "../components/PageHeader";
import { contactImage, innerBanner } from "../data/banners";
import { api, ApiError } from "../lib/apiClient";
import { COMPANY, mailHref, telHrefFor, whatsappHref } from "../data/company";
import LocationMap from "../components/LocationMap";
import { useCategories } from "../lib/useCategories";

const EMPTY_FORM = { name: "", email: "", phone: "", service: "", message: "" };

export default function Contact() {
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [successMessage, setSuccessMessage] = useState("");
  const [failureMessage, setFailureMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { categories } = useCategories();

  const infoCards = useMemo(
    () => [
      ...COMPANY.phones.map((entry, index) => ({
        key: `phone-${entry.digits}`,
        label: index === 0 ? "Call" : "Call (alternate)",
        val: entry.display,
        href: telHrefFor(entry),
        Icon: FiPhone,
      })),
      { key: "email", label: "Email", val: COMPANY.email, href: mailHref, Icon: FiMail },
      {
        key: "whatsapp",
        label: "WhatsApp",
        val: COMPANY.phones.find((entry) => entry.whatsapp)?.display,
        href: whatsappHref,
        Icon: FaWhatsapp,
        external: true,
      },
    ],
    [],
  );

  const validate = () => {
    const next = {};
    if (!form.name.trim()) next.name = "Please enter your full name.";
    if (!form.email.trim()) next.email = "Email is required.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      next.email = "Enter a valid email address.";
    if (!form.phone.trim()) next.phone = "Phone number is required.";
    else if (form.phone.length !== 10) next.phone = "Phone number must be exactly 10 digits.";
    if (!form.message.trim()) next.message = "Tell us about your project.";
    return next;
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    if (name === "phone") {
      const digits = value.replace(/\D/g, "");
      if (digits.length > 10) return;
      setForm((current) => ({ ...current, phone: digits }));
    } else {
      setForm((current) => ({ ...current, [name]: value }));
    }

    if (errors[name]) {
      setErrors((current) => {
        const next = { ...current };
        delete next[name];
        return next;
      });
    }
    if (successMessage) setSuccessMessage("");
    if (failureMessage) setFailureMessage("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (submitting) return;
    setSuccessMessage("");
    setFailureMessage("");

    const validation = validate();
    setErrors(validation);
    if (Object.keys(validation).length > 0) return;

    setSubmitting(true);
    try {
      const data = await api.submitLead({
        name: form.name,
        email: form.email,
        phone: form.phone,
        service: form.service,
        message: form.message,
      });
      setSuccessMessage(data?.message || "Thanks for reaching out. We will get back to you shortly.");
      setForm(EMPTY_FORM);
    } catch (error) {
      console.error("Enquiry failed:", error);
      setFailureMessage(
        error instanceof ApiError && error.status === 0
          ? "We could not reach the server. Please call or WhatsApp us instead."
          : "Something went wrong. Please try again, or call us directly.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-brand-light">
      <PageHeader
        title="Let's talk about"
        accent="your rooms"
        subtitle="Contact"
        description="Tell us the rooms, a rough budget and when you would like it done. You get a plan and a price back, not a sales call."
        image={innerBanner}
      />

      <section className="section-padding">
        <div className="container">
          <div className="row g-4 g-xl-5 align-items-stretch">
            <div className="col-lg-5">
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.7, ease: "easeOut" }}
                className="h-100 d-flex flex-column gap-4"
              >
                <div className="contact-figure flex-grow-1">
                  <img src={contactImage} alt="" aria-hidden="true" loading="lazy" />
                </div>

                <div className="row g-3">
                  {infoCards.map(({ key, label, val, href, Icon, external }) => (
                    <div className="col-12 col-sm-6" key={key}>
                      <a
                        className="contact-info-item"
                        href={href}
                        target={external ? "_blank" : undefined}
                        rel="noreferrer"
                      >
                        <span className="icon-box" aria-hidden="true">
                          <Icon />
                        </span>
                        <span>
                          <h2 className="info-heading">{label}</h2>
                          <span className="info-subheading">{val}</span>
                        </span>
                      </a>
                    </div>
                  ))}
                </div>
              </motion.div>
            </div>

            <div className="col-lg-7">
              <motion.div
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.7, ease: "easeOut", delay: 0.08 }}
              >
                <span className="ds-eyebrow mb-3 d-inline-flex">Send an enquiry</span>
                <h2 className="contact-head">
                  Start with the <em>room</em>, not the budget
                </h2>
                <p className="ds-lead mb-4">
                  The more you tell us about how the space gets used, the more useful the first
                  drawing will be.
                </p>

                <form
                  className="row g-3 contact-form"
                  onSubmit={handleSubmit}
                  noValidate
                  aria-label="Contact form"
                >
                  <div className="col-md-6">
                    <label className="form-label" htmlFor="cf-name">
                      Name
                    </label>
                    <input
                      id="cf-name"
                      type="text"
                      className={`form-control ${errors.name ? "is-invalid" : ""}`}
                      placeholder="Full name"
                      name="name"
                      value={form.name}
                      onChange={handleChange}
                      aria-invalid={!!errors.name}
                    />
                    {errors.name && <div className="invalid-feedback d-block small">{errors.name}</div>}
                  </div>

                  {/* Honeypot: bots fill it, people never see it. */}
                  <input
                    type="text"
                    name="company"
                    tabIndex="-1"
                    autoComplete="off"
                    style={{ display: "none" }}
                    aria-hidden="true"
                  />

                  <div className="col-md-6">
                    <label className="form-label" htmlFor="cf-email">
                      Email
                    </label>
                    <input
                      id="cf-email"
                      type="email"
                      className={`form-control ${errors.email ? "is-invalid" : ""}`}
                      placeholder="email@address.com"
                      name="email"
                      value={form.email}
                      onChange={handleChange}
                      aria-invalid={!!errors.email}
                    />
                    {errors.email && (
                      <div className="invalid-feedback d-block small">{errors.email}</div>
                    )}
                  </div>

                  <div className="col-md-6">
                    <label className="form-label" htmlFor="cf-phone">
                      Phone number
                    </label>
                    <input
                      id="cf-phone"
                      type="tel"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={10}
                      className={`form-control ${errors.phone ? "is-invalid" : ""}`}
                      placeholder="10-digit mobile number"
                      name="phone"
                      value={form.phone}
                      onChange={handleChange}
                      aria-invalid={!!errors.phone}
                    />
                    {errors.phone && (
                      <div className="invalid-feedback d-block small">{errors.phone}</div>
                    )}
                  </div>

                  <div className="col-md-6">
                    <label className="form-label" htmlFor="cf-service">
                      What do you need?
                    </label>
                    <select
                      id="cf-service"
                      className="form-select"
                      name="service"
                      value={form.service}
                      onChange={handleChange}
                    >
                      <option value="">Select an option</option>
                      {categories.map((category) => (
                        <option value={category.name} key={category.id}>
                          {category.name}
                        </option>
                      ))}
                      <option value="Full home interiors">Full home interiors</option>
                      <option value="Office fit-out">Office fit-out</option>
                      <option value="Something else">Something else</option>
                    </select>
                  </div>

                  <div className="col-12">
                    <label className="form-label" htmlFor="cf-message">
                      About the project
                    </label>
                    <textarea
                      id="cf-message"
                      rows={5}
                      className={`form-control ${errors.message ? "is-invalid" : ""}`}
                      placeholder="Which rooms, roughly what size, and when you would like it finished."
                      name="message"
                      value={form.message}
                      onChange={handleChange}
                      aria-invalid={!!errors.message}
                    />
                    {errors.message && (
                      <div className="invalid-feedback d-block small">{errors.message}</div>
                    )}
                  </div>

                  <div className="col-12 d-flex flex-wrap gap-3 align-items-center">
                    <button type="submit" className="btn-clay" disabled={submitting} aria-busy={submitting}>
                      {submitting ? "Sending…" : "Send enquiry"}
                    </button>
                    <a className="btn-ghost" href={whatsappHref} target="_blank" rel="noreferrer">
                      <FaWhatsapp aria-hidden="true" />
                      WhatsApp us
                    </a>
                  </div>

                  {successMessage && (
                    <div className="col-12">
                      <div className="alert alert-success rounded-3 mb-0 py-2 px-3 small" role="status">
                        {successMessage}
                      </div>
                    </div>
                  )}
                  {failureMessage && (
                    <div className="col-12">
                      <div className="alert alert-danger rounded-3 mb-0 py-2 px-3 small" role="status">
                        {failureMessage}
                      </div>
                    </div>
                  )}
                </form>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      <section className="section-padding pt-0">
        <div className="container">
          <header className="ds-head">
            <span className="ds-eyebrow">Find us</span>
            <h2 className="ds-title">Where the workshop is</h2>
          </header>
          <LocationMap />
        </div>
      </section>
    </div>
  );
}
