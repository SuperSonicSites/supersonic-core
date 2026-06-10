// Pixel-compares a candidate screenshot against a baseline and reports the
// mismatch percentage plus a visual diff image. The scoring gate for
// pixel-parity migration loops: capture localhost, diff against
// screenshots/before/<site>/, fix, repeat.
//
// Usage: node tools/pixel-diff.mjs --baseline a.png --candidate b.png [--out diff.png] [--threshold 0.1]
// Exit code 0 always (reporting tool); consumers read the printed percentage.

import { readFile, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { PNG } from 'pngjs';
import pixelmatch from 'pixelmatch';

const args = process.argv.slice(2);
function getArg(name, fallback = undefined) {
  const index = args.indexOf(name);
  return index === -1 || index === args.length - 1 ? fallback : args[index + 1];
}

const baselinePath = getArg('--baseline');
const candidatePath = getArg('--candidate');
const outPath = getArg('--out');
const threshold = Number(getArg('--threshold', '0.1'));

if (!baselinePath || !candidatePath) {
  console.error('Usage: node tools/pixel-diff.mjs --baseline <png> --candidate <png> [--out diff.png] [--threshold 0.1]');
  process.exit(2);
}

const baseline = PNG.sync.read(await readFile(baselinePath));
const candidate = PNG.sync.read(await readFile(candidatePath));

// Compare on the shared region; report any canvas-size drift separately so a
// taller/shorter page is visible even when overlapping pixels match.
const width = Math.min(baseline.width, candidate.width);
const height = Math.min(baseline.height, candidate.height);

function cropTo(png, w, h) {
  if (png.width === w && png.height === h) return png;
  const out = new PNG({ width: w, height: h });
  PNG.bitblt(png, out, 0, 0, w, h, 0, 0);
  return out;
}

const a = cropTo(baseline, width, height);
const b = cropTo(candidate, width, height);
const diff = new PNG({ width, height });
const mismatched = pixelmatch(a.data, b.data, diff.data, width, height, { threshold });

const pct = (mismatched / (width * height)) * 100;
const sizeDrift = {
  baseline: { width: baseline.width, height: baseline.height },
  candidate: { width: candidate.width, height: candidate.height },
  heightDeltaPx: candidate.height - baseline.height,
  widthDeltaPx: candidate.width - baseline.width
};

if (outPath) {
  await mkdir(path.dirname(path.resolve(outPath)), { recursive: true });
  await writeFile(outPath, PNG.sync.write(diff));
}

console.log(JSON.stringify({
  baseline: baselinePath,
  candidate: candidatePath,
  comparedRegion: { width, height },
  mismatchedPixels: mismatched,
  mismatchPct: Number(pct.toFixed(3)),
  sizeDrift,
  diffImage: outPath ?? null
}, null, 2));
