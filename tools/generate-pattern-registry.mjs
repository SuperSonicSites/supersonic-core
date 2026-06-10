#!/usr/bin/env node
/**
 * Generates docs/pattern-registry.md from data/pattern-certifications.json.
 *
 * The JSON registry is the single source of truth; the Markdown doc is a
 * deterministic rendering of it so humans can browse pattern status without
 * the doc drifting out of date (the failure mode this replaces).
 *
 * Usage:
 *   node tools/generate-pattern-registry.mjs                regenerate the doc
 *   node tools/generate-pattern-registry.mjs --check        exit 1 if the doc is stale (CI gate)
 *   node tools/generate-pattern-registry.mjs --self-test    offline fixture checks
 */

import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const REGISTRY_PATH = 'data/pattern-certifications.json';
const DOC_PATH = 'docs/pattern-registry.md';

const STATUS_ORDER = ['approved', 'screenshots-captured', 'qa-page-created', 'source-ready', 'needs-revision'];

const LIFECYCLE_NOTES = [
  '- `source-ready` — pattern file exists in the theme and passes static validation.',
  '- `qa-page-created` — a temporary staging QA page exists for visual review.',
  '- `screenshots-captured` — desktop/tablet/mobile screenshots captured for review.',
  '- `approved` — certified at the listed theme version; safe to compose into layouts.',
  '- `needs-revision` — review found issues; do not compose until re-certified.'
];

function shortSlug(slug) {
  return slug.includes('/') ? slug.split('/').pop() : slug;
}

function categoryHeading(category) {
  const stripped = category.replace(/^supersonic-/, '');
  return stripped.charAt(0).toUpperCase() + stripped.slice(1);
}

// Deterministic: categories in first-seen registry order, patterns sorted by slug
// within each category so regeneration never reorders rows spuriously.
export function renderRegistryDoc(registry) {
  const patterns = Array.isArray(registry.patterns) ? registry.patterns : [];

  const lines = [];
  lines.push('# Pattern Registry');
  lines.push('');
  lines.push('<!-- GENERATED FILE — do not edit by hand. -->');
  lines.push('<!-- Source of truth: data/pattern-certifications.json -->');
  lines.push('<!-- Regenerate with: npm run pattern:registry:generate -->');
  lines.push('');
  lines.push(
    'This document is generated from `data/pattern-certifications.json`. ' +
      'Edit that file (via the certification workflow) and regenerate; manual edits here will fail CI.'
  );
  lines.push('');

  lines.push('## Summary');
  lines.push('');
  lines.push(`- Total patterns: ${patterns.length}`);
  const byStatus = new Map();
  for (const p of patterns) {
    byStatus.set(p.status, (byStatus.get(p.status) ?? 0) + 1);
  }
  const statuses = [...byStatus.keys()].sort(
    (a, b) => (STATUS_ORDER.indexOf(a) + 100) - (STATUS_ORDER.indexOf(b) + 100) || a.localeCompare(b)
  );
  for (const status of statuses) {
    lines.push(`- ${status}: ${byStatus.get(status)}`);
  }
  lines.push('');

  const byCategory = new Map();
  for (const p of patterns) {
    const cat = p.category ?? 'uncategorized';
    if (!byCategory.has(cat)) {
      byCategory.set(cat, []);
    }
    byCategory.get(cat).push(p);
  }

  for (const [category, entries] of byCategory) {
    lines.push(`## ${categoryHeading(category)}`);
    lines.push('');
    lines.push('| Pattern | Title | Status | Theme version | Last reviewed | Copy slots |');
    lines.push('| --- | --- | --- | --- | --- | --- |');
    const sorted = [...entries].sort((a, b) => a.slug.localeCompare(b.slug));
    for (const p of sorted) {
      const slots = Array.isArray(p.copy_slots) ? String(p.copy_slots.length) : '0';
      const version = p.certifiedThemeVersion ?? '—';
      const reviewed = p.lastReviewedAt ?? '—';
      // Full slug stays in the cell: tools/validate-pattern-registry.mjs requires
      // every registry slug to appear verbatim in this doc.
      lines.push(
        `| \`${p.slug}\` ([source](../${p.sourceFile ?? ''})) | ${p.title ?? shortSlug(p.slug)} | ${p.status} | ${version} | ${reviewed} | ${slots} |`
      );
    }
    lines.push('');
  }

  lines.push('## Lifecycle states');
  lines.push('');
  lines.push(...LIFECYCLE_NOTES);
  lines.push('');

  return lines.join('\n');
}

async function loadRegistry() {
  const raw = await readFile(path.join(ROOT, REGISTRY_PATH), 'utf8');
  return JSON.parse(raw);
}

async function generate() {
  const registry = await loadRegistry();
  const doc = renderRegistryDoc(registry);
  await writeFile(path.join(ROOT, DOC_PATH), `${doc}\n`.replace(/\n+$/, '\n'), 'utf8');
  console.log(`OK: wrote ${DOC_PATH} (${registry.patterns.length} patterns)`);
}

async function check() {
  const registry = await loadRegistry();
  const expected = `${renderRegistryDoc(registry)}\n`.replace(/\n+$/, '\n');
  const actual = await readFile(path.join(ROOT, DOC_PATH), 'utf8').catch(() => '');
  if (actual !== expected) {
    console.error(`FAIL: ${DOC_PATH} is stale relative to ${REGISTRY_PATH}.`);
    console.error('Fix: run `npm run pattern:registry:generate` and commit the result.');
    process.exit(1);
  }
  console.log(`OK: ${DOC_PATH} is in sync with ${REGISTRY_PATH}`);
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

  const fixture = {
    patterns: [
      {
        slug: 'theme/zeta-hero',
        title: 'Zeta Hero',
        category: 'supersonic-heroes',
        sourceFile: 'wp-content/themes/t/patterns/zeta-hero.php',
        status: 'approved',
        certifiedThemeVersion: '0.2.0',
        lastReviewedAt: '2026-01-01',
        copy_slots: [{ id: 'a' }, { id: 'b' }]
      },
      {
        slug: 'theme/alpha-hero',
        title: 'Alpha Hero',
        category: 'supersonic-heroes',
        sourceFile: 'wp-content/themes/t/patterns/alpha-hero.php',
        status: 'needs-revision'
      }
    ]
  };

  checkCase('doc carries generated-file header', () => {
    const doc = renderRegistryDoc(fixture);
    assert(doc.includes('GENERATED FILE'), 'missing generated header');
    assert(doc.includes('pattern:registry:generate'), 'missing regenerate hint');
  });

  checkCase('every slug appears verbatim', () => {
    const doc = renderRegistryDoc(fixture);
    assert(doc.includes('theme/zeta-hero') && doc.includes('theme/alpha-hero'), 'slug missing');
  });

  checkCase('summary counts by status', () => {
    const doc = renderRegistryDoc(fixture);
    assert(doc.includes('Total patterns: 2'), 'wrong total');
    assert(doc.includes('approved: 1') && doc.includes('needs-revision: 1'), 'wrong status counts');
  });

  checkCase('rows sorted by slug within category', () => {
    const doc = renderRegistryDoc(fixture);
    assert(doc.indexOf('theme/alpha-hero') < doc.indexOf('theme/zeta-hero'), 'rows not sorted');
  });

  checkCase('copy slot counts rendered', () => {
    const doc = renderRegistryDoc(fixture);
    const zetaRow = doc.split('\n').find((l) => l.includes('theme/zeta-hero'));
    assert(zetaRow.trim().endsWith('| 2 |'), `expected 2 slots in row: ${zetaRow}`);
  });

  checkCase('deterministic output', () => {
    assert(renderRegistryDoc(fixture) === renderRegistryDoc(fixture), 'output not stable');
  });

  checkCase('empty registry renders without throwing', () => {
    const doc = renderRegistryDoc({ patterns: [] });
    assert(doc.includes('Total patterns: 0'), 'empty render broken');
  });

  for (const line of results) {
    console.log(line);
  }
  const failed = results.filter((line) => line.startsWith('FAIL')).length;
  console.log(failed === 0 ? `OK: ${results.length}/${results.length} self-test checks passed` : `FAIL: ${failed} check(s) failed`);
  process.exit(failed === 0 ? 0 : 1);
}

const arg = process.argv[2];
if (arg === '--self-test') {
  selfTest();
} else if (arg === '--check') {
  await check();
} else {
  await generate();
}
