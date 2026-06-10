// Capture legacy site flow: wraps `npm run capture:site` (tools/capture-site.mjs)
// and renders the capture summary — page/asset counts, brand palette swatches,
// font stacks, and the NEEDS-MAPPING count in captured/redirects.draft.csv.

import { readFile } from 'node:fs/promises';
import path from 'node:path';
import * as p from '@clack/prompts';
import pc from 'picocolors';
import { take, swatch } from '../lib/ui.mjs';
import { runNpm } from '../lib/run.mjs';
import { parseRedirectsCsv } from '../../lib/redirects.mjs';

async function readJson(rootDir, relativePath) {
  try {
    return JSON.parse(await readFile(path.join(rootDir, relativePath), 'utf8'));
  } catch {
    return null;
  }
}

const numberValidate = (value) =>
  String(value).trim() !== '' && Number.isNaN(Number(value)) ? 'Enter a number.' : undefined;

export async function captureFlow({ rootDir }) {
  p.log.step('Capture legacy site — runs npm run capture:site into captured/');

  const intake = await readJson(rootDir, 'data/site-intake.json');
  const legacy = intake && typeof intake === 'object' ? intake.legacySite : null;
  if (!legacy || legacy.isRedesign !== true) {
    p.log.warn('Intake does not mark this build as a redesign (legacySite.isRedesign). Capture is only needed for redesigns.');
  }

  const url = String(
    take(
      await p.text({
        message: 'Legacy site URL to capture',
        initialValue: legacy && typeof legacy.url === 'string' ? legacy.url : undefined,
        placeholder: 'https://www.example.com',
        validate: (value) => (/^https?:\/\//i.test(String(value).trim()) ? undefined : 'Enter a full http(s) URL.')
      })
    )
  ).trim();
  const maxPages = String(take(await p.text({ message: 'Max pages', initialValue: '200', validate: numberValidate }))).trim();
  const delayMs = String(
    take(await p.text({ message: 'Delay between requests (ms)', initialValue: '500', validate: numberValidate }))
  ).trim();

  const go = take(
    await p.confirm({ message: `Run: npm run capture:site -- --url ${url} --max-pages ${maxPages} --delay-ms ${delayMs}?` })
  );
  if (!go) {
    p.log.message('Capture skipped.');
    return;
  }

  const spinner = p.spinner();
  spinner.start('Crawling the legacy site (this can take several minutes)');
  const { code, lines } = await runNpm('capture:site', ['--url', url, '--max-pages', maxPages, '--delay-ms', delayMs], {
    cwd: rootDir
  });
  if (code !== 0) {
    spinner.stop(pc.red('Capture FAILED'));
    p.log.error(`npm run capture:site exited with code ${code}. Last output:`);
    for (const line of lines.slice(-15)) {
      p.log.error(`  ${line}`);
    }
    return;
  }
  spinner.stop(pc.green('Capture finished'));

  const summary = await readJson(rootDir, 'captured/summary.json');
  const brand = await readJson(rootDir, 'captured/brand.json');
  if (!summary) {
    p.log.error('captured/summary.json missing after capture — treat the capture as unproven and inspect captured/ manually.');
    return;
  }

  const isTTY = Boolean(process.stdout.isTTY);
  const out = [];
  out.push(`site: ${summary.site}    captured at: ${summary.capturedAt}`);
  out.push(
    `pages: ${summary.pagesCrawled} crawled, ${summary.pagesOk} ok, ${summary.pagesFailed} failed; sitemap URLs: ${summary.sitemapUrls}`
  );
  out.push(
    `assets: ${summary.imagesDownloaded} images (+${summary.imagesDeduped} deduped, ${summary.imagesSkipped} skipped), ` +
      `${summary.fontsDownloaded} fonts, ${summary.logoCandidates} logo candidates`
  );

  if (brand && Array.isArray(brand.palette) && brand.palette.length > 0) {
    out.push('');
    out.push('Top palette:');
    for (const color of brand.palette.slice(0, 8)) {
      out.push(`  ${swatch(color.hex, isTTY)}  ${color.roleGuess} (${color.count} samples)`);
    }
  }
  if (brand && Array.isArray(brand.fonts) && brand.fonts.length > 0) {
    out.push('');
    out.push('Top font stacks:');
    for (const font of brand.fonts.slice(0, 5)) {
      out.push(`  ${font.family} — ${font.roleGuess} (${font.count} samples)`);
    }
  }

  let needsMapping = summary.redirectsNeedsMapping;
  try {
    const draft = await readFile(path.join(rootDir, 'captured/redirects.draft.csv'), 'utf8');
    needsMapping = parseRedirectsCsv(draft).rows.filter((row) => /NEEDS-MAPPING/.test(row.notes)).length;
  } catch {
    // keep the summary.json count
  }
  out.push('');
  out.push(
    `redirect draft: ${summary.redirectRows} rows, ${summary.redirectsMatched} auto-matched, ` +
      `${needsMapping} NEEDS-MAPPING${needsMapping > 0 ? ' — run "Curate redirects" next' : ''}`
  );

  p.note(out.join('\n'), 'Capture summary');
  p.log.info('Next: "Brand review" to adopt palette/fonts/logos into the intake, then "Curate redirects".');
}
