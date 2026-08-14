/**
 * Short-lived localStorage cache for the public catalogue.
 *
 * The catalogue changes rarely and every page view would otherwise re-fetch
 * it, so this keeps navigation snappy and takes load off the API. Any admin
 * write clears it, so an editor sees their change immediately rather than
 * waiting out the TTL and assuming the save failed.
 *
 * Everything here is best-effort — Safari private mode and full quotas both
 * throw on setItem, and a cache miss is only ever a performance question.
 */

// Bump when the cached shape changes, so stale entries are ignored rather
// than deserialised into something the UI doesn't understand.
const VERSION = "v1";
const PREFIX = `cnc:catalogue:${VERSION}:`;
const DEFAULT_TTL_MS = 10 * 60 * 1000;

const storage = () => {
  try {
    return typeof window !== "undefined" ? window.localStorage : null;
  } catch {
    return null; // access itself can throw when cookies are blocked
  }
};

export function readCache(key, { ttlMs = DEFAULT_TTL_MS } = {}) {
  const store = storage();
  if (!store) return null;

  try {
    const raw = store.getItem(PREFIX + key);
    if (!raw) return null;

    const { at, payload } = JSON.parse(raw);
    if (!at || Date.now() - at > ttlMs) {
      store.removeItem(PREFIX + key);
      return null;
    }
    return payload;
  } catch {
    return null;
  }
}

export function writeCache(key, payload) {
  const store = storage();
  if (!store) return;

  try {
    store.setItem(PREFIX + key, JSON.stringify({ at: Date.now(), payload }));
  } catch {
    // Quota exceeded or private mode. Drop our own entries and give up
    // quietly rather than breaking the page over a cache write.
    try {
      clearCatalogueCache();
    } catch {
      /* nothing else to try */
    }
  }
}

/**
 * Drop every cached entry. Called after an admin write so the editor sees
 * their change on the public site immediately instead of waiting out the TTL
 * and assuming the save failed.
 */
export function clearCatalogueCache() {
  const store = storage();
  if (!store) return;

  try {
    const stale = [];
    for (let i = 0; i < store.length; i += 1) {
      const key = store.key(i);
      // Match on the un-versioned prefix so a version bump also clears
      // entries written by older builds.
      if (key && key.startsWith("cnc:catalogue:")) stale.push(key);
    }
    stale.forEach((key) => store.removeItem(key));
  } catch {
    /* best effort */
  }
}
