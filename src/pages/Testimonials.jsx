import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import PageHeader from "../components/PageHeader";
import { innerBanner } from "../data/banners";
import { loadTestimonials } from "../lib/publicCatalogue";
import { cloudinaryUrl } from "../lib/cloudinary";

export default function Testimonials() {
  const [testimonials, setTestimonials] = useState(null);
  const [error, setError] = useState(null);
  const [status, setStatus] = useState("idle");
  const fetchedRef = useRef(false);

  useEffect(() => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;
    setStatus("loading");
    loadTestimonials().then((result) => {
      setTestimonials(result.testimonials);
      if (result.error) {
        console.error("Testimonials error:", result.error);
        setError("Unable to load testimonials");
      }
      setStatus("success");
    });
  }, []);

  return (
    <div className="bg-brand-light">
      <PageHeader
        title="Client"
        accent="Stories"
        subtitle="Testimonials"
        description="What people say once they have lived with the work for a while."
        image={innerBanner}
      />

      <section className="section-padding">
        <div className="container">
          {error && (
            <p className="text-warning small mb-3">
              ⚠️ Some content may be outdated. Please try again later.
            </p>
          )}
          {status === "loading" && (
            <p className="text-brand-muted small mb-3">Loading testimonials...</p>
          )}

          <div className="row g-4">
            {(testimonials || []).map((item, index) => (
              <div className="col-12 col-md-6 col-xl-4" key={`${item.name}-${index}`}>
                <motion.figure
                  initial={{ opacity: 0, y: 26 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.3 }}
                  transition={{ duration: 0.65, delay: (index % 3) * 0.08 }}
                  className="quote-card mb-0"
                >
                  <div
                    className="quote-card__stars"
                    aria-label={`${Math.max(1, Math.min(5, item.rating || 5))} out of 5`}
                  >
                    {"★".repeat(Math.max(1, Math.min(5, item.rating || 5)))}
                  </div>

                  <blockquote className="quote-card__body">{item.content}</blockquote>

                  <figcaption className="quote-card__who">
                    <span className="quote-card__avatar">
                      {item.avatar && item.avatar.trim() !== "" ? (
                        <img
                          src={cloudinaryUrl(item.avatar, { width: 128, height: 128 })}
                          className="cover-image"
                          alt=""
                          loading="lazy"
                        />
                      ) : (
                        <span aria-hidden="true">{item.name?.slice(0, 1) || "?"}</span>
                      )}
                    </span>
                    <span>
                      <h2 className="quote-card__name">{item.name}</h2>
                      <span className="quote-card__role">{item.role}</span>
                    </span>
                  </figcaption>
                </motion.figure>
              </div>
            ))}
          </div>

          {status !== "loading" && (testimonials?.length ?? 0) === 0 && (
            <p className="text-brand-muted text-center mb-0">No testimonials available.</p>
          )}
        </div>
      </section>
    </div>
  );
}
