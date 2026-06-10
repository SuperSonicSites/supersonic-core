// Offline self-test for Supersonic Studio (node tools/studio/index.mjs --self-test).
// No TUI, no prompts, no network: exercises the pure logic in tools/studio/lib/
// against embedded fixtures (plus the committed intake schema + example file).
// House PASS/FAIL output; returns exit code 1 on any failure.

import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { deriveState, STATE_FILES, isTbdIntake } from './lib/state.mjs';
import { summarize } from './lib/run.mjs';
import { checkAgainstSchema } from './lib/schema-lite.mjs';
import { curateRow, buildNewPageSlugs, CURATED_NOTE } from './lib/curation.mjs';
import { parseRedirectsCsv } from '../lib/redirects.mjs';
import { toCsv } from '../lib/capture.mjs';

// --- embedded fixtures ---------------------------------------------------------

const TBD_INTAKE = {
  client: { name: 'TBD', businessType: 'TBD', locationOrServiceArea: 'TBD', primaryOffer: 'TBD' },
  pages: []
};

const REDESIGN_INTAKE = {
  client: { name: 'Acme Plumbing', businessType: 'Service', locationOrServiceArea: 'Dallas', primaryOffer: 'Repairs' },
  pages: [
    { title: 'Home', slug: '/', purpose: 'p', primaryCta: 'c', launchRequired: true },
    { title: 'Services', slug: '/services/', purpose: 'p', primaryCta: 'c', launchRequired: true }
  ],
  legacySite: { isRedesign: true, url: 'https://old.example.com' }
};

const RESIDUE_CSV = [
  'from,to,status,notes',
  '/old-services/,/services,301,auto:segment:1.00',
  '/old-team/,,301,NEEDS-MAPPING',
  '/old-blog/,,301,NEEDS-MAPPING',
  ''
].join('\n');

const CLEAN_CSV = ['from,to,status,notes', '/old-services/,/services,301,curated:studio', '/old-team/,,410,curated:studio 410 gone', ''].join(
  '\n'
);

const DONE_BRIEFS = { briefs: [{ page_id: 'home' }] };
const DONE_COMPOSITIONS = { version: 1, compositions: [{ url_slug: '/' }] };
const DONE_COPY = { pages: [{ page_id: 'home' }] };
const DONE_CERTS = { patterns: [{ slug: 'theme/hero' }] };

function fileMapOf(overrides) {
  const base = {
    [STATE_FILES.INTAKE]: null,
    [STATE_FILES.INVENTORY]: null,
    [STATE_FILES.REDIRECTS]: null,
    [STATE_FILES.BRIEFS]: null,
    [STATE_FILES.COMPOSITIONS]: null,
    [STATE_FILES.COPY_DECK]: null,
    [STATE_FILES.CERTIFICATIONS]: null,
    [STATE_FILES.PACKAGES]: null
  };
  return { ...base, ...overrides };
}

const stageById = (stages, id) => stages.find((stage) => stage.id === id);

// --- runner ---------------------------------------------------------------------

export async function runSelfTest() {
  const results = [];
  const check = (name, condition) => {
    results.push({ ok: Boolean(condition), name });
  };

  // ===== deriveState (a): virgin repo / TBD intake ===============================
  const virgin = deriveState(fileMapOf({ [STATE_FILES.INTAKE]: TBD_INTAKE, [STATE_FILES.REDIRECTS]: 'from,to,status,notes\n' }));
  check('virgin: returns 8 ordered stages', virgin.length === 8 && virgin[0].id === 'intake' && virgin[7].id === 'package');
  check('virgin: intake is the next stage', stageById(virgin, 'intake').status === 'next');
  check('virgin: intake detail names the TBD template + Init interview', /TBD template — run Init interview/.test(stageById(virgin, 'intake').detail));
  check('virgin: capture is n/a for a non-redesign', stageById(virgin, 'capture').status === 'done' && /n\/a \(new build\)/.test(stageById(virgin, 'capture').detail));
  check('virgin: empty redirect map is fine for a new build', stageById(virgin, 'redirects').status === 'done');
  check('virgin: briefs pending', stageById(virgin, 'briefs').status === 'pending');
  check('virgin: package pending', stageById(virgin, 'package').status === 'pending');
  check('virgin: exactly one stage marked next', virgin.filter((stage) => stage.status === 'next').length === 1);
  check('isTbdIntake heuristic matches the validator convention', isTbdIntake(TBD_INTAKE) && !isTbdIntake(REDESIGN_INTAKE));

  // ===== deriveState (b): redesign mid-pipeline with NEEDS-MAPPING residue ======
  const mid = deriveState(
    fileMapOf({
      [STATE_FILES.INTAKE]: REDESIGN_INTAKE,
      [STATE_FILES.INVENTORY]: [{ path: '/old-services/', status: 200 }, { path: '/old-team/', status: 200 }],
      [STATE_FILES.REDIRECTS]: RESIDUE_CSV
    })
  );
  check('mid: intake done and labeled redesign', stageById(mid, 'intake').status === 'done' && /redesign/.test(stageById(mid, 'intake').detail));
  check('mid: capture done with page count', stageById(mid, 'capture').status === 'done' && /2 legacy pages/.test(stageById(mid, 'capture').detail));
  check('mid: NEEDS-MAPPING residue puts redirects in attention', stageById(mid, 'redirects').status === 'attention');
  check('mid: redirects detail counts the residue', /2 NEEDS-MAPPING/.test(stageById(mid, 'redirects').detail));
  check('mid: briefs become the next pending stage', stageById(mid, 'briefs').status === 'next');

  // attention on malformed artifacts
  const broken = deriveState(fileMapOf({ [STATE_FILES.INTAKE]: 'not json {', [STATE_FILES.BRIEFS]: { briefs: [] } }));
  check('attention: unparseable intake flags attention', stageById(broken, 'intake').status === 'attention');
  check('attention: empty briefs[] flags attention, not done', stageById(broken, 'briefs').status === 'attention');

  // redesign with missing capture
  const noCapture = deriveState(fileMapOf({ [STATE_FILES.INTAKE]: REDESIGN_INTAKE, [STATE_FILES.REDIRECTS]: 'from,to,status,notes\n' }));
  check('redesign: missing inventory makes capture the next stage', stageById(noCapture, 'capture').status === 'next');
  check('redesign: header-only redirects map is pending, not done', stageById(noCapture, 'redirects').status === 'pending');

  // ===== deriveState (c): all done ===============================================
  const allDone = deriveState(
    fileMapOf({
      [STATE_FILES.INTAKE]: REDESIGN_INTAKE,
      [STATE_FILES.INVENTORY]: [{ path: '/old-services/', status: 200 }],
      [STATE_FILES.REDIRECTS]: CLEAN_CSV,
      [STATE_FILES.BRIEFS]: DONE_BRIEFS,
      [STATE_FILES.COMPOSITIONS]: DONE_COMPOSITIONS,
      [STATE_FILES.COPY_DECK]: DONE_COPY,
      [STATE_FILES.CERTIFICATIONS]: DONE_CERTS,
      [STATE_FILES.PACKAGES]: ['supersonic-site-theme.zip', 'supersonic-site-core.zip']
    })
  );
  check('all-done: every stage is done', allDone.every((stage) => stage.status === 'done'));
  check('all-done: package detail lists the zips', /supersonic-site-theme\.zip/.test(stageById(allDone, 'package').detail));

  // ===== schema-lite ==============================================================
  const here = path.dirname(fileURLToPath(import.meta.url));
  const rootDir = path.resolve(here, '..', '..');
  const schema = JSON.parse(await readFile(path.join(rootDir, 'data/site-intake.schema.json'), 'utf8'));
  const example = JSON.parse(await readFile(path.join(rootDir, 'data/site-intake.example.json'), 'utf8'));

  check('schema-lite: data/site-intake.example.json passes', checkAgainstSchema(example, schema).length === 0);

  const unknownKey = JSON.parse(JSON.stringify(example));
  unknownKey.client.surpriseField = true;
  const unknownIssues = checkAgainstSchema(unknownKey, schema);
  check('schema-lite: unknown key flagged with its JSON path', unknownIssues.some((issue) => issue.includes('$.client') && issue.includes('surpriseField')));

  const wrongType = JSON.parse(JSON.stringify(example));
  wrongType.client.name = 5;
  const typeIssues = checkAgainstSchema(wrongType, schema);
  check('schema-lite: wrong type flagged', typeIssues.some((issue) => issue.includes('$.client.name') && issue.includes('expected string')));

  const wrongItemType = JSON.parse(JSON.stringify(example));
  wrongItemType.brand.voice = ['fine', 42];
  check(
    'schema-lite: wrong array item type flagged with index',
    checkAgainstSchema(wrongItemType, schema).some((issue) => issue.includes('$.brand.voice[1]'))
  );

  const missingRequired = JSON.parse(JSON.stringify(example));
  delete missingRequired.goals;
  check(
    'schema-lite: missing required property flagged',
    checkAgainstSchema(missingRequired, schema).some((issue) => issue.includes('missing required property "goals"'))
  );

  const nestedRequired = JSON.parse(JSON.stringify(example));
  delete nestedRequired.legacySite.isRedesign;
  check(
    'schema-lite: nested missing required (legacySite.isRedesign) flagged',
    checkAgainstSchema(nestedRequired, schema).some((issue) => issue.includes('$.legacySite') && issue.includes('isRedesign'))
  );

  check('schema-lite: root $schema annotation key is tolerated', !checkAgainstSchema(example, schema).some((issue) => issue.includes('$schema')));

  // ===== summarize ================================================================
  const sampleLines = [
    'PASS: data/redirects.csv passes redirect rules RED-1/2/3/4/6 (12 rows)',
    'PASS: regression fixture: cannibalization detector is strict',
    'FAIL: RED-4: data/redirects.csv line 3: destination "/nope" is not a known new-site path',
    'SKIP: RED-5: legacy coverage SKIPPED — data/legacy-inventory.json not found',
    'NOTE: data/redirects.csv: the redirect map is empty (header only)',
    'unrelated npm noise that must not be counted'
  ];
  const summary = summarize(sampleLines);
  check('summarize: counts PASS/FAIL/SKIP/NOTE', summary.counts.pass === 2 && summary.counts.fail === 1 && summary.counts.skip === 1 && summary.counts.note === 1);
  check('summarize: FAIL line kept verbatim with rule ID', summary.failLines[0] === sampleLines[2] && summary.failLines[0].includes('RED-4'));
  check('summarize: label is human-readable', summary.label === '2 PASS, 1 FAIL, 1 SKIP, 1 NOTE');
  check('summarize: empty input is harmless', summarize([]).label === 'no PASS/FAIL output' && summarize(null).counts.fail === 0);

  // ===== redirect curation transform =============================================
  const needsRow = { from: '/old-team/', to: '', status: '301', notes: 'NEEDS-MAPPING' };
  const mapped = curateRow(needsRow, { kind: 'map', to: '/about' });
  check('curation: NEEDS-MAPPING -> curated 301 row', mapped.to === '/about' && mapped.status === '301' && mapped.notes === CURATED_NOTE);
  check('curation: curated row has no NEEDS-MAPPING residue', !/NEEDS-MAPPING/.test(mapped.notes));

  const gone = curateRow(needsRow, { kind: 'gone' });
  check('curation: 410 decision empties "to" and sets status 410', gone.to === '' && gone.status === '410');

  const skipped = curateRow(needsRow, { kind: 'skip' });
  check('curation: skip leaves the row unchanged (residue stays visible)', skipped.notes === 'NEEDS-MAPPING' && skipped.to === '');

  const accepted = curateRow({ from: '/old-services/', to: '/services', status: '301', notes: 'auto:exact:1.00' }, { kind: 'accept' });
  check('curation: accept keeps the auto match as-is', accepted.to === '/services' && accepted.notes === 'auto:exact:1.00');

  // round-trip through the shared CSV serializer/parser
  const roundTrip = parseRedirectsCsv(toCsv([mapped, gone]));
  check(
    'curation: curated rows round-trip through toCsv/parseRedirectsCsv',
    roundTrip.issues.length === 0 &&
      roundTrip.rows.length === 2 &&
      roundTrip.rows[0].to === '/about' &&
      roundTrip.rows[1].status === '410'
  );

  const slugs = buildNewPageSlugs(
    { pages: [{ title: 'Home', slug: '/' }, { title: 'Services', slug: '/services/' }, { title: 'TBD', slug: 'TBD' }] },
    { compositions: [{ url_slug: '/services' }, { url_slug: '/contact/' }] }
  );
  check(
    'curation: slug list merges intake + compositions, dedupes, drops TBD, adds allowlist',
    slugs.includes('/') && slugs.includes('/services') && slugs.includes('/contact') && slugs.includes('/blog') && !slugs.some((slug) => /tbd/i.test(slug)) && slugs.filter((slug) => slug === '/services').length === 1
  );

  // --- report --------------------------------------------------------------------
  let failures = 0;
  for (const result of results) {
    if (result.ok) {
      console.log(`PASS: ${result.name}`);
    } else {
      failures += 1;
      console.log(`FAIL: ${result.name}`);
    }
  }
  console.log(`\n${results.length - failures}/${results.length} self-test checks passed.`);
  return failures > 0 ? 1 : 0;
}
