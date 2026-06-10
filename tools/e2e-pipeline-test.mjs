#!/usr/bin/env node
/**
 * End-to-end pipeline stress test: runs mock client engagements A-to-Z
 * through the REAL tools and gates — synthetic legacy site served on
 * localhost, capture, redirect curation, briefs/copy/composition gates,
 * design-DNA compile, Rank Math exports, packaging — each in an isolated
 * copy of the repo, then injects deliberate corruptions and asserts the
 * gates FAIL with the right rule (a gate that cannot fail is not a gate).
 *
 * The AI stages (seo-strategist, copywriter) are simulated by instantiating
 * the repo's coherent .example.json dataset per business — this harness
 * tests the MECHANICAL pipeline, not model output quality.
 *
 * Usage:
 *   node tools/e2e-pipeline-test.mjs                 full run (4 businesses + negative suite)
 *   node tools/e2e-pipeline-test.mjs --skip-render   skip the WordPress Playground render leg
 *   node tools/e2e-pipeline-test.mjs --keep          keep /tmp workspaces for inspection
 *   node tools/e2e-pipeline-test.mjs --business plumber-redesign   run one
 */

import { spawn } from 'node:child_process';
import { cp, mkdir, readFile, rm, symlink, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const WORK_ROOT = path.join(os.tmpdir(), 'supersonic-e2e');

// ---------------------------------------------------------------------------
// Mock businesses. All reuse the example dataset's new-site slugs
// (/ , /drain-cleaning , /why-drains-clog) so cross-file coherence holds;
// they vary in legacy-site shape, brand DNA, and expected outcomes.
// ---------------------------------------------------------------------------

const BUSINESSES = [
  {
    id: 'plumber-redesign',
    clientName: 'Apex Plumbing Co',
    isRedesign: true,
    port: 9610,
    colors: ['#0b5fd0', '#0a2a4a'],
    fonts: ['Archivo', 'Source Sans 3'],
    // Legacy paths exercise: home, near-match (auto-mapping candidate), blog
    // post needing manual mapping, junk page for 410, utm duplicate, a 404
    // link target, and an uppercase alias of an existing page.
    legacyPages: [
      { path: '/', title: 'Apex Plumbing | Dallas Plumber', h2: 'Trusted Dallas plumbing since 1998' },
      { path: '/services/drain-cleaning/', title: 'Drain Cleaning Dallas', h2: 'Drain cleaning that lasts' },
      { path: '/blog/why-do-drains-clog/', title: 'Why Do Drains Clog?', h2: 'The 5 usual suspects' },
      { path: '/old-coupons/', title: 'Coupons 2019', h2: 'Expired offers' },
      { path: '/about-us/', title: 'About Apex', h2: 'Family owned' }
    ],
    sitemapExtras: ['/services/drain-cleaning/?utm_source=feed', '/About-Us/'],
    deadLinks: ['/this-page-died/'],
    curation: {
      '/': '/',
      '/services/drain-cleaning': '/drain-cleaning',
      '/blog/why-do-drains-clog': '/why-drains-clog',
      '/old-coupons': '410',
      '/about-us': '/'
    },
    knownTopPages: [{ url: '/services/drain-cleaning', keywords: ['drain cleaning dallas'] }],
    expect: { dna: 'pass' }
  },
  {
    id: 'dental-newbuild',
    clientName: 'Bright Smile Dental',
    isRedesign: false,
    port: 0, // no legacy site
    colors: ['#0e7c6b', '#123332'],
    fonts: ['Poppins'],
    legacyPages: [],
    curation: {},
    knownTopPages: [],
    expect: { dna: 'pass' }
  },
  {
    id: 'landscaper-messy',
    clientName: 'Verde Landscaping & Diseño',
    isRedesign: true,
    port: 9611,
    colors: ['#3f7d20', '#1f3d0c', '#f4a259'],
    fonts: ['Fraunces', 'Inter'],
    legacyPages: [
      { path: '/', title: 'Verde Landscaping', h2: 'Outdoor spaces, hecho bien' },
      { path: '/servicios/diseño-de-jardines/', title: 'Diseño de Jardines', h2: 'Garden design' },
      { path: '/gallery/spring//2021/', title: 'Gallery', h2: 'Double-slash depths' },
      { path: '/quote', title: 'Get a Quote', h2: 'Fast quotes' }
    ],
    sitemapExtras: ['/ghost-page-in-sitemap/'],
    deadLinks: [],
    curation: {
      '/': '/',
      '/servicios/dise%C3%B1o-de-jardines': '/drain-cleaning',
      '/servicios/diseño-de-jardines': '/drain-cleaning',
      '/gallery/spring/2021': '410',
      '/gallery/spring//2021': '410',
      '/quote': '/',
      '/ghost-page-in-sitemap': '410'
    },
    knownTopPages: [],
    expect: { dna: 'pass' }
  },
  {
    id: 'consultant-neutral',
    clientName: 'Greyline Consulting',
    isRedesign: false,
    port: 0,
    colors: ['#f5f5f5', '#d8d8d8', '#101010'],
    fonts: ['Georgia'],
    legacyPages: [],
    curation: {},
    knownTopPages: [],
    // All-neutral brand: design compiler must refuse (DNA-4), not invent.
    expect: { dna: 'DNA-4' }
  }
];

// ---------------------------------------------------------------------------
// Synthetic legacy site
// ---------------------------------------------------------------------------

function pageHtml(biz, page, allPages, deadLinks) {
  const nav = allPages.map((p) => `<a href="${p.path}">${p.title}</a>`).join(' | ');
  const dead = deadLinks.map((d) => `<a href="${d}">old link</a>`).join(' ');
  return `<!doctype html><html lang="en"><head><meta charset="utf-8">
<title>${page.title}</title>
<meta name="description" content="${page.title} — ${biz.clientName}">
<link rel="stylesheet" href="/style.css">
<link rel="icon" href="/favicon.ico">
</head><body>
<header><img src="/logo.svg" alt="${biz.clientName} logo" class="logo"><nav>${nav}</nav></header>
<main><h1>${page.title}</h1><h2>${page.h2}</h2>
<p>${`Words about ${page.title.toLowerCase()} for ${biz.clientName}. `.repeat(40)}</p>
<img src="/hero.jpg" alt="${page.h2}">
${dead}</main>
<footer>© ${biz.clientName}</footer></body></html>`;
}

function buildRoutes(biz) {
  const routes = new Map();
  for (const page of biz.legacyPages) {
    routes.set(page.path, { status: 200, type: 'text/html', body: pageHtml(biz, page, biz.legacyPages, biz.deadLinks ?? []) });
  }
  const allUrls = [...biz.legacyPages.map((p) => p.path), ...(biz.sitemapExtras ?? [])];
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${allUrls.map((u) => `<url><loc>http://127.0.0.1:${biz.port}${encodeURI(u)}</loc></url>`).join('\n')}
</urlset>`;
  routes.set('/sitemap.xml', { status: 200, type: 'application/xml', body: sitemap });
  routes.set('/robots.txt', { status: 200, type: 'text/plain', body: `User-agent: *\nAllow: /\nSitemap: http://127.0.0.1:${biz.port}/sitemap.xml\n` });
  routes.set('/style.css', {
    status: 200,
    type: 'text/css',
    body: `:root{--brand:${biz.colors[0]}}
body{font-family:'${biz.fonts[0]}',sans-serif;color:${biz.colors[1] ?? '#111111'};background:#ffffff}
h1,h2{font-family:'${biz.fonts[0]}',serif;color:${biz.colors[0]}}
p{font-family:'${biz.fonts[1] ?? biz.fonts[0]}',sans-serif}
.logo{height:40px}
a{color:${biz.colors[0]}}
.accent{background:${biz.colors[0]};color:#fff}
.alt{background:${biz.colors[2] ?? biz.colors[0]}}`
  });
  routes.set('/logo.svg', {
    status: 200,
    type: 'image/svg+xml',
    body: `<svg xmlns="http://www.w3.org/2000/svg" width="160" height="40"><rect width="160" height="40" fill="${biz.colors[0]}"/><text x="10" y="26" fill="#fff" font-size="18">${biz.clientName.slice(0, 12)}</text></svg>`
  });
  // 1x1 JPEG so image download paths execute.
  routes.set('/hero.jpg', {
    status: 200,
    type: 'image/jpeg',
    body: Buffer.from('/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/wAALCAABAAEBAREA/8QAFAABAAAAAAAAAAAAAAAAAAAACf/EABQQAQAAAAAAAAAAAAAAAAAAAAD/2gAIAQEAAD8AKp//2Q==', 'base64')
  });
  routes.set('/favicon.ico', { status: 200, type: 'image/x-icon', body: Buffer.alloc(64) });
  return routes;
}

function serveSite(biz) {
  const routes = buildRoutes(biz);
  const server = http.createServer((req, res) => {
    const rawPath = decodeURIComponent(new URL(req.url, `http://x`).pathname);
    const hit =
      routes.get(rawPath) ??
      routes.get(rawPath.endsWith('/') ? rawPath.slice(0, -1) : `${rawPath}/`) ??
      (rawPath.toLowerCase() !== rawPath ? routes.get(rawPath.toLowerCase()) : undefined);
    if (!hit) {
      res.writeHead(404, { 'content-type': 'text/html' });
      res.end('<!doctype html><html><head><title>Not found</title></head><body><main><h1>404</h1></main></body></html>');
      return;
    }
    res.writeHead(hit.status, { 'content-type': hit.type });
    res.end(hit.body);
  });
  return new Promise((resolve) => server.listen(biz.port, '127.0.0.1', () => resolve(server)));
}

// ---------------------------------------------------------------------------
// Workspace + process plumbing
// ---------------------------------------------------------------------------

async function setupWorkspace(id) {
  const ws = path.join(WORK_ROOT, id);
  await rm(ws, { recursive: true, force: true });
  await mkdir(ws, { recursive: true });
  for (const entry of ['tools', 'data', 'docs', 'wp-content', 'packages', 'screenshots', '.claude', 'package.json', 'package-lock.json']) {
    if (existsSync(path.join(ROOT, entry))) {
      await cp(path.join(ROOT, entry), path.join(ws, entry), { recursive: true });
    }
  }
  await symlink(path.join(ROOT, 'node_modules'), path.join(ws, 'node_modules'), 'dir');
  return ws;
}

function run(cwd, cmd, args) {
  return new Promise((resolve) => {
    const child = spawn(cmd, args, { cwd, env: process.env });
    let out = '';
    child.stdout.on('data', (c) => (out += c));
    child.stderr.on('data', (c) => (out += c));
    child.on('error', (error) => resolve({ code: 1, out: `spawn error: ${error.message}` }));
    child.on('close', (code) => resolve({ code: code ?? 1, out }));
  });
}

const npmRun = (ws, script, args = []) => run(ws, 'npm', ['run', script, ...(args.length ? ['--', ...args] : [])]);

// ---------------------------------------------------------------------------
// Engagement data instantiation (simulates the AI stages deterministically)
// ---------------------------------------------------------------------------

async function readJsonFile(file) {
  return JSON.parse(await readFile(file, 'utf8'));
}

async function instantiateEngagement(ws, biz) {
  const intake = await readJsonFile(path.join(ws, 'data', 'site-intake.example.json'));
  intake.client.name = biz.clientName;
  intake.design.colors = biz.colors;
  intake.design.fonts = biz.fonts;
  intake.legacySite = biz.isRedesign
    ? {
        isRedesign: true,
        url: `http://127.0.0.1:${biz.port}`,
        cms: 'WordPress',
        keepUrls: false,
        knownTopPages: biz.knownTopPages,
        assetsToReuse: ['logo'],
        thingsThatMustNotBreak: ['phone number visibility']
      }
    : { isRedesign: false };
  await writeFile(path.join(ws, 'data', 'site-intake.json'), JSON.stringify(intake, null, 2) + '\n');

  for (const name of ['page-compositions', 'copy-deck']) {
    const data = await readJsonFile(path.join(ws, 'data', `${name}.example.json`));
    await writeFile(path.join(ws, 'data', `${name}.json`), JSON.stringify(data, null, 2) + '\n');
  }

  const briefs = await readJsonFile(path.join(ws, 'data', 'seo-briefs.example.json'));
  if (biz.isRedesign) {
    // legacy blocks per SEO-LEG-1/2: every redirect landing on a brief is
    // claimed; knownTopPages get preservedKeywords.
    const landings = new Map();
    for (const [from, to] of Object.entries(biz.curation)) {
      if (to !== '410') {
        if (!landings.has(to)) landings.set(to, []);
        landings.get(to).push(from);
      }
    }
    for (const brief of briefs.briefs) {
      const sources = landings.get(brief.url_slug) ?? [];
      const top = biz.knownTopPages.find((t) => biz.curation[t.url] === brief.url_slug);
      if (sources.length > 0 || top) {
        brief.legacy = { sourceUrls: sources };
        if (top) {
          brief.legacy.preservedKeywords = top.keywords;
        }
      }
    }
  }
  await writeFile(path.join(ws, 'data', 'seo-briefs.json'), JSON.stringify(briefs, null, 2) + '\n');
}

async function curateRedirects(ws, biz) {
  const draftPath = path.join(ws, 'captured', 'redirects.draft.csv');
  const draft = existsSync(draftPath) ? await readFile(draftPath, 'utf8') : 'from,to,status,notes\n';
  const lines = draft.trim().split('\n').slice(1);
  const seen = new Set();
  const rows = [];
  for (const line of lines) {
    const from = line.split(',')[0];
    if (!from || seen.has(from)) continue;
    seen.add(from);
    const target = biz.curation[from];
    if (target === undefined) {
      rows.push(`${from},,301,NEEDS-MAPPING uncurated`); // left to expose RED gates
    } else if (target === '410') {
      rows.push(`${from},,410,curated:e2e gone`);
    } else {
      rows.push(`${from},${target},301,curated:e2e`);
    }
  }
  // curation entries the crawler may have normalized differently still count
  for (const [from, target] of Object.entries(biz.curation)) {
    if (seen.has(from)) continue;
    seen.add(from);
    rows.push(target === '410' ? `${from},,410,curated:e2e gone` : `${from},${target},301,curated:e2e`);
  }
  await writeFile(path.join(ws, 'data', 'redirects.csv'), ['from,to,status,notes', ...rows].join('\n') + '\n');

  const inventoryPath = path.join(ws, 'captured', 'inventory.json');
  if (existsSync(inventoryPath)) {
    await cp(inventoryPath, path.join(ws, 'data', 'legacy-inventory.json'));
  }
}

// ---------------------------------------------------------------------------
// Negative suite: each corruption must make its gate FAIL with the rule named.
// ---------------------------------------------------------------------------

const NEGATIVES = [
  {
    name: 'em dash in copy deck -> copy:check fails',
    gate: 'copy:check',
    expectInOutput: /FAIL/,
    async apply(ws) {
      const file = path.join(ws, 'data', 'copy-deck.json');
      const deck = await readJsonFile(file);
      JSON.stringify(deck).includes('"text"');
      const firstPage = deck.pages[0];
      const firstSlot = Object.values(firstPage.slots ?? firstPage)[0];
      // robust: just append an em dash to the serialized first text occurrence
      let raw = await readFile(file, 'utf8');
      raw = raw.replace(/"text": "([^"]+)"/, '"text": "$1 — corrupted"');
      await writeFile(file, raw);
    }
  },
  {
    name: 'redirect to slug that is not in the new site -> redirects:check fails',
    gate: 'redirects:check',
    expectInOutput: /FAIL/,
    async apply(ws) {
      const file = path.join(ws, 'data', 'redirects.csv');
      await writeFile(file, (await readFile(file, 'utf8')) + '/zombie-page,/this-slug-does-not-exist,301,curated:e2e\n');
    }
  },
  {
    name: 'live legacy 200 page dropped from redirect map -> RED-5 coverage fails',
    gate: 'redirects:check',
    expectInOutput: /RED-5|FAIL/,
    async apply(ws) {
      const file = path.join(ws, 'data', 'redirects.csv');
      const rows = (await readFile(file, 'utf8')).trim().split('\n');
      await writeFile(file, rows.filter((row) => !row.startsWith('/about-us')).join('\n') + '\n');
    }
  },
  {
    name: 'unapproved pattern slug in composition -> compose:check fails',
    gate: 'compose:check',
    expectInOutput: /FAIL/,
    async apply(ws) {
      const file = path.join(ws, 'data', 'page-compositions.json');
      let raw = await readFile(file, 'utf8');
      raw = raw.replace(/supersonic-site-theme\/hero-[a-z-]+/, 'supersonic-site-theme/hero-vaporware');
      await writeFile(file, raw);
    }
  },
  {
    name: 'duplicate seo_title across pages -> meta export META-3 fails',
    gate: 'seo:meta:export',
    expectInOutput: /META-3/,
    async apply(ws) {
      const file = path.join(ws, 'data', 'seo-briefs.json');
      const briefs = await readJsonFile(file);
      if (briefs.briefs.length >= 2) {
        briefs.briefs[1].seo_title = briefs.briefs[0].seo_title;
      }
      await writeFile(file, JSON.stringify(briefs, null, 2) + '\n');
    }
  },
  {
    name: 'invalid hex in intake design.colors -> design:compile DNA-1 fails',
    gate: 'design:compile',
    expectInOutput: /DNA-1/,
    async apply(ws) {
      const file = path.join(ws, 'data', 'site-intake.json');
      const intake = await readJsonFile(file);
      intake.design.colors = ['#12g45z', ...intake.design.colors];
      await writeFile(file, JSON.stringify(intake, null, 2) + '\n');
    }
  },
  {
    name: 'arbitrary inline color in a pattern -> validate (token contract) fails',
    gate: 'validate',
    expectInOutput: /FAIL/,
    async apply(ws) {
      const file = path.join(ws, 'wp-content', 'themes', 'supersonic-site-theme', 'patterns', 'hero-simple.php');
      let raw = await readFile(file, 'utf8');
      raw = raw.replace('</h1>', '</h1>\n<!-- wp:paragraph {"style":{"color":{"text":"#ff00aa"}}} --><p class="has-text-color" style="color:#ff00aa">rogue</p><!-- /wp:paragraph -->');
      await writeFile(file, raw);
    }
  }
];

// ---------------------------------------------------------------------------
// Runner
// ---------------------------------------------------------------------------

const results = [];
function record(business, stage, status, detail = '') {
  results.push({ business, stage, status, detail });
  const icon = status === 'PASS' ? 'PASS' : status === 'EXPECTED-FAIL' ? 'PASS(neg)' : 'FAIL';
  console.log(`${icon.padEnd(9)} [${business}] ${stage}${detail ? ` — ${detail.split('\n')[0].slice(0, 160)}` : ''}`);
}

function firstFails(out, n = 3) {
  return out
    .split('\n')
    .filter((line) => /FAIL/.test(line))
    .slice(0, n)
    .join(' | ');
}

async function gateStep(ws, biz, label, script, args = [], { expectFail = null } = {}) {
  const result = await npmRun(ws, script, args);
  if (expectFail) {
    const matched = expectFail.test(result.out);
    if (result.code !== 0 && matched) {
      record(biz, label, 'EXPECTED-FAIL');
      return true;
    }
    record(biz, label, 'FAIL', result.code === 0 ? 'gate PASSED but a failure was expected (gate cannot fail = bug)' : `failed but without expected marker: ${firstFails(result.out)}`);
    return false;
  }
  if (result.code === 0) {
    record(biz, label, 'PASS');
    return true;
  }
  record(biz, label, 'FAIL', firstFails(result.out) || result.out.slice(-300));
  return false;
}

async function runBusiness(biz, { skipRender }) {
  console.log(`\n=== ${biz.id} (${biz.clientName}) ===`);
  const ws = await setupWorkspace(biz.id);

  await instantiateEngagement(ws, biz);

  if (biz.isRedesign) {
    const server = await serveSite(biz);
    try {
      const cap = await run(ws, 'node', ['tools/capture-site.mjs', '--url', `http://127.0.0.1:${biz.port}`, '--max-pages', '50', '--delay-ms', '0']);
      if (cap.code === 0 && existsSync(path.join(ws, 'captured', 'inventory.json'))) {
        const inventory = await readJsonFile(path.join(ws, 'captured', 'inventory.json'));
        const brand = await readJsonFile(path.join(ws, 'captured', 'brand.json'));
        const brandHexes = (brand.palette ?? []).map((p) => String(p.hex).toLowerCase());
        const gotBrand = biz.colors.some((c) => brandHexes.includes(c.toLowerCase()));
        const gotFont = (brand.fonts ?? []).some((f) => biz.fonts.some((bf) => f.family?.toLowerCase().includes(bf.toLowerCase().split(' ')[0])));
        record(biz.id, 'capture: crawl + inventory', 'PASS', `${inventory.length} records`);
        record(biz.id, 'capture: brand palette finds site colors', gotBrand ? 'PASS' : 'FAIL', gotBrand ? '' : `palette ${brandHexes.join(',')} missing ${biz.colors.join(',')}`);
        record(biz.id, 'capture: fonts detected', gotFont ? 'PASS' : 'FAIL', gotFont ? '' : JSON.stringify(brand.fonts));
        const draftExists = existsSync(path.join(ws, 'captured', 'redirects.draft.csv'));
        record(biz.id, 'capture: redirect draft written', draftExists ? 'PASS' : 'FAIL');
      } else {
        record(biz.id, 'capture: crawl + inventory', 'FAIL', cap.out.slice(-400));
      }
    } finally {
      server.close();
    }
    await curateRedirects(ws, biz);
  }

  await gateStep(ws, biz.id, 'gate: redirects:check', 'redirects:check');
  if (biz.isRedesign) {
    await gateStep(ws, biz.id, 'export: Rank Math redirects', 'redirects:export');
  }
  await gateStep(ws, biz.id, 'gate: seo:briefs:check (incl SEO-LEG)', 'seo:briefs:check');
  await gateStep(ws, biz.id, 'gate: copy:check', 'copy:check');
  await gateStep(ws, biz.id, 'gate: compose:check', 'compose:check');
  await gateStep(ws, biz.id, 'export: Rank Math meta', 'seo:meta:export');

  if (biz.expect.dna === 'pass') {
    const planned = await npmRun(ws, 'design:compile');
    record(biz.id, 'design: compile (dry-run)', planned.code === 0 ? 'PASS' : 'FAIL', planned.code === 0 ? '' : firstFails(planned.out));
    const written = await npmRun(ws, 'design:compile', ['--write']);
    record(biz.id, 'design: compile --write', written.code === 0 ? 'PASS' : 'FAIL', written.code === 0 ? '' : firstFails(written.out));
    await gateStep(ws, biz.id, 'design: --check after write', 'design:compile', ['--check']);
    await gateStep(ws, biz.id, 'validate after DNA write', 'validate');
  } else {
    await gateStep(ws, biz.id, `design: compile must fail ${biz.expect.dna}`, 'design:compile', [], { expectFail: new RegExp(biz.expect.dna) });
  }

  await gateStep(ws, biz.id, 'package: build zips', 'package');
  await gateStep(ws, biz.id, 'package: determinism', 'package:determinism');

  if (!skipRender && biz.expect.dna === 'pass') {
    const render = await run(ws, 'node', [
      'tools/playground-render.mjs',
      '--patterns',
      'hero-simple,section-service-cards',
      '--theme-dir',
      path.join(ws, 'wp-content', 'themes', 'supersonic-site-theme'),
      '--out',
      path.join(ws, 'render-out'),
      '--port',
      String(9700 + BUSINESSES.indexOf(biz))
    ]);
    record(biz.id, 'render: branded WordPress render', render.code === 0 ? 'PASS' : 'FAIL', render.code === 0 ? '' : firstFails(render.out) || render.out.slice(-300));
  }
  return ws;
}

async function runNegatives(baseWs, { keep }) {
  console.log('\n=== negative suite (each corruption must FAIL its gate) ===');
  for (const negative of NEGATIVES) {
    const ws = path.join(WORK_ROOT, 'negative');
    await rm(ws, { recursive: true, force: true });
    await cp(baseWs, ws, { recursive: true });
    try {
      await negative.apply(ws);
      const result = await npmRun(ws, negative.gate.includes(':') ? negative.gate : negative.gate);
      const failedRight = result.code !== 0 && negative.expectInOutput.test(result.out);
      record('negative', negative.name, failedRight ? 'EXPECTED-FAIL' : 'FAIL', failedRight ? '' : result.code === 0 ? 'GATE PASSED ON CORRUPTED INPUT — the gate cannot fail (bug)' : `failed without expected marker: ${firstFails(result.out)}`);
    } catch (error) {
      record('negative', negative.name, 'FAIL', `harness error: ${error.message}`);
    }
  }
  if (!keep) {
    await rm(path.join(WORK_ROOT, 'negative'), { recursive: true, force: true });
  }
}

// ---------------------------------------------------------------------------

const argv = process.argv.slice(2);
const skipRender = argv.includes('--skip-render');
const keep = argv.includes('--keep');
const onlyArg = argv.indexOf('--business');
const only = onlyArg >= 0 ? argv[onlyArg + 1] : null;

await mkdir(WORK_ROOT, { recursive: true });
let plumberWs = null;
for (const biz of BUSINESSES) {
  if (only && biz.id !== only) continue;
  const ws = await runBusiness(biz, { skipRender });
  if (biz.id === 'plumber-redesign') {
    plumberWs = ws;
  }
}

if (!only || only === 'plumber-redesign') {
  if (plumberWs) {
    await runNegatives(plumberWs, { keep });
  }
}

if (!keep) {
  await rm(WORK_ROOT, { recursive: true, force: true });
}

const failures = results.filter((r) => r.status === 'FAIL');
console.log(`\n=== E2E SUMMARY: ${results.length} steps, ${failures.length} unexpected failure(s) ===`);
for (const failure of failures) {
  console.log(`BUG: [${failure.business}] ${failure.stage} — ${failure.detail}`);
}
process.exit(failures.length > 0 ? 1 : 0);
