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

async function dryRun() {
  const env = await loadEnv();
  const baseUrl = requireStagingUrl(env);
  const positional = args.filter((arg) => !arg.startsWith('--'));
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

if (!['check', 'dry-run'].includes(command)) {
  console.error('Usage: node tools/staging-rest.mjs <check|dry-run> [--method POST] [--route /wp-json/wp/v2/pages] [--payload data/page-json/example.json]');
  process.exit(1);
}

if (command === 'check') {
  await check();
}

if (command === 'dry-run') {
  await dryRun();
}
