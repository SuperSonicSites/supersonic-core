import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const command = process.argv[2];
const args = process.argv.slice(3);

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
    if (args[i].startsWith('--')) {
      i += 1;
      continue;
    }
    positional.push(args[i]);
  }

  return positional;
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

async function qaPageDryRun() {
  const env = await loadEnv();
  const baseUrl = requireStagingUrl(env);
  const positional = positionalArgs();
  const patternSlug = getArg('--pattern', positional[0]);
  const title = getArg('--title');
  const contentPath = getArg('--content', patternSlug ? undefined : positional[0]);

  if (!patternSlug && !contentPath) {
    throw new Error('Provide --pattern theme/pattern-slug or --content path/to/payload.json for QA page dry-run.');
  }

  const patternName = patternSlug ? patternSlug.split('/').pop() : path.basename(contentPath, path.extname(contentPath));
  const pageTitle = title ?? `QA - Pattern - ${patternName}`;
  const pageSlug = `qa-pattern-${slugify(patternName)}`;
  let content = patternSlug ? `<!-- wp:pattern {"slug":"${patternSlug}"} /-->` : null;

  if (contentPath) {
    const payloadText = await readFile(path.resolve(root, contentPath), 'utf8');
    const payload = JSON.parse(payloadText);
    content = payload.content;
  }

  const payload = {
    status: 'draft',
    title: pageTitle,
    slug: pageSlug,
    content
  };

  console.log('QA page dry-run only. No request was sent.');
  console.log(`Method: POST`);
  console.log(`URL: ${baseUrl}/wp-json/wp/v2/pages`);
  console.log(`Purpose: temporary staging-only pattern QA page`);
  console.log(`Payload: ${JSON.stringify(payload, null, 2)}`);
  console.log('Live QA page creation requires explicit approval.');
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

if (!['check', 'certify', 'dry-run', 'qa-page-dry-run', 'qa-page-trash-dry-run'].includes(command)) {
  console.error('Usage: node tools/staging-rest.mjs <check|certify|dry-run|qa-page-dry-run|qa-page-trash-dry-run> [--pattern theme/pattern] [--id page-id] [--method POST] [--route /wp-json/wp/v2/pages] [--payload data/page-json/example.json]');
  process.exit(1);
}

if (command === 'check') {
  await check();
}

if (command === 'certify') {
  await certify();
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
