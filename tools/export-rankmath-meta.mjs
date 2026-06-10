#!/usr/bin/env node
/**
 * Exports per-page SEO metadata from data/seo-briefs.json into a Rank Math
 * application file: data/rankmath-meta.csv (one row per page: slug, SEO
 * title, meta description, focus keyword). The owner applies it on staging
 * via Rank Math's CSV importer (Pro) or as the per-page checklist while
 * filling the Rank Math meta box — this tool never writes to WordPress.
 *
 * Rules (fail closed):
 *   META-1  seo_title 30-60 chars (upper bound matches validate-seo-briefs;
 *           floor guards against thin titles reaching Rank Math)
 *   META-2  meta_description 120-160 chars (same alignment)
 *   META-3  duplicate slug, title, or description across pages
 *
 * Usage:
 *   node tools/export-rankmath-meta.mjs [--briefs data/seo-briefs.json] [--out data/rankmath-meta.csv]
 *   node tools/export-rankmath-meta.mjs --self-test
 */

import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

const HEADER = ['slug', 'seo_title', 'meta_description', 'focus_keyword'];

function csvField(value) {
  const s = String(value ?? '');
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

// Pure: briefs -> { ok, failures: [{rule, detail}], rows, csv }.
export function buildMetaExport(briefs) {
  const failures = [];
  const rows = [];
  const seen = { slug: new Map(), title: new Map(), description: new Map() };

  for (const brief of Array.isArray(briefs) ? briefs : []) {
    const slug = String(brief.url_slug ?? '');
    const title = String(brief.seo_title ?? '');
    const description = String(brief.meta_description ?? '');
    const keyword = String(brief.primary_keyword?.term ?? '');

    if (title.length < 30 || title.length > 60) {
      failures.push({ rule: 'META-1', detail: `${slug} seo_title is ${title.length} chars (need 30-60)` });
    }
    if (description.length < 120 || description.length > 160) {
      failures.push({ rule: 'META-2', detail: `${slug} meta_description is ${description.length} chars (need 120-160)` });
    }
    for (const [key, value] of [['slug', slug], ['title', title], ['description', description]]) {
      const prior = seen[key].get(value.toLowerCase());
      if (prior !== undefined) {
        failures.push({ rule: 'META-3', detail: `${slug} duplicates the ${key} of ${prior}` });
      } else {
        seen[key].set(value.toLowerCase(), slug);
      }
    }
    rows.push({ slug, seo_title: title, meta_description: description, focus_keyword: keyword });
  }

  rows.sort((a, b) => a.slug.localeCompare(b.slug));
  const csv = [HEADER.join(','), ...rows.map((row) => HEADER.map((key) => csvField(row[key])).join(','))].join('\n') + '\n';
  return { ok: failures.length === 0, failures, rows, csv };
}

async function run(briefsPath, outPath) {
  const data = JSON.parse(await readFile(path.resolve(ROOT, briefsPath), 'utf8'));
  const briefs = data.briefs ?? [];
  if (briefs.length === 0) {
    console.error(`FAIL: ${briefsPath} has no briefs — run the seo-strategist stage first.`);
    process.exit(1);
  }
  const result = buildMetaExport(briefs);
  for (const failure of result.failures) {
    console.error(`FAIL ${failure.rule}: ${failure.detail}`);
  }
  if (!result.ok) {
    console.error(`FAIL: ${result.failures.length} issue(s) — fix data/seo-briefs.json (seo:briefs:check should agree).`);
    process.exit(1);
  }
  await writeFile(path.resolve(ROOT, outPath), result.csv, 'utf8');
  console.log(`OK: wrote ${outPath} (${result.rows.length} pages). Apply on staging via Rank Math; never auto-applied.`);
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

  const good = (slug, n) => ({
    url_slug: slug,
    seo_title: `Emergency Plumber in Dallas TX | 24/7 Fast Help ${n}`.padEnd(52, '.').slice(0, 55),
    meta_description: `Licensed Dallas plumbers on call 24/7 for burst pipes, leaks, and water heaters with same-day service, upfront pricing, and fast local help ${n}.`.slice(0, 150),
    primary_keyword: { term: `keyword ${n}` }
  });

  checkCase('clean briefs export: sorted rows, header, keyword column', () => {
    const result = buildMetaExport([good('/b', 1), good('/a', 2)]);
    assert(result.ok, JSON.stringify(result.failures));
    const lines = result.csv.trim().split('\n');
    assert(lines[0] === 'slug,seo_title,meta_description,focus_keyword', lines[0]);
    assert(lines[1].startsWith('/a,') && lines[2].startsWith('/b,'), 'rows not sorted by slug');
    assert(lines[1].includes('keyword 2'), 'focus keyword missing');
  });

  checkCase('META-1 short title fails', () => {
    const bad = { ...good('/x', 1), seo_title: 'Too short' };
    const result = buildMetaExport([bad]);
    assert(!result.ok && result.failures.some((f) => f.rule === 'META-1'), JSON.stringify(result.failures));
  });

  checkCase('META-2 long description fails', () => {
    const bad = { ...good('/x', 1), meta_description: 'x'.repeat(200) };
    const result = buildMetaExport([bad]);
    assert(!result.ok && result.failures.some((f) => f.rule === 'META-2'), JSON.stringify(result.failures));
  });

  checkCase('META-3 duplicate title across slugs fails', () => {
    const a = good('/a', 1);
    const b = { ...good('/b', 2), seo_title: a.seo_title };
    const result = buildMetaExport([a, b]);
    assert(!result.ok && result.failures.some((f) => f.rule === 'META-3' && /title/.test(f.detail)), JSON.stringify(result.failures));
  });

  checkCase('CSV escaping: commas and quotes survive round-trip shape', () => {
    const tricky = { ...good('/x', 1) };
    tricky.meta_description = `Licensed plumbers, "fast" help on call 24/7 for pipes, leaks, and heaters with same-day service, upfront pricing, and trusted local pros here.`;
    const result = buildMetaExport([tricky]);
    assert(result.ok, JSON.stringify(result.failures));
    assert(result.csv.includes('"Licensed plumbers, ""fast"" help'), 'quoting wrong');
  });

  checkCase('deterministic output', () => {
    const briefs = [good('/b', 1), good('/a', 2)];
    assert(buildMetaExport(briefs).csv === buildMetaExport(briefs).csv, 'not deterministic');
  });

  for (const line of results) {
    console.log(line);
  }
  const failed = results.filter((line) => line.startsWith('FAIL')).length;
  console.log(failed === 0 ? `OK: ${results.length}/${results.length} self-test checks passed` : `FAIL: ${failed} check(s) failed`);
  process.exit(failed === 0 ? 0 : 1);
}

const args = process.argv.slice(2);
if (args.includes('--self-test')) {
  selfTest();
} else {
  const briefsArg = args.indexOf('--briefs');
  const outArg = args.indexOf('--out');
  await run(briefsArg >= 0 ? args[briefsArg + 1] : 'data/seo-briefs.json', outArg >= 0 ? args[outArg + 1] : 'data/rankmath-meta.csv');
}
