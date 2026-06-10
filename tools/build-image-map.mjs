// Joins data/site-extraction.json (per-page <img> srcs in DOM order) with the
// harvest manifest (url -> file) and the media attachment map (file -> id) to
// produce data/page-image-map.json: for each live page, the ordered list of
// images with their local WordPress attachment id and URL. This is the lookup
// table page assembly uses to place the right photo in the right slot.

import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

const extraction = JSON.parse(await readFile(path.join(root, 'data/site-extraction.json'), 'utf8'));
const manifest = JSON.parse(await readFile(path.join(root, 'tools/tmp/site-images/manifest.json'), 'utf8'));
const attachments = JSON.parse(await readFile(path.join(root, 'tools/tmp/site-images/attachment-map.json'), 'utf8'));

const norm = (u) => decodeURIComponent(String(u).split('?')[0]).toLowerCase();
const fileByUrl = new Map();
for (const m of manifest) {
  if (m.file) fileByUrl.set(norm(m.url), m.file);
}

const out = {};
for (const [pagePath, page] of Object.entries(extraction.pages)) {
  out[pagePath] = (page.images ?? []).map((img, index) => {
    const file = fileByUrl.get(norm(img.src)) ?? null;
    const att = file && attachments[file] ? attachments[file].id : null;
    return { index, liveSrc: img.src, alt: img.alt, width: img.width, height: img.height, file, attachmentId: att };
  });
}

await writeFile(path.join(root, 'data/page-image-map.json'), JSON.stringify(out, null, 2));
const flat = Object.values(out).flat();
console.log(`mapped ${flat.filter((x) => x.attachmentId).length}/${flat.length} images to attachments`);
for (const [p, imgs] of Object.entries(out)) {
  const missing = imgs.filter((x) => !x.attachmentId);
  if (missing.length) console.log(`${p}: ${missing.length} unmapped (${missing.map((m) => m.liveSrc.slice(-40)).join('; ')})`);
}
