// Generates the staging --content payload for the sample Service page fixture
// from its readable HTML source, so the composed markup has a single source of
// truth (no hand-escaped JSON). Fixture only; not part of the build.
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const src = path.join(root, 'docs/layouts/sample-service-page.html');
const out = path.join(root, 'data/page-json/sample-service-page.json');

const html = await readFile(src, 'utf8');
// Drop the leading SAMPLE banner comment; page content starts at the first block.
const start = html.indexOf('<!-- wp:');
if (start === -1) {
  throw new Error('No block markup found in sample-service-page.html');
}
const content = html.slice(start).trim();

await mkdir(path.dirname(out), { recursive: true });
await writeFile(out, `${JSON.stringify({ content }, null, 2)}\n`, 'utf8');
console.log(`Wrote ${path.relative(root, out)} (${content.length} chars of block markup).`);
