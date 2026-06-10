#!/usr/bin/env node
/**
 * Visual regression gate: compares rendered pattern screenshots against
 * committed baselines with pixelmatch. Fail-closed: a rendered pattern with
 * no baseline is a failure (review the render, then --update-baselines).
 *
 * Rules:
 *   VIS-1  rendered screenshot has no baseline            -> FAIL
 *   VIS-2  baseline and render dimensions differ          -> FAIL
 *   VIS-3  changed-pixel ratio exceeds threshold          -> FAIL (diff PNG written)
 *   VIS-W1 baseline exists with no matching render        -> WARN (pattern may be filtered)
 *
 * Usage:
 *   node tools/visual-diff.mjs [--render-dir screenshots/render] [--baseline-dir screenshots/baseline]
 *                              [--diff-dir screenshots/diff] [--threshold 0.001]
 *                              [--patterns slug1,slug2] [--update-baselines] [--self-test]
 */

import { copyFile, mkdir, readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import pixelmatch from 'pixelmatch';
import { PNG } from 'pngjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

const DEFAULTS = {
  renderDir: 'screenshots/render',
  baselineDir: 'screenshots/baseline',
  diffDir: 'screenshots/diff',
  threshold: 0.001
};

// Antialiasing-tolerant pixelmatch options: ignore AA pixels and require a
// meaningful per-pixel color delta so font rasterization noise doesn't fail CI.
const PIXELMATCH_OPTIONS = { threshold: 0.1, includeAA: false };

// Pure: compares two decoded PNGs, returns { rule, ok, ratio, diff } where
// diff is a PNG instance when pixels differ. Throws nothing.
export function comparePngs(baselinePng, renderPng, ratioThreshold) {
  if (baselinePng.width !== renderPng.width || baselinePng.height !== renderPng.height) {
    return {
      ok: false,
      rule: 'VIS-2',
      detail: `dimensions differ: baseline ${baselinePng.width}x${baselinePng.height} vs render ${renderPng.width}x${renderPng.height}`
    };
  }
  const { width, height } = baselinePng;
  const diff = new PNG({ width, height });
  const changed = pixelmatch(baselinePng.data, renderPng.data, diff.data, width, height, PIXELMATCH_OPTIONS);
  const ratio = changed / (width * height);
  if (ratio > ratioThreshold) {
    return {
      ok: false,
      rule: 'VIS-3',
      detail: `changed-pixel ratio ${ratio.toFixed(6)} exceeds threshold ${ratioThreshold}`,
      ratio,
      diff
    };
  }
  return { ok: true, ratio };
}

// Pure: pairs render files against baseline files (relative paths like
// "<slug>/desktop.png") into compare/missing-baseline/orphaned-baseline sets.
export function pairScreenshots(renderFiles, baselineFiles) {
  const renderSet = new Set(renderFiles);
  const baselineSet = new Set(baselineFiles);
  return {
    compare: renderFiles.filter((file) => baselineSet.has(file)).sort(),
    missingBaseline: renderFiles.filter((file) => !baselineSet.has(file)).sort(),
    orphanedBaseline: baselineFiles.filter((file) => !renderSet.has(file)).sort()
  };
}

async function listPngs(dir) {
  const out = [];
  let slugs;
  try {
    slugs = await readdir(dir, { withFileTypes: true });
  } catch {
    return out;
  }
  for (const entry of slugs) {
    if (!entry.isDirectory()) {
      continue;
    }
    let files;
    try {
      files = await readdir(path.join(dir, entry.name));
    } catch {
      continue;
    }
    for (const file of files) {
      if (file.endsWith('.png')) {
        out.push(`${entry.name}/${file}`);
      }
    }
  }
  return out.sort();
}

function parseArgs(argv) {
  const opts = { ...DEFAULTS, patterns: null, updateBaselines: false, selfTest: false };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--render-dir') opts.renderDir = argv[++i];
    else if (arg === '--baseline-dir') opts.baselineDir = argv[++i];
    else if (arg === '--diff-dir') opts.diffDir = argv[++i];
    else if (arg === '--threshold') opts.threshold = Number(argv[++i]);
    else if (arg === '--patterns') opts.patterns = argv[++i].split(',').map((s) => s.trim()).filter(Boolean);
    else if (arg === '--update-baselines') opts.updateBaselines = true;
    else if (arg === '--self-test') opts.selfTest = true;
    else {
      console.error(`FAIL: unknown argument ${arg}`);
      process.exit(2);
    }
  }
  if (!Number.isFinite(opts.threshold) || opts.threshold < 0) {
    console.error('FAIL: --threshold must be a non-negative number');
    process.exit(2);
  }
  return opts;
}

function filterByPatterns(files, patterns) {
  if (!patterns) {
    return files;
  }
  const wanted = new Set(patterns);
  return files.filter((file) => wanted.has(file.split('/')[0]));
}

async function run(opts) {
  const renderDir = path.resolve(ROOT, opts.renderDir);
  const baselineDir = path.resolve(ROOT, opts.baselineDir);
  const diffDir = path.resolve(ROOT, opts.diffDir);

  const renders = filterByPatterns(await listPngs(renderDir), opts.patterns);
  const baselines = filterByPatterns(await listPngs(baselineDir), opts.patterns);

  if (renders.length === 0) {
    console.error(`FAIL: no rendered screenshots found under ${opts.renderDir} — run the playground render first.`);
    process.exit(1);
  }

  if (opts.updateBaselines) {
    for (const file of renders) {
      const dest = path.join(baselineDir, file);
      await mkdir(path.dirname(dest), { recursive: true });
      await copyFile(path.join(renderDir, file), dest);
      console.log(`UPDATED: ${path.join(opts.baselineDir, file)}`);
    }
    console.log(`OK: ${renders.length} baseline(s) updated — review the git diff and commit deliberately.`);
    return;
  }

  const { compare, missingBaseline, orphanedBaseline } = pairScreenshots(renders, baselines);
  let failures = 0;

  for (const file of missingBaseline) {
    failures += 1;
    console.error(`FAIL VIS-1: ${file} has no baseline. Review ${path.join(opts.renderDir, file)} visually, then run with --update-baselines.`);
  }

  for (const file of compare) {
    const baselinePng = PNG.sync.read(await readFile(path.join(baselineDir, file)));
    const renderPng = PNG.sync.read(await readFile(path.join(renderDir, file)));
    const result = comparePngs(baselinePng, renderPng, opts.threshold);
    if (result.ok) {
      console.log(`PASS: ${file} (ratio ${result.ratio.toFixed(6)})`);
      continue;
    }
    failures += 1;
    if (result.diff) {
      const diffPath = path.join(diffDir, file);
      await mkdir(path.dirname(diffPath), { recursive: true });
      await writeFile(diffPath, PNG.sync.write(result.diff));
      console.error(`FAIL ${result.rule}: ${file} — ${result.detail} (diff: ${path.join(opts.diffDir, file)})`);
    } else {
      console.error(`FAIL ${result.rule}: ${file} — ${result.detail}`);
    }
  }

  for (const file of orphanedBaseline) {
    console.warn(`WARN VIS-W1: baseline ${file} has no matching render (filtered out or removed pattern).`);
  }

  if (failures > 0) {
    console.error(`FAIL: ${failures} visual regression failure(s) across ${renders.length} screenshot(s).`);
    process.exit(1);
  }
  console.log(`OK: ${compare.length} screenshot(s) match baselines (threshold ${opts.threshold}).`);
}

function makePng(width, height, paint) {
  const png = new PNG({ width, height });
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const idx = (width * y + x) << 2;
      const [r, g, b] = paint(x, y);
      png.data[idx] = r;
      png.data[idx + 1] = g;
      png.data[idx + 2] = b;
      png.data[idx + 3] = 255;
    }
  }
  return png;
}

function selfTest() {
  const results = [];
  const checkCase = (name, fn) => {
    try {
      fn();
      results.push(`PASS: ${name}`);
    } catch (error) {
      results.push(`FAIL: ${name} — ${error.message}`);
    }
  };
  const assert = (cond, msg) => {
    if (!cond) {
      throw new Error(msg);
    }
  };

  const white = () => [255, 255, 255];
  const size = 20; // 400 px total

  checkCase('identical images pass', () => {
    const result = comparePngs(makePng(size, size, white), makePng(size, size, white), 0.001);
    assert(result.ok && result.ratio === 0, `expected ok ratio 0, got ${JSON.stringify(result)}`);
  });

  checkCase('large change fails VIS-3 with diff', () => {
    const half = makePng(size, size, (x) => (x < size / 2 ? [0, 0, 0] : [255, 255, 255]));
    const result = comparePngs(makePng(size, size, white), half, 0.001);
    assert(!result.ok && result.rule === 'VIS-3' && result.diff, `expected VIS-3, got ${JSON.stringify(result.rule)}`);
  });

  checkCase('dimension mismatch fails VIS-2', () => {
    const result = comparePngs(makePng(size, size, white), makePng(size, size + 1, white), 0.001);
    assert(!result.ok && result.rule === 'VIS-2', `expected VIS-2, got ${JSON.stringify(result.rule)}`);
  });

  checkCase('ratio just under threshold passes', () => {
    // 1 changed pixel of 400 = ratio 0.0025; threshold 0.003 passes it.
    const onePixel = makePng(size, size, (x, y) => (x === 0 && y === 0 ? [255, 0, 0] : [255, 255, 255]));
    const result = comparePngs(makePng(size, size, white), onePixel, 0.003);
    assert(result.ok, `expected pass at threshold 0.003, got ${JSON.stringify(result)}`);
  });

  checkCase('ratio just over threshold fails', () => {
    const onePixel = makePng(size, size, (x, y) => (x === 0 && y === 0 ? [255, 0, 0] : [255, 255, 255]));
    const result = comparePngs(makePng(size, size, white), onePixel, 0.002);
    assert(!result.ok && result.rule === 'VIS-3', `expected VIS-3 at threshold 0.002, got ${JSON.stringify(result)}`);
  });

  checkCase('pairing: missing baseline detected (VIS-1 input)', () => {
    const pairs = pairScreenshots(['hero/desktop.png', 'cta/desktop.png'], ['hero/desktop.png']);
    assert(
      pairs.compare.length === 1 && pairs.missingBaseline[0] === 'cta/desktop.png' && pairs.orphanedBaseline.length === 0,
      JSON.stringify(pairs)
    );
  });

  checkCase('pairing: orphaned baseline is warn-only set', () => {
    const pairs = pairScreenshots(['hero/desktop.png'], ['hero/desktop.png', 'gone/mobile.png']);
    assert(pairs.orphanedBaseline[0] === 'gone/mobile.png' && pairs.missingBaseline.length === 0, JSON.stringify(pairs));
  });

  for (const line of results) {
    console.log(line);
  }
  const failed = results.filter((line) => line.startsWith('FAIL')).length;
  console.log(failed === 0 ? `OK: ${results.length}/${results.length} self-test checks passed` : `FAIL: ${failed} check(s) failed`);
  process.exit(failed === 0 ? 0 : 1);
}

const opts = parseArgs(process.argv.slice(2));
if (opts.selfTest) {
  selfTest();
} else {
  await run(opts);
}
