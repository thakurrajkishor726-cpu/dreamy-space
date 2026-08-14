import { api } from "./apiClient";

const FOLDER = import.meta.env.VITE_CLOUDINARY_FOLDER || "dreamyspaces";

/**
 * Uploads are always signed by the API — the Cloudinary secret never exists in
 * this bundle, and an unauthenticated upload is impossible rather than merely
 * useless. There is no unsigned-preset fallback any more.
 */
export async function uploadImage(file, { onProgress, folder = FOLDER } = {}) {
  const signed = await api.signUpload(folder);

  const body = new FormData();
  body.append("file", file);
  // These must match exactly what the server signed — adding or omitting any
  // signed parameter invalidates the signature.
  body.append("api_key", signed.apiKey);
  body.append("timestamp", signed.timestamp);
  body.append("folder", signed.folder);
  body.append("signature", signed.signature);

  return new Promise((resolve, reject) => {
    const request = new XMLHttpRequest();
    request.open("POST", `https://api.cloudinary.com/v1_1/${signed.cloudName}/image/upload`);

    request.upload.onprogress = (event) => {
      if (event.lengthComputable && onProgress) {
        onProgress(Math.round((event.loaded / event.total) * 100));
      }
    };

    request.onload = () => {
      let payload;
      try {
        payload = JSON.parse(request.responseText);
      } catch {
        reject(new Error("Cloudinary returned an unreadable response."));
        return;
      }
      if (request.status < 200 || request.status >= 300) {
        reject(new Error(payload?.error?.message || `Upload failed (${request.status})`));
        return;
      }
      resolve({
        url: payload.secure_url,
        publicId: payload.public_id,
        width: payload.width,
        height: payload.height,
        bytes: payload.bytes,
      });
    };

    request.onerror = () => reject(new Error("Network error while uploading to Cloudinary."));
    request.send(body);
  });
}

/**
 * Rewrite a Cloudinary delivery URL to add transformations. `f_auto,q_auto`
 * makes Cloudinary pick WebP/AVIF and a sensible quality per browser, which is
 * where most of the bandwidth saving comes from.
 *
 * Non-Cloudinary URLs (the bundled category images under /images/categories)
 * pass through untouched.
 */
export function cloudinaryUrl(url, { width, height, crop = "fill", quality = "auto" } = {}) {
  if (!url || !url.includes("/upload/")) return url;

  const parts = ["f_auto", `q_${quality}`];
  if (width) parts.push(`w_${width}`);
  if (height) parts.push(`h_${height}`);
  if (width || height) parts.push(`c_${crop}`);

  return url.replace("/upload/", `/upload/${parts.join(",")}/`);
}

/** Build a srcset across common breakpoints for responsive delivery. */
export function cloudinarySrcSet(url, widths = [480, 800, 1200, 1600]) {
  if (!url || !url.includes("/upload/")) return undefined;
  return widths.map((w) => `${cloudinaryUrl(url, { width: w })} ${w}w`).join(", ");
}
