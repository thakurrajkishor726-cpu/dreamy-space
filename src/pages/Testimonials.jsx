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
        title="Client Stories"
        image={innerBanner}
        imagePosition="center center"
        overlay
        showSubtitle={false}
        showDescription={false}
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
              <div className="col-12 col-lg-6" key={`${item.name}-${index}`}>
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.4 }}
                  transition={{ duration: 0.8, delay: (index % 2) * 0.1 }}
                  className="card h-100 border-0 shadow-soft position-relative"
                >
                  <div className="card-body testimonial-body">
                    <div className="mb-3 text-warning">
                      {"★".repeat(Math.max(1, Math.min(5, item.rating || 5)))}
                    </div>
                    <p className="mb-4">“{item.content}”</p>
                    <div className="d-flex align-items-center gap-3 pt-3 border-top muted-border">
                      <div className="rounded-circle overflow-hidden avatar-64 bg-brand-mid d-flex align-items-center justify-content-center text-brand fw-semibold">
                        {item.avatar && item.avatar.trim() !== "" ? (
                          <img
                            src={cloudinaryUrl(item.avatar, { width: 128, height: 128 })}
                            className="cover-image"
                            alt={item.name}
                            loading="lazy"
                          />
                        ) : (
                          <span aria-hidden="true">{item.name?.slice(0, 1) || "?"}</span>
                        )}
                      </div>
                      <div>
                        <h6 className="mb-0 text-brand">{item.name}</h6>
                        <small className="text-uppercase text-brand-muted">{item.role}</small>
                      </div>
                    </div>
                  </div>
                </motion.div>
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
