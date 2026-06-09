import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const defaultRoot = path.resolve(__dirname, '..');

// Roles a writer may fill. Mirrors copySlotRoles in validate-pattern-registry.mjs and
// the role enum in data/copy-deck.schema.json. Deliberately excludes the SEO heading
// outline (H1/H2/H3): headings are owned by seo-strategist, placed by layout-architect,
// and only echoed read-only in locked_headings, never written as a copy slot.
const SLOT_ROLES = new Set([
  'eyebrow',
  'label',
  'body',
  'card-title',
  'card-body',
  'list-item',
  'cta',
  'caption',
  'faq-answer'
]);

// Prose roles that carry the page's substantive body words. Brief coverage counts only
// these; microcopy (eyebrow, label, card-title, cta) is excluded so a page of buttons
// cannot fake its way to a word-count target.
const PROSE_ROLES = new Set(['body', 'card-body', 'faq-answer', 'list-item', 'caption']);

// Brief coverage floor. A page whose realized prose is below this fraction of the brief's
// target_word_count is genuinely thin (COVERAGE-1). The softer 95% band is intentionally
// left to copy-review judgment (it now has the measured number) rather than a hard gate.
const COVERAGE_FLOOR = 0.8;

// Mechanical copy rules (documented in BRAND.md "Mechanical copy rules"). These are
// hard fails, not prose suggestions: the model is told the rules, the validator makes
// them true. The runner is binary pass/fail, so smart typography is a hard fail too.
const EM_EN_DASH_RE = /[—–]/; // em dash U+2014, en dash U+2013
const SMART_TYPO_RE = /[‘’“”…]/; // smart quotes + ellipsis char

// Sibling balance: slots sharing a sibling_group (e.g. cards in a row) must hold roughly
// equal text so the boxes line up. Char length tracks rendered height more tightly than
// word count. 1.25 = the longest may be at most 25% longer than the shortest.
const SIBLING_TOLERANCE = 1.25;

const SLUG_RE = /^\/(?:[a-z0-9]+(?:-[a-z0-9]+)*(?:\/[a-z0-9]+(?:-[a-z0-9]+)*)*)?\/?$/;

// Framework floor, seeded from BRAND.md "Words And Phrases To Avoid". Site intake
// (brand.phrasesToAvoid) augments this list; it never shrinks it.
const DEFAULT_PHRASES_TO_AVOID = [
  'best-in-class',
  'cutting-edge',
  'game-changing',
  'next-level',
  'revolutionary',
  'unlock your potential',
  'tailored solutions'
];

const charLen = (text) => [...text].length;
const wordCount = (text) => (text.trim() === '' ? 0 : text.trim().split(/\s+/).length);

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Returns an array of human-readable rule violations for a copy-deck document.
// Empty array means the deck satisfies every hard rule. Pure: takes the phrase list
// as an argument so regression fixtures stay file-free.
export function checkCopyDoc(doc, { phrasesToAvoid = DEFAULT_PHRASES_TO_AVOID } = {}) {
  const issues = [];

  if (!doc || typeof doc !== 'object' || Array.isArray(doc)) {
    issues.push('document must be a JSON object');
    return issues;
  }

  if (!doc.site || typeof doc.site !== 'object') {
    issues.push('missing site object');
  }
  if (!doc.source || typeof doc.source !== 'object') {
    issues.push('missing source object (provenance)');
  }

  const pages = Array.isArray(doc.pages) ? doc.pages : null;
  if (!pages || pages.length === 0) {
    issues.push('pages must be a non-empty array');
    return issues;
  }

  const phraseMatchers = (Array.isArray(phrasesToAvoid) ? phrasesToAvoid : [])
    .filter((phrase) => typeof phrase === 'string' && phrase.trim())
    .map((phrase) => ({ phrase, re: new RegExp(`\\b${escapeRegExp(phrase.trim())}\\b`, 'i') }));

  const pageIds = new Map();

  pages.forEach((page, pageIndex) => {
    const id = (page && page.page_id) || `#${pageIndex}`;

    if (!page || typeof page !== 'object') {
      issues.push(`page ${id} must be an object`);
      return;
    }

    if (typeof page.page_id !== 'string' || !page.page_id) {
      issues.push(`page ${id} missing required field: page_id`);
    } else if (pageIds.has(page.page_id)) {
      issues.push(`duplicate page_id across pages: ${page.page_id}`);
    } else {
      pageIds.set(page.page_id, id);
    }

    if (typeof page.url_slug === 'string' && !SLUG_RE.test(page.url_slug)) {
      issues.push(`page ${id} url_slug must be a lowercase, hyphen-separated path: ${page.url_slug}`);
    }

    const slots = Array.isArray(page.slots) ? page.slots : null;
    if (!slots || slots.length === 0) {
      issues.push(`page ${id} slots must be a non-empty array`);
      return;
    }

    const slotIds = new Set();
    const siblingGroups = new Map();

    slots.forEach((slot, slotIndex) => {
      const sid = (slot && slot.id) || `#${slotIndex}`;

      if (!slot || typeof slot !== 'object') {
        issues.push(`page ${id} slot ${sid} must be an object`);
        return;
      }

      if (typeof slot.id !== 'string' || !slot.id) {
        issues.push(`page ${id} slot ${sid} missing required field: id`);
      } else if (slotIds.has(slot.id)) {
        issues.push(`page ${id} has duplicate slot id: ${slot.id}`);
      } else {
        slotIds.add(slot.id);
      }

      if (!SLOT_ROLES.has(slot.role)) {
        issues.push(`page ${id} slot ${sid} has invalid role: ${slot.role}`);
      }

      if (typeof slot.text !== 'string' || slot.text.trim().length === 0) {
        issues.push(`page ${id} slot ${sid} must have non-empty text`);
        return;
      }

      const text = slot.text;

      if (EM_EN_DASH_RE.test(text)) {
        issues.push(`page ${id} slot ${sid} text contains a banned em/en dash (U+2014/U+2013); use a comma, period, or "to"`);
      }
      if (SMART_TYPO_RE.test(text)) {
        issues.push(`page ${id} slot ${sid} text contains smart quotes or an ellipsis character; use straight quotes and three periods`);
      }
      for (const { phrase, re } of phraseMatchers) {
        if (re.test(text)) {
          issues.push(`page ${id} slot ${sid} uses a phrase to avoid: "${phrase}"`);
        }
      }

      const chars = charLen(text);
      const words = wordCount(text);
      if (typeof slot.max_chars === 'number' && chars > slot.max_chars) {
        issues.push(`page ${id} slot ${sid} exceeds max_chars: ${chars} > ${slot.max_chars}`);
      }
      if (typeof slot.min_chars === 'number' && chars < slot.min_chars) {
        issues.push(`page ${id} slot ${sid} is below min_chars: ${chars} < ${slot.min_chars}`);
      }
      if (typeof slot.max_words === 'number' && words > slot.max_words) {
        issues.push(`page ${id} slot ${sid} exceeds max_words: ${words} > ${slot.max_words}`);
      }

      if (typeof slot.sibling_group === 'string' && slot.sibling_group) {
        if (!siblingGroups.has(slot.sibling_group)) {
          siblingGroups.set(slot.sibling_group, []);
        }
        siblingGroups.get(slot.sibling_group).push({ id: slot.id || sid, len: chars });
      }
    });

    for (const [group, members] of siblingGroups) {
      if (members.length < 2) {
        continue;
      }
      const lengths = members.map((member) => member.len);
      const min = Math.min(...lengths);
      const max = Math.max(...lengths);
      if (min > 0 && max / min > SIBLING_TOLERANCE) {
        const memberList = members.map((member) => `${member.id} (${member.len})`).join(', ');
        issues.push(
          `page ${id} sibling_group "${group}" is unbalanced: longest ${max} vs shortest ${min} chars exceeds ${SIBLING_TOLERANCE}x [${memberList}]`
        );
      }
    }
  });

  return issues;
}

// Cross-checks a deck against the per-pattern copy_slots budgets in the registry.
// Opt-in per slot: only slots that declare pattern_slug + slot_ref are checked, so the
// caps in the deck cannot drift from the source of truth (and cannot be invented).
export function checkDeckAgainstRegistry(doc, registryBySlug) {
  const issues = [];
  const pages = Array.isArray(doc && doc.pages) ? doc.pages : [];

  for (const page of pages) {
    const id = (page && page.page_id) || '#';
    const slots = Array.isArray(page && page.slots) ? page.slots : [];

    for (const slot of slots) {
      if (!slot || typeof slot !== 'object' || !slot.pattern_slug || !slot.slot_ref) {
        continue;
      }
      const sid = slot.id || '#';
      const patternSlots = registryBySlug.get(slot.pattern_slug);
      if (!patternSlots) {
        // Pattern absent from the registry or not yet seeded with copy_slots: budgets
        // are optional, so skip rather than fail.
        continue;
      }
      const template = patternSlots.get(slot.slot_ref);
      if (!template) {
        issues.push(`page ${id} slot ${sid} references unknown copy slot "${slot.slot_ref}" on ${slot.pattern_slug}`);
        continue;
      }
      if (slot.role !== template.role) {
        issues.push(`page ${id} slot ${sid} role "${slot.role}" does not match registry role "${template.role}" (${slot.pattern_slug}/${slot.slot_ref})`);
      }
      for (const field of ['max_chars', 'max_words', 'min_chars']) {
        if (template[field] !== undefined && slot[field] !== template[field]) {
          issues.push(
            `page ${id} slot ${sid} ${field} ${slot[field]} must match the pattern budget ${template[field]} (${slot.pattern_slug}/${slot.slot_ref})`
          );
        }
      }
      if (template.sibling_group !== undefined && !(typeof slot.sibling_group === 'string' && slot.sibling_group)) {
        issues.push(`page ${id} slot ${sid} must set a sibling_group: ${slot.pattern_slug}/${slot.slot_ref} is a balanced group in the registry`);
      }
    }
  }

  return issues;
}

// Lightweight structural check for the layout-architect page-composition manifest.
// Deeper cross-checks (slug exists in registry, page covered by the deck) are deferred.
export function checkCompositionsDoc(doc) {
  const issues = [];

  if (!doc || typeof doc !== 'object' || Array.isArray(doc)) {
    issues.push('document must be a JSON object');
    return issues;
  }
  if (!Number.isInteger(doc.version)) {
    issues.push('version must be an integer');
  }

  const compositions = Array.isArray(doc.compositions) ? doc.compositions : null;
  if (!compositions || compositions.length === 0) {
    issues.push('compositions must be a non-empty array');
    return issues;
  }

  compositions.forEach((composition, index) => {
    const id = (composition && composition.page_id) || `#${index}`;
    if (!composition || typeof composition !== 'object') {
      issues.push(`composition ${id} must be an object`);
      return;
    }
    if (typeof composition.page_id !== 'string' || !composition.page_id) {
      issues.push(`composition ${id} missing required field: page_id`);
    }
    const patterns = Array.isArray(composition.patterns) ? composition.patterns : null;
    if (!patterns || patterns.length === 0) {
      issues.push(`composition ${id} patterns must be a non-empty array`);
      return;
    }
    patterns.forEach((pattern, patternIndex) => {
      if (!pattern || typeof pattern !== 'object') {
        issues.push(`composition ${id} patterns[${patternIndex}] must be an object`);
        return;
      }
      if (!Number.isInteger(pattern.position)) {
        issues.push(`composition ${id} patterns[${patternIndex}] needs an integer position`);
      }
      if (typeof pattern.slug !== 'string' || !pattern.slug) {
        issues.push(`composition ${id} patterns[${patternIndex}] needs a slug`);
      }
    });
  });

  return issues;
}

// The layout->copy preflight gate (compose:check). Runs BEFORE the copywriter resolves
// the slot manifest and converts what used to be opaque join-time failures into named,
// blame-routed rule violations. registryEntriesBySlug maps slug -> full registry entry
// (status, copy_slots, contentBearing); briefIds is the set of brief page_ids. Pure: all
// inputs are passed in so regression fixtures stay file-free.
export function checkCompositionAgainstRegistry(doc, { registryEntriesBySlug, briefIds } = {}) {
  const issues = [];
  const compositions = Array.isArray(doc && doc.compositions) ? doc.compositions : [];
  const entries = registryEntriesBySlug instanceof Map ? registryEntriesBySlug : new Map();
  const briefs = briefIds instanceof Set ? briefIds : null;

  for (const composition of compositions) {
    const id = (composition && composition.page_id) || '#';
    const patterns = Array.isArray(composition && composition.patterns) ? composition.patterns : [];

    if (briefs && composition && typeof composition.page_id === 'string' && !briefs.has(composition.page_id)) {
      issues.push(`COMPOSE-6 composition ${id} has no matching brief page_id (compose a page only for a real brief)`);
    }

    let h1Owners = 0;
    for (const pattern of patterns) {
      if (!pattern || typeof pattern !== 'object' || typeof pattern.slug !== 'string' || !pattern.slug) {
        continue;
      }
      if (pattern.h1_owner === true) {
        h1Owners += 1;
      }
      const slug = pattern.slug;
      const entry = entries.get(slug);
      if (!entry) {
        issues.push(`COMPOSE-1 composition ${id} references unknown pattern "${slug}" (not in data/pattern-certifications.json); route to layout-architect`);
        continue;
      }
      if (entry.status !== 'approved') {
        issues.push(`COMPOSE-2 composition ${id} pattern "${slug}" is not approved (status: ${entry.status}); route to pattern-builder/certify-pattern`);
      }
      const slots = Array.isArray(entry.copy_slots) ? entry.copy_slots : [];
      if (entry.contentBearing !== false && slots.length === 0) {
        issues.push(`COMPOSE-3 composition ${id} content-bearing pattern "${slug}" declares no copy_slots; route to pattern-builder to declare them or mark contentBearing:false`);
      }
      const hasRepeatable = slots.some((slot) => slot && slot.repeatable === true);
      if (hasRepeatable && !(Number.isInteger(pattern.instances) && pattern.instances >= 1)) {
        issues.push(`COMPOSE-4 composition ${id} pattern "${slug}" has repeatable copy_slots but no instances count (>=1); layout-architect must set instances`);
      }
    }

    if (h1Owners !== 1) {
      issues.push(`COMPOSE-5 composition ${id} must designate exactly one pattern with h1_owner:true (found ${h1Owners}); the page needs exactly one editable H1`);
    }
  }

  return issues;
}

// Brief coverage: realized prose words per page vs the brief target_word_count. Makes the
// "thin content" finding measurable for copy-review and seo-auditor. Pure: briefsById maps
// page_id -> brief. Only the substantive prose roles count (see PROSE_ROLES).
export function checkBriefCoverage(doc, briefsById, { floor = COVERAGE_FLOOR } = {}) {
  const issues = [];
  const pages = Array.isArray(doc && doc.pages) ? doc.pages : [];
  const briefs = briefsById instanceof Map ? briefsById : new Map();

  for (const page of pages) {
    if (!page || typeof page !== 'object' || typeof page.page_id !== 'string') {
      continue;
    }
    const brief = briefs.get(page.page_id);
    const target = brief && Number(brief.target_word_count);
    if (!Number.isFinite(target) || target <= 0) {
      continue;
    }
    const slots = Array.isArray(page.slots) ? page.slots : [];
    let realized = 0;
    for (const slot of slots) {
      if (slot && typeof slot === 'object' && PROSE_ROLES.has(slot.role) && typeof slot.text === 'string') {
        realized += wordCount(slot.text);
      }
    }
    const ratio = realized / target;
    if (ratio < floor) {
      const pct = Math.round(ratio * 100);
      issues.push(
        `COVERAGE-1 page ${page.page_id} body copy is thin: ${realized} prose words is ${pct}% of brief target_word_count ${target} (need >=${Math.round(floor * 100)}%); route to layout-architect (more sections) or copywriter (longer body)`
      );
    }
  }

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

async function readJson(rootDir, relativePath) {
  return JSON.parse(await readFile(path.join(rootDir, relativePath), 'utf8'));
}

// Framework floor (BRAND.md) unioned with the site's brand.phrasesToAvoid. The mechanical
// rule must never be a no-op, so a missing/empty intake falls back to the defaults.
async function loadPhrasesToAvoid(rootDir) {
  for (const relativePath of ['data/site-intake.json', 'data/site-intake.example.json']) {
    if (await exists(path.join(rootDir, relativePath))) {
      try {
        const intake = await readJson(rootDir, relativePath);
        const list = intake && intake.brand && intake.brand.phrasesToAvoid;
        if (Array.isArray(list) && list.length) {
          const extra = list.filter((phrase) => typeof phrase === 'string' && phrase.trim());
          return Array.from(new Set([...DEFAULT_PHRASES_TO_AVOID, ...extra]));
        }
      } catch {
        // fall through to defaults
      }
    }
  }
  return DEFAULT_PHRASES_TO_AVOID;
}

function buildRegistryMap(registry) {
  const map = new Map();
  const patterns = Array.isArray(registry && registry.patterns) ? registry.patterns : [];
  for (const entry of patterns) {
    if (!entry || typeof entry !== 'object' || !entry.slug || !Array.isArray(entry.copy_slots)) {
      continue;
    }
    const slotMap = new Map();
    for (const slot of entry.copy_slots) {
      if (slot && typeof slot === 'object' && typeof slot.id === 'string') {
        slotMap.set(slot.id, slot);
      }
    }
    map.set(entry.slug, slotMap);
  }
  return map;
}

// Unlike buildRegistryMap (which keeps only entries with copy_slots), this keeps EVERY
// entry so the compose gate can see status and contentBearing on patterns that have no
// slots (structural chrome) and on patterns that are missing slots by mistake.
export function buildRegistryEntryMap(registry) {
  const map = new Map();
  const patterns = Array.isArray(registry && registry.patterns) ? registry.patterns : [];
  for (const entry of patterns) {
    if (entry && typeof entry === 'object' && typeof entry.slug === 'string') {
      map.set(entry.slug, entry);
    }
  }
  return map;
}

async function validatePageCompositions(rootDir, results) {
  const files = ['data/page-compositions.example.json'];
  if (await exists(path.join(rootDir, 'data/page-compositions.json'))) {
    files.push('data/page-compositions.json');
  }

  for (const relativePath of files) {
    if (!(await exists(path.join(rootDir, relativePath)))) {
      continue;
    }
    let doc;
    try {
      doc = await readJson(rootDir, relativePath);
    } catch (error) {
      results.push({ status: 'fail', message: `${relativePath} is invalid JSON: ${error.message}` });
      continue;
    }
    const issues = checkCompositionsDoc(doc);
    if (issues.length === 0) {
      const count = Array.isArray(doc.compositions) ? doc.compositions.length : 0;
      results.push({ status: 'pass', message: `${relativePath} passes page-composition structure (${count} pages)` });
    } else {
      for (const issue of issues) {
        results.push({ status: 'fail', message: `${relativePath}: ${issue}` });
      }
    }
  }
}

export async function validateCopy({ rootDir = defaultRoot } = {}) {
  const results = [];
  const phrasesToAvoid = await loadPhrasesToAvoid(rootDir);

  let registryBySlug = new Map();
  if (await exists(path.join(rootDir, 'data/pattern-certifications.json'))) {
    try {
      registryBySlug = buildRegistryMap(await readJson(rootDir, 'data/pattern-certifications.json'));
    } catch (error) {
      results.push({ status: 'fail', message: `data/pattern-certifications.json is invalid JSON: ${error.message}` });
    }
  }

  const decks = [{ deck: 'data/copy-deck.example.json', briefs: 'data/seo-briefs.example.json' }];
  if (await exists(path.join(rootDir, 'data/copy-deck.json'))) {
    decks.push({ deck: 'data/copy-deck.json', briefs: 'data/seo-briefs.json' });
  }

  for (const { deck, briefs } of decks) {
    let doc;
    try {
      doc = await readJson(rootDir, deck);
    } catch (error) {
      results.push({ status: 'fail', message: `${deck} is invalid JSON: ${error.message}` });
      continue;
    }

    const issues = checkCopyDoc(doc, { phrasesToAvoid });
    if (issues.length === 0) {
      const count = Array.isArray(doc.pages) ? doc.pages.length : 0;
      results.push({ status: 'pass', message: `${deck} passes copy rules (${count} pages)` });
    } else {
      for (const issue of issues) {
        results.push({ status: 'fail', message: `${deck}: ${issue}` });
      }
    }

    const registryIssues = checkDeckAgainstRegistry(doc, registryBySlug);
    if (registryIssues.length === 0) {
      results.push({ status: 'pass', message: `${deck} matches pattern copy-slot budgets in data/pattern-certifications.json` });
    } else {
      for (const issue of registryIssues) {
        results.push({ status: 'fail', message: `${deck}: ${issue}` });
      }
    }

    if (await exists(path.join(rootDir, briefs))) {
      try {
        const briefsDoc = await readJson(rootDir, briefs);
        const briefIds = new Set(
          (Array.isArray(briefsDoc.briefs) ? briefsDoc.briefs : [])
            .map((brief) => brief && brief.page_id)
            .filter(Boolean)
        );
        const orphans = (Array.isArray(doc.pages) ? doc.pages : [])
          .map((page) => page && page.page_id)
          .filter((pageId) => pageId && !briefIds.has(pageId));
        if (orphans.length === 0) {
          results.push({ status: 'pass', message: `${deck} page_ids all resolve against ${briefs}` });
        } else {
          for (const pageId of orphans) {
            results.push({ status: 'fail', message: `${deck}: page_id "${pageId}" has no matching brief in ${briefs}` });
          }
        }

        // Brief coverage is scoped to the REAL deck only. The .example deck is an
        // intentionally short illustration and would false-fail a word-count target.
        if (deck === 'data/copy-deck.json') {
          const briefsById = new Map(
            (Array.isArray(briefsDoc.briefs) ? briefsDoc.briefs : [])
              .filter((brief) => brief && brief.page_id)
              .map((brief) => [brief.page_id, brief])
          );
          const coverageIssues = checkBriefCoverage(doc, briefsById);
          if (coverageIssues.length === 0) {
            results.push({ status: 'pass', message: `${deck} body copy meets brief coverage targets` });
          } else {
            for (const issue of coverageIssues) {
              results.push({ status: 'fail', message: `${deck}: ${issue}` });
            }
          }
        }
      } catch (error) {
        results.push({ status: 'fail', message: `${briefs} is invalid JSON: ${error.message}` });
      }
    }
  }

  await validatePageCompositions(rootDir, results);
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
  const phrases = ['best-in-class', 'revolutionary', 'tailored solutions'];
  const site = { niche: 'n', geography: 'g' };
  const source = { briefs: 'data/seo-briefs.json', intake: 'data/site-intake.json' };
  const card = (id, text) => ({ id, role: 'card-body', text, sibling_group: 'cards', max_chars: 130 });
  const goodDoc = () => ({
    site,
    source,
    pages: [
      {
        page_id: 'home',
        url_slug: '/',
        slots: [
          { id: 'hero', role: 'body', text: 'Fast, friendly local service with upfront pricing.', max_chars: 120 },
          card('c1', 'Drains cleared fast with snaking and hydro jetting service.'),
          card('c2', 'Water heater repair and replacement handled the same day.'),
          card('c3', 'Leak detection without tearing up your floors or walls.'),
          card('c4', 'Around the clock emergency plumbing across the metro.'),
          { id: 'cta', role: 'cta', text: 'Call now for help', max_chars: 40 }
        ]
      }
    ]
  });

  assertFixture(
    results,
    'clean copy fixture has no issues',
    checkCopyDoc(goodDoc(), { phrasesToAvoid: phrases }).length === 0
  );

  const dash = goodDoc();
  dash.pages[0].slots[0].text = 'Fast service — upfront pricing.';
  assertFixture(
    results,
    'em-dash detector',
    checkCopyDoc(dash, { phrasesToAvoid: phrases }).some((issue) => issue.includes('banned em/en dash'))
  );

  const phrase = goodDoc();
  phrase.pages[0].slots[0].text = 'We deliver Best-In-Class plumbing.';
  assertFixture(
    results,
    'phrases-to-avoid detector',
    checkCopyDoc(phrase, { phrasesToAvoid: phrases }).some((issue) => issue.includes('phrase to avoid'))
  );

  const long = goodDoc();
  long.pages[0].slots[0].max_chars = 20;
  long.pages[0].slots[0].text = 'This body copy is clearly far longer than twenty characters.';
  assertFixture(
    results,
    'max_chars detector',
    checkCopyDoc(long, { phrasesToAvoid: phrases }).some((issue) => issue.includes('exceeds max_chars'))
  );

  const skew = goodDoc();
  skew.pages[0].slots[4].text = 'Help';
  assertFixture(
    results,
    'sibling-balance detector',
    checkCopyDoc(skew, { phrasesToAvoid: phrases }).some((issue) => issue.includes('is unbalanced'))
  );

  const curly = goodDoc();
  curly.pages[0].slots[0].text = 'We’re here to help…';
  assertFixture(
    results,
    'smart-typography detector',
    checkCopyDoc(curly, { phrasesToAvoid: phrases }).some((issue) => issue.includes('smart quotes or an ellipsis'))
  );

  const registryMap = new Map([
    ['theme/cards', new Map([['card-body', { id: 'card-body', role: 'card-body', max_chars: 130, sibling_group: 'cards' }]])]
  ]);
  const drifted = {
    site,
    source,
    pages: [
      {
        page_id: 'home',
        url_slug: '/',
        slots: [
          { id: 'c1', role: 'card-body', text: 'In budget.', pattern_slug: 'theme/cards', slot_ref: 'card-body', max_chars: 200, sibling_group: 'cards' }
        ]
      }
    ]
  };
  assertFixture(
    results,
    'registry-budget detector',
    checkDeckAgainstRegistry(drifted, registryMap).some((issue) => issue.includes('must match the pattern budget'))
  );

  // compose:check fixtures (the layout->copy preflight gate, COMPOSE-1..6).
  const composeEntries = new Map([
    ['theme/hero', { slug: 'theme/hero', status: 'approved', copy_slots: [{ id: 'lede', role: 'body', max_chars: 180 }] }],
    ['theme/cards', { slug: 'theme/cards', status: 'approved', copy_slots: [{ id: 'card-body', role: 'card-body', max_chars: 130, repeatable: true }] }],
    ['theme/chrome', { slug: 'theme/chrome', status: 'approved', contentBearing: false }],
    ['theme/empty', { slug: 'theme/empty', status: 'approved', copy_slots: [] }],
    ['theme/draft', { slug: 'theme/draft', status: 'needs-revision', copy_slots: [{ id: 'body', role: 'body' }] }]
  ]);
  const composeBriefIds = new Set(['home']);
  const goodComposition = () => ({
    version: 1,
    compositions: [
      {
        page_id: 'home',
        patterns: [
          { position: 1, slug: 'theme/hero', h1_owner: true },
          { position: 2, slug: 'theme/cards', instances: 3 },
          { position: 3, slug: 'theme/chrome' }
        ]
      }
    ]
  });
  const compose = (doc) => checkCompositionAgainstRegistry(doc, { registryEntriesBySlug: composeEntries, briefIds: composeBriefIds });

  assertFixture(results, 'compose clean fixture has no issues', compose(goodComposition()).length === 0);

  const cUnknown = goodComposition();
  cUnknown.compositions[0].patterns[1].slug = 'theme/missing';
  assertFixture(results, 'compose unknown-slug detector (COMPOSE-1)', compose(cUnknown).some((i) => i.startsWith('COMPOSE-1')));

  const cUnapproved = goodComposition();
  cUnapproved.compositions[0].patterns[1] = { position: 2, slug: 'theme/draft' };
  assertFixture(results, 'compose unapproved detector (COMPOSE-2)', compose(cUnapproved).some((i) => i.startsWith('COMPOSE-2')));

  const cEmpty = goodComposition();
  cEmpty.compositions[0].patterns.push({ position: 4, slug: 'theme/empty' });
  assertFixture(results, 'compose content-bearing-without-slots detector (COMPOSE-3)', compose(cEmpty).some((i) => i.startsWith('COMPOSE-3')));

  const cNoInstances = goodComposition();
  delete cNoInstances.compositions[0].patterns[1].instances;
  assertFixture(results, 'compose repeatable-without-instances detector (COMPOSE-4)', compose(cNoInstances).some((i) => i.startsWith('COMPOSE-4')));

  const cNoH1 = goodComposition();
  delete cNoH1.compositions[0].patterns[0].h1_owner;
  assertFixture(results, 'compose h1-owner-cardinality detector (COMPOSE-5)', compose(cNoH1).some((i) => i.startsWith('COMPOSE-5')));

  const cNoBrief = goodComposition();
  cNoBrief.compositions[0].page_id = 'ghost';
  assertFixture(results, 'compose missing-brief detector (COMPOSE-6)', compose(cNoBrief).some((i) => i.startsWith('COMPOSE-6')));

  // brief-coverage fixtures (COVERAGE-1).
  const coverageBriefs = new Map([['home', { page_id: 'home', target_word_count: 100 }]]);
  const thinDeck = { site, source, pages: [{ page_id: 'home', url_slug: '/', slots: [{ id: 'b', role: 'body', text: 'Too short.' }] }] };
  assertFixture(results, 'brief-coverage thin-page detector (COVERAGE-1)', checkBriefCoverage(thinDeck, coverageBriefs).some((i) => i.startsWith('COVERAGE-1')));
  const fullText = Array.from({ length: 100 }, (_unused, i) => `word${i}`).join(' ');
  const fullDeck = { site, source, pages: [{ page_id: 'home', url_slug: '/', slots: [{ id: 'b', role: 'body', text: fullText }] }] };
  assertFixture(results, 'brief-coverage passes a full page', checkBriefCoverage(fullDeck, coverageBriefs).length === 0);
}

if (process.argv[1] === __filename) {
  const results = await validateCopy();
  for (const result of results) {
    console.log(`${result.status === 'pass' ? 'PASS' : 'FAIL'}: ${result.message}`);
  }
  if (results.some((result) => result.status === 'fail')) {
    process.exit(1);
  }
}
