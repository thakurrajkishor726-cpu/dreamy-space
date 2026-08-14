const API_BASE = "https://api.creativenconcepts.com";

export async function apiGet(path) {
  try {
    const res = await fetch(`${API_BASE}${path}`, { headers: { Accept: "application/json" } });
    if (!res.ok) throw new Error(`API error: ${res.status}`);
    const json = await res.json();
    if (!json || json.success === false) throw new Error("Invalid API response");
    return { data: json.data, error: null };
  } catch (err) {
    return { data: null, error: err.message };
  }
}

export async function apiPost(path, payload) {
  try {
    const res = await fetch(`${API_BASE}${path}`, {
      method: "POST",
      headers: { Accept: "application/json", "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (res.status === 422) {
      const json = await res.json();
      return { data: null, error: "Validation error", errors: json?.errors || {} };
    }
    if (!res.ok) throw new Error(`API error: ${res.status}`);
    const json = await res.json();
    if (!json || json.success === false) throw new Error("Invalid API response");
    return { data: json.data, error: null, errors: null };
  } catch (err) {
    return { data: null, error: err.message, errors: null };
  }
}
