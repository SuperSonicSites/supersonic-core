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

  runRegressionFixtures(results);
  return results;
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
}

if (process.argv[1] === __filename) {
  const results = await validateSeoBriefs();
  for (const result of results) {
    console.log(`${result.status === 'pass' ? 'PASS' : 'FAIL'}: ${result.message}`);
  }
  if (results.some((result) => result.status === 'fail')) {
    process.exit(1);
  }
}
