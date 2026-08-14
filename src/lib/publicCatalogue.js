import { api } from "./apiClient";
import { readCache, writeCache } from "./catalogueCache";
import { loadCategoriesOnce } from "./useCategories";
import { TESTIMONIALS } from "../data/testimonials";

/**
 * Read side of the catalogue for the public site.
 *
 * Projects come from the FastAPI/Turso service. Team and testimonials have no
 * table yet, so those return empty until you add one.
 *
 * Reads go through a short cache mainly to keep navigation snappy. Turso's
 * free tier is 1B reads/month, so quota isn't the driver here.
 */

/** Flatten the nested project -> categories -> images shape into cards. */
const normalise = (projects) =>
  projects.map((project) => {
    const blocks = project.categories || [];
    return {
      id: project.id,
      title: project.name,
      location: project.location || "",
      categories: blocks.map((block) => block.category_name),
      // Every image across every category, tagged with which category it came
      // from so the lightbox can label it.
      images: blocks.flatMap((block) =>
        (block.images || []).map((image) => ({
          url: image.image_url,
          category: block.category_name,
        })),
      ),
    };
  });

export async function loadPublicProjects() {
  const cached = readCache("projects");
  if (cached) return cached;

  try {
    // Categories come from the shared loader so this does not fire a second
    // /api/categories request alongside the one the nav and home grid share.
    const [projects, shared] = await Promise.all([api.listProjects(), loadCategoriesOnce()]);
    const result = {
      projects: normalise(projects),
      categories: shared.categories.map((category) => category.name),
      error: null,
    };
    if (result.projects.length) writeCache("projects", result);
    return result;
  } catch (error) {
    console.error("Catalogue read failed:", error);
    return { projects: [], categories: [], error: error.message };
  }
}

/* ------------------------------------------------------------------ */
/* Team & testimonials                                                 */
/* ------------------------------------------------------------------ */

/**
 * Team has no table yet, so this stays empty rather than showing the staff
 * photos of the studio this project was rebuilt from.
 */
export async function loadTeam() {
  return { team: [], error: null };
}

/**
 * Testimonials come from the database and are managed in the admin.
 *
 * The static list in src/data/testimonials.js is only a fallback for a cold
 * first load with the API unreachable — the table is the source of truth, and
 * seeding it is a one-off (scripts/seed_testimonials.py).
 */
export async function loadTestimonials() {
  const cached = readCache("testimonials");
  if (cached) return cached;

  try {
    const rows = await api.listTestimonials();
    const testimonials = rows.map((row) => ({
      id: row.id,
      name: row.name,
      role: row.designation,
      rating: row.rating,
      content: row.comment,
    }));

    if (testimonials.length) {
      const result = { testimonials, error: null };
      writeCache("testimonials", result);
      return result;
    }
    // Empty table means the seed has not been run; show the fallback rather
    // than an empty page.
    return { testimonials: TESTIMONIALS, error: null };
  } catch (error) {
    console.error("Testimonials read failed:", error);
    return { testimonials: TESTIMONIALS, error: error.message };
  }
}
