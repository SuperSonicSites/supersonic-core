// Generates a staging --content payload {content} from a composed layout HTML
// fixture, so the block markup has a single source of truth (no hand-escaped
// JSON). Fixture tooling; not part of the build.
//   node tools/make-sample-service-payload.mjs [--src docs/layouts/<f>.html] [--out data/page-json/<f>.json]
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const getArg = (name, fallback) => {
  const i = args.indexOf(name);
  return i === -1 || i === args.length - 1 ? fallback : args[i + 1];
};
const src = path.resolve(root, getArg('--src', 'docs/layouts/sample-service-page.html'));
const out = path.resolve(root, getArg('--out', 'data/page-json/sample-service-page.json'));

const html = await readFile(src, 'utf8');
// Page content starts at the first block; the leading SAMPLE banner is dropped.
const start = html.indexOf('<!-- wp:');
if (start === -1) {
  throw new Error(`No block markup found in ${path.relative(root, src)}`);
}
const content = html.slice(start).trim();

await mkdir(path.dirname(out), { recursive: true });
await writeFile(out, `${JSON.stringify({ content }, null, 2)}\n`, 'utf8');
console.log(`Wrote ${path.relative(root, out)} (${content.length} chars of block markup).`);
