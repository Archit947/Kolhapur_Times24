#!/usr/bin/env node
/**
 * Migration script: Supabase Storage → Cloudinary
 *
 * What it does
 * ─────────────
 * 1. Reads every news article whose featured_image contains a Supabase Storage URL.
 * 2. Downloads the image.
 * 3. Uploads it to Cloudinary (signed upload using the API key/secret).
 * 4. Updates the database record with the new Cloudinary URL.
 * 5. Writes a JSON migration report to migration-report.json.
 *
 * The script is idempotent — articles whose featured_image already points to
 * res.cloudinary.com are skipped automatically.
 *
 * Usage
 * ─────
 * 1. Fill in the Cloudinary and Supabase service-role key vars in .env.local.
 * 2. Run:  node --env-file=.env.local scripts/migrate-to-cloudinary.js
 *    (Node 20.6+ supports --env-file; for older Node install dotenv and
 *     replace the top of this file with: import 'dotenv/config';)
 *
 * Required env vars
 * ─────────────────
 *   CLOUDINARY_CLOUD_NAME
 *   CLOUDINARY_API_KEY
 *   CLOUDINARY_API_SECRET
 *   VITE_SUPABASE_URL          (already set for the app)
 *   SUPABASE_SERVICE_ROLE_KEY  (service-role key — never expose to the browser)
 *
 * The SUPABASE_SERVICE_ROLE_KEY bypasses RLS so the script can update rows.
 * Get it from Supabase → Settings → API → service_role.
 */

import crypto from 'crypto';
import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';

// ── Resolve project root and load .env.local if --env-file was not used ──────
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath   = path.join(__dirname, '..', '.env.local');

try {
  const envContent = readFileSync(envPath, 'utf8');
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const val = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, '');
    if (key && !(key in process.env)) process.env[key] = val;
  }
} catch {
  // .env.local not found — assume env vars are already set in the shell
}

// ── Validate required env vars ────────────────────────────────────────────────
const CLOUD_NAME    = process.env.CLOUDINARY_CLOUD_NAME;
const API_KEY       = process.env.CLOUDINARY_API_KEY;
const API_SECRET    = process.env.CLOUDINARY_API_SECRET;
const SUPABASE_URL  = process.env.VITE_SUPABASE_URL;
const SERVICE_KEY   = process.env.SUPABASE_SERVICE_ROLE_KEY;

const missing = [
  !CLOUD_NAME    && 'CLOUDINARY_CLOUD_NAME',
  !API_KEY       && 'CLOUDINARY_API_KEY',
  !API_SECRET    && 'CLOUDINARY_API_SECRET',
  !SUPABASE_URL  && 'VITE_SUPABASE_URL',
  !SERVICE_KEY   && 'SUPABASE_SERVICE_ROLE_KEY',
].filter(Boolean);

if (missing.length) {
  console.error('Missing required environment variables:', missing.join(', '));
  process.exit(1);
}

// ── Supabase REST helpers ─────────────────────────────────────────────────────
const SB_HEADERS = {
  'apikey':        SERVICE_KEY,
  'Authorization': `Bearer ${SERVICE_KEY}`,
  'Content-Type':  'application/json',
  'Prefer':        'return=representation',
};

async function supabaseSelect(table, select = '*', filters = '') {
  const url = `${SUPABASE_URL}/rest/v1/${table}?select=${encodeURIComponent(select)}${filters ? '&' + filters : ''}`;
  const res  = await fetch(url, { headers: SB_HEADERS });
  if (!res.ok) throw new Error(`Supabase SELECT failed: ${await res.text()}`);
  return res.json();
}

async function supabaseUpdate(table, id, updates) {
  const url = `${SUPABASE_URL}/rest/v1/${table}?id=eq.${id}`;
  const res  = await fetch(url, {
    method:  'PATCH',
    headers: SB_HEADERS,
    body:    JSON.stringify(updates),
  });
  if (!res.ok) throw new Error(`Supabase PATCH failed: ${await res.text()}`);
}

// ── Cloudinary signed upload helper ──────────────────────────────────────────
function buildSignature(params) {
  const sorted = Object.keys(params)
    .sort()
    .map(k => `${k}=${params[k]}`)
    .join('&');
  return crypto.createHash('sha1').update(sorted + API_SECRET).digest('hex');
}

async function uploadToCloudinary(imageBuffer, fileName, folder = 'news') {
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const signature = buildSignature({ folder, timestamp });

  const body = new FormData();
  const blob = new Blob([imageBuffer], { type: 'image/jpeg' });
  body.append('file',      blob, fileName);
  body.append('api_key',   API_KEY);
  body.append('timestamp', timestamp);
  body.append('folder',    folder);
  body.append('signature', signature);

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
    { method: 'POST', body }
  );
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message ?? `Cloudinary upload error (HTTP ${res.status})`);
  }
  return res.json();
}

// ── Retry wrapper ─────────────────────────────────────────────────────────────
async function withRetry(fn, retries = 3, delayMs = 1500) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      if (attempt === retries) throw err;
      console.warn(`  ↩ Attempt ${attempt} failed (${err.message}). Retrying in ${delayMs}ms…`);
      await new Promise(r => setTimeout(r, delayMs));
    }
  }
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  console.log('╔══════════════════════════════════════════════════╗');
  console.log('║  Supabase Storage → Cloudinary migration script  ║');
  console.log('╚══════════════════════════════════════════════════╝\n');

  const report = {
    startedAt:  new Date().toISOString(),
    migrated:   [],
    skipped:    [],
    failed:     [],
  };

  // 1. Fetch all articles that have a featured_image
  console.log('Fetching articles from Supabase…');
  const allArticles = await supabaseSelect(
    'news',
    'id,title,featured_image',
    'featured_image=not.is.null'
  );
  console.log(`Found ${allArticles.length} articles with a featured_image.\n`);

  for (const article of allArticles) {
    const { id, title, featured_image } = article;
    const shortTitle = title?.slice(0, 60) ?? id;

    // Skip articles that already have a Cloudinary URL
    if (featured_image.includes('res.cloudinary.com')) {
      console.log(`[SKIP]  "${shortTitle}" — already on Cloudinary`);
      report.skipped.push({ id, reason: 'already_on_cloudinary', url: featured_image });
      continue;
    }

    // Skip non-Supabase URLs (external images entered manually)
    if (!featured_image.includes('supabase')) {
      console.log(`[SKIP]  "${shortTitle}" — external URL, not Supabase Storage`);
      report.skipped.push({ id, reason: 'external_url', url: featured_image });
      continue;
    }

    console.log(`[MIGRATE] "${shortTitle}"`);
    console.log(`  Source: ${featured_image}`);

    try {
      // 2. Download the image from Supabase Storage
      const downloadRes = await withRetry(() => fetch(featured_image));
      if (!downloadRes.ok) throw new Error(`Download failed (HTTP ${downloadRes.status})`);
      const buffer = Buffer.from(await downloadRes.arrayBuffer());
      const fileName = `migrated_${id}.jpg`;

      // 3. Upload to Cloudinary
      const cloudData = await withRetry(() => uploadToCloudinary(buffer, fileName, 'news'));
      const newUrl = cloudData.secure_url;

      // 4. Update the database record
      await supabaseUpdate('news', id, { featured_image: newUrl });

      console.log(`  ✓ New URL: ${newUrl}`);
      report.migrated.push({ id, oldUrl: featured_image, newUrl });

    } catch (err) {
      console.error(`  ✗ FAILED: ${err.message}`);
      report.failed.push({ id, title: shortTitle, url: featured_image, error: err.message });
      // Continue with the next article
    }
  }

  // ── Summary ──────────────────────────────────────────────────────────────────
  report.finishedAt = new Date().toISOString();
  console.log('\n────────────────────────────────────────────────────');
  console.log(`Migrated : ${report.migrated.length}`);
  console.log(`Skipped  : ${report.skipped.length}`);
  console.log(`Failed   : ${report.failed.length}`);
  console.log('────────────────────────────────────────────────────');

  const reportPath = path.join(__dirname, '..', 'migration-report.json');
  writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`\nFull report saved to: ${reportPath}`);

  if (report.failed.length > 0) {
    console.warn('\nSome articles failed to migrate. Re-run the script to retry them.');
    process.exit(1);
  } else {
    console.log('\nMigration complete!');
  }
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
