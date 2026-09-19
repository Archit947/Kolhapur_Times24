/**
 * Cloudinary upload service.
 *
 * All browser uploads use unsigned upload presets — the API secret is never
 * exposed to the client.  Deletion is routed through a Vercel serverless
 * function (api/cloudinary-delete.js) that holds the secret securely.
 *
 * Required env vars (set in .env.local):
 *   VITE_CLOUDINARY_CLOUD_NAME   – your Cloudinary cloud name
 *   VITE_CLOUDINARY_UPLOAD_PRESET – an unsigned upload preset
 */

const CLOUD_NAME    = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

function assertConfig() {
  if (!CLOUD_NAME || !UPLOAD_PRESET) {
    throw new Error(
      'Cloudinary is not configured. ' +
      'Add VITE_CLOUDINARY_CLOUD_NAME and VITE_CLOUDINARY_UPLOAD_PRESET to .env.local'
    );
  }
}

// ─── Upload ──────────────────────────────────────────────────────────────────

/**
 * Upload an image File to Cloudinary via an unsigned upload preset.
 *
 * @param {File} file
 * @param {{ folder?: string }} [opts]
 * @returns {Promise<{
 *   secure_url: string,
 *   public_id:  string,
 *   width:      number,
 *   height:     number,
 *   format:     string,
 *   bytes:      number
 * }>}
 */
export async function uploadImage(file, { folder = 'news' } = {}) {
  assertConfig();

  const body = new FormData();
  body.append('file',           file);
  body.append('upload_preset',  UPLOAD_PRESET);
  body.append('folder',         folder);

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
    { method: 'POST', body }
  );

  if (!res.ok) {
    const payload = await res.json().catch(() => ({}));
    throw new Error(
      payload.error?.message ?? `Cloudinary upload failed (HTTP ${res.status})`
    );
  }

  const data = await res.json();
  return {
    secure_url: data.secure_url,
    public_id:  data.public_id,
    width:      data.width,
    height:     data.height,
    format:     data.format,
    bytes:      data.bytes,
  };
}

/**
 * Upload a video File to Cloudinary via an unsigned upload preset.
 * Make sure the preset allows video resource types in your Cloudinary dashboard.
 *
 * @param {File} file
 * @param {{ folder?: string }} [opts]
 * @returns {Promise<{ secure_url: string, public_id: string, format: string, bytes: number }>}
 */
export async function uploadVideo(file, { folder = 'news/videos' } = {}) {
  assertConfig();

  const body = new FormData();
  body.append('file',          file);
  body.append('upload_preset', UPLOAD_PRESET);
  body.append('folder',        folder);

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/video/upload`,
    { method: 'POST', body }
  );

  if (!res.ok) {
    const payload = await res.json().catch(() => ({}));
    throw new Error(
      payload.error?.message ?? `Cloudinary video upload failed (HTTP ${res.status})`
    );
  }

  const data = await res.json();
  return {
    secure_url: data.secure_url,
    public_id:  data.public_id,
    format:     data.format,
    bytes:      data.bytes,
  };
}

// ─── Delete (best-effort via server) ─────────────────────────────────────────

/**
 * Request deletion of a Cloudinary asset through the backend serverless
 * function.  This is fire-and-forget — it never throws so a failed delete
 * cannot break the calling UI flow.
 *
 * @param {string} publicId – Cloudinary public_id (e.g. 'news/abc123')
 */
export async function deleteCloudinaryAsset(publicId) {
  if (!publicId) return;
  try {
    await fetch('/api/cloudinary-delete', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ publicId }),
    });
  } catch {
    console.warn('[Cloudinary] Best-effort delete failed for public_id:', publicId);
  }
}

// ─── URL utilities ────────────────────────────────────────────────────────────

/**
 * Inject Cloudinary transformation parameters into a secure_url for optimised
 * delivery (auto format, auto quality, optional resize).
 *
 * Pass the plain secure_url from the database — do NOT pass a URL that already
 * contains transformations, or the transforms will be duplicated.
 *
 * @param {string} url
 * @param {{ width?: number, height?: number }} [opts]
 * @returns {string}
 */
export function getOptimizedUrl(url, { width, height } = {}) {
  if (!url || !url.includes('res.cloudinary.com')) return url;
  // Avoid doubling transforms if the URL already has them
  if (url.includes('/upload/f_auto')) return url;

  const transforms = ['f_auto', 'q_auto'];
  if (width)           transforms.push(`w_${width}`);
  if (height)          transforms.push(`h_${height}`);
  if (width || height) transforms.push('c_fill');

  return url.replace('/upload/', `/upload/${transforms.join(',')}/`);
}

/**
 * Extract the Cloudinary public_id from a plain secure_url (no transformations).
 * Returns an empty string for non-Cloudinary URLs.
 *
 * @param {string} url
 * @returns {string}
 */
export function extractPublicId(url) {
  if (!url || !url.includes('res.cloudinary.com')) return '';

  const uploadIndex = url.indexOf('/upload/');
  if (uploadIndex === -1) return '';

  let path = url.substring(uploadIndex + 8); // characters after '/upload/'
  path = path.replace(/^v\d+\//, '');        // strip version prefix  e.g. v1234567890/
  path = path.replace(/\.[^./]+$/, '');       // strip file extension  e.g. .jpg
  return path;
}
