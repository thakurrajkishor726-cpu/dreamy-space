/**
 * Client for the FastAPI catalogue service.
 *
 * The session token lives in localStorage. That is readable by any script on
 * the origin, which is the accepted trade for a static SPA with no cookie
 * backend — the mitigation is a short token TTL and the fact that the API
 * re-checks `is_admin` against the users table on every request, so a stolen
 * token stops working the moment the account is demoted.
 */

import { clearCatalogueCache } from "./catalogueCache";

const BASE = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/$/, "");
const TOKEN_KEY = "cnc:token";

export const apiUrl = (path) => `${BASE}${path}`;

/* ------------------------------------------------------------------ */
/* Token storage                                                       */
/* ------------------------------------------------------------------ */

export function getToken() {
  try {
    return window.localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setToken(token) {
  try {
    if (token) window.localStorage.setItem(TOKEN_KEY, token);
    else window.localStorage.removeItem(TOKEN_KEY);
  } catch {
    /* private mode — the session just won't survive a reload */
  }
}

/* ------------------------------------------------------------------ */
/* Request                                                             */
/* ------------------------------------------------------------------ */

export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

export async function request(path, { method = "GET", body, auth = false } = {}) {
  const headers = {};
  if (body !== undefined) headers["Content-Type"] = "application/json";

  if (auth) {
    const token = getToken();
    if (!token) throw new ApiError("You need to sign in first.", 401);
    headers.Authorization = `Bearer ${token}`;
  }

  let response;
  try {
    response = await fetch(apiUrl(path), {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new ApiError("Could not reach the API. Is it running?", 0);
  }

  // Any successful write invalidates what the public pages have cached.
  if (method !== "GET" && response.ok) clearCatalogueCache();

  if (response.status === 204) return null;

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    // FastAPI validation errors arrive as a list of {loc, msg}.
    const detail = payload?.detail;
    const message = Array.isArray(detail)
      ? detail.map((item) => item.msg).join("; ")
      : detail || `Request failed (${response.status})`;
    throw new ApiError(message, response.status);
  }

  return payload;
}

const get = (path) => request(path);
const authed = (path, method, body) => request(path, { method, body, auth: true });

/* ------------------------------------------------------------------ */
/* Endpoints                                                           */
/* ------------------------------------------------------------------ */

export const api = {
  login: (email, password) => request("/api/auth/login", { method: "POST", body: { email, password } }),
  me: () => request("/api/auth/me", { auth: true }),

  listCategories: () => get("/api/categories"),
  createCategory: (name) => authed("/api/categories", "POST", { name }),
  updateCategory: (id, name) => authed(`/api/categories/${id}`, "PATCH", { name }),
  deleteCategory: (id) => authed(`/api/categories/${id}`, "DELETE"),

  listProjects: (categoryId) =>
    get(categoryId ? `/api/projects?category_id=${categoryId}` : "/api/projects"),
  getProject: (id) => get(`/api/projects/${id}`),
  createProject: (payload) => authed("/api/projects", "POST", payload),
  updateProject: (id, payload) => authed(`/api/projects/${id}`, "PUT", payload),
  deleteProject: (id) => authed(`/api/projects/${id}`, "DELETE"),

  signUpload: (folder) => authed("/api/sign-upload", "POST", { folder }),
};
