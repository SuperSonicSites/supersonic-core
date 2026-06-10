#!/usr/bin/env node
/**
 * Asset curator: ranks the legacy images harvested by capture-site into a
 * scored inventory the image plan draws from. Classifies logo / photo /
 * graphic, reads real pixel dimensions from file headers (PNG, JPEG, WebP,
 * SVG, GIF — no native deps), and writes captured/asset-inventory.json
 * sorted hero-first (biggest usable photos on top).
 *
 * Usage:
 *   node tools/curate-assets.mjs [--captured captured] [--self-test]
 */

import { readdir, readFile, writeFile, stat } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

export function imageDimensions(buffer, name = '') {
  try {
    if (buffer.length > 24 && buffer.readUInt32BE(0) === 0x89504e47) {
      return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) };
    }
    if (buffer.length > 4 && buffer[0] === 0xff && buffer[1] === 0xd8) {
      let off = 2;
      while (off + 9 < buffer.length) {
        if (buffer[off] !== 0xff) break;
        const marker = buffer[off + 1];
        const size = buffer.readUInt16BE(off + 2);
        if (marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc) {
          return { height: buffer.readUInt16BE(off + 5), width: buffer.readUInt16BE(off + 7) };
        }
        off += 2 + size;
      }
    }
    if (buffer.length > 30 && buffer.toString('ascii', 0, 4) === 'RIFF' && buffer.toString('ascii', 8, 12) === 'WEBP') {
      const fmt = buffer.toString('ascii', 12, 16);
      if (fmt === 'VP8 ') return { width: buffer.readUInt16LE(26) & 0x3fff, height: buffer.readUInt16LE(28) & 0x3fff };
      if (fmt === 'VP8L') {
        const b = buffer.readUInt32LE(21);
        return { width: (b & 0x3fff) + 1, height: ((b >> 14) & 0x3fff) + 1 };
      }
      if (fmt === 'VP8X') {
        return { width: 1 + (buffer.readUIntLE(24, 3)), height: 1 + (buffer.readUIntLE(27, 3)) };
      }
    }
    if (buffer.length > 10 && buffer.toString('ascii', 0, 3) === 'GIF') {
      return { width: buffer.readUInt16LE(6), height: buffer.readUInt16LE(8) };
    }
    if (/\.svg$/i.test(name) || buffer.toString('utf8', 0, 256).includes('<svg')) {
      const text = buffer.toString('utf8');
      const vb = /viewBox\s*=\s*["']\s*[\d.+-]+\s+[\d.+-]+\s+([\d.]+)\s+([\d.]+)/.exec(text);
      if (vb) return { width: Math.round(Number(vb[1])), height: Math.round(Number(vb[2])) };
      const w = /width\s*=\s*["']?([\d.]+)/.exec(text);
      const h = /height\s*=\s*["']?([\d.]+)/.exec(text);
      if (w && h) return { width: Math.round(Number(w[1])), height: Math.round(Number(h[1])) };
      return { width: 0, height: 0, vector: true };
    }
  } catch {
    // fall through
  }
  return { width: 0, height: 0 };
}

export function classify({ width, height, bytes, file, logoFiles }) {
  if (logoFiles.has(path.basename(file)) || /logo|favicon/i.test(file)) {
    return 'logo';
  }
  if (/\.svg$/i.test(file)) {
    return 'graphic';
  }
  const pixels = width * height;
  if (pixels >= 250000) {
    return 'photo';
  }
  if (pixels > 0 && pixels < 20000) {
    return 'icon';
  }
  return bytes > 60000 ? 'photo' : 'graphic';
}

export function scoreAsset(record) {
  if (record.kind !== 'photo') {
    return 0;
  }
  const pixels = record.width * record.height;
  const aspect = record.height > 0 ? record.width / record.height : 0;
  // Hero-friendliness: resolution first, landscape-to-square preferred.
  const aspectFit = aspect >= 0.7 && aspect <= 2.2 ? 1 : 0.5;
  return Math.round(Math.sqrt(pixels) * aspectFit);
}

async function run(capturedDir) {
  const imagesDir = path.resolve(ROOT, capturedDir, 'assets', 'images');
  if (!existsSync(imagesDir)) {
    console.error(`FAIL: ${capturedDir}/assets/images not found — run npm run capture:site first.`);
    process.exit(1);
  }
  const brandPath = path.resolve(ROOT, capturedDir, 'brand.json');
  const logoFiles = new Set();
  if (existsSync(brandPath)) {
    const brand = JSON.parse(await readFile(brandPath, 'utf8'));
    for (const candidate of brand.logoCandidates ?? []) {
      logoFiles.add(path.basename(String(candidate.file ?? candidate)));
    }
  }
  const records = [];
  for (const file of await readdir(imagesDir)) {
    const full = path.join(imagesDir, file);
    if (!(await stat(full)).isFile()) continue;
    const buffer = await readFile(full);
    const { width, height } = imageDimensions(buffer, file);
    const record = {
      file: path.posix.join(capturedDir, 'assets', 'images', file),
      width,
      height,
      bytes: buffer.length,
      kind: classify({ width, height, bytes: buffer.length, file, logoFiles })
    };
    record.score = scoreAsset(record);
    records.push(record);
  }
  records.sort((a, b) => b.score - a.score || b.bytes - a.bytes);
  const outPath = path.resolve(ROOT, capturedDir, 'asset-inventory.json');
  await writeFile(outPath, JSON.stringify(records, null, 2) + '\n');
  const photos = records.filter((r) => r.kind === 'photo').length;
  console.log(`OK: ${records.length} asset(s) inventoried (${photos} photo(s)) -> ${capturedDir}/asset-inventory.json`);
  if (photos === 0) {
    console.log('WARN: no usable photos found — the image plan will need client uploads or licensed stock before image:check passes.');
  }
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
    if (!cond) throw new Error(msg);
  };

  checkCase('PNG dimensions', () => {
    const buffer = Buffer.alloc(33);
    buffer.writeUInt32BE(0x89504e47, 0);
    buffer.writeUInt32BE(800, 16);
    buffer.writeUInt32BE(600, 20);
    const dim = imageDimensions(buffer, 'x.png');
    assert(dim.width === 800 && dim.height === 600, JSON.stringify(dim));
  });

  checkCase('JPEG SOF dimensions', () => {
    const buffer = Buffer.from([0xff, 0xd8, 0xff, 0xc0, 0x00, 0x11, 0x08, 0x02, 0x58, 0x03, 0x20, 0x03, 0x01, 0x22, 0x00, 0x02, 0x11, 0x01, 0x03, 0x11, 0x01]);
    const dim = imageDimensions(buffer, 'x.jpg');
    assert(dim.width === 800 && dim.height === 600, JSON.stringify(dim));
  });

  checkCase('SVG viewBox dimensions', () => {
    const dim = imageDimensions(Buffer.from('<svg viewBox="0 0 160 40"></svg>'), 'logo.svg');
    assert(dim.width === 160 && dim.height === 40, JSON.stringify(dim));
  });

  checkCase('classification: logo, photo, icon', () => {
    const logos = new Set(['mark.png']);
    assert(classify({ width: 1200, height: 800, bytes: 300000, file: 'a/van.jpg', logoFiles: logos }) === 'photo', 'photo');
    assert(classify({ width: 160, height: 40, bytes: 4000, file: 'a/mark.png', logoFiles: logos }) === 'logo', 'logo');
    assert(classify({ width: 64, height: 64, bytes: 2000, file: 'a/star.png', logoFiles: new Set() }) === 'icon', 'icon');
  });

  checkCase('scoring prefers big landscape photos, zeroes non-photos', () => {
    const big = scoreAsset({ kind: 'photo', width: 1600, height: 900 });
    const tall = scoreAsset({ kind: 'photo', width: 400, height: 1600 });
    assert(big > tall, `${big} <= ${tall}`);
    assert(scoreAsset({ kind: 'logo', width: 1600, height: 900 }) === 0, 'logo scored');
  });

  for (const line of results) console.log(line);
  const failed = results.filter((line) => line.startsWith('FAIL')).length;
  console.log(failed === 0 ? `OK: ${results.length}/${results.length} self-test checks passed` : `FAIL: ${failed} check(s) failed`);
  process.exit(failed === 0 ? 0 : 1);
}

const args = process.argv.slice(2);
if (args.includes('--self-test')) {
  selfTest();
} else {
  const idx = args.indexOf('--captured');
  await run(idx >= 0 ? args[idx + 1] : 'captured');
}
