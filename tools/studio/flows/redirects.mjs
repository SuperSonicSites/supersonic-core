// Curate redirects flow: walks captured/redirects.draft.csv (or the existing
// data/redirects.csv) row by row, bulk-confirms auto-matched rows, prompts a
// destination for every NEEDS-MAPPING row, writes the curated map via the
// shared toCsv(), then proves it with `npm run redirects:check` (fail closed —
// Studio shows the gate's verdict verbatim and never claims success itself).

import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import * as p from '@clack/prompts';
import pc from 'picocolors';
import { take } from '../lib/ui.mjs';
import { runNpm, summarize } from '../lib/run.mjs';
import { parseRedirectsCsv } from '../../lib/redirects.mjs';
import { toCsv } from '../../lib/capture.mjs';
import { curateRow, buildNewPageSlugs, NEEDS_MAPPING_RE } from '../lib/curation.mjs';

const DRAFT_PATH = 'captured/redirects.draft.csv';
const CURATED_PATH = 'data/redirects.csv';

async function readJson(rootDir, relativePath) {
  try {
    return JSON.parse(await readFile(path.join(rootDir, relativePath), 'utf8'));
  } catch {
    return null;
  }
}

async function pickSource(rootDir, forceCurated) {
  if (!forceCurated) {
    try {
      const text = await readFile(path.join(rootDir, DRAFT_PATH), 'utf8');
      return { text, label: DRAFT_PATH };
    } catch {
      // no draft — fall through to the curated file
    }
  }
  const text = await readFile(path.join(rootDir, CURATED_PATH), 'utf8');
  return { text, label: CURATED_PATH };
}

// Prompts a decision for one unmapped row. Returns a curation decision object.
async function askRowDecision(row, slugOptions) {
  const choice = take(
    await p.select({
      message: `Map legacy URL ${pc.bold(row.from)} ${row.notes ? pc.dim(`(${row.notes})`) : ''}`,
      options: [
        ...slugOptions.map((slug) => ({ value: `map:${slug}`, label: `301 -> ${slug}` })),
        { value: 'custom', label: '301 -> custom path...' },
        { value: 'gone', label: '410 gone (deliberately killed)' },
        { value: 'skip', label: 'Skip / leave unmapped (stays NEEDS-MAPPING; gate keeps failing)' }
      ]
    })
  );
  if (choice === 'gone') {
    return { kind: 'gone' };
  }
  if (choice === 'skip') {
    return { kind: 'skip' };
  }
  if (choice === 'custom') {
    const to = String(
      take(
        await p.text({
          message: 'Destination path on the new site',
          placeholder: '/services/',
          validate: (value) => (String(value).trim().startsWith('/') ? undefined : 'Must be a site-relative path starting with "/".')
        })
      )
    ).trim();
    return { kind: 'map', to };
  }
  return { kind: 'map', to: choice.slice('map:'.length) };
}

async function curateOnce(rootDir, forceCurated) {
  let source;
  try {
    source = await pickSource(rootDir, forceCurated);
  } catch (error) {
    p.log.error(`No redirect source found (${error.message}). Run "Capture legacy site" first or create ${CURATED_PATH}.`);
    return false;
  }
  p.log.info(`Curating from ${source.label}`);

  const { issues, rows } = parseRedirectsCsv(source.text);
  if (issues.length > 0) {
    p.log.error(`${source.label} has CSV structure issues — fix these first:`);
    for (const issue of issues) {
      p.log.error(`  ${issue}`);
    }
    return false;
  }
  if (rows.length === 0) {
    p.log.message(`${source.label} has no data rows — nothing to curate.`);
    return false;
  }

  const intake = await readJson(rootDir, 'data/site-intake.json');
  const compositions = await readJson(rootDir, 'data/page-compositions.json');
  const slugOptions = buildNewPageSlugs(intake, compositions);
  if (slugOptions.length <= 2) {
    p.log.warn('Few known new-site slugs (intake pages[] / compositions are thin) — expect to use "custom path" often.');
  }

  const decisions = new Array(rows.length).fill(undefined);
  const autoIdx = [];
  const needsIdx = [];
  rows.forEach((row, index) => {
    if (NEEDS_MAPPING_RE.test(row.notes)) {
      needsIdx.push(index);
    } else if (row.notes.startsWith('auto:')) {
      autoIdx.push(index);
    }
    // anything else is already curated — passes through unchanged
  });

  // Bulk-confirm the auto-matched rows.
  let reviewQueue = [...needsIdx];
  if (autoIdx.length > 0) {
    p.note(
      autoIdx.map((i) => `${rows[i].from} -> ${rows[i].to} (${rows[i].notes})`).join('\n'),
      `${autoIdx.length} auto-matched row(s)`
    );
    const acceptAll = take(await p.confirm({ message: `Accept all ${autoIdx.length} auto-matched rows as 301s?` }));
    if (acceptAll) {
      for (const i of autoIdx) {
        decisions[i] = { kind: 'accept' };
      }
    } else {
      reviewQueue = [...autoIdx, ...needsIdx].sort((a, b) => a - b);
    }
  }

  // Per-row curation for NEEDS-MAPPING (and rejected autos).
  if (reviewQueue.length > 0) {
    p.log.step(`${reviewQueue.length} row(s) to curate`);
  }
  for (const i of reviewQueue) {
    decisions[i] = await askRowDecision(rows[i], slugOptions);
  }

  const finalRows = rows.map((row, index) => curateRow(row, decisions[index]));
  const mapped = finalRows.filter((row) => row.status !== '410' && !NEEDS_MAPPING_RE.test(row.notes)).length;
  const gone = finalRows.filter((row) => row.status === '410').length;
  const residue = finalRows.filter((row) => NEEDS_MAPPING_RE.test(row.notes)).length;

  p.note(
    [
      `${mapped} mapped (301/302), ${gone} gone (410), ${residue} still NEEDS-MAPPING`,
      residue > 0 ? pc.yellow('NEEDS-MAPPING residue means redirects:check WILL fail (curation unfinished).') : ''
    ]
      .filter(Boolean)
      .join('\n'),
    'Curation summary'
  );

  const write = take(await p.confirm({ message: `Write curated map to ${CURATED_PATH}? (overwrites it)` }));
  if (!write) {
    p.log.warn('Not written — curation discarded.');
    return false;
  }
  await writeFile(path.join(rootDir, CURATED_PATH), toCsv(finalRows));
  p.log.success(`${CURATED_PATH} written (${finalRows.length} rows).`);
  return true;
}

export async function redirectsFlow({ rootDir }) {
  p.log.step('Curate redirects — hard gate for redesigns (new-site-init Redirect Gate)');

  let forceCurated = false;
  for (;;) {
    const wrote = await curateOnce(rootDir, forceCurated);
    if (!wrote) {
      return;
    }

    const spinner = p.spinner();
    spinner.start('Running npm run redirects:check');
    const { code, lines } = await runNpm('redirects:check', [], { cwd: rootDir });
    const { label, failLines } = summarize(lines);
    spinner.stop(code === 0 ? pc.green(`redirects:check PASSED — ${label}`) : pc.red(`redirects:check FAILED — ${label}`));

    if (code === 0) {
      const nonFail = lines.filter((line) => /^(SKIP|NOTE):/.test(line));
      if (nonFail.length > 0) {
        p.note(nonFail.join('\n'), 'redirects:check skips/notes (a skip is not a pass)');
      }
      p.log.success('Redirect gate passed. Reminder: changing redirects later still requires explicit approval.');
      return;
    }

    p.log.error('The redirect gate is NOT passed:');
    for (const line of failLines) {
      p.log.error(`  ${line}`);
    }
    const retry = take(await p.confirm({ message: 'Re-enter curation on data/redirects.csv to fix these?' }));
    if (!retry) {
      p.log.warn('Leaving with redirects:check failing — the redesign build plan must not be approved in this state.');
      return;
    }
    forceCurated = true; // re-edit the file we just wrote, not the stale draft
  }
}
