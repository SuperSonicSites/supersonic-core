import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  checkCompositionsDoc,
  checkCompositionAgainstRegistry,
  buildRegistryEntryMap
} from './validate-copy.mjs';

// compose:check -- the layout->copy preflight gate.
//
// Runs BEFORE the copywriter resolves the slot manifest, so a bad composition fails closed
// here with a named, blame-routed COMPOSE-* rule instead of an opaque join-time crash deep
// inside the writer. It validates page-compositions.{example,}.json against the pattern
// registry and the SEO briefs: every composed slug exists and is approved, content-bearing
// patterns declare copy_slots, repeatable patterns declare instances, each page has exactly
// one H1 owner, and each page maps to a real brief. Deck/coverage checks live in copy:check.

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const defaultRoot = path.resolve(__dirname, '..');

async function exists(absolutePath) {
  try {
    await stat(absolutePath);
    return true;
  } catch {
    return false;
  }
}

async function readJson(rootDir, relativePath) {
  return JSON.parse(await readFile(path.join(rootDir, relativePath), 'utf8'));
}

function briefIdSet(briefsDoc) {
  return new Set(
    (Array.isArray(briefsDoc && briefsDoc.briefs) ? briefsDoc.briefs : [])
      .map((brief) => brief && brief.page_id)
      .filter(Boolean)
  );
}

export async function validateCompositions({ rootDir = defaultRoot } = {}) {
  const results = [];

  let registryEntriesBySlug = new Map();
  if (await exists(path.join(rootDir, 'data/pattern-certifications.json'))) {
    try {
      registryEntriesBySlug = buildRegistryEntryMap(await readJson(rootDir, 'data/pattern-certifications.json'));
    } catch (error) {
      results.push({ status: 'fail', message: `data/pattern-certifications.json is invalid JSON: ${error.message}` });
    }
  }

  // Pair each composition file with its sibling briefs file so COMPOSE-6 can resolve pages.
  const pairs = [{ comp: 'data/page-compositions.example.json', briefs: 'data/seo-briefs.example.json' }];
  if (await exists(path.join(rootDir, 'data/page-compositions.json'))) {
    pairs.push({ comp: 'data/page-compositions.json', briefs: 'data/seo-briefs.json' });
  }

  for (const { comp, briefs } of pairs) {
    if (!(await exists(path.join(rootDir, comp)))) {
      continue;
    }
    let doc;
    try {
      doc = await readJson(rootDir, comp);
    } catch (error) {
      results.push({ status: 'fail', message: `${comp} is invalid JSON: ${error.message}` });
      continue;
    }

    const structureIssues = checkCompositionsDoc(doc);
    if (structureIssues.length > 0) {
      for (const issue of structureIssues) {
        results.push({ status: 'fail', message: `${comp}: ${issue}` });
      }
      // Structure is broken; skip the registry cross-check for this file.
      continue;
    }
    results.push({ status: 'pass', message: `${comp} passes page-composition structure (${doc.compositions.length} pages)` });

    let briefIds = null;
    if (await exists(path.join(rootDir, briefs))) {
      try {
        briefIds = briefIdSet(await readJson(rootDir, briefs));
      } catch (error) {
        results.push({ status: 'fail', message: `${briefs} is invalid JSON: ${error.message}` });
      }
    }

    const registryIssues = checkCompositionAgainstRegistry(doc, { registryEntriesBySlug, briefIds });
    if (registryIssues.length === 0) {
      results.push({ status: 'pass', message: `${comp} passes the layout->copy gate (slugs approved, slots + instances + H1 owner resolved)` });
    } else {
      for (const issue of registryIssues) {
        results.push({ status: 'fail', message: `${comp}: ${issue}` });
      }
    }
  }

  return results;
}

if (process.argv[1] === __filename) {
  const results = await validateCompositions();
  for (const result of results) {
    console.log(`${result.status === 'pass' ? 'PASS' : 'FAIL'}: ${result.message}`);
  }
  if (results.some((result) => result.status === 'fail')) {
    process.exit(1);
  }
}
