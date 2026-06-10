import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const command = process.argv[2];
const args = process.argv.slice(3);
const valueFlags = new Set([
  '--theme',
  '--plugin',
  '--pattern',
  '--id',
  '--title',
  '--status',
  '--content',
  '--method',
  '--route',
  '--payload',
  '--manifest'
]);

function parseEnv(content) {
  const env = {};
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) {
      continue;
    }
    const index = trimmed.indexOf('=');
    if (index === -1) {
      continue;
    }
    env[trimmed.slice(0, index)] = trimmed.slice(index + 1);
  }
  return env;
}

async function loadEnv() {
  const local = parseEnv(await readFile(path.join(root, '.env'), 'utf8').catch(() => ''));
  return { ...local, ...process.env };
}

function getArg(name, fallback = undefined) {
  const index = args.indexOf(name);
  if (index === -1 || index === args.length - 1) {
    return fallback;
  }
  return args[index + 1];
}

function positionalArgs() {
  const positional = [];
  for (let i = 0; i < args.length; i += 1) {
    if (args[i] === 'confirm' || args[i] === 'confirmed') {
      continue;
    }
    if (args[i].startsWith('--')) {
      if (valueFlags.has(args[i])) {
        i += 1;
      }
      continue;
    }
    positional.push(args[i]);
  }

  return positional;
}

function isConfirmed() {
  return args.includes('--confirm') || args.includes('confirm') || args.includes('confirmed');
}

function slugify(value) {
  return String(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-');
}

function requireStagingUrl(env) {
  if (!env.WP_STAGING_URL) {
    throw new Error('Missing WP_STAGING_URL in .env or process environment.');
  }
  return env.WP_STAGING_URL.replace(/\/+$/, '');
}

function assertStagingHost(baseUrl) {
  const hostname = new URL(baseUrl).hostname;
  if (!hostname.startsWith('staging.')) {
    throw new Error(`Refusing live QA page write: WP_STAGING_URL host must start with staging. Current host: ${hostname}`);
  }
}

function authHeader(env) {
  if (!env.WP_REST_USER || !env.WP_REST_APP_PASSWORD) {
    return null;
  }
  return `Basic ${Buffer.from(`${env.WP_REST_USER}:${env.WP_REST_APP_PASSWORD}`).toString('base64')}`;
}

async function readJson(url, headers = {}) {
  const response = await fetch(url, { headers });
  const text = await response.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    data = text;
  }

  return { response, data };
}

async function check() {
  const env = await loadEnv();
  const baseUrl = requireStagingUrl(env);
  const rootResponse = await fetch(`${baseUrl}/wp-json/`);

  console.log(`GET /wp-json/: ${rootResponse.status}`);
  if (!rootResponse.ok) {
    process.exit(1);
  }

  const auth = authHeader(env);
  if (!auth) {
    console.log('Auth check skipped: WP_REST_USER or WP_REST_APP_PASSWORD is missing.');
    return;
  }

  const meResponse = await fetch(`${baseUrl}/wp-json/wp/v2/users/me?context=edit`, {
    headers: { Authorization: auth }
  });

  console.log(`GET /wp-json/wp/v2/users/me?context=edit: ${meResponse.status}`);
  if (!meResponse.ok) {
    process.exit(1);
  }
}

async function certify() {
  const env = await loadEnv();
  const baseUrl = requireStagingUrl(env);
  const auth = authHeader(env);
  const positional = positionalArgs();
  const expectedTheme = getArg('--theme', positional[0]);
  const expectedPlugin = getArg('--plugin', positional[1]);

  if (!auth) {
    throw new Error('WP_REST_USER and WP_REST_APP_PASSWORD are required for staging certification.');
  }

  const headers = { Authorization: auth };
  const frontendResponse = await fetch(baseUrl);
  const frontendHtml = await frontendResponse.text();
  const generator = frontendHtml.match(/<meta name="generator" content="([^"]+)"/i)?.[1] ?? 'not detected';
  const theme = await readJson(`${baseUrl}/wp-json/wp/v2/themes?status=active`, headers);
  const plugins = await readJson(`${baseUrl}/wp-json/wp/v2/plugins`, headers);
  const patterns = await readJson(`${baseUrl}/wp-json/wp/v2/block-patterns/patterns`, headers);

  const activeTheme = Array.isArray(theme.data)
    ? theme.data.map((item) => ({
        stylesheet: item.stylesheet?.raw ?? item.stylesheet,
        name: item.name?.raw ?? item.name,
        version: item.version?.raw ?? item.version,
        status: item.status
      }))
    : theme.data;

  const supersonicPlugins = Array.isArray(plugins.data)
    ? plugins.data
        .filter((item) => String(item.plugin).includes('supersonic'))
        .map((item) => ({
          plugin: item.plugin,
          name: item.name,
          version: item.version,
          status: item.status
        }))
    : plugins.data;

  const patternSummary = Array.isArray(patterns.data)
    ? {
        count: patterns.data.length,
        names: patterns.data.map((item) => item.name).sort()
      }
    : patterns.data;

  console.log(JSON.stringify({
    frontend: {
      status: frontendResponse.status,
      generator
    },
    rest: {
      themeStatus: theme.response.status,
      pluginsStatus: plugins.response.status,
      patternsStatus: patterns.response.status
    },
    activeTheme,
    supersonicPlugins,
    patternSummary
  }, null, 2));

  if (!frontendResponse.ok || !theme.response.ok || !plugins.response.ok || !patterns.response.ok) {
    process.exit(1);
  }

  const activeThemeVersion = Array.isArray(activeTheme) ? activeTheme[0]?.version : null;
  const activePluginVersion = Array.isArray(supersonicPlugins) ? supersonicPlugins[0]?.version : null;
  const mismatches = [];

  if (expectedTheme && activeThemeVersion !== expectedTheme) {
    mismatches.push(`expected theme ${expectedTheme}, got ${activeThemeVersion ?? 'not detected'}`);
  }
  if (expectedPlugin && activePluginVersion !== expectedPlugin) {
    mismatches.push(`expected plugin ${expectedPlugin}, got ${activePluginVersion ?? 'not detected'}`);
  }
  if (mismatches.length) {
    console.error(`Staging certification failed: ${mismatches.join('; ')}`);
    process.exit(1);
  }
}

// Read-only: list staging pages (id, title, slug, status, link). Used by the
// visual-qa workflow to find qa-pattern-* pages without depending on tools/tmp.
async function pages() {
  const env = await loadEnv();
  const baseUrl = requireStagingUrl(env);
  const auth = authHeader(env);
  if (!auth) {
    throw new Error('WP_REST_USER and WP_REST_APP_PASSWORD are required to list pages.');
  }
  const { response, data } = await readJson(
    `${baseUrl}/wp-json/wp/v2/pages?status=any&per_page=100&context=edit`,
    { Authorization: auth }
  );
  if (!response.ok || !Array.isArray(data)) {
    throw new Error(`Page list failed (${response.status}): ${JSON.stringify(data)}`);
  }
  const list = data.map((p) => ({
    id: p.id,
    title: p.title?.raw ?? p.title?.rendered ?? '',
    slug: p.slug,
    status: p.status,
    link: p.link
  }));
  console.log(JSON.stringify(list, null, 2));
}

async function qaPages() {
  const env = await loadEnv();
  const baseUrl = requireStagingUrl(env);
  const auth = authHeader(env);
  if (!auth) {
    throw new Error('WP_REST_USER and WP_REST_APP_PASSWORD are required to list QA pages.');
  }
  const { response, data } = await readJson(
    `${baseUrl}/wp-json/wp/v2/pages?status=any&per_page=100&context=edit`,
    { Authorization: auth }
  );
  if (!response.ok || !Array.isArray(data)) {
    throw new Error(`QA page list failed (${response.status}): ${JSON.stringify(data)}`);
  }
  const list = data
    .filter((p) => String(p.slug).startsWith('qa-pattern-'))
    .map((p) => ({
      id: p.id,
      title: p.title?.raw ?? p.title?.rendered ?? '',
      slug: p.slug,
      status: p.status,
      link: p.link
    }));
  console.log(JSON.stringify(list, null, 2));
}

async function dryRun() {
  const env = await loadEnv();
  const baseUrl = requireStagingUrl(env);
  const positional = positionalArgs();
  const method = getArg('--method', /^[A-Z]+$/i.test(positional[0] ?? '') ? positional[0] : 'POST').toUpperCase();
  const route = getArg('--route', positional[1] ?? '/wp-json/wp/v2/pages');
  const payloadPath = getArg('--payload');
  const auth = authHeader(env);

  let payload = null;
  if (payloadPath) {
    const payloadText = await readFile(path.resolve(root, payloadPath), 'utf8');
    payload = JSON.parse(payloadText);
  }

  console.log('REST dry-run only. No request was sent.');
  console.log(`Method: ${method}`);
  console.log(`URL: ${baseUrl}${route.startsWith('/') ? route : `/${route}`}`);
  console.log(`Auth configured: ${auth ? 'yes' : 'no'}`);
  console.log(`Payload: ${payload ? JSON.stringify(payload, null, 2) : 'none'}`);
  console.log('Live staging writes require explicit user approval and a separate implementation step.');
}

async function readContentPayload(contentPath) {
  const payloadText = await readFile(path.resolve(root, contentPath), 'utf8');
  const payload = JSON.parse(payloadText);
  if (typeof payload.content !== 'string' || payload.content.trim().length === 0) {
    throw new Error(`--content payload ${contentPath} must have a non-empty string "content" field.`);
  }
  return payload.content;
}

async function qaPageDryRun() {
  const env = await loadEnv();
  const baseUrl = requireStagingUrl(env);
  const positional = positionalArgs();
  const title = getArg('--title');
  const explicitStatus = getArg('--status');
  const npmStatus = ['publish', 'draft', 'pending', 'private', 'future'].includes(positional[0]) ? positional[0] : null;
  const status = explicitStatus ?? npmStatus ?? 'publish';
  const patternPosition = npmStatus ? 1 : 0;
  const patternSlug = getArg('--pattern', positional[patternPosition]);
  const contentPath = getArg('--content', patternSlug ? undefined : positional[patternPosition]);

  if (!patternSlug && !contentPath) {
    throw new Error('Provide --pattern theme/pattern-slug or --content path/to/payload.json for QA page dry-run.');
  }

  const patternName = patternSlug ? patternSlug.split('/').pop() : path.basename(contentPath, path.extname(contentPath));
  const pageTitle = title ?? `QA - Pattern - ${patternName}`;
  const pageSlug = `qa-pattern-${slugify(patternName)}`;
  let content = patternSlug ? `<!-- wp:pattern {"slug":"${patternSlug}"} /-->` : null;

  if (contentPath) {
    content = await readContentPayload(contentPath);
  }

  const payload = {
    status,
    title: pageTitle,
    slug: pageSlug,
    content
  };

  console.log('QA page dry-run only. No request was sent.');
  console.log(`Method: POST (create, or update existing slug when used with --content)`);
  console.log(`URL: ${baseUrl}/wp-json/wp/v2/pages`);
  console.log(`Purpose: temporary staging-only pattern QA page`);
  console.log(`Payload: ${JSON.stringify(payload, null, 2)}`);
  console.log(`Screenshot URL: ${baseUrl}/${pageSlug}/`);
  console.log(`Screenshot command: npm run screenshot -- --url "${baseUrl}/${pageSlug}/" --selector "main" --label "${pageSlug}" --out "screenshots/after/${pageSlug}"`);
  console.log('Live QA page creation/update requires explicit approval.');
}

async function qaPageTrashDryRun() {
  const env = await loadEnv();
  const baseUrl = requireStagingUrl(env);
  const pageId = getArg('--id', positionalArgs()[0]);

  if (!pageId) {
    throw new Error('Provide --id <page-id> for QA page trash dry-run.');
  }

  console.log('QA page trash dry-run only. No request was sent.');
  console.log(`Method: DELETE`);
  console.log(`URL: ${baseUrl}/wp-json/wp/v2/pages/${pageId}`);
  console.log('Payload: {"force": false}');
  console.log('Live QA page cleanup requires explicit approval.');
}

// Live QA page write. Refuses without confirmation so it can never fire by accident.
// Staging-only by design; pages are published (so they are screenshot-able) and
// trashed after review. Never run against production.
async function qaPageCreate() {
  const confirmed = isConfirmed();
  const env = await loadEnv();
  const baseUrl = requireStagingUrl(env);
  const auth = authHeader(env);
  const positional = positionalArgs();
  const title = getArg('--title');
  const explicitStatus = getArg('--status');
  const npmStatus = ['publish', 'draft', 'pending', 'private', 'future'].includes(positional[0]) ? positional[0] : null;
  const status = explicitStatus ?? npmStatus ?? 'publish';
  const patternPosition = npmStatus ? 1 : 0;
  const patternSlug = getArg('--pattern', positional[patternPosition]);
  const contentPath = getArg('--content', patternSlug ? undefined : positional[patternPosition]);

  if (!auth) {
    throw new Error('WP_REST_USER and WP_REST_APP_PASSWORD are required for QA page creation.');
  }
  if (!patternSlug && !contentPath) {
    throw new Error('Provide --pattern theme/pattern-slug or --content path/to/payload.json for QA page creation.');
  }

  const patternName = patternSlug ? patternSlug.split('/').pop() : path.basename(contentPath, path.extname(contentPath));
  const pageTitle = title ?? `QA - Pattern - ${patternName}`;
  const pageSlug = `qa-pattern-${slugify(patternName)}`;
  let content = patternSlug ? `<!-- wp:pattern {"slug":"${patternSlug}"} /-->` : null;
  if (contentPath) {
    content = await readContentPayload(contentPath);
  }

  if (!confirmed) {
    console.log('REFUSED: live QA page creation needs confirm. Run qa-page-dry-run first for approval, then re-run with confirm.');
    console.log(JSON.stringify({ wouldCreate: { status, title: pageTitle, slug: pageSlug, content } }, null, 2));
    process.exit(2);
  }

  assertStagingHost(baseUrl);

  const pagePayload = { status, title: pageTitle, slug: pageSlug, content };

  // Idempotent for pattern references; --content updates existing pages so
  // screenshots cannot accidentally prove stale layout markup.
  const existing = await readJson(`${baseUrl}/wp-json/wp/v2/pages?slug=${pageSlug}&status=any&context=edit`, { Authorization: auth });
  if (!existing.response.ok || !Array.isArray(existing.data)) {
    throw new Error(`Existing QA page lookup failed (${existing.response.status}): ${JSON.stringify(existing.data)}`);
  }
  if (Array.isArray(existing.data) && existing.data.length > 0) {
    const page = existing.data[0];
    if (contentPath) {
      const update = await fetch(`${baseUrl}/wp-json/wp/v2/pages/${page.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: auth },
        body: JSON.stringify(pagePayload)
      });
      const updatedPage = await update.json();
      if (!update.ok) {
        throw new Error(`QA page update failed (${update.status}): ${JSON.stringify(updatedPage)}`);
      }
      console.log(JSON.stringify({ updated: true, id: updatedPage.id, slug: updatedPage.slug, link: updatedPage.link, status: updatedPage.status }, null, 2));
      return;
    }
    console.log(JSON.stringify({ reused: true, id: page.id, slug: page.slug, link: page.link, status: page.status }, null, 2));
    return;
  }

  const res = await fetch(`${baseUrl}/wp-json/wp/v2/pages`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: auth },
    body: JSON.stringify(pagePayload)
  });
  const page = await res.json();
  if (!res.ok) {
    throw new Error(`QA page create failed (${res.status}): ${JSON.stringify(page)}`);
  }
  console.log(JSON.stringify({ created: true, id: page.id, slug: page.slug, link: page.link, status: page.status }, null, 2));
}

async function qaPageTrash() {
  const confirmed = isConfirmed();
  const env = await loadEnv();
  const baseUrl = requireStagingUrl(env);
  const auth = authHeader(env);
  const pageId = getArg('--id', positionalArgs()[0]);

  if (!auth) {
    throw new Error('WP_REST_USER and WP_REST_APP_PASSWORD are required for QA page cleanup.');
  }
  if (!pageId) {
    throw new Error('Provide --id <page-id> for QA page trash.');
  }
  if (!confirmed) {
    console.log(`REFUSED: live QA page cleanup needs confirm. Would trash page ${pageId} (force=false).`);
    process.exit(2);
  }

  assertStagingHost(baseUrl);

  const res = await fetch(`${baseUrl}/wp-json/wp/v2/pages/${pageId}?force=false`, {
    method: 'DELETE',
    headers: { Authorization: auth }
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(`QA page trash failed (${res.status}): ${JSON.stringify(data)}`);
  }
  console.log(JSON.stringify({ trashed: true, id: data.id ?? pageId, status: data.status ?? 'trash' }, null, 2));
}

// Media pipeline: extension -> Content-Type allowlist. Anything outside this map
// is rejected in both the dry-run plan and the live upload.
const MEDIA_MIME_TYPES = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
  '.svg': 'image/svg+xml',
  '.gif': 'image/gif'
};

const MEDIA_MANIFEST_KEYS = new Set(['file', 'title', 'altText', 'caption', 'attachToSlug']);

// Inline schema-shape validation mirroring data/media-manifest.schema.json
// (array of {file, title, altText, caption?, attachToSlug?}, additionalProperties false).
function checkMediaManifestShape(entries) {
  const issues = [];

  if (!Array.isArray(entries)) {
    issues.push('media manifest must be a JSON array of entries (see data/media-manifest.schema.json)');
    return issues;
  }
  if (entries.length === 0) {
    issues.push('media manifest must contain at least one entry');
  }

  entries.forEach((entry, index) => {
    if (!entry || typeof entry !== 'object' || Array.isArray(entry)) {
      issues.push(`entry #${index} must be an object`);
      return;
    }
    const label = `entry #${index} (${typeof entry.file === 'string' && entry.file ? entry.file : 'no file'})`;
    for (const key of ['file', 'title', 'altText']) {
      if (typeof entry[key] !== 'string' || entry[key].trim().length === 0) {
        issues.push(`${label} missing required non-empty string field: ${key}`);
      }
    }
    for (const key of ['caption', 'attachToSlug']) {
      if (entry[key] !== undefined && typeof entry[key] !== 'string') {
        issues.push(`${label} optional field ${key} must be a string`);
      }
    }
    for (const key of Object.keys(entry)) {
      if (!MEDIA_MANIFEST_KEYS.has(key)) {
        issues.push(`${label} has unknown field: ${key} (additionalProperties are not allowed)`);
      }
    }
  });

  return issues;
}

async function loadMediaManifest(manifestPath) {
  const absolutePath = path.resolve(root, manifestPath);
  let text;
  try {
    text = await readFile(absolutePath, 'utf8');
  } catch {
    throw new Error(`Media manifest not found: ${manifestPath}. Provide --manifest <path> or create data/media-manifest.json.`);
  }
  let entries;
  try {
    entries = JSON.parse(text);
  } catch (error) {
    throw new Error(`Media manifest ${manifestPath} is invalid JSON: ${error.message}`);
  }
  return entries;
}

// Builds the per-entry upload plan and collects every blocker (shape violations,
// missing files, disallowed extensions) so the dry-run can fail closed with the
// complete list instead of stopping at the first problem.
async function buildMediaPlan(entries) {
  const issues = [...checkMediaManifestShape(entries)];
  const plan = [];

  for (const [index, entry] of (Array.isArray(entries) ? entries : []).entries()) {
    if (!entry || typeof entry !== 'object' || typeof entry.file !== 'string' || !entry.file) {
      continue;
    }
    const filePath = path.resolve(root, entry.file);
    const fileName = path.basename(filePath);
    const extension = path.extname(fileName).toLowerCase();
    const mime = MEDIA_MIME_TYPES[extension] ?? null;
    let size = null;

    if (!mime) {
      issues.push(`entry #${index} (${entry.file}) has unsupported extension "${extension || 'none'}"; allowed: ${Object.keys(MEDIA_MIME_TYPES).join(', ')}`);
    }
    try {
      size = (await stat(filePath)).size;
    } catch {
      issues.push(`entry #${index} (${entry.file}) file does not exist on disk: ${entry.file}`);
    }

    plan.push({
      file: entry.file,
      fileName,
      size,
      mime,
      title: entry.title ?? null,
      altText: entry.altText ?? null,
      attachToSlug: entry.attachToSlug ?? null
    });
  }

  return { plan, issues };
}

async function mediaDryRun() {
  const env = await loadEnv();
  const manifestPath = getArg('--manifest', positionalArgs()[0] ?? 'data/media-manifest.json');
  const issues = [];
  let baseUrl = null;

  // Resolve staging URL/auth like every other command, but collect the failures so
  // the dry-run reports everything that would block a live upload, then exits 2.
  try {
    baseUrl = requireStagingUrl(env);
  } catch (error) {
    issues.push(error.message);
  }
  if (!authHeader(env)) {
    issues.push('WP_REST_USER and WP_REST_APP_PASSWORD are required for media upload.');
  }

  let entries = null;
  try {
    entries = await loadMediaManifest(manifestPath);
  } catch (error) {
    issues.push(error.message);
  }

  console.log('Media dry-run only. No request was sent.');
  console.log(`Manifest: ${manifestPath}`);
  console.log(`Target: ${baseUrl ? `${baseUrl}/wp-json/wp/v2/media` : 'not resolved (missing WP_STAGING_URL)'}`);

  if (entries !== null) {
    const { plan, issues: planIssues } = await buildMediaPlan(entries);
    issues.push(...planIssues);
    console.log(`Upload plan (${plan.length} entries):`);
    console.log(JSON.stringify(plan, null, 2));
  }

  if (issues.length) {
    console.error('MEDIA DRY-RUN FAILED: the following issues block a live upload:');
    for (const issue of issues) {
      console.error(`- ${issue}`);
    }
    process.exit(2);
  }

  console.log('Dry-run clean. Live upload requires explicit approval: re-run as media-upload with confirm.');
}

// Live media upload. Refuses without confirmation so it can never fire by accident.
// Staging-only by design (assertStagingHost). Idempotent: an attachment whose
// source_url basename matches the manifest file is updated in place, not re-uploaded.
async function mediaUpload() {
  const confirmed = isConfirmed();
  const env = await loadEnv();
  const baseUrl = requireStagingUrl(env);
  const auth = authHeader(env);
  const manifestPath = getArg('--manifest', positionalArgs()[0] ?? 'data/media-manifest.json');

  if (!auth) {
    throw new Error('WP_REST_USER and WP_REST_APP_PASSWORD are required for media upload.');
  }

  const entries = await loadMediaManifest(manifestPath);
  const { plan, issues } = await buildMediaPlan(entries);
  if (issues.length) {
    console.error('REFUSED: media manifest failed validation. Fix these and re-run media-dry-run:');
    for (const issue of issues) {
      console.error(`- ${issue}`);
    }
    process.exit(2);
  }

  if (!confirmed) {
    console.log('REFUSED: live media upload needs confirm. Run media-dry-run first for approval, then re-run with confirm.');
    console.log(JSON.stringify({ wouldUpload: plan }, null, 2));
    process.exit(2);
  }

  assertStagingHost(baseUrl);

  const results = [];
  let failedCount = 0;

  for (const [index, entry] of entries.entries()) {
    const item = plan[index];
    try {
      // Idempotency: reuse an existing attachment whose source_url basename matches.
      const search = await readJson(
        `${baseUrl}/wp-json/wp/v2/media?search=${encodeURIComponent(item.fileName)}&per_page=100`,
        { Authorization: auth }
      );
      if (!search.response.ok || !Array.isArray(search.data)) {
        throw new Error(`media search failed (${search.response.status}): ${JSON.stringify(search.data)}`);
      }
      const existing = search.data.find((media) => {
        try {
          return decodeURIComponent(path.posix.basename(new URL(media.source_url).pathname)) === item.fileName;
        } catch {
          return false;
        }
      });

      let mediaId;
      if (existing) {
        console.log(`${item.fileName}: exists, updating meta (id ${existing.id})`);
        mediaId = existing.id;
      } else {
        const body = await readFile(path.resolve(root, entry.file));
        const createResponse = await fetch(`${baseUrl}/wp-json/wp/v2/media`, {
          method: 'POST',
          headers: {
            Authorization: auth,
            'Content-Type': item.mime,
            'Content-Disposition': `attachment; filename="${item.fileName}"`
          },
          body
        });
        const created = await createResponse.json();
        if (!createResponse.ok) {
          throw new Error(`media create failed (${createResponse.status}): ${JSON.stringify(created)}`);
        }
        mediaId = created.id;
        console.log(`${item.fileName}: uploaded (id ${mediaId})`);
      }

      const metaPayload = { alt_text: entry.altText, title: entry.title };
      if (entry.caption) {
        metaPayload.caption = entry.caption;
      }
      const updateResponse = await fetch(`${baseUrl}/wp-json/wp/v2/media/${mediaId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: auth },
        body: JSON.stringify(metaPayload)
      });
      const updated = await updateResponse.json();
      if (!updateResponse.ok) {
        throw new Error(`media meta update failed (${updateResponse.status}): ${JSON.stringify(updated)}`);
      }

      results.push({
        file: entry.file,
        id: mediaId,
        status: existing ? 'meta-updated' : 'uploaded',
        sourceUrl: updated.source_url ?? null
      });
    } catch (error) {
      failedCount += 1;
      results.push({ file: entry.file, status: 'failed', error: error.message });
    }
  }

  console.log(JSON.stringify({
    total: results.length,
    uploaded: results.filter((result) => result.status === 'uploaded').length,
    metaUpdated: results.filter((result) => result.status === 'meta-updated').length,
    failed: failedCount,
    results
  }, null, 2));

  if (failedCount > 0) {
    process.exit(1);
  }
}

if (!['check', 'certify', 'pages', 'qa-pages', 'dry-run', 'qa-page-dry-run', 'qa-page-trash-dry-run', 'qa-page-create', 'qa-page-trash', 'media-dry-run', 'media-upload'].includes(command)) {
  console.error('Usage: node tools/staging-rest.mjs <check|certify|pages|qa-pages|dry-run|qa-page-dry-run|qa-page-trash-dry-run|qa-page-create|qa-page-trash|media-dry-run|media-upload> [theme-version plugin-version] [confirm] [status] [theme/pattern] [page-id] [--theme X.Y.Z] [--plugin X.Y.Z] [--pattern theme/pattern] [--content data/page-json/example.json] [--id page-id] [--confirm] [--status publish] [--method POST] [--route /wp-json/wp/v2/pages] [--payload data/page-json/example.json] [--manifest data/media-manifest.json]');
  process.exit(1);
}

if (command === 'check') {
  await check();
}

if (command === 'certify') {
  await certify();
}

if (command === 'pages') {
  await pages();
}

if (command === 'qa-pages') {
  await qaPages();
}

if (command === 'dry-run') {
  await dryRun();
}

if (command === 'qa-page-dry-run') {
  await qaPageDryRun();
}

if (command === 'qa-page-trash-dry-run') {
  await qaPageTrashDryRun();
}

if (command === 'qa-page-create') {
  await qaPageCreate();
}

if (command === 'qa-page-trash') {
  await qaPageTrash();
}

if (command === 'media-dry-run') {
  await mediaDryRun();
}

if (command === 'media-upload') {
  await mediaUpload();
}
