#!/usr/bin/env node
/**
 * WordPress Playground render harness: boots a real WordPress (WASM, no
 * Docker/MySQL) with the repo theme + plugin mounted, creates one page per
 * certified pattern, screenshots each at desktop/tablet/mobile, and smoke-
 * tests the blog templates. This is the layer that proves patterns render
 * in real WordPress — static validation cannot see broken block markup,
 * missing token definitions, or template regressions.
 *
 * Usage:
 *   node tools/playground-render.mjs [--patterns slug1,slug2] [--out screenshots/render]
 *                                    [--port 9400] [--skip-screenshots] [--no-blog-smoke]
 *                                    [--keep-running] [--self-test]
 *
 * Boot failures (Playground downloads WP/PHP assets on first run; needs
 * network) are reported as BOOT-FAIL, distinct from render test failures.
 */

import { spawn } from 'node:child_process';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import { patternPageContent } from './lib/wp-rest.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const THEME_DIR = 'wp-content/themes/supersonic-site-theme';
const PLUGIN_DIR = 'wp-content/plugins/supersonic-site-core';
const REGISTRY_PATH = 'data/pattern-certifications.json';

// --- pure helpers (covered by --self-test) -----------------------------------------

// Resolves which pattern slugs to render: all registry slugs, or the requested
// subset (accepts both "hero-simple" and "supersonic-site-theme/hero-simple").
// Unknown requested slugs are an error (fail closed, no silent skips).
export function resolvePatternSlugs(registry, requested) {
  const all = (registry.patterns ?? []).map((entry) => entry.slug);
  if (!requested || requested.length === 0) {
    return { slugs: all, unknown: [] };
  }
  const bySuffix = new Map(all.map((slug) => [slug.split('/').pop(), slug]));
  const slugs = [];
  const unknown = [];
  for (const want of requested) {
    const full = all.includes(want) ? want : bySuffix.get(want);
    if (full) {
      slugs.push(full);
    } else {
      unknown.push(want);
    }
  }
  return { slugs, unknown };
}

// Page slug for a pattern's render page ("supersonic-site-theme/hero-simple"
// -> "render-hero-simple").
export function renderPageSlug(patternSlug) {
  return `render-${patternSlug.split('/').pop()}`;
}

// Query-string URL for the render page. Playground's CLI server routes
// query-string permalinks reliably; pretty permalinks 404 even after a
// rewrite flush, so the harness deliberately avoids them.
export function renderPagePath(patternSlug) {
  return `/?pagename=${renderPageSlug(patternSlug)}`;
}

// PHP run inside Playground after activation: pretty permalinks, seed posts
// for the blog smoke, and one published page per pattern containing only the
// pattern reference block.
export function buildSeedPhp(patternSlugs) {
  const pages = patternSlugs
    .map((slug) => {
      const content = patternPageContent(slug).replace(/'/g, "\\'");
      return `wp_insert_post(['post_type' => 'page', 'post_status' => 'publish', 'post_title' => '${renderPageSlug(slug)}', 'post_name' => '${renderPageSlug(slug)}', 'post_content' => '${content}']);`;
    })
    .join('\n');
  return `<?php
require '/wordpress/wp-load.php';
update_option('blog_public', 0);
for ($i = 1; $i <= 3; $i++) {
  wp_insert_post(['post_type' => 'post', 'post_status' => 'publish', 'post_title' => "Seed post $i", 'post_content' => "<p>Seed content $i for template smoke tests.</p>"]);
}
${pages}
`;
}

// Playground blueprint: activate the mounted theme + plugin, then run the
// seeding PHP. The theme/plugin are mounted as directories (not installed
// from zips) so the harness always tests the working tree.
export function buildBlueprint(patternSlugs) {
  return {
    landingPage: '/',
    preferredVersions: { wp: 'latest', php: '8.2' },
    steps: [
      { step: 'activateTheme', themeFolderName: 'supersonic-site-theme' },
      { step: 'activatePlugin', pluginPath: 'supersonic-site-core/plugin.php' },
      // Rank Math is the framework's approved SEO plugin; the FAQ pattern
      // embeds rank-math/faq-block, which renders nothing without it.
      {
        step: 'installPlugin',
        pluginData: { resource: 'wordpress.org/plugins', slug: 'seo-by-rank-math' },
        options: { activate: true }
      },
      { step: 'runPHP', code: buildSeedPhp(patternSlugs) }
    ]
  };
}

// Aggregates per-check results into the final verdict. Boot failure trumps
// everything; otherwise any failed check fails the run.
export function aggregateResults({ boot, checks }) {
  if (!boot.ok) {
    return { ok: false, summary: `BOOT-FAIL: ${boot.detail}` };
  }
  const failed = checks.filter((check) => !check.ok);
  return {
    ok: failed.length === 0,
    summary:
      failed.length === 0
        ? `OK: ${checks.length} render check(s) passed`
        : `FAIL: ${failed.length}/${checks.length} render check(s) failed`
  };
}

// --- harness ------------------------------------------------------------------------

function parseArgs(argv) {
  const opts = {
    patterns: null,
    out: 'screenshots/render',
    port: 9400,
    screenshots: true,
    blogSmoke: true,
    keepRunning: false,
    selfTest: false
  };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--patterns') opts.patterns = argv[++i].split(',').map((s) => s.trim()).filter(Boolean);
    else if (arg === '--out') opts.out = argv[++i];
    else if (arg === '--port') opts.port = Number(argv[++i]);
    else if (arg === '--skip-screenshots') opts.screenshots = false;
    else if (arg === '--no-blog-smoke') opts.blogSmoke = false;
    else if (arg === '--keep-running') opts.keepRunning = true;
    else if (arg === '--self-test') opts.selfTest = true;
    else {
      console.error(`FAIL: unknown argument ${arg}`);
      process.exit(2);
    }
  }
  return opts;
}

async function bootPlayground(blueprint, port) {
  const blueprintPath = path.join(os.tmpdir(), `supersonic-blueprint-${Date.now()}.json`);
  await writeFile(blueprintPath, JSON.stringify(blueprint, null, 2));
  // Use the locally installed @wp-playground/cli bin explicitly: `npx
  // wp-playground` resolves an unrelated package of that name.
  const cliBin = path.join(ROOT, 'node_modules', '.bin', 'wp-playground-cli');
  const cliArgs = [
    'server',
    `--port=${port}`,
    `--blueprint=${blueprintPath}`,
    `--mount=${path.join(ROOT, THEME_DIR)}:/wordpress/wp-content/themes/supersonic-site-theme`,
    `--mount=${path.join(ROOT, PLUGIN_DIR)}:/wordpress/wp-content/plugins/supersonic-site-core`
  ];
  const child = spawn(cliBin, cliArgs, { cwd: ROOT, env: process.env });
  let log = '';
  child.stdout.on('data', (chunk) => {
    log += chunk;
  });
  child.stderr.on('data', (chunk) => {
    log += chunk;
  });
  const baseUrl = `http://127.0.0.1:${port}`;

  const deadline = Date.now() + 180000;
  while (Date.now() < deadline) {
    if (child.exitCode !== null) {
      return { ok: false, detail: `Playground CLI exited ${child.exitCode} before serving. Last output:\n${log.slice(-1500)}`, child: null };
    }
    try {
      const response = await fetch(`${baseUrl}/wp-json/`, { signal: AbortSignal.timeout(4000) });
      if (response.ok) {
        return { ok: true, detail: `WordPress serving at ${baseUrl}`, child, baseUrl };
      }
    } catch {
      // not up yet
    }
    await new Promise((resolve) => setTimeout(resolve, 2000));
  }
  child.kill('SIGTERM');
  return { ok: false, detail: `Playground did not serve within 180s (likely blocked WP asset download). Last output:\n${log.slice(-1500)}`, child: null };
}

async function checkUrl(baseUrl, urlPath, { expectStatus = 200, label }) {
  try {
    const response = await fetch(`${baseUrl}${urlPath}`, { signal: AbortSignal.timeout(20000) });
    if (response.status !== expectStatus) {
      return { ok: false, label, detail: `${urlPath} returned ${response.status}, expected ${expectStatus}` };
    }
    if (expectStatus === 200) {
      const html = await response.text();
      const mainMatch = /<main[^>]*>([\s\S]*?)<\/main>/i.exec(html);
      if (!mainMatch || mainMatch[1].trim().length < 40) {
        return { ok: false, label, detail: `${urlPath} rendered an empty/missing <main>` };
      }
    }
    return { ok: true, label, detail: `${urlPath} -> ${expectStatus}` };
  } catch (error) {
    return { ok: false, label, detail: `${urlPath} fetch failed: ${error.message}` };
  }
}

async function screenshotPattern(browserBundle, baseUrl, patternSlug, outDir) {
  const { browser, openMaskedPage, VIEWPORTS } = browserBundle;
  const checks = [];
  const short = patternSlug.split('/').pop();
  const url = `${baseUrl}${renderPagePath(patternSlug)}`;
  for (const viewport of VIEWPORTS) {
    const consoleErrors = [];
    let page;
    try {
      page = await openMaskedPage(browser, {
        viewport,
        url,
        blockExternal: true,
        // ERR_BLOCKED_BY_CLIENT is our own deliberate external-request block.
        onConsoleError: (text) => {
          if (!text.includes('ERR_BLOCKED_BY_CLIENT')) {
            consoleErrors.push(text);
          }
        },
        onPageError: (text) => consoleErrors.push(text)
      });
      const main = page.locator('main');
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1);
      const dir = path.join(outDir, short);
      await mkdir(dir, { recursive: true });
      await main.screenshot({ path: path.join(dir, `${viewport.name}.png`) });
      const issues = [];
      if (overflow) issues.push('horizontal overflow');
      if (consoleErrors.length > 0) issues.push(`console errors: ${consoleErrors.slice(0, 3).join(' | ')}`);
      checks.push({
        ok: issues.length === 0,
        label: `${short}@${viewport.name}`,
        detail: issues.length === 0 ? 'rendered clean' : issues.join('; ')
      });
    } catch (error) {
      checks.push({ ok: false, label: `${short}@${viewport.name}`, detail: `render failed: ${error.message}` });
    } finally {
      await page?.close().catch(() => {});
    }
  }
  return checks;
}

async function run(opts) {
  const registry = JSON.parse(await readFile(path.join(ROOT, REGISTRY_PATH), 'utf8'));
  const { slugs, unknown } = resolvePatternSlugs(registry, opts.patterns);
  if (unknown.length > 0) {
    console.error(`FAIL: unknown pattern slug(s): ${unknown.join(', ')}`);
    process.exit(2);
  }
  if (!existsSync(path.join(ROOT, THEME_DIR)) || !existsSync(path.join(ROOT, PLUGIN_DIR))) {
    console.error('FAIL: theme or plugin directory missing from the working tree.');
    process.exit(2);
  }

  console.log(`Booting WordPress Playground with ${slugs.length} pattern page(s)...`);
  const boot = await bootPlayground(buildBlueprint(slugs), opts.port);
  const checks = [];

  if (boot.ok) {
    console.log(`PASS: boot — ${boot.detail}`);
    // The CLI serves while the blueprint's seeding PHP is still running, so
    // wait for the LAST seeded page (inserts are sequential) before checking
    // anything — otherwise early pattern pages race the seeder and 404.
    const lastPage = renderPagePath(slugs[slugs.length - 1]);
    const seedDeadline = Date.now() + 180000;
    let seeded = false;
    while (Date.now() < seedDeadline) {
      try {
        const probe = await fetch(`${boot.baseUrl}${lastPage}`, { signal: AbortSignal.timeout(5000) });
        if (probe.status === 200) {
          seeded = true;
          break;
        }
      } catch {
        // still seeding
      }
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }
    if (!seeded) {
      checks.push({ ok: false, label: 'seeding', detail: `last render page ${lastPage} never appeared within 180s` });
    }
    if (opts.blogSmoke) {
      checks.push(await checkUrl(boot.baseUrl, '/', { label: 'blog: front page' }));
      checks.push(await checkUrl(boot.baseUrl, '/?name=seed-post-1', { label: 'blog: single post' }));
      checks.push(await checkUrl(boot.baseUrl, '/?s=seed', { label: 'blog: search' }));
      checks.push(await checkUrl(boot.baseUrl, '/?pagename=no-such-page-xyz', { expectStatus: 404, label: 'blog: 404 template' }));
    }
    for (const slug of slugs) {
      checks.push(await checkUrl(boot.baseUrl, renderPagePath(slug), { label: `page: ${slug}` }));
    }
    if (opts.screenshots) {
      const { launchChromium, openMaskedPage, VIEWPORTS } = await import('./lib/browser.mjs');
      const browser = await launchChromium('playground render');
      try {
        for (const slug of slugs) {
          checks.push(...(await screenshotPattern({ browser, openMaskedPage, VIEWPORTS }, boot.baseUrl, slug, path.resolve(ROOT, opts.out))));
        }
      } finally {
        await browser.close().catch(() => {});
      }
    }
  }

  for (const check of checks) {
    console.log(`${check.ok ? 'PASS' : 'FAIL'}: ${check.label} — ${check.detail}`);
  }
  const verdict = aggregateResults({ boot, checks });
  console.log(JSON.stringify({ boot: boot.ok, bootDetail: boot.ok ? boot.detail : boot.detail.split('\n')[0], checks: checks.length, failed: checks.filter((c) => !c.ok).length }));
  console.log(verdict.summary);

  if (boot.child && !opts.keepRunning) {
    boot.child.kill('SIGTERM');
  } else if (boot.child && opts.keepRunning) {
    console.log(`Playground left running at ${boot.baseUrl} (Ctrl-C to stop).`);
    return;
  }
  process.exit(verdict.ok ? 0 : 1);
}

// --- self-test ------------------------------------------------------------------------

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

  const fixtureRegistry = {
    patterns: [{ slug: 'supersonic-site-theme/hero-simple' }, { slug: 'supersonic-site-theme/cta-banner' }]
  };

  checkCase('slug resolution: defaults to all registry patterns', () => {
    const { slugs, unknown } = resolvePatternSlugs(fixtureRegistry, null);
    assert(slugs.length === 2 && unknown.length === 0, JSON.stringify({ slugs, unknown }));
  });

  checkCase('slug resolution: accepts short and full slugs', () => {
    const { slugs } = resolvePatternSlugs(fixtureRegistry, ['hero-simple', 'supersonic-site-theme/cta-banner']);
    assert(slugs.join(',') === 'supersonic-site-theme/hero-simple,supersonic-site-theme/cta-banner', slugs.join(','));
  });

  checkCase('slug resolution: unknown slugs reported, not silently dropped', () => {
    const { unknown } = resolvePatternSlugs(fixtureRegistry, ['nope']);
    assert(unknown.length === 1 && unknown[0] === 'nope', JSON.stringify(unknown));
  });

  checkCase('render page slug derivation', () => {
    assert(renderPageSlug('supersonic-site-theme/hero-simple') === 'render-hero-simple', renderPageSlug('supersonic-site-theme/hero-simple'));
  });

  checkCase('blueprint activates theme + plugin then seeds', () => {
    const blueprint = buildBlueprint(['supersonic-site-theme/hero-simple']);
    const steps = blueprint.steps.map((step) => step.step).join(',');
    assert(steps === 'activateTheme,activatePlugin,installPlugin,runPHP', steps);
    assert(blueprint.steps[1].pluginPath === 'supersonic-site-core/plugin.php', blueprint.steps[1].pluginPath);
  });

  checkCase('seed PHP creates posts and one page per pattern', () => {
    const php = buildSeedPhp(['supersonic-site-theme/hero-simple', 'supersonic-site-theme/cta-banner']);
    assert(php.includes('Seed post'), 'missing seed posts');
    assert((php.match(/wp_insert_post\(\['post_type' => 'page'/g) || []).length === 2, 'expected 2 page inserts');
    assert(php.includes('wp:pattern {\\\'') === false && php.includes('wp:pattern'), 'pattern reference malformed');
  });

  checkCase('aggregation: boot failure trumps checks', () => {
    const verdict = aggregateResults({ boot: { ok: false, detail: 'network blocked' }, checks: [{ ok: true }] });
    assert(!verdict.ok && verdict.summary.startsWith('BOOT-FAIL'), verdict.summary);
  });

  checkCase('aggregation: any failed check fails the run', () => {
    const verdict = aggregateResults({ boot: { ok: true, detail: '' }, checks: [{ ok: true }, { ok: false }] });
    assert(!verdict.ok && /1\/2/.test(verdict.summary), verdict.summary);
  });

  checkCase('aggregation: all green passes', () => {
    const verdict = aggregateResults({ boot: { ok: true, detail: '' }, checks: [{ ok: true }, { ok: true }] });
    assert(verdict.ok, verdict.summary);
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
