import { useEffect, useState } from "react";
import { api } from "./apiClient";
import { readCache, writeCache } from "./catalogueCache";
import { CATEGORY_IMAGES } from "../data/categoryImages";

/**
 * Categories and their showcase images, shared by every component that needs
 * them (nav menu, footer, marquee, home grid, Our Work, contact form).
 *
 * Three layers, best first:
 *
 *   1. The API, which is the truth and the only source that knows
 *      show_in_dashboard.
 *   2. The localStorage cache, so a repeat visitor renders correct flags with
 *      no request and an API outage is invisible.
 *   3. The build-time manifest of public/images/categories, so a first-ever
 *      visit with the API down still shows the work instead of a blank grid.
 *
 * One request serves every mounted consumer: the in-flight promise is shared,
 * and the result is broadcast so the nav and the home grid never disagree.
 */

const CACHE_KEY = "categories";

/** Manifest fallback. It predates the flag, so nothing is hidden. */
const fromManifest = () =>
  CATEGORY_IMAGES.map((category, index) => ({
    id: `manifest-${index}`,
    name: category.name,
    images: category.images,
    showInDashboard: true,
  }));

const normalise = (rows) =>
  rows.map((row) => ({
    id: row.id,
    name: row.name,
    images: (row.images || []).map((image) => image.image_url),
    showInDashboard: row.show_in_dashboard !== false,
    projectCount: row.project_count || 0,
  }));

let inflight = null;
const listeners = new Set();
let snapshot = null;

function publish(next) {
  snapshot = next;
  listeners.forEach((listener) => listener(next));
}

/**
 * The shared, de-duplicated category fetch. Exported so non-component callers
 * (publicCatalogue) reuse the same request instead of firing their own —
 * three overlapping calls on a cold load was most of the delay before the
 * home grid could paint.
 */
export function loadCategoriesOnce() {
  return snapshot ? Promise.resolve(snapshot) : load();
}

function load() {
  if (inflight) return inflight;

  inflight = api
    .listCategories()
    .then((rows) => {
      // An empty table means the seed has not been run. Falling through to
      // the manifest is better than an empty site, but it is not "live", so
      // it stays flagged as such.
      const categories = normalise(rows);
      const next = categories.length
        ? { categories, source: "api" }
        : { categories: fromManifest(), source: "manifest" };
      if (categories.length) writeCache(CACHE_KEY, categories);
      publish(next);
      return next;
    })
    .catch((error) => {
      console.error("Category load failed:", error);
      const cached = readCache(CACHE_KEY);
      const next = cached
        ? { categories: cached, source: "cache" }
        : { categories: fromManifest(), source: "manifest" };
      publish(next);
      return next;
    })
    .finally(() => {
      inflight = null;
    });

  return inflight;
}

export function useCategories() {
  const [state, setState] = useState(
    () => snapshot || { categories: readCache(CACHE_KEY) || fromManifest(), source: "seed" },
  );

  useEffect(() => {
    listeners.add(setState);
    if (snapshot) setState(snapshot);
    else load();
    return () => listeners.delete(setState);
  }, []);

  return {
    categories: state.categories,
    source: state.source,
    // True once we have something better than the first synchronous guess, so
    // a consumer that filters on showInDashboard can wait rather than flash a
    // category the owner has hidden.
    settled: state.source !== "seed",
  };
}

/** Drop the shared snapshot so the next mount refetches (used after admin saves). */
export function invalidateCategories() {
  snapshot = null;
  inflight = null;
}
