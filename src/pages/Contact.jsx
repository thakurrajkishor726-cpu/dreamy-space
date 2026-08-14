import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { FiMail, FiMapPin, FiPhone } from "react-icons/fi";
import PageHeader from "../components/PageHeader";
import { contactImage, innerBanner } from "../data/banners";
import { apiPost } from "../lib/api";
import { COMPANY, addressText } from "../data/company";


const EMPTY_FORM = { name: "", email: "", phone: "", service: "", message: "" };

const slideLeft = {
  hidden: { opacity: 0, x: -80 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.9, ease: "easeOut" } },
};
const slideRight = {
  hidden: { opacity: 0, x: 80 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.9, ease: "easeOut", delay: 0.08 } },
};
const riseUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 1, ease: "easeOut", delay: 0.35 } },
};

export default function Contact() {
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [successMessage, setSuccessMessage] = useState("");
  const [failureMessage, setFailureMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const infoCards = useMemo(
    () => [
      { key: "location", label: "Our Studio", val: addressText, href: COMPANY.mapsUrl, Icon: FiMapPin },
      { key: "email", label: "Email Us", val: COMPANY.email, href: `mailto:${COMPANY.email}`, Icon: FiMail },
      { key: "phone", label: "Call Us", val: COMPANY.phone, href: `tel:+${COMPANY.phoneDigits}`, Icon: FiPhone },
    ],
    [],
  );

  const asText = (value) => (Array.isArray(value) ? value.join(" ") : value);

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
    const { data, error, errors: apiErrors } = await apiPost("/api/v1/contact-us", {
      name: form.name,
      email: form.email,
      phone: form.phone,
      service: form.service,
      message: form.message,
    });
    setSubmitting(false);

    if (apiErrors && Object.keys(apiErrors).length) {
      setErrors(apiErrors);
      return;
    }
    if (error) {
      console.error("Lead submission error:", error);
      setFailureMessage("Something went wrong. Please try again later.");
      return;
    }

    setSuccessMessage(data?.message || "Thanks for reaching out. We’ll get back to you shortly.");
    setForm(EMPTY_FORM);
  };

  return (
    <div className="bg-white">
      <PageHeader
        title="Contact Us"
        image={innerBanner}
        imagePosition="center center"
        overlay
        showSubtitle={false}
        showDescription={false}
      />

      <section className="section-padding">
        <div className="container">
          <div className="row g-4 align-items-stretch">
            <div className="col-lg-6">
              <motion.div
                variants={slideLeft}
                initial="hidden"
                animate="visible"
                className="h-100 overflow-hidden pe-5"
                aria-hidden="true"
              >
                <img
                  src={contactImage}
                  alt="Contact us"
                  className="w-100 h-100"
                  loading="lazy"
                  style={{ objectFit: "cover", display: "block" }}
                />
              </motion.div>
            </div>

            <div className="col-lg-6 d-flex flex-column j-c-xl">
              <motion.div
                variants={slideRight}
                initial="hidden"
                animate="visible"
                className="mb-2 section-title"
              >
                <h2 className="contact-head">
                  Designing <span className="fst-italic text-brand-muted">Your Future</span> Starts
                  Here.
                </h2>
                <p className="text-brand-muted mb-0">
                  Tell us the rooms, the rough budget and when you would like it done. We will come
                  back with a plan and a price, not a sales call.
                </p>
              </motion.div>

              <motion.div
                variants={slideRight}
                initial="hidden"
                animate="visible"
                transition={{ delay: 0.12 }}
                className="card border-0"
              >
                <div className="card-body h-100 d-flex flex-column p-0">
                  <form
                    className="row g-3 mt-auto contact-form"
                    onSubmit={handleSubmit}
                    noValidate
                    aria-label="Contact form"
                  >
                    <div className="col-md-6">
                      <label className="form-label small text-uppercase fw-semibold text-brand-muted">
                        Name
                      </label>
                      <input
                        type="text"
                        className={`form-control ${errors.name ? "is-invalid" : ""}`}
                        placeholder="Full Name"
                        name="name"
                        value={form.name}
                        onChange={handleChange}
                        aria-invalid={!!errors.name}
                      />
                      {errors.name && (
                        <div className="invalid-feedback d-block small">{asText(errors.name)}</div>
                      )}
                    </div>

                    <input
                      type="text"
                      name="company"
                      tabIndex="-1"
                      autoComplete="off"
                      style={{ display: "none" }}
                    />

                    <div className="col-md-6">
                      <label className="form-label small text-uppercase fw-semibold text-brand-muted">
                        Email
                      </label>
                      <input
                        type="email"
                        className={`form-control ${errors.email ? "is-invalid" : ""}`}
                        placeholder="email@address.com"
                        name="email"
                        value={form.email}
                        onChange={handleChange}
                        aria-invalid={!!errors.email}
                      />
                      {errors.email && (
                        <div className="invalid-feedback d-block small">{asText(errors.email)}</div>
                      )}
                    </div>

                    <div className="col-md-6">
                      <label className="form-label small text-uppercase fw-semibold text-brand-muted">
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        maxLength={10}
                        className={`form-control ${errors.phone ? "is-invalid" : ""}`}
                        placeholder="Enter 10-digit mobile number"
                        name="phone"
                        value={form.phone}
                        onChange={handleChange}
                        aria-invalid={!!errors.phone}
                      />
                      {errors.phone && (
                        <div className="invalid-feedback d-block small">{asText(errors.phone)}</div>
                      )}
                    </div>

                    <div className="col-md-6">
                      <label className="form-label small text-uppercase fw-semibold text-brand-muted">
                        Service Required
                      </label>
                      <select
                        className={`form-select ${errors.service ? "is-invalid" : ""}`}
                        name="service"
                        value={form.service}
                        onChange={handleChange}
                        aria-invalid={!!errors.service}
                      >
                        <option value="">Select a service</option>
                        <option value="Residential Interior">Residential Interior</option>
                        <option value="Commercial Space">Commercial Space</option>
                        <option value="Retails Project ">Retails Project</option>
                      </select>
                      {errors.service && (
                        <div className="invalid-feedback d-block small">
                          {asText(errors.service)}
                        </div>
                      )}
                    </div>

                    <div className="col-12">
                      <label className="form-label small text-uppercase fw-semibold text-brand-muted">
                        Project Message
                      </label>
                      <textarea
                        rows={4}
                        className={`form-control ${errors.message ? "is-invalid" : ""}`}
                        placeholder="Tell us about your space..."
                        name="message"
                        value={form.message}
                        onChange={handleChange}
                        aria-invalid={!!errors.message}
                      />
                      {errors.message && (
                        <div className="invalid-feedback d-block small">
                          {asText(errors.message)}
                        </div>
                      )}
                    </div>

                    <div className="col-12">
                      <button
                        type="submit"
                        className="btn btn-brand w-100 py-3 text-uppercase"
                        disabled={submitting}
                        aria-busy={submitting}
                      >
                        Submit Request
                      </button>
                      {successMessage && (
                        <div
                          className="alert alert-success rounded-3 mt-3 mb-0 py-2 px-3 small"
                          role="status"
                        >
                          {successMessage}
                        </div>
                      )}
                      {failureMessage && (
                        <div
                          className="alert alert-danger rounded-3 mt-3 mb-0 py-2 px-3 small"
                          role="status"
                        >
                          {failureMessage}
                        </div>
                      )}
                    </div>
                  </form>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      <motion.div
        className="section-padding pt-0"
        variants={riseUp}
        initial="hidden"
        animate="visible"
      >
        <div className="container">
          <div className="row g-3">
            {infoCards.map(({ key, label, val, href, Icon }) => (
              <div className="col-12 col-md-6 col-lg-4 custom-apply" key={key}>
                <div className="px-1 p-xl-4 h-100 contact-info-item d-flex align-items-start gap-3">
                  <div className="text-brand icon-box" aria-hidden="true">
                    <Icon />
                  </div>
                  <div>
                    <h6 className="info-heading mb-1">{label}</h6>
                    <p className="info-subheading mb-0">{val}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
