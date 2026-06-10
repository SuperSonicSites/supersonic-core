import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const defaultRoot = path.resolve(__dirname, '..');

const ARCHETYPES = new Set([
  'home',
  'service',
  'landing',
  'about',
  'contact',
  'pricing',
  'blog-article',
  'faq',
  'local-business'
]);
const INTENTS = new Set(['informational', 'commercial', 'transactional', 'navigational']);
const SCHEMA_EMITTERS = new Set(['plugin', 'rank-math', 'seo-layer']);
const OWNED_METADATA = ['seo_title', 'meta_description', 'schema'];
const SLUG_RE = /^\/(?:[a-z0-9]+(?:-[a-z0-9]+)*(?:\/[a-z0-9]+(?:-[a-z0-9]+)*)*)?\/?$/;
const REQUIRED_BRIEF_FIELDS = [
  'page_id',
  'page_title',
  'url_slug',
  'archetype',
  'search_intent',
  'primary_keyword',
  'secondary_keywords',
  'lsi_terms',
  'seo_title',
  'meta_description',
  'target_word_count',
  'outline',
  'internal_links',
  'schema'
];

// Normalizes a site-relative path for comparison: lowercase, leading "/", no
// trailing "/" (except the root). Returns null for non-path values.
function normalizePath(value) {
  if (typeof value !== 'string' || !value.trim()) {
    return null;
  }
  let candidate = value.trim();
  if (/^https?:\/\//i.test(candidate)) {
    try {
      candidate = new URL(candidate).pathname;
    } catch {
      return null;
    }
  }
  if (!candidate.startsWith('/')) {
    return null;
  }
  candidate = candidate.toLowerCase();
  if (candidate.length > 1 && candidate.endsWith('/')) {
    candidate = candidate.slice(0, -1);
  }
  return candidate;
}

// Minimal CSV parser for data/redirects.csv (from,to,status,notes). Handles
// quoted fields the same way tools/capture-site.mjs toCsv() writes them.
export function parseRedirectsCsv(text) {
  const rows = [];
  const lines = String(text).split(/\r?\n/);
  for (const line of lines) {
    if (!line.trim()) {
      continue;
    }
    const fields = [];
    let field = '';
    let quoted = false;
    for (let i = 0; i < line.length; i += 1) {
      const char = line[i];
      if (quoted) {
        if (char === '"' && line[i + 1] === '"') {
          field += '"';
          i += 1;
        } else if (char === '"') {
          quoted = false;
        } else {
          field += char;
        }
      } else if (char === '"') {
        quoted = true;
      } else if (char === ',') {
        fields.push(field);
        field = '';
      } else {
        field += char;
      }
    }
    fields.push(field);
    rows.push({
      from: (fields[0] || '').trim(),
      to: (fields[1] || '').trim(),
      status: (fields[2] || '').trim(),
      notes: (fields[3] || '').trim()
    });
  }
  // Drop the header row if present.
  if (rows.length && rows[0].from.toLowerCase() === 'from' && rows[0].to.toLowerCase() === 'to') {
    rows.shift();
  }
  return rows;
}

// The freshly cloned intake is a TBD template (client fields literally "TBD").
// Treat it as not-yet-filled, same convention as tools/capture-site.mjs.
function isTbdIntake(intake) {
  const name = intake && intake.client && intake.client.name;
  return typeof name !== 'string' || !name.trim() || name.trim().toUpperCase() === 'TBD';
}

// Legacy rankings preservation for redesigns (SEO-LEG-1 / SEO-LEG-2).
// Cross-checks the briefs against intake legacySite and data/redirects.csv rows.
// Returns { issues, skips }: issues are hard failures, skips are labeled reasons
// a rule did not apply (never silent).
export function checkLegacyRules(doc, intake, redirectRows) {
  const issues = [];
  const skips = [];

  const legacySite = intake && typeof intake === 'object' ? intake.legacySite : null;
  if (!legacySite || typeof legacySite !== 'object' || legacySite.isRedesign !== true) {
    skips.push('SEO-LEG-1/SEO-LEG-2: intake legacySite.isRedesign is not true (not a redesign build)');
    return { issues, skips };
  }

  const briefs = Array.isArray(doc && doc.briefs) ? doc.briefs : [];
  const briefBySlug = new Map();
  for (const brief of briefs) {
    const slug = brief && typeof brief === 'object' ? normalizePath(brief.url_slug) : null;
    if (slug && !briefBySlug.has(slug)) {
      briefBySlug.set(slug, brief);
    }
  }
  const briefId = (brief) => brief.page_id || brief.url_slug || '?';

  const rows = Array.isArray(redirectRows) ? redirectRows : [];

  // SEO-LEG-1: every redirect that lands on a briefed page must be claimed by
  // that page's brief via legacy.sourceUrls, so the strategist provably consumed
  // the legacy URL map instead of redirecting blind.
  if (rows.length === 0) {
    skips.push('SEO-LEG-1: data/redirects.csv has no data rows yet (header-only or absent)');
  } else {
    for (const row of rows) {
      const from = normalizePath(row.from);
      const to = normalizePath(row.to);
      if (!from || !to) {
        continue;
      }
      const brief = briefBySlug.get(to);
      if (!brief) {
        continue;
      }
      const legacy = brief.legacy && typeof brief.legacy === 'object' ? brief.legacy : {};
      const claimed = (Array.isArray(legacy.sourceUrls) ? legacy.sourceUrls : [])
        .map(normalizePath)
        .filter(Boolean);
      if (!claimed.includes(from)) {
        issues.push(
          `SEO-LEG-1: redirect ${row.from} -> ${brief.url_slug} is in data/redirects.csv but brief ${briefId(brief)} legacy.sourceUrls does not list "${row.from}" (seo-strategist must record every legacy URL feeding this page)`
        );
      }
    }
  }

  // SEO-LEG-2: every known legacy top page that maps to a briefed page needs an
  // explicit rankings decision: preservedKeywords, or a waiver saying why not.
  const topPages = Array.isArray(legacySite.knownTopPages) ? legacySite.knownTopPages : [];
  if (topPages.length === 0) {
    skips.push('SEO-LEG-2: intake legacySite.knownTopPages is empty (no legacy top pages declared)');
  } else {
    const redirectByFrom = new Map();
    for (const row of rows) {
      const from = normalizePath(row.from);
      const to = normalizePath(row.to);
      if (from && to && !redirectByFrom.has(from)) {
        redirectByFrom.set(from, to);
      }
    }
    for (const topPage of topPages) {
      const legacyPath = topPage && typeof topPage === 'object' ? normalizePath(topPage.url) : null;
      if (!legacyPath) {
        continue;
      }
      const targetSlug = redirectByFrom.get(legacyPath) || legacyPath;
      const brief = briefBySlug.get(targetSlug);
      if (!brief) {
        continue;
      }
      const legacy = brief.legacy && typeof brief.legacy === 'object' ? brief.legacy : {};
      const preserved = (Array.isArray(legacy.preservedKeywords) ? legacy.preservedKeywords : []).filter(
        (keyword) => typeof keyword === 'string' && keyword.trim()
      );
      const waiver = typeof legacy.waiver === 'string' ? legacy.waiver.trim() : '';
      if (preserved.length === 0 && !waiver) {
        const keywords = (Array.isArray(topPage.rankingKeywords) ? topPage.rankingKeywords : [])
          .filter((keyword) => typeof keyword === 'string' && keyword.trim())
          .join(', ');
        issues.push(
          `SEO-LEG-2: legacy top page ${topPage.url} maps to brief ${briefId(brief)} (${brief.url_slug}) which has neither non-empty legacy.preservedKeywords nor a legacy.waiver${keywords ? ` — legacy ranking keywords at stake: ${keywords}` : ''}`
        );
      }
    }
  }

  return { issues, skips };
}

function slugWordCount(slug) {
  return slug
    .split('/')
    .filter(Boolean)
    .flatMap((segment) => segment.split('-'))
    .filter(Boolean).length;
}

// Returns an array of human-readable rule violations for a briefs document.
// Empty array means the document satisfies every hard rule.
export function checkBriefsDoc(doc) {
  const issues = [];

  if (!doc || typeof doc !== 'object' || Array.isArray(doc)) {
    issues.push('document must be a JSON object');
    return issues;
  }

  if (!doc.site || typeof doc.site !== 'object') {
    issues.push('missing site object');
  }

  const handoff = doc.handoff;
  if (!handoff || typeof handoff !== 'object') {
    issues.push('missing handoff object (ownership boundary)');
  } else {
    const owns = Array.isArray(handoff.strategistOwns) ? handoff.strategistOwns : [];
    const writer = Array.isArray(handoff.writerEditable) ? handoff.writerEditable : [];
    for (const field of OWNED_METADATA) {
      if (!owns.includes(field)) {
        issues.push(`handoff.strategistOwns must include "${field}" (seo-strategist owns SEO metadata)`);
      }
      if (writer.includes(field)) {
        issues.push(`handoff.writerEditable must NOT include "${field}" (the writer does not author SEO metadata)`);
      }
    }
  }

  const briefs = Array.isArray(doc.briefs) ? doc.briefs : null;
  if (!briefs || briefs.length === 0) {
    issues.push('briefs must be a non-empty array');
    return issues;
  }

  const primaryByTerm = new Map();
  const slugById = new Map();
  const pageIds = new Map();

  briefs.forEach((brief, index) => {
    const id = (brief && brief.page_id) || `#${index}`;

    if (!brief || typeof brief !== 'object') {
      issues.push(`brief ${id} must be an object`);
      return;
    }

    for (const field of REQUIRED_BRIEF_FIELDS) {
      if (brief[field] === undefined) {
        issues.push(`brief ${id} missing required field: ${field}`);
      }
    }

    if (brief.archetype !== undefined && !ARCHETYPES.has(brief.archetype)) {
      issues.push(`brief ${id} has invalid archetype: ${brief.archetype}`);
    }
    if (brief.search_intent !== undefined && !INTENTS.has(brief.search_intent)) {
      issues.push(`brief ${id} has invalid search_intent: ${brief.search_intent}`);
    }

    if (typeof brief.seo_title === 'string' && (brief.seo_title.length < 1 || brief.seo_title.length > 60)) {
      issues.push(`brief ${id} seo_title must be 1-60 chars (is ${brief.seo_title.length})`);
    }
    if (
      typeof brief.meta_description === 'string' &&
      (brief.meta_description.length < 1 || brief.meta_description.length > 160)
    ) {
      issues.push(`brief ${id} meta_description must be 1-160 chars (is ${brief.meta_description.length})`);
    }

    if (typeof brief.url_slug === 'string') {
      const slug = brief.url_slug;
      if (!SLUG_RE.test(slug)) {
        issues.push(`brief ${id} url_slug must be a lowercase, hyphen-separated path: ${slug}`);
      } else if (slug !== '/') {
        const words = slugWordCount(slug);
        if (words < 1 || words > 5) {
          issues.push(`brief ${id} url_slug should map to <=5 words (has ${words}): ${slug}`);
        }
      }
      const key = slug.toLowerCase();
      if (slugById.has(key)) {
        issues.push(`duplicate url_slug across briefs: ${slug} (${slugById.get(key)} and ${id})`);
      }
      slugById.set(key, id);
    }

    if (typeof brief.page_id === 'string') {
      if (pageIds.has(brief.page_id)) {
        issues.push(`duplicate page_id across briefs: ${brief.page_id}`);
      }
      pageIds.set(brief.page_id, id);
    }

    const primary = brief.primary_keyword;
    if (primary && typeof primary === 'object') {
      if (typeof primary.term === 'string') {
        const key = primary.term.trim().toLowerCase();
        if (primaryByTerm.has(key)) {
          issues.push(
            `keyword cannibalization: "${primary.term}" is the primary keyword for both ${primaryByTerm.get(key)} and ${id}`
          );
        }
        primaryByTerm.set(key, id);
      } else {
        issues.push(`brief ${id} primary_keyword.term must be a string`);
      }
      for (const metric of ['volume', 'seo_difficulty']) {
        if (typeof primary[metric] !== 'number') {
          issues.push(`brief ${id} primary_keyword.${metric} must be a number sourced from Ubersuggest`);
        }
      }
    }

    const schema = brief.schema;
    if (schema && typeof schema === 'object') {
      if (!schema.type) {
        issues.push(`brief ${id} schema.type is required`);
      }
      if (!SCHEMA_EMITTERS.has(schema.emitted_by)) {
        issues.push(
          `brief ${id} schema.emitted_by must be plugin/rank-math/seo-layer (schema is never emitted by this agent): ${schema.emitted_by}`
        );
      }
    }

    if (Array.isArray(brief.internal_links)) {
      brief.internal_links.forEach((link, linkIndex) => {
        if (!link || !link.target_slug || !link.anchor_text) {
          issues.push(`brief ${id} internal_links[${linkIndex}] needs a non-empty target_slug and anchor_text`);
        }
      });
    }

    const legacy = brief.legacy;
    if (legacy !== undefined) {
      if (!legacy || typeof legacy !== 'object' || Array.isArray(legacy)) {
        issues.push(`brief ${id} legacy must be an object (sourceUrls/preservedKeywords/rankingsNotes/waiver)`);
      } else {
        if (legacy.sourceUrls !== undefined) {
          if (!Array.isArray(legacy.sourceUrls)) {
            issues.push(`brief ${id} legacy.sourceUrls must be an array of site-relative paths`);
          } else {
            legacy.sourceUrls.forEach((sourceUrl, urlIndex) => {
              if (typeof sourceUrl !== 'string' || !sourceUrl.startsWith('/')) {
                issues.push(
                  `brief ${id} legacy.sourceUrls[${urlIndex}] must be a site-relative path starting with "/" (matching data/redirects.csv from): ${sourceUrl}`
                );
              }
            });
          }
        }
        if (legacy.preservedKeywords !== undefined && !Array.isArray(legacy.preservedKeywords)) {
          issues.push(`brief ${id} legacy.preservedKeywords must be an array of keyword strings`);
        }
        for (const field of ['rankingsNotes', 'waiver']) {
          if (legacy[field] !== undefined && typeof legacy[field] !== 'string') {
            issues.push(`brief ${id} legacy.${field} must be a string`);
          }
        }
      }
    }
  });

  return issues;
}

async function exists(absolutePath) {
  try {
    await stat(absolutePath);
    return true;
  } catch {
    return false;
  }
}

export async function validateSeoBriefs({ rootDir = defaultRoot } = {}) {
  const results = [];
  const files = ['data/seo-briefs.example.json'];
  const realFile = 'data/seo-briefs.json';
  if (await exists(path.join(rootDir, realFile))) {
    files.push(realFile);
  }

  for (const relativePath of files) {
    let doc;
    try {
      doc = JSON.parse(await readFile(path.join(rootDir, relativePath), 'utf8'));
    } catch (error) {
      results.push({ status: 'fail', message: `${relativePath} is invalid JSON: ${error.message}` });
      continue;
    }

    const issues = checkBriefsDoc(doc);
    if (issues.length === 0) {
      const count = Array.isArray(doc.briefs) ? doc.briefs.length : 0;
      results.push({ status: 'pass', message: `${relativePath} passes SEO brief rules (${count} briefs)` });
    } else {
      for (const issue of issues) {
        results.push({ status: 'fail', message: `${relativePath}: ${issue}` });
      }
    }
  }

  await runLegacyChecks(rootDir, results);
  runRegressionFixtures(results);
  return results;
}

// Runs SEO-LEG-1/SEO-LEG-2 against the live briefs only (the worked example is
// not cross-checked against this repo's intake). Every non-applicable state is a
// labeled skip, never silent; only real rule violations fail.
async function runLegacyChecks(rootDir, results) {
  const briefsPath = path.join(rootDir, 'data/seo-briefs.json');
  if (!(await exists(briefsPath))) {
    results.push({
      status: 'skip',
      message: 'SEO-LEG-1/SEO-LEG-2: data/seo-briefs.json absent (no live briefs to cross-check yet)'
    });
    return;
  }

  let doc;
  try {
    doc = JSON.parse(await readFile(briefsPath, 'utf8'));
  } catch {
    // Invalid JSON is already reported as a fail by the main loop above.
    return;
  }

  let intake;
  try {
    intake = JSON.parse(await readFile(path.join(rootDir, 'data/site-intake.json'), 'utf8'));
  } catch {
    results.push({
      status: 'skip',
      message: 'SEO-LEG-1/SEO-LEG-2: data/site-intake.json missing or invalid JSON (cannot cross-check legacy rankings)'
    });
    return;
  }
  if (isTbdIntake(intake)) {
    results.push({
      status: 'skip',
      message: 'SEO-LEG-1/SEO-LEG-2: data/site-intake.json is still the TBD template (Init interview not captured yet)'
    });
    return;
  }

  let redirectRows = [];
  try {
    redirectRows = parseRedirectsCsv(await readFile(path.join(rootDir, 'data/redirects.csv'), 'utf8'));
  } catch {
    redirectRows = [];
  }

  const { issues, skips } = checkLegacyRules(doc, intake, redirectRows);
  for (const skip of skips) {
    results.push({ status: 'skip', message: skip });
  }
  for (const issue of issues) {
    results.push({ status: 'fail', message: `data/seo-briefs.json: ${issue}` });
  }
  for (const rule of ['SEO-LEG-1', 'SEO-LEG-2']) {
    const skipped = skips.some((skip) => skip.startsWith(rule) || skip.startsWith('SEO-LEG-1/SEO-LEG-2'));
    const failed = issues.some((issue) => issue.startsWith(rule));
    if (!skipped && !failed) {
      results.push({ status: 'pass', message: `data/seo-briefs.json passes ${rule} (legacy rankings preservation)` });
    }
  }
}

function assertFixture(results, name, condition) {
  results.push({
    status: condition ? 'pass' : 'fail',
    message: condition
      ? `regression fixture: ${name} is strict`
      : `regression fixture FAILED: ${name} is not strict`
  });
}

function runRegressionFixtures(results) {
  const handoff = {
    strategistOwns: ['seo_title', 'meta_description', 'schema'],
    writerEditable: ['section body copy'],
    structureBy: 'layout-architect',
    schemaEmittedBy: 'plugin'
  };
  const site = { niche: 'n', geography: 'g', competitors: [] };
  const goodBrief = {
    page_id: 'a',
    page_title: 'A',
    url_slug: '/a-page',
    archetype: 'service',
    search_intent: 'commercial',
    primary_keyword: { term: 'kw one', volume: 10, seo_difficulty: 5 },
    secondary_keywords: [],
    lsi_terms: ['x'],
    seo_title: 'Title',
    meta_description: 'Desc',
    target_word_count: 100,
    outline: { h1: 'H1', sections: [] },
    internal_links: [],
    schema: { type: 'Service', emitted_by: 'plugin' }
  };

  assertFixture(results, 'clean fixture has no issues', checkBriefsDoc({ site, handoff, briefs: [goodBrief] }).length === 0);

  const cannibalized = checkBriefsDoc({
    site,
    handoff,
    briefs: [goodBrief, { ...goodBrief, page_id: 'b', url_slug: '/b-page' }]
  });
  assertFixture(results, 'cannibalization detector', cannibalized.some((issue) => issue.includes('cannibalization')));

  const longTitle = checkBriefsDoc({ site, handoff, briefs: [{ ...goodBrief, seo_title: 'x'.repeat(70) }] });
  assertFixture(results, 'seo_title length detector', longTitle.some((issue) => issue.includes('seo_title must be 1-60')));

  const writerOwns = checkBriefsDoc({
    site,
    handoff: { ...handoff, writerEditable: ['seo_title'] },
    briefs: [goodBrief]
  });
  assertFixture(results, 'writer-ownership detector', writerOwns.some((issue) => issue.includes('writerEditable must NOT include')));

  const restSchema = checkBriefsDoc({
    site,
    handoff,
    briefs: [{ ...goodBrief, schema: { type: 'Service', emitted_by: 'rest' } }]
  });
  assertFixture(results, 'schema-emitter detector', restSchema.some((issue) => issue.includes('schema.emitted_by must be')));

  // SEO-LEG fixtures: legacy rankings preservation on redesign builds.
  const redesignIntake = {
    client: { name: 'Acme Plumbing', businessType: 'b', locationOrServiceArea: 'l', primaryOffer: 'o' },
    legacySite: {
      isRedesign: true,
      url: 'https://legacy.example.com',
      knownTopPages: [
        {
          url: 'https://legacy.example.com/old-drains/',
          monthlySessions: 900,
          rankingKeywords: ['drain cleaning dallas']
        }
      ]
    }
  };
  const legacyRows = parseRedirectsCsv('from,to,status,notes\n/old-drains/,/a-page,301,top legacy page\n');

  const legacyClean = checkLegacyRules(
    {
      site,
      handoff,
      briefs: [{ ...goodBrief, legacy: { sourceUrls: ['/old-drains/'], preservedKeywords: ['drain cleaning dallas'] } }]
    },
    redesignIntake,
    legacyRows
  );
  assertFixture(
    results,
    'SEO-LEG clean redesign fixture has no issues',
    legacyClean.issues.length === 0 && legacyClean.skips.length === 0
  );

  const missingSourceUrls = checkLegacyRules(
    {
      site,
      handoff,
      briefs: [{ ...goodBrief, legacy: { preservedKeywords: ['drain cleaning dallas'] } }]
    },
    redesignIntake,
    legacyRows
  );
  assertFixture(
    results,
    'SEO-LEG-1 missing sourceUrls detector',
    missingSourceUrls.issues.some((issue) => issue.startsWith('SEO-LEG-1'))
  );

  const missingPreserved = checkLegacyRules(
    {
      site,
      handoff,
      briefs: [{ ...goodBrief, legacy: { sourceUrls: ['/old-drains/'] } }]
    },
    redesignIntake,
    legacyRows
  );
  assertFixture(
    results,
    'SEO-LEG-2 missing preservedKeywords detector',
    missingPreserved.issues.some((issue) => issue.startsWith('SEO-LEG-2'))
  );

  const waived = checkLegacyRules(
    {
      site,
      handoff,
      briefs: [
        {
          ...goodBrief,
          legacy: {
            sourceUrls: ['/old-drains/'],
            waiver: 'Client is retiring this service line; rankings intentionally not preserved.'
          }
        }
      ]
    },
    redesignIntake,
    legacyRows
  );
  assertFixture(results, 'SEO-LEG-2 waiver acceptance', waived.issues.length === 0);

  const notRedesign = checkLegacyRules(
    { site, handoff, briefs: [goodBrief] },
    { ...redesignIntake, legacySite: { isRedesign: false } },
    legacyRows
  );
  assertFixture(
    results,
    'SEO-LEG non-redesign skip',
    notRedesign.issues.length === 0 && notRedesign.skips.some((skip) => skip.includes('isRedesign'))
  );
}

if (process.argv[1] === __filename) {
  const results = await validateSeoBriefs();
  for (const result of results) {
    const label = result.status === 'pass' ? 'PASS' : result.status === 'skip' ? 'SKIP' : 'FAIL';
    console.log(`${label}: ${result.message}`);
  }
  if (results.some((result) => result.status === 'fail')) {
    process.exit(1);
  }
}
