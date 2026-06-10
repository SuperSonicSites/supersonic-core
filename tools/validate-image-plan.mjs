#!/usr/bin/env node
/**
 * Image plan gate (npm run image:check). Photography is a required layout
 * artifact, not an afterthought: every image slot in every composed page
 * must be assigned a real, existing asset with human alt text BEFORE a
 * build is production-ready. Placeholder art fails closed.
 *
 * Rules:
 *   IMG-1  data/image-plan.json must exist and parse when compositions
 *          declare image slots (a skip is printed loudly when compositions
 *          are absent — a skip is not a pass)
 *   IMG-2  exact slot coverage: one entry per image slot per pattern
 *          instance per page (pattern image slots are counted from the
 *          pattern source files — the same truth WordPress renders)
 *   IMG-3  alt text: >= 5 chars, sentence-like, no filenames or
 *          placeholder words ("image", "photo", "placeholder")
 *   IMG-4  the asset file must exist and must not be the theme placeholder;
 *          {"pending": true, "reason": "..."} entries fail unless
 *          --allow-pending (drafting mode)
 *   IMG-5  hero slots must use a "photo" asset when captured/asset-inventory.json
 *          is present (warn-only without an inventory)
 *
 * Usage:
 *   node tools/validate-image-plan.mjs [--allow-pending] [--root <dir>] [--self-test]
 */

import { readFile, readdir, mkdir, writeFile, rm } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const DEFAULT_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PATTERNS_DIR = 'wp-content/themes/supersonic-site-theme/patterns';

async function patternImageSlotCounts(rootDir) {
  const dir = path.join(rootDir, PATTERNS_DIR);
  const counts = new Map();
  for (const file of await readdir(dir)) {
    if (!file.endsWith('.php')) continue;
    const source = await readFile(path.join(dir, file), 'utf8');
    const slug = /Slug:\s*(\S+)/.exec(source)?.[1];
    if (slug) {
      counts.set(slug, (source.match(/<!-- wp:image/g) ?? []).length);
    }
  }
  return counts;
}

export async function validateImagePlan({ rootDir = DEFAULT_ROOT, allowPending = false } = {}) {
  const failures = [];
  const warnings = [];
  const fail = (rule, detail) => failures.push(`${rule}: ${detail}`);

  const compositionsPath = path.join(rootDir, 'data', 'page-compositions.json');
  if (!existsSync(compositionsPath)) {
    warnings.push('IMG-1 SKIPPED: data/page-compositions.json not found — image coverage is NOT verified (a skip is not a pass).');
    return { failures, warnings };
  }
  const compositions = JSON.parse(await readFile(compositionsPath, 'utf8')).compositions ?? [];
  const slotCounts = await patternImageSlotCounts(rootDir);

  const required = [];
  for (const page of compositions) {
    for (const instance of page.patterns ?? []) {
      const count = slotCounts.get(instance.slug) ?? 0;
      for (let imageIndex = 1; imageIndex <= count; imageIndex += 1) {
        required.push({ page_id: page.page_id, position: instance.position, slug: instance.slug, imageIndex });
      }
    }
  }
  if (required.length === 0) {
    warnings.push('IMG-2 SKIPPED: composed pages declare no image slots.');
    return { failures, warnings };
  }

  const planPath = path.join(rootDir, 'data', 'image-plan.json');
  if (!existsSync(planPath)) {
    fail('IMG-1', `composed pages have ${required.length} image slot(s) but data/image-plan.json does not exist — run the layout image-plan step (curate assets with npm run image:curate first)`);
    return { failures, warnings };
  }
  let plan;
  try {
    plan = JSON.parse(await readFile(planPath, 'utf8'));
  } catch (error) {
    fail('IMG-1', `data/image-plan.json is not valid JSON: ${error.message}`);
    return { failures, warnings };
  }

  let inventory = null;
  const inventoryPath = path.join(rootDir, 'captured', 'asset-inventory.json');
  if (existsSync(inventoryPath)) {
    inventory = new Map(JSON.parse(await readFile(inventoryPath, 'utf8')).map((r) => [r.file, r]));
  }

  const entries = plan.slots ?? [];
  const keyOf = (e) => `${e.page_id}#${e.position}#${e.imageIndex}`;
  const byKey = new Map();
  for (const entry of entries) {
    const key = keyOf(entry);
    if (byKey.has(key)) {
      fail('IMG-2', `duplicate plan entry for ${key}`);
    }
    byKey.set(key, entry);
  }
  for (const slot of required) {
    const entry = byKey.get(keyOf(slot));
    if (!entry) {
      fail('IMG-2', `${slot.page_id} position ${slot.position} (${slot.slug}) image ${slot.imageIndex} has no image-plan entry`);
      continue;
    }
    byKey.delete(keyOf(slot));

    if (entry.pending) {
      if (allowPending) {
        warnings.push(`PENDING: ${slot.page_id}#${slot.position}#${slot.imageIndex} — ${entry.reason ?? 'no reason given'}`);
      } else {
        fail('IMG-4', `${slot.page_id} position ${slot.position} image ${slot.imageIndex} is pending (${entry.reason ?? 'no reason'}) — resolve before production (or draft with --allow-pending)`);
      }
      continue;
    }

    const alt = String(entry.alt ?? '').trim();
    if (alt.length < 5) {
      fail('IMG-3', `${slot.page_id} position ${slot.position} image ${slot.imageIndex}: alt text too short ("${alt}")`);
    } else if (/\.(jpe?g|png|webp|svg|gif)\b/i.test(alt) || /^(image|photo|picture|placeholder|img)[\s\d]*$/i.test(alt)) {
      fail('IMG-3', `${slot.page_id} position ${slot.position} image ${slot.imageIndex}: alt text looks like a filename/placeholder ("${alt}")`);
    }

    const asset = String(entry.asset ?? '');
    if (!asset) {
      fail('IMG-4', `${slot.page_id} position ${slot.position} image ${slot.imageIndex}: no asset path`);
    } else if (/pattern-placeholder/.test(asset)) {
      fail('IMG-4', `${slot.page_id} position ${slot.position} image ${slot.imageIndex}: still the theme placeholder — assign a real asset`);
    } else if (!existsSync(path.resolve(rootDir, asset))) {
      fail('IMG-4', `${slot.page_id} position ${slot.position} image ${slot.imageIndex}: asset not found: ${asset}`);
    } else if (/hero/.test(slot.slug)) {
      const record = inventory?.get(asset);
      if (inventory && record && record.kind !== 'photo') {
        fail('IMG-5', `${slot.page_id} hero image ${slot.imageIndex} uses a ${record.kind} (${asset}) — heroes need a photo`);
      } else if (!inventory) {
        warnings.push(`IMG-5 unverified for ${slot.page_id} hero (no captured/asset-inventory.json) — verify the hero asset is a real photo manually.`);
      }
    }
  }
  for (const orphanKey of byKey.keys()) {
    warnings.push(`ORPHAN: plan entry ${orphanKey} matches no composed slot (stale after recomposition?)`);
  }
  return { failures, warnings };
}

async function runCli() {
  const args = process.argv.slice(2);
  const rootIdx = args.indexOf('--root');
  const { failures, warnings } = await validateImagePlan({
    rootDir: rootIdx >= 0 ? path.resolve(args[rootIdx + 1]) : DEFAULT_ROOT,
    allowPending: args.includes('--allow-pending')
  });
  for (const warning of warnings) console.log(`WARN ${warning}`);
  for (const failure of failures) console.error(`FAIL ${failure}`);
  if (failures.length > 0) {
    console.error(`FAIL: ${failures.length} image-plan issue(s).`);
    process.exit(1);
  }
  console.log('OK: image plan covers every composed image slot with real assets and alt text.');
}

async function selfTest() {
  const results = [];
  const tmp = path.join(os.tmpdir(), `img-plan-test-${Date.now()}`);
  const patternsDir = path.join(tmp, PATTERNS_DIR);
  await mkdir(patternsDir, { recursive: true });
  await mkdir(path.join(tmp, 'data'), { recursive: true });
  await mkdir(path.join(tmp, 'assets'), { recursive: true });
  await writeFile(path.join(patternsDir, 'hero-x.php'), '/** Slug: t/hero-x */ <!-- wp:image -->');
  await writeFile(path.join(patternsDir, 'plain.php'), '/** Slug: t/plain */ no images');
  await writeFile(path.join(tmp, 'assets', 'van.jpg'), 'x');
  const compositions = { compositions: [{ page_id: 'home', patterns: [{ position: 1, slug: 't/hero-x' }, { position: 2, slug: 't/plain' }] }] };
  await writeFile(path.join(tmp, 'data', 'page-compositions.json'), JSON.stringify(compositions));

  const checkCase = async (name, plan, expectRule, opts = {}) => {
    await writeFile(path.join(tmp, 'data', 'image-plan.json'), JSON.stringify(plan));
    const { failures } = await validateImagePlan({ rootDir: tmp, ...opts });
    const hit = expectRule === null ? failures.length === 0 : failures.some((f) => f.startsWith(expectRule));
    results.push(`${hit ? 'PASS' : 'FAIL'}: ${name}${hit ? '' : ' — got ' + JSON.stringify(failures)}`);
  };

  await checkCase('clean plan passes', { slots: [{ page_id: 'home', position: 1, imageIndex: 1, asset: 'assets/van.jpg', alt: 'Service van parked in Wichita' }] }, null);
  await checkCase('missing slot fails IMG-2', { slots: [] }, 'IMG-2');
  await checkCase('filename alt fails IMG-3', { slots: [{ page_id: 'home', position: 1, imageIndex: 1, asset: 'assets/van.jpg', alt: 'van.jpg' }] }, 'IMG-3');
  await checkCase('placeholder asset fails IMG-4', { slots: [{ page_id: 'home', position: 1, imageIndex: 1, asset: 'images/pattern-placeholder.svg', alt: 'A nice picture of work' }] }, 'IMG-4');
  await checkCase('missing file fails IMG-4', { slots: [{ page_id: 'home', position: 1, imageIndex: 1, asset: 'assets/nope.jpg', alt: 'A nice picture of work' }] }, 'IMG-4');
  await checkCase('pending fails by default', { slots: [{ page_id: 'home', position: 1, imageIndex: 1, pending: true, reason: 'client shoot booked' }] }, 'IMG-4');
  await checkCase('pending allowed in draft mode', { slots: [{ page_id: 'home', position: 1, imageIndex: 1, pending: true, reason: 'client shoot booked' }] }, null, { allowPending: true });

  await rm(tmp, { recursive: true, force: true });
  for (const line of results) console.log(line);
  const failed = results.filter((line) => line.startsWith('FAIL')).length;
  console.log(failed === 0 ? `OK: ${results.length}/${results.length} self-test checks passed` : `FAIL: ${failed} check(s) failed`);
  process.exit(failed === 0 ? 0 : 1);
}

if (process.argv.includes('--self-test')) {
  await selfTest();
} else {
  await runCli();
}
