// Harvests every image a live site actually serves by capturing response
// bodies from a real Chromium session (defeats hotlink/CDN 403s that block
// plain fetch). Writes files + manifest.json to tools/tmp/site-images/.
// Companion to tools/extract-site.mjs in the Axis A migration pipeline.
//
// Usage: node tools/harvest-site-images.mjs --base https://www.example.com --paths "/,/about"

import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { VIEWPORTS, launchChromium, openMaskedPage } from './lib/browser.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const args = process.argv.slice(2);

function getArg(name, fallback = undefined) {
  const index = args.indexOf(name);
  return index === -1 || index === args.length - 1 ? fallback : args[index + 1];
}

const base = getArg('--base');
const paths = getArg('--paths', '/').split(',').map((p) => p.trim()).filter(Boolean);
if (!base) {
  console.error('Usage: node tools/harvest-site-images.mjs --base <url> [--paths "/,/about"]');
  process.exit(1);
}

const outDir = path.join(root, 'tools/tmp/site-images');
await mkdir(outDir, { recursive: true });

const saved = new Map();
let counter = 0;

function fileNameFor(url) {
  counter += 1;
  const parsed = new URL(url);
  let stem = decodeURIComponent(path.basename(parsed.pathname)).replace(/[^a-zA-Z0-9._-]+/g, '-');
  if (!stem) stem = 'image';
  if (!/\.(png|jpe?g|webp|gif|svg|avif|ico)$/i.test(stem)) {
    stem += '.img';
  }
  return `${String(counter).padStart(2, '0')}-${stem}`.slice(0, 110);
}

const browser = await launchChromium('image harvest');
try {
  // Desktop pass loads the largest responsive variants.
  const viewport = VIEWPORTS[0];
  for (const p of paths) {
    const url = new URL(p, base).toString();
    const page = await openMaskedPage(browser, { viewport, url });
    page.on('response', async (response) => {
      try {
        const resourceUrl = response.url();
        if (saved.has(resourceUrl) || !response.ok()) return;
        const type = response.headers()['content-type'] ?? '';
        if (!type.startsWith('image/')) return;
        const body = await response.body();
        if (body.length < 200) return;
        const ext = { 'image/webp': '.webp', 'image/png': '.png', 'image/jpeg': '.jpg', 'image/svg+xml': '.svg', 'image/avif': '.avif', 'image/gif': '.gif' }[type.split(';')[0]] ?? '';
        let fileName = fileNameFor(resourceUrl);
        if (ext && !fileName.toLowerCase().endsWith(ext)) fileName = fileName.replace(/\.(img|webp|png|jpe?g|svg|avif|gif|ico)$/i, '') + ext;
        await writeFile(path.join(outDir, fileName), body);
        saved.set(resourceUrl, { file: fileName, bytes: body.length, contentType: type, firstSeenOn: p });
      } catch {
        // response bodies can be gone for cancelled requests; skip quietly
      }
    });
    // Scroll to trigger every lazy image, then give the network a beat.
    await page.evaluate(async () => {
      await new Promise((resolve) => {
        let y = 0;
        const step = () => {
          y += 700;
          window.scrollTo(0, y);
          if (y >= document.body.scrollHeight) resolve();
          else setTimeout(step, 150);
        };
        step();
      });
    });
    await page.waitForTimeout(2500);
    await page.context().close();
    console.log(`${p}: ${saved.size} unique images so far`);
  }
} finally {
  await browser.close();
}

const manifest = [...saved.entries()].map(([url, meta]) => ({ url, ...meta }));
await writeFile(path.join(outDir, 'manifest.json'), JSON.stringify(manifest, null, 2));
console.log(`\nSaved ${manifest.length} images to ${path.relative(root, outDir)}`);
