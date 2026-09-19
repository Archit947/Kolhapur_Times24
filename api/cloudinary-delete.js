/**
 * Vercel serverless function — /api/cloudinary-delete
 *
 * Deletes a Cloudinary asset by public_id.
 * The API secret lives here (server-side) and is never exposed to the browser.
 *
 * Required environment variables (set in Vercel dashboard + .env.local):
 *   CLOUDINARY_CLOUD_NAME
 *   CLOUDINARY_API_KEY
 *   CLOUDINARY_API_SECRET
 *
 * Security:
 *  - Only DELETE requests with public_ids starting with 'news/' or 'ads/'
 *    are accepted, preventing arbitrary asset deletion.
 *  - Uses SHA-1 signature as required by the Cloudinary REST API.
 */

import crypto from 'crypto';

const ALLOWED_PREFIXES  = ['news/', 'ads/'];
const MAX_PUBLIC_ID_LEN = 256;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const cloudName = process.env.CLOUDINARY_CLOUD_NAME ?? process.env.VITE_CLOUDINARY_CLOUD_NAME;
  const apiKey    = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) {
    return res.status(500).json({ error: 'Cloudinary server credentials are not configured' });
  }

  // Parse body — Vercel parses JSON bodies automatically for serverless functions
  const { publicId } = req.body ?? {};

  if (
    typeof publicId !== 'string' ||
    publicId.length > MAX_PUBLIC_ID_LEN ||
    !ALLOWED_PREFIXES.some(prefix => publicId.startsWith(prefix))
  ) {
    return res.status(400).json({ error: 'Invalid or disallowed public_id' });
  }

  const timestamp = Math.floor(Date.now() / 1000);
  const toSign    = `public_id=${publicId}&timestamp=${timestamp}${apiSecret}`;
  const signature = crypto.createHash('sha1').update(toSign).digest('hex');

  try {
    const cloudRes = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/image/destroy`,
      {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          public_id: publicId,
          api_key:   apiKey,
          timestamp,
          signature,
        }),
      }
    );

    const data = await cloudRes.json().catch(() => ({}));

    if (data.result === 'ok' || data.result === 'not found') {
      return res.status(200).json({ deleted: true, result: data.result });
    }

    return res.status(502).json({ error: data.error?.message ?? 'Cloudinary delete failed' });
  } catch {
    return res.status(502).json({ error: 'Failed to reach Cloudinary API' });
  }
}
