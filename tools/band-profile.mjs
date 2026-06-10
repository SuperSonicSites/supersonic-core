// Prints the vertical band structure of a full-page screenshot: contiguous
// runs of rows classified by dominant color (white / dark / yellow / photo).
// Lets a migration loop compare section heights between a live baseline and a
// local candidate numerically instead of eyeballing.

import { readFile } from 'node:fs/promises';
import { PNG } from 'pngjs';

const file = process.argv[2];
if (!file) { console.error('usage: node tools/band-profile.mjs <png>'); process.exit(2); }
const png = PNG.sync.read(await readFile(file));

function classifyRow(y) {
  let r = 0, g = 0, b = 0, varSum = 0;
  const n = png.width;
  const samples = [];
  for (let x = 0; x < n; x += 8) {
    const i = (y * n + x) * 4;
    samples.push([png.data[i], png.data[i + 1], png.data[i + 2]]);
  }
  for (const s of samples) { r += s[0]; g += s[1]; b += s[2]; }
  r /= samples.length; g /= samples.length; b /= samples.length;
  for (const s of samples) { varSum += Math.abs(s[0] - r) + Math.abs(s[1] - g) + Math.abs(s[2] - b); }
  const variance = varSum / samples.length;
  if (r > 200 && g > 175 && b < 110) return 'yellow';
  if (r < 60 && g < 60 && b < 60) return 'dark';
  if (r > 235 && g > 235 && b > 235 && variance < 40) return 'white';
  return 'photo/mixed';
}

const bands = [];
let current = null;
for (let y = 0; y < png.height; y += 2) {
  const cls = classifyRow(y);
  if (!current || current.cls !== cls) {
    if (current) bands.push(current);
    current = { cls, start: y, end: y };
  } else {
    current.end = y;
  }
}
if (current) bands.push(current);

const merged = [];
for (const band of bands) {
  const h = band.end - band.start + 2;
  if (merged.length && h < 24) { merged[merged.length - 1].end = band.end; continue; }
  merged.push(band);
}
console.log(`${file} (${png.width}x${png.height})`);
for (const band of merged) {
  console.log(`${String(band.start).padStart(5)} - ${String(band.end).padStart(5)}  (${String(band.end - band.start).padStart(4)}px)  ${band.cls}`);
}
