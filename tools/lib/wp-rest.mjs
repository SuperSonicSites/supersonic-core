// Shared WordPress REST helpers, extracted from tools/staging-rest.mjs so the
// staging tool and the Playground render harness build identical requests and
// page payloads instead of drifting copies.

// Basic-auth header from WP application-password env values; null when either
// credential is missing so callers can fail closed with their own message.
export function authHeader(env) {
  if (!env.WP_REST_USER || !env.WP_REST_APP_PASSWORD) {
    return null;
  }
  return `Basic ${Buffer.from(`${env.WP_REST_USER}:${env.WP_REST_APP_PASSWORD}`).toString('base64')}`;
}

// GET a JSON endpoint; tolerates non-JSON bodies (returns the raw text as
// data) so callers can include the body in error messages.
export async function readJson(url, headers = {}) {
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

// The canonical wp/v2 pages payload shape used for QA/render pages.
export function pagePayload({ title, slug, content, status = 'publish' }) {
  return { status, title, slug, content };
}

// Pattern-reference page content: one block reference, nothing else, so the
// page proves the pattern and only the pattern.
export function patternPageContent(patternSlug) {
  return `<!-- wp:pattern {"slug":"${patternSlug}"} /-->`;
}
