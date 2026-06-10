// Second-pass image harvest: fetches every <img> URL recorded in
// data/site-extraction.json from INSIDE the live page's browser context
// (same-origin fetch defeats hotlink protection and reaches lazy carousel
// slides that never render). Skips files already saved by the first pass.

import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { VIEWPORTS, launchChromium, openMaskedPage } from './lib/browser.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const outDir = path.join(root, 'tools/tmp/site-images');
await mkdir(outDir, { recursive: true });

const extraction = JSON.parse(await readFile(path.join(root, 'data/site-extraction.json'), 'utf8'));
const manifestPath = path.join(outDir, 'manifest.json');
let manifest = [];
try { manifest = JSON.parse(await readFile(manifestPath, 'utf8')); } catch {}
const have = new Set(manifest.map((m) => m.url));

const wanted = new Map();
for (const [pagePath, page] of Object.entries(extraction.pages)) {
  for (const img of page.images ?? []) {
    if (img.src && /^https?:/i.test(img.src) && !have.has(img.src) && !wanted.has(img.src)) {
      wanted.set(img.src, pagePath);
    }
  }
}
console.log(`${wanted.size} missing images to fetch`);
if (!wanted.size) process.exit(0);

let counter = manifest.length;
const browser = await launchChromium('image harvest v2');
try {
  const byPage = new Map();
  for (const [url, pagePath] of wanted) {
    if (!byPage.has(pagePath)) byPage.set(pagePath, []);
    byPage.get(pagePath).push(url);
  }
  for (const [pagePath, urls] of byPage) {
    const pageUrl = new URL(pagePath, extraction.base).toString();
    const page = await openMaskedPage(browser, { viewport: VIEWPORTS[0], url: pageUrl });
    for (const url of urls) {
      try {
        const data = await page.evaluate(async (u) => {
          const res = await fetch(u, { credentials: 'include' });
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          const type = res.headers.get('content-type') ?? '';
          const buf = await res.arrayBuffer();
          let binary = '';
          const bytes = new Uint8Array(buf);
          for (let i = 0; i < bytes.length; i += 1) binary += String.fromCharCode(bytes[i]);
          return { b64: btoa(binary), type };
        }, url);
        counter += 1;
        const ext = { 'image/webp': '.webp', 'image/png': '.png', 'image/jpeg': '.jpg', 'image/svg+xml': '.svg', 'image/avif': '.avif', 'image/gif': '.gif' }[data.type.split(';')[0]] ?? '.img';
        let stem = decodeURIComponent(path.basename(new URL(url).pathname)).replace(/[^a-zA-Z0-9._-]+/g, '-').replace(/\.(webp|png|jpe?g|svg|avif|gif)$/i, '');
        const fileName = `${String(counter).padStart(2, '0')}-${stem}`.slice(0, 105) + ext;
        await writeFile(path.join(outDir, fileName), Buffer.from(data.b64, 'base64'));
        manifest.push({ url, file: fileName, bytes: data.b64.length, contentType: data.type, firstSeenOn: pagePath, pass: 2 });
        console.log(`ok   ${fileName}`);
      } catch (error) {
        manifest.push({ url, file: null, error: String(error.message ?? error), firstSeenOn: pagePath, pass: 2 });
        console.log(`FAIL ${url}: ${error.message}`);
      }
    }
    await page.context().close();
  }
} finally {
  await browser.close();
}
await writeFile(manifestPath, JSON.stringify(manifest, null, 2));
console.log(`manifest now ${manifest.length} entries`);
