// redirects:check -- the redirect-map gate for redesign builds.
//
// Validates data/redirects.csv (Git source of truth for Rank Math redirects,
// see SEO_STRATEGY.md) BEFORE it is exported to Rank Math, so a broken map
// fails closed here with a named, blame-routed RED-* rule instead of shipping
// chains, loops, dead destinations, or uncovered legacy URLs to staging.
// Parsing is shared with tools/export-rankmath-redirects.mjs via
// tools/lib/redirects.mjs so the gate and the export never disagree on what a
// row means.
//
// Rules:
//   RED-1 structure: exact header, non-empty site-relative "from", "to"
//         required unless 410, status in {301,302,410}, no full URLs in
//         "from", no NEEDS-MAPPING residue (curation unfinished).
//   RED-2 no chains: a non-410 "to" must not equal another row's "from".
//   RED-3 no loops: "from" != "to" after normalization, and no cycles.
//   RED-4 destination exists: every non-410 "to" must resolve to a known
//         new-site path (intake pages[] + data/page-compositions.json +
//         allowlist "/", "/blog/"); absolute/external URLs are rejected.
//   RED-5 coverage: every 200-status path in data/legacy-inventory.json that
//         is not kept on the new site must appear as a "from" (SKIP, not
//         pass, when no snapshot is committed).
//   RED-6 no duplicate "from" (trailing-slash-insensitive).
//
// Usage:
//   node tools/validate-redirects.mjs                     # checks data/redirects.csv
//   node tools/validate-redirects.mjs --csv path/to.csv   # custom CSV path
//   node tools/validate-redirects.mjs --self-test         # offline fixture run
//
// Fails closed: any FAIL exits 1. RED-5 without a committed legacy inventory
// is reported as an explicit SKIP, never as a pass.

import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  checkRedirectRowStructure,
  normalizeRedirectPath,
  parseRedirectsCsv
} from './lib/redirects.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const defaultRoot = path.resolve(__dirname, '..');

const FULL_URL_RE = /^[a-z][a-z0-9+.-]*:\/\//i;
const TBD_RE = /^tbd$/i;
const DESTINATION_ALLOWLIST = ['/', '/blog/'];
const ROUTE_CURATION = 'route to redirect curation (new-site-init Redesign Branch)';

function urlPathname(value) {
  try {
    return new URL(value).pathname || '/';
  } catch {
    return null;
  }
}

// Builds the set of known new-site paths RED-4/RED-5 resolve against.
// Sources: "/" + the allowlist, intake pages[] slugs (TBD placeholders are
// skipped), and url_slugs from data/page-compositions.json when present (the
// .example.json file is never a source). Returns { paths, sources }.
export function buildNewSitePaths({ intakePages, compositionsDoc } = {}) {
  const paths = new Set();
  const sources = [`allowlist (${DESTINATION_ALLOWLIST.join(', ')})`];
  for (const allowed of DESTINATION_ALLOWLIST) {
    paths.add(normalizeRedirectPath(allowed));
  }

  const usablePages = (Array.isArray(intakePages) ? intakePages : []).filter(
    (page) =>
      page &&
      typeof page.slug === 'string' &&
      page.slug.trim() !== '' &&
      !TBD_RE.test(page.slug.trim())
  );
  if (usablePages.length > 0) {
    for (const page of usablePages) {
      paths.add(normalizeRedirectPath(page.slug));
    }
    sources.push('data/site-intake.json pages[]');
  }

  const compositions = Array.isArray(compositionsDoc && compositionsDoc.compositions)
    ? compositionsDoc.compositions
    : [];
  if (compositions.length > 0) {
    for (const composition of compositions) {
      const normalized = normalizeRedirectPath(composition && composition.url_slug);
      if (normalized) {
        paths.add(normalized);
      }
    }
    sources.push('data/page-compositions.json');
  }

  return { paths, sources };
}

// Pure rule engine. Takes the raw CSV text, the known new-site path set, and
// the optional legacy inventory (null = no committed snapshot). Returns
// { issues: [{rule, message}], notes: [string], skips: [string], rowCount }.
export function checkRedirects({ csvText, newSitePaths, legacyInventory = null }) {
  const issues = [];
  const notes = [];
  const skips = [];
  const fail = (rule, message) => issues.push({ rule, message });

  const { paths, sources } = newSitePaths || buildNewSitePaths({});
  const { issues: parseIssues, rows } = parseRedirectsCsv(csvText);
  for (const parseIssue of parseIssues) {
    fail('RED-1', `${parseIssue}; ${ROUTE_CURATION}`);
  }

  // --- RED-1: per-row structure -------------------------------------------
  const validRows = [];
  for (const row of rows) {
    let structureIssues = checkRedirectRowStructure(row);
    let fullUrlFrom = false;

    if (FULL_URL_RE.test(row.from)) {
      fullUrlFrom = true;
      structureIssues = structureIssues.filter(
        (message) => !message.includes('"from" must be a path starting with')
      );
      const pathname = urlPathname(row.from);
      structureIssues.push(
        `line ${row.lineNumber}: "from" is a full URL ("${row.from}"); use the site-relative path instead — strip the scheme and host${pathname ? ` and keep "${pathname}"` : ''}`
      );
    }

    if (/NEEDS-MAPPING/.test(row.notes)) {
      structureIssues.push(
        `line ${row.lineNumber}: notes still say NEEDS-MAPPING for "${row.from}" — redirect curation is unfinished; map it to a real destination (301/302) or mark it 410 first`
      );
    }

    for (const message of structureIssues) {
      fail('RED-1', `${message}; ${ROUTE_CURATION}`);
    }
    if (checkRedirectRowStructure(row).length === 0 && !fullUrlFrom) {
      validRows.push(row);
    }
  }

  // --- RED-6: duplicate "from" (trailing-slash-insensitive) ----------------
  const firstByFrom = new Map(); // normalized from -> row
  for (const row of validRows) {
    const key = normalizeRedirectPath(row.from);
    if (firstByFrom.has(key)) {
      const first = firstByFrom.get(key);
      fail(
        'RED-6',
        `line ${row.lineNumber}: duplicate "from" "${row.from}" also appears as "${first.from}" on line ${first.lineNumber} (trailing-slash-insensitive); keep exactly one row; ${ROUTE_CURATION}`
      );
    } else {
      firstByFrom.set(key, row);
    }
  }

  // --- RED-2: no chains / RED-3: no loops or cycles -------------------------
  const nextHop = new Map(); // normalized from -> normalized to (non-410 only)
  for (const row of validRows) {
    if (row.status === '410') {
      continue;
    }
    const fromKey = normalizeRedirectPath(row.from);
    const toKey = normalizeRedirectPath(row.to);

    if (fromKey === toKey) {
      fail(
        'RED-3',
        `line ${row.lineNumber}: loop: "${row.from}" redirects to itself ("${row.to}" is the same path after normalization); remove the row or fix the destination; ${ROUTE_CURATION}`
      );
      continue;
    }
    if (!nextHop.has(fromKey)) {
      nextHop.set(fromKey, toKey);
    }

    const target = firstByFrom.get(toKey);
    if (target && target !== row) {
      if (target.status === '410') {
        fail(
          'RED-2',
          `line ${row.lineNumber}: chain: "${row.from}" -> "${row.to}" but line ${target.lineNumber} marks "${target.from}" as 410 Gone; make "${row.from}" 410 directly or pick a live destination; ${ROUTE_CURATION}`
        );
      } else {
        fail(
          'RED-2',
          `line ${row.lineNumber}: chain: "${row.from}" -> "${row.to}" and line ${target.lineNumber} redirects "${target.from}" -> "${target.to}"; collapse to the direct mapping "${row.from}" -> "${target.to}"; ${ROUTE_CURATION}`
        );
      }
    }
  }

  // Cycles across rows (a -> b -> ... -> a). Self-loops are reported above.
  const reportedCycles = new Set();
  for (const start of nextHop.keys()) {
    const stack = [];
    const inStack = new Set();
    let current = start;
    while (current !== undefined && nextHop.has(current) && !inStack.has(current)) {
      stack.push(current);
      inStack.add(current);
      current = nextHop.get(current);
    }
    if (current !== undefined && inStack.has(current)) {
      const cycle = stack.slice(stack.indexOf(current));
      if (cycle.length > 1) {
        const canonical = [...cycle].sort().join('|');
        if (!reportedCycles.has(canonical)) {
          reportedCycles.add(canonical);
          fail(
            'RED-3',
            `redirect cycle: ${[...cycle, cycle[0]].join(' -> ')}; break the cycle so every path resolves to a final page; ${ROUTE_CURATION}`
          );
        }
      }
    }
  }

  // --- RED-4: destination exists --------------------------------------------
  for (const row of validRows) {
    if (row.status === '410') {
      continue;
    }
    if (FULL_URL_RE.test(row.to)) {
      fail(
        'RED-4',
        `line ${row.lineNumber}: destination "${row.to}" is an absolute/external URL; redirects must stay on-site — use a site-relative path; ${ROUTE_CURATION}`
      );
      continue;
    }
    const toKey = normalizeRedirectPath(row.to);
    if (!paths.has(toKey)) {
      fail(
        'RED-4',
        `line ${row.lineNumber}: destination "${row.to}" is not a known new-site path (checked: ${sources.join(', ')}); fix the destination or add the page — route to layout-architect for missing pages, otherwise redirect curation`
      );
    }
  }

  // --- empty-map note --------------------------------------------------------
  if (parseIssues.length === 0 && rows.length === 0) {
    notes.push(
      'the redirect map is empty (header only) — no redirects are defined yet. Fine for non-redesign builds; redesign builds must curate it before launch.'
    );
  }

  // --- RED-5: legacy coverage ------------------------------------------------
  if (legacyInventory === null) {
    skips.push(
      'RED-5: legacy coverage SKIPPED — data/legacy-inventory.json not found, so coverage is NOT verified (a skip is not a pass). For redesign builds, curate captured/inventory.json into data/legacy-inventory.json and re-run.'
    );
  } else if (!Array.isArray(legacyInventory)) {
    fail('RED-5', 'data/legacy-inventory.json must be a JSON array of inventory records ({ path/url, status, ... }); re-curate it from captured/inventory.json');
  } else {
    const coveredFroms = new Set(
      rows
        .filter((row) => row.from.startsWith('/'))
        .map((row) => normalizeRedirectPath(row.from))
    );
    for (const record of legacyInventory) {
      if (!record || typeof record !== 'object' || Number(record.status) !== 200) {
        continue;
      }
      const recordPath =
        typeof record.path === 'string' && record.path.trim() !== ''
          ? record.path
          : urlPathname(String(record.url || ''));
      const key = normalizeRedirectPath(recordPath);
      if (!key || paths.has(key) || coveredFroms.has(key)) {
        continue;
      }
      fail(
        'RED-5',
        `legacy URL "${key}" returned 200 on the old site but has no new-site page and no redirect row; add a 301/302 "from" row (or 410 it deliberately); ${ROUTE_CURATION}`
      );
    }
  }

  return { issues, notes, skips, rowCount: rows.length };
}

async function exists(absolutePath) {
  try {
    await stat(absolutePath);
    return true;
  } catch {
    return false;
  }
}

export async function validateRedirects({ rootDir = defaultRoot, csvPath = 'data/redirects.csv' } = {}) {
  const results = [];
  const csvLabel = csvPath;

  let csvText;
  try {
    csvText = await readFile(path.resolve(rootDir, csvPath), 'utf8');
  } catch (error) {
    results.push({ status: 'fail', message: `RED-1: cannot read ${csvLabel}: ${error.message}` });
    return results;
  }

  let intakePages = [];
  const intakePath = path.join(rootDir, 'data/site-intake.json');
  if (await exists(intakePath)) {
    try {
      const intake = JSON.parse(await readFile(intakePath, 'utf8'));
      intakePages = Array.isArray(intake && intake.pages) ? intake.pages : [];
    } catch (error) {
      results.push({ status: 'fail', message: `RED-4: data/site-intake.json is invalid JSON: ${error.message}` });
      return results;
    }
  }

  let compositionsDoc = null;
  const compositionsPath = path.join(rootDir, 'data/page-compositions.json');
  if (await exists(compositionsPath)) {
    try {
      compositionsDoc = JSON.parse(await readFile(compositionsPath, 'utf8'));
    } catch (error) {
      results.push({ status: 'fail', message: `RED-4: data/page-compositions.json is invalid JSON: ${error.message}` });
      return results;
    }
  }

  let legacyInventory = null;
  const inventoryPath = path.join(rootDir, 'data/legacy-inventory.json');
  if (await exists(inventoryPath)) {
    try {
      legacyInventory = JSON.parse(await readFile(inventoryPath, 'utf8'));
    } catch (error) {
      results.push({ status: 'fail', message: `RED-5: data/legacy-inventory.json is invalid JSON: ${error.message}` });
      return results;
    }
  }

  const newSitePaths = buildNewSitePaths({ intakePages, compositionsDoc });
  const { issues, notes, skips, rowCount } = checkRedirects({ csvText, newSitePaths, legacyInventory });

  for (const note of notes) {
    results.push({ status: 'note', message: `${csvLabel}: ${note}` });
  }
  for (const skip of skips) {
    results.push({ status: 'skip', message: skip });
  }
  if (issues.length === 0) {
    results.push({
      status: 'pass',
      message: `${csvLabel} passes redirect rules RED-1/2/3/4/6 (${rowCount} row${rowCount === 1 ? '' : 's'}; destinations checked against ${newSitePaths.paths.size} known new-site paths)`
    });
  } else {
    for (const issue of issues) {
      results.push({ status: 'fail', message: `${issue.rule}: ${csvLabel} ${issue.message}` });
    }
  }

  return results;
}

// --- self-test ---------------------------------------------------------------

function assertCase(results, name, condition) {
  results.push({
    status: condition ? 'pass' : 'fail',
    message: condition ? `self-test: ${name}` : `self-test FAILED: ${name} (detector is lax)`
  });
}

export async function runSelfTest() {
  const results = [];
  const fixturesDir = path.join(__dirname, 'fixtures', 'redirects');
  const fixture = (name) => readFile(path.join(fixturesDir, name), 'utf8');
  const jsonFixture = async (name) => JSON.parse(await fixture(name));

  const newSitePaths = buildNewSitePaths({
    intakePages: await jsonFixture('intake-pages.json'),
    compositionsDoc: await jsonFixture('compositions.json')
  });
  const run = async (csvName, legacyInventory = null) =>
    checkRedirects({ csvText: await fixture(csvName), newSitePaths, legacyInventory });
  const fired = (outcome, rule, fragment) =>
    outcome.issues.some((issue) => issue.rule === rule && issue.message.includes(fragment));

  // buildNewSitePaths
  assertCase(
    results,
    'new-site path set includes intake pages, composition slugs, and the allowlist',
    ['/', '/blog', '/services', '/about', '/contact', '/drain-cleaning'].every((p) => newSitePaths.paths.has(p))
  );
  assertCase(
    results,
    'TBD intake placeholders contribute no paths',
    buildNewSitePaths({ intakePages: [{ title: 'TBD', slug: 'TBD' }] }).paths.size === 2
  );

  // clean set
  const clean = await run('clean.csv', await jsonFixture('legacy-inventory.json'));
  assertCase(results, 'clean fixture has zero issues', clean.issues.length === 0);
  assertCase(results, 'clean fixture emits no skips when the legacy inventory is provided', clean.skips.length === 0);

  // RED-1
  assertCase(results, 'RED-1 wrong header fails closed', fired(await run('bad-header.csv'), 'RED-1', 'header must be exactly'));
  assertCase(results, 'RED-1 empty "to" on a 301 fails closed', fired(await run('empty-to.csv'), 'RED-1', '"to" must not be empty'));
  assertCase(results, 'RED-1 bad status fails closed', fired(await run('bad-status.csv'), 'RED-1', 'status must be 301, 302, or 410'));
  assertCase(
    results,
    'RED-1 full URL in "from" fails with a strip-the-host fix message',
    fired(await run('full-url-from.csv'), 'RED-1', 'strip the scheme and host')
  );
  assertCase(
    results,
    'RED-1 NEEDS-MAPPING residue fails closed',
    fired(await run('needs-mapping.csv'), 'RED-1', 'NEEDS-MAPPING')
  );
  assertCase(
    results,
    'RED-1 truly empty input fails closed',
    fired(checkRedirects({ csvText: '', newSitePaths }), 'RED-1', 'input is empty')
  );

  // RED-2 / RED-3
  const chain = await run('chain.csv');
  assertCase(results, 'RED-2 chain fails closed', fired(chain, 'RED-2', 'chain:'));
  assertCase(
    results,
    'RED-2 reports the collapsed direct mapping',
    fired(chain, 'RED-2', 'collapse to the direct mapping "/very-old-about" -> "/about"')
  );
  assertCase(results, 'RED-3 self-loop fails closed', fired(await run('loop.csv'), 'RED-3', 'redirects to itself'));
  assertCase(results, 'RED-3 cross-row cycle fails closed', fired(await run('cycle.csv'), 'RED-3', 'redirect cycle'));

  // RED-4
  assertCase(
    results,
    'RED-4 unknown destination fails closed',
    fired(await run('unknown-destination.csv'), 'RED-4', 'not a known new-site path')
  );
  assertCase(
    results,
    'RED-4 external destination fails closed (redirects stay on-site)',
    fired(await run('external-destination.csv'), 'RED-4', 'must stay on-site')
  );

  // RED-5
  const uncovered = await run('clean.csv', await jsonFixture('legacy-inventory-uncovered.json'));
  assertCase(
    results,
    'RED-5 uncovered legacy 200 URL fails closed and names the path',
    fired(uncovered, 'RED-5', '"/lost-page"')
  );
  assertCase(
    results,
    'RED-5 ignores non-200 legacy records',
    !uncovered.issues.some((issue) => issue.message.includes('/broken'))
  );
  const noInventory = await run('clean.csv', null);
  assertCase(
    results,
    'RED-5 without a committed inventory is an explicit SKIP, not a pass',
    noInventory.skips.length === 1 &&
      noInventory.skips[0].includes('RED-5') &&
      noInventory.skips[0].includes('SKIPPED')
  );

  // RED-6
  assertCase(
    results,
    'RED-6 duplicate "from" fails closed (trailing-slash-insensitive)',
    fired(await run('duplicate-from.csv'), 'RED-6', 'duplicate "from"')
  );

  // header-only behavior
  const headerOnly = await run('header-only.csv', null);
  assertCase(
    results,
    'header-only CSV passes structure with an empty-map NOTE',
    headerOnly.issues.length === 0 && headerOnly.notes.length === 1 && headerOnly.notes[0].includes('empty')
  );
  const headerOnlyWithLegacy = await run('header-only.csv', await jsonFixture('legacy-inventory-uncovered.json'));
  assertCase(
    results,
    'header-only CSV still fails RED-5 when uncovered legacy URLs exist',
    fired(headerOnlyWithLegacy, 'RED-5', '"/lost-page"') && fired(headerOnlyWithLegacy, 'RED-5', '"/about-us"')
  );

  return results;
}

// --- CLI -----------------------------------------------------------------------

const STATUS_LABEL = { pass: 'PASS', fail: 'FAIL', skip: 'SKIP', note: 'NOTE' };

if (process.argv[1] === __filename) {
  const args = process.argv.slice(2);
  let results;
  if (args.includes('--self-test')) {
    results = await runSelfTest();
  } else {
    const csvIndex = args.indexOf('--csv');
    const csvPath = csvIndex !== -1 ? args[csvIndex + 1] : undefined;
    if (csvIndex !== -1 && !csvPath) {
      console.log('FAIL: --csv requires a path argument');
      process.exit(1);
    }
    results = await validateRedirects(csvPath ? { csvPath } : {});
  }
  for (const result of results) {
    console.log(`${STATUS_LABEL[result.status] || 'FAIL'}: ${result.message}`);
  }
  if (results.some((result) => result.status === 'fail')) {
    process.exit(1);
  }
}
