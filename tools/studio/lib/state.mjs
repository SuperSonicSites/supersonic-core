// Pipeline-state derivation for Supersonic Studio.
//
// deriveState(fileMap) is PURE: it receives already-parsed file contents and
// returns the ordered stage checklist the Studio main menu renders. loadState()
// is the thin filesystem wrapper that builds the fileMap and calls it.
//
// Stage statuses:
//   done      — the stage's artifact exists and passes its quick shape check
//   next      — the first pending stage in pipeline order (the suggested action)
//   pending   — not started yet
//   attention — an artifact exists but its quick shape check fails (invalid
//               JSON, NEEDS-MAPPING residue, malformed top-level shape)

import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { parseRedirectsCsv } from '../../lib/redirects.mjs';

// fileMap keys. JSON files map to parsed objects (or the raw string when the
// file exists but is not valid JSON, or null when missing). The redirects CSV
// maps to its raw text. PACKAGES maps to an array of .zip filenames.
export const STATE_FILES = {
  INTAKE: 'data/site-intake.json',
  INVENTORY: 'captured/inventory.json',
  REDIRECTS: 'data/redirects.csv',
  BRIEFS: 'data/seo-briefs.json',
  COMPOSITIONS: 'data/page-compositions.json',
  COPY_DECK: 'data/copy-deck.json',
  CERTIFICATIONS: 'data/pattern-certifications.json',
  PACKAGES: 'packages/*.zip'
};

// Same TBD heuristic as tools/validate-seo-briefs.mjs isTbdIntake(): the
// freshly cloned intake template has client.name literally "TBD".
export function isTbdIntake(intake) {
  const name = intake && intake.client && intake.client.name;
  return typeof name !== 'string' || !name.trim() || name.trim().toUpperCase() === 'TBD';
}

function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

// One "exists non-empty JSON doc with a non-empty <key> array" stage check.
function docArrayStage(doc, fileLabel, key, { missingDetail, doneNoun }) {
  if (doc === null || doc === undefined) {
    return { status: 'pending', detail: missingDetail };
  }
  if (!isPlainObject(doc)) {
    return { status: 'attention', detail: `${fileLabel} exists but is not a JSON object (invalid JSON?)` };
  }
  const items = Array.isArray(doc[key]) ? doc[key] : null;
  if (!items || items.length === 0) {
    return { status: 'attention', detail: `${fileLabel} exists but ${key}[] is empty or malformed` };
  }
  return { status: 'done', detail: `${items.length} ${doneNoun}` };
}

// Pure stage derivation. fileMap: { [STATE_FILES.*]: parsedContentOrNull }.
// Returns ordered stages: [{ id, label, status, detail }].
export function deriveState(fileMap) {
  const map = fileMap && typeof fileMap === 'object' ? fileMap : {};
  const intake = map[STATE_FILES.INTAKE] ?? null;
  const intakeParsed = isPlainObject(intake) ? intake : null;
  const isRedesign = Boolean(
    intakeParsed && isPlainObject(intakeParsed.legacySite) && intakeParsed.legacySite.isRedesign === true
  );

  const stages = [];

  // --- intake ----------------------------------------------------------------
  if (intake === null || intake === undefined) {
    stages.push({ id: 'intake', status: 'pending', detail: 'data/site-intake.json missing — run the Init interview' });
  } else if (!intakeParsed || !isPlainObject(intakeParsed.client)) {
    stages.push({ id: 'intake', status: 'attention', detail: 'data/site-intake.json exists but is malformed (no client object / invalid JSON)' });
  } else if (isTbdIntake(intakeParsed)) {
    stages.push({ id: 'intake', status: 'pending', detail: 'TBD template — run Init interview' });
  } else {
    stages.push({
      id: 'intake',
      status: 'done',
      detail: `client: ${intakeParsed.client.name}${isRedesign ? ' (redesign)' : ' (new build)'}`
    });
  }

  // --- capture (redesigns only) ------------------------------------------------
  const inventory = map[STATE_FILES.INVENTORY] ?? null;
  if (!isRedesign) {
    stages.push({ id: 'capture', status: 'done', detail: 'n/a (new build)' });
  } else if (inventory === null || inventory === undefined) {
    stages.push({ id: 'capture', status: 'pending', detail: 'captured/inventory.json missing — run Capture legacy site' });
  } else if (!Array.isArray(inventory)) {
    stages.push({ id: 'capture', status: 'attention', detail: 'captured/inventory.json exists but is not a JSON array' });
  } else {
    stages.push({ id: 'capture', status: 'done', detail: `${inventory.length} legacy pages captured` });
  }

  // --- redirects ----------------------------------------------------------------
  const csvText = map[STATE_FILES.REDIRECTS] ?? null;
  if (csvText === null || csvText === undefined) {
    stages.push(
      isRedesign
        ? { id: 'redirects', status: 'pending', detail: 'data/redirects.csv missing — curate legacy redirects' }
        : { id: 'redirects', status: 'done', detail: 'no redirect map yet (fine for a new build)' }
    );
  } else if (typeof csvText !== 'string') {
    stages.push({ id: 'redirects', status: 'attention', detail: 'data/redirects.csv could not be read as text' });
  } else {
    const { issues, rows } = parseRedirectsCsv(csvText);
    const needsMapping = rows.filter((row) => /NEEDS-MAPPING/.test(row.notes)).length;
    if (issues.length > 0) {
      stages.push({ id: 'redirects', status: 'attention', detail: `data/redirects.csv has ${issues.length} CSV structure issue(s)` });
    } else if (needsMapping > 0) {
      stages.push({
        id: 'redirects',
        status: 'attention',
        detail: `${needsMapping} NEEDS-MAPPING row(s) — curation unfinished (run Curate redirects)`
      });
    } else if (rows.length === 0) {
      stages.push(
        isRedesign
          ? { id: 'redirects', status: 'pending', detail: 'header only — curate the legacy redirect map' }
          : { id: 'redirects', status: 'done', detail: 'empty map (fine for a new build)' }
      );
    } else {
      stages.push({ id: 'redirects', status: 'done', detail: `${rows.length} curated row(s), no NEEDS-MAPPING` });
    }
  }

  // --- briefs / compositions / copy / certifications -----------------------------
  stages.push({
    id: 'briefs',
    ...docArrayStage(map[STATE_FILES.BRIEFS] ?? null, 'data/seo-briefs.json', 'briefs', {
      missingDetail: 'data/seo-briefs.json missing — run seo-strategist',
      doneNoun: 'SEO briefs'
    })
  });
  stages.push({
    id: 'compositions',
    ...docArrayStage(map[STATE_FILES.COMPOSITIONS] ?? null, 'data/page-compositions.json', 'compositions', {
      missingDetail: 'data/page-compositions.json missing — run layout-architect',
      doneNoun: 'page compositions'
    })
  });
  stages.push({
    id: 'copy',
    ...docArrayStage(map[STATE_FILES.COPY_DECK] ?? null, 'data/copy-deck.json', 'pages', {
      missingDetail: 'data/copy-deck.json missing — run copywriter',
      doneNoun: 'pages of copy'
    })
  });
  stages.push({
    id: 'certifications',
    ...docArrayStage(map[STATE_FILES.CERTIFICATIONS] ?? null, 'data/pattern-certifications.json', 'patterns', {
      missingDetail: 'data/pattern-certifications.json missing — run certify-pattern',
      doneNoun: 'certified pattern records'
    })
  });

  // --- package --------------------------------------------------------------------
  const zips = map[STATE_FILES.PACKAGES] ?? null;
  if (Array.isArray(zips) && zips.length > 0) {
    stages.push({ id: 'package', status: 'done', detail: `${zips.length} zip(s): ${zips.join(', ')}` });
  } else {
    stages.push({ id: 'package', status: 'pending', detail: 'no packages/*.zip — run Validate / package' });
  }

  // First pending stage becomes the suggested next action. 'attention' stages
  // keep their status: they already demand action and must not look routine.
  const next = stages.find((stage) => stage.status === 'pending');
  if (next) {
    next.status = 'next';
  }

  const LABELS = {
    intake: 'Intake',
    capture: 'Legacy capture',
    redirects: 'Redirects',
    briefs: 'SEO briefs',
    compositions: 'Page compositions',
    copy: 'Copy deck',
    certifications: 'Pattern certifications',
    package: 'Package'
  };
  return stages.map((stage) => ({ ...stage, label: LABELS[stage.id] || stage.id }));
}

// --- filesystem wrapper ------------------------------------------------------

async function readJsonOrRaw(absolutePath) {
  let text;
  try {
    text = await readFile(absolutePath, 'utf8');
  } catch {
    return null; // missing
  }
  try {
    return JSON.parse(text);
  } catch {
    return text; // exists but invalid JSON -> quick shape checks flag 'attention'
  }
}

export async function loadState(rootDir) {
  const fileMap = {};
  for (const key of [
    STATE_FILES.INTAKE,
    STATE_FILES.INVENTORY,
    STATE_FILES.BRIEFS,
    STATE_FILES.COMPOSITIONS,
    STATE_FILES.COPY_DECK,
    STATE_FILES.CERTIFICATIONS
  ]) {
    fileMap[key] = await readJsonOrRaw(path.join(rootDir, key));
  }
  try {
    fileMap[STATE_FILES.REDIRECTS] = await readFile(path.join(rootDir, STATE_FILES.REDIRECTS), 'utf8');
  } catch {
    fileMap[STATE_FILES.REDIRECTS] = null;
  }
  try {
    fileMap[STATE_FILES.PACKAGES] = (await readdir(path.join(rootDir, 'packages'))).filter((name) =>
      name.toLowerCase().endsWith('.zip')
    );
  } catch {
    fileMap[STATE_FILES.PACKAGES] = null;
  }
  return deriveState(fileMap);
}
