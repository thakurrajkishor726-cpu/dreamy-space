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
 * These used to read the API of the site this project was rebuilt from, which
 * meant the page showed another studio's staff photos under "Our Dedicated
 * Team" and their clients' words as testimonials. That is somebody else's
 * data and somebody else's people, so the feed is disconnected.
 *
 * Both pages already render a clean empty state. Add `team` and
 * `testimonials` tables to the Turso schema when you want your own.
 */
export async function loadTeam() {
  return { team: [], error: null };
}

export async function loadTestimonials() {
  // Placeholder copy, see src/data/testimonials.js. Swap for a real table
  // before launch.
  return { testimonials: TESTIMONIALS, error: null };
}
