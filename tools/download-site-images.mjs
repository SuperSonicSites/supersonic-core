// Downloads every unique image recorded in data/site-extraction.json into
// tools/tmp/site-images/ (gitignored) so they can be imported into the local
// WordPress media library for pixel-parity page assembly. Part of the Axis A
// migration pipeline alongside tools/extract-site.mjs.

import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const outDir = path.join(root, 'tools/tmp/site-images');

const extraction = JSON.parse(await readFile(path.join(root, 'data/site-extraction.json'), 'utf8'));

const urls = new Map();
for (const [pagePath, page] of Object.entries(extraction.pages)) {
  for (const img of page.images ?? []) {
    if (!img.src || !/^https?:/i.test(img.src)) continue;
    if (!urls.has(img.src)) {
      urls.set(img.src, { alt: img.alt, width: img.width, height: img.height, pages: [] });
    }
    urls.get(img.src).pages.push(pagePath);
  }
}

await mkdir(outDir, { recursive: true });

function fileNameFor(url, index) {
  const parsed = new URL(url);
  let base = path.basename(parsed.pathname) || `image-${index}`;
  base = decodeURIComponent(base).replace(/[^a-zA-Z0-9._-]+/g, '-');
  if (!/\.(png|jpe?g|webp|gif|svg|avif)$/i.test(base)) base += '.webp';
  return `${String(index).padStart(2, '0')}-${base}`.slice(0, 120);
}

const manifest = [];
let index = 0;
for (const [url, meta] of urls) {
  index += 1;
  const fileName = fileNameFor(url, index);
  try {
    const response = await fetch(url, { headers: { 'user-agent': 'Mozilla/5.0 (supersonic-migration)' } });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const buffer = Buffer.from(await response.arrayBuffer());
    await writeFile(path.join(outDir, fileName), buffer);
    manifest.push({ file: fileName, url, alt: meta.alt, width: meta.width, height: meta.height, pages: meta.pages, bytes: buffer.length });
    console.log(`ok   ${fileName} (${Math.round(buffer.length / 1024)} KB)`);
  } catch (error) {
    manifest.push({ file: null, url, error: String(error.message ?? error), pages: meta.pages });
    console.log(`FAIL ${url}: ${error.message}`);
  }
}

await writeFile(path.join(outDir, 'manifest.json'), JSON.stringify(manifest, null, 2));
console.log(`\n${manifest.filter((m) => m.file).length}/${manifest.length} images saved to ${path.relative(root, outDir)}`);
