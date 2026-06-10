import { readdir, readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const defaultRoot = path.resolve(__dirname, '..');

const registryPath = 'data/pattern-certifications.json';
const patternDir = 'wp-content/themes/supersonic-site-theme/patterns';
const registryDocPath = 'docs/pattern-registry.md';
const allowedStatuses = new Set([
  'source-ready',
  'qa-page-created',
  'screenshots-captured',
  'approved',
  'needs-revision'
]);

// Roles a copy_slot may declare. Mirrors SLOT_ROLES in tools/validate-copy.mjs and
// the role enum in data/copy-deck.schema.json. Headings (h1/h2/h3) are owned upstream
// and never written as copy slots, so they are deliberately excluded here too.
const copySlotRoles = new Set([
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

function isPositiveInteger(value) {
  return Number.isInteger(value) && value > 0;
}

// Validates the optional per-pattern copy_slots budgets (the source of truth that
// tools/validate-copy.mjs cross-checks the copy deck against). Each entry must carry a
// unique non-empty id, a known role string, and any declared char/word caps must be
// positive integers. copy_slots is optional; only entries that declare it are checked.
function validateCopySlots(entry, results) {
  if (entry.copy_slots === undefined) {
    return;
  }
  if (!Array.isArray(entry.copy_slots)) {
    push(results, 'fail', `${entry.slug} copy_slots must be an array`);
    return;
  }

  const seenIds = new Set();
  entry.copy_slots.forEach((slot, index) => {
    const ref = (slot && typeof slot.id === 'string' && slot.id) || `#${index}`;

    if (!slot || typeof slot !== 'object' || Array.isArray(slot)) {
      push(results, 'fail', `${entry.slug} copy_slots[${index}] must be an object`);
      return;
    }

    if (typeof slot.id !== 'string' || !slot.id) {
      push(results, 'fail', `${entry.slug} copy_slots ${ref} must have a non-empty string id`);
    } else if (seenIds.has(slot.id)) {
      push(results, 'fail', `${entry.slug} has duplicate copy_slots id: ${slot.id}`);
    } else {
      seenIds.add(slot.id);
    }

    if (typeof slot.role !== 'string' || !copySlotRoles.has(slot.role)) {
      push(results, 'fail', `${entry.slug} copy_slots ${ref} has invalid role: ${slot.role ?? '(missing)'}`);
    }

    for (const field of ['max_chars', 'min_chars', 'max_words']) {
      if (slot[field] !== undefined && !isPositiveInteger(slot[field])) {
        push(results, 'fail', `${entry.slug} copy_slots ${ref} ${field} must be a positive integer: ${slot[field]}`);
      }
    }

    if (slot.sibling_group !== undefined && (typeof slot.sibling_group !== 'string' || !slot.sibling_group)) {
      push(results, 'fail', `${entry.slug} copy_slots ${ref} sibling_group must be a non-empty string`);
    }

    if (slot.repeatable !== undefined && typeof slot.repeatable !== 'boolean') {
      push(results, 'fail', `${entry.slug} copy_slots ${ref} repeatable must be a boolean`);
    }
  });
}

// REG-CB-1: a content-bearing pattern (anything not explicitly contentBearing:false) that
// is approved must declare a non-empty copy_slots array. Otherwise the copywriter has no
// slot to fill and the layout->copy gate (COMPOSE-3) fails downstream with a less obvious
// error. Gated on approved so in-flight patterns are not blocked mid-build. Structural
// chrome (headers, footers, logo/stat bands, NAP blocks) sets contentBearing:false.
function validateContentBearing(entry, results) {
  if (entry.contentBearing !== undefined && typeof entry.contentBearing !== 'boolean') {
    push(results, 'fail', `${entry.slug} contentBearing must be a boolean`);
    return;
  }
  if (entry.contentBearing === false) {
    return;
  }
  if (entry.status === 'approved' && !(Array.isArray(entry.copy_slots) && entry.copy_slots.length > 0)) {
    push(
      results,
      'fail',
      `REG-CB-1 ${entry.slug} is content-bearing and approved but declares no copy_slots; add copy_slots or set contentBearing:false`
    );
  }
}

function normalizePath(value) {
  return value.replace(/\\/g, '/');
}

function slugify(value) {
  return String(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-');
}

async function exists(root, relativePath) {
  if (!relativePath) {
    return false;
  }
  try {
    await stat(path.join(root, relativePath));
    return true;
  } catch {
    return false;
  }
}

async function readText(root, relativePath) {
  return readFile(path.join(root, relativePath), 'utf8');
}

async function collectFiles(root, relativePath, extensions) {
  const absolutePath = path.join(root, relativePath);
  const entries = await readdir(absolutePath, { withFileTypes: true }).catch(() => []);
  const files = [];

  for (const entry of entries) {
    if (entry.name === '.git' || entry.name === 'node_modules' || entry.name === 'packages') {
      continue;
    }

    const childRelativePath = path.join(relativePath, entry.name);
    if (entry.isDirectory()) {
      files.push(...await collectFiles(root, childRelativePath, extensions));
    } else if (extensions.some((extension) => entry.name.endsWith(extension))) {
      files.push(normalizePath(childRelativePath));
    }
  }

  return files.sort();
}

function parsePatternHeader(content) {
  const header = {};
  const match = content.match(/\/\*\*([\s\S]*?)\*\//);
  if (!match) {
    return header;
  }

  for (const line of match[1].split(/\r?\n/)) {
    const item = line.match(/^\s*\*\s*([^:]+):\s*(.+?)\s*$/);
    if (item) {
      header[item[1].trim()] = item[2].trim();
    }
  }

  return header;
}

function push(results, status, message) {
  results.push({ status, message });
}

function extractMarkdownTargets(content) {
  const targets = [];
  const linkPattern = /!?\[[^\]]*]\(([^)]+)\)/g;
  let match;

  while ((match = linkPattern.exec(content)) !== null) {
    let target = match[1].trim();
    if (!target || target.startsWith('#')) {
      continue;
    }
    if (/^(?:https?:|mailto:|tel:|app:\/\/)/i.test(target)) {
      continue;
    }
    if (target.startsWith('<') && target.endsWith('>')) {
      target = target.slice(1, -1);
    }
    if (!target.startsWith('<')) {
      target = target.split(/\s+["']/)[0];
    }
    target = target.split('#')[0];
    if (target) {
      targets.push(target);
    }
  }

  return targets;
}

function extractScreenshotPaths(content) {
  const targets = new Set();
  const screenshotPattern = /screenshots\/(?:before|after)\/[A-Za-z0-9._/-]+/g;
  let match;

  while ((match = screenshotPattern.exec(content)) !== null) {
    targets.add(match[0].replace(/[.,;:]+$/, ''));
  }

  return [...targets];
}

async function validateMarkdownLinks(root, results) {
  const failureCount = results.filter((result) => result.status === 'fail').length;
  const markdownFiles = [
    ...(await collectFiles(root, '.', ['.md']))
  ].filter((file) => !file.startsWith('packages/') && !file.startsWith('node_modules/'));

  for (const file of markdownFiles) {
    const content = await readText(root, file);
    const baseDir = path.posix.dirname(file);

    for (const target of extractMarkdownTargets(content)) {
      const resolved = normalizePath(path.posix.normalize(path.posix.join(baseDir, target)));
      if (!(await exists(root, resolved))) {
        push(results, 'fail', `${file} links to missing local target: ${target}`);
      }
    }
  }

  if (results.filter((result) => result.status === 'fail').length === failureCount) {
    push(results, 'pass', 'internal Markdown links resolve');
  }
}

async function validateReportScreenshotPaths(root, results) {
  const failureCount = results.filter((result) => result.status === 'fail').length;
  const reportFiles = await collectFiles(root, 'docs/reports', ['.md']);

  for (const file of reportFiles) {
    const content = await readText(root, file);
    for (const target of extractScreenshotPaths(content)) {
      if (!(await exists(root, target))) {
        push(results, 'fail', `${file} references missing screenshot evidence: ${target}`);
      }
    }
  }

  if (results.filter((result) => result.status === 'fail').length === failureCount) {
    push(results, 'pass', 'report screenshot paths exist when referenced');
  }
}

export async function validatePatternRegistry({ rootDir = defaultRoot } = {}) {
  const root = rootDir;
  const results = [];

  let registry;
  try {
    registry = JSON.parse(await readText(root, registryPath));
    push(results, 'pass', `${registryPath} parses`);
  } catch (error) {
    push(results, 'fail', `${registryPath} is invalid JSON: ${error.message}`);
    return results;
  }

  const entries = Array.isArray(registry.patterns) ? registry.patterns : [];
  if (!Array.isArray(registry.patterns)) {
    push(results, 'fail', `${registryPath} must contain a patterns array`);
  }

  const patternFiles = await collectFiles(root, patternDir, ['.php']);
  const patternFilesSet = new Set(patternFiles);
  const entriesBySlug = new Map();
  const registryDoc = await readText(root, registryDocPath).catch(() => '');

  for (const entry of entries) {
    if (!entry || typeof entry !== 'object') {
      push(results, 'fail', `${registryPath} contains a non-object pattern entry`);
      continue;
    }

    if (!entry.slug || typeof entry.slug !== 'string') {
      push(results, 'fail', `${registryPath} contains an entry without a slug`);
      continue;
    }

    if (entriesBySlug.has(entry.slug)) {
      push(results, 'fail', `${registryPath} contains duplicate slug: ${entry.slug}`);
    }
    entriesBySlug.set(entry.slug, entry);

    const expectedQaSlug = `qa-pattern-${slugify(entry.slug.split('/').pop())}`;
    if (entry.qaPageSlug !== expectedQaSlug) {
      push(results, 'fail', `${entry.slug} qaPageSlug should be ${expectedQaSlug}`);
    }

    if (!allowedStatuses.has(entry.status)) {
      push(results, 'fail', `${entry.slug} has invalid status: ${entry.status}`);
    }

    if (!entry.sourceFile || !patternFilesSet.has(entry.sourceFile)) {
      push(results, 'fail', `${entry.slug} sourceFile is missing or not a pattern file: ${entry.sourceFile}`);
      continue;
    }

    const source = await readText(root, entry.sourceFile);
    const header = parsePatternHeader(source);
    if (header.Slug !== entry.slug) {
      push(results, 'fail', `${entry.sourceFile} header slug ${header.Slug ?? '(missing)'} does not match registry slug ${entry.slug}`);
    }
    if (header.Title !== entry.title) {
      push(results, 'fail', `${entry.slug} title should match pattern header: ${header.Title ?? '(missing)'}`);
    }
    if (header.Categories !== entry.category) {
      push(results, 'fail', `${entry.slug} category should match pattern header: ${header.Categories ?? '(missing)'}`);
    }
    if (!registryDoc.includes(entry.slug)) {
      push(results, 'fail', `${entry.slug} is missing from ${registryDocPath}`);
    }

    // QA pages live on a protected non-production host: Hostinger staging
    // (staging.*) or an owner-approved local development runtime (*.local,
    // localhost, 127.0.0.1). Production hosts stay forbidden.
    if (entry.qaPageUrl && !/^https?:\/\/(staging\.|localhost(:|\/)|127\.0\.0\.1(:|\/)|[a-z0-9-]+(\.[a-z0-9-]+)*\.local(:|\/))/i.test(entry.qaPageUrl)) {
      push(results, 'fail', `${entry.slug} qaPageUrl must point at a staging.* host or a local dev host (*.local, localhost)`);
    }

    if (entry.reportPath && !(await exists(root, entry.reportPath))) {
      push(results, 'fail', `${entry.slug} reportPath does not exist: ${entry.reportPath}`);
    }

    const screenshots = entry.screenshots ?? {};
    for (const breakpoint of ['desktop', 'tablet', 'mobile']) {
      if (screenshots[breakpoint] && !(await exists(root, screenshots[breakpoint]))) {
        push(results, 'fail', `${entry.slug} ${breakpoint} screenshot does not exist: ${screenshots[breakpoint]}`);
      }
    }

    if (['qa-page-created', 'screenshots-captured', 'approved'].includes(entry.status) && !entry.qaPageUrl) {
      push(results, 'fail', `${entry.slug} status ${entry.status} requires qaPageUrl`);
    }

    if (['screenshots-captured', 'approved'].includes(entry.status)) {
      for (const breakpoint of ['desktop', 'tablet', 'mobile']) {
        if (!screenshots[breakpoint]) {
          push(results, 'fail', `${entry.slug} status ${entry.status} requires ${breakpoint} screenshot`);
        }
      }
      if (!entry.reportPath) {
        push(results, 'fail', `${entry.slug} status ${entry.status} requires reportPath`);
      }
    }

    if (entry.status === 'approved') {
      if (!/^\d+\.\d+\.\d+$/.test(entry.certifiedThemeVersion ?? '')) {
        push(results, 'fail', `${entry.slug} approved status requires certifiedThemeVersion`);
      }
      if (!entry.lastReviewedAt) {
        push(results, 'fail', `${entry.slug} approved status requires lastReviewedAt`);
      }
    }

    if (!Array.isArray(entry.knownIssues)) {
      push(results, 'fail', `${entry.slug} knownIssues must be an array`);
    }

    validateCopySlots(entry, results);
    validateContentBearing(entry, results);
  }

  for (const file of patternFiles) {
    const source = await readText(root, file);
    const header = parsePatternHeader(source);
    if (!header.Slug || !entriesBySlug.has(header.Slug)) {
      push(results, 'fail', `${file} is missing from ${registryPath}`);
    }
  }

  if (entries.length === patternFiles.length) {
    push(results, 'pass', `${registryPath} tracks ${entries.length} pattern files`);
  } else {
    push(results, 'fail', `${registryPath} tracks ${entries.length} entries, but ${patternFiles.length} pattern files exist`);
  }

  await validateMarkdownLinks(root, results);
  await validateReportScreenshotPaths(root, results);

  return results;
}

if (process.argv[1] === __filename) {
  const results = await validatePatternRegistry();
  for (const result of results) {
    const icon = result.status === 'pass' ? 'PASS' : 'FAIL';
    console.log(`${icon}: ${result.message}`);
  }
  if (results.some((result) => result.status === 'fail')) {
    process.exit(1);
  }
}
