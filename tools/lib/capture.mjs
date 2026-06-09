// Pure parsing/aggregation helpers for the site capture toolkit (tools/capture-site.mjs).
// Everything in this file is side-effect free — no network, no filesystem, no globals —
// so each function is unit-testable offline via `node tools/capture-site.mjs --self-test`.

// Paths ending in these extensions are assets, not crawlable pages.
const ASSET_EXTENSION_RE =
  /\.(?:jpe?g|png|gif|webp|avif|svg|ico|bmp|tiff?|css|js|mjs|map|json|xml|rss|atom|pdf|zip|gz|tgz|rar|7z|mp3|mp4|m4a|m4v|webm|mov|avi|wmv|woff2?|ttf|otf|eot|doc|docx|xls|xlsx|ppt|pptx|csv|txt|sql|wpress)$/i;

const NON_PAGE_SCHEME_RE = /^(?:mailto|tel|sms|javascript|data|ftp|file|whatsapp|skype):/i;

function decodeXmlEntities(value) {
  return String(value)
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCodePoint(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, dec) => String.fromCodePoint(Number(dec)))
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'");
}

// Lowercased hostname key with `www.` stripped, accepting either a bare host
// ("client.com") or a full URL ("https://www.client.com/path").
export function hostKey(hostOrUrl) {
  let host = String(hostOrUrl || '').trim();
  if (host.includes('://')) {
    try {
      host = new URL(host).hostname;
    } catch {
      return '';
    }
  }
  return host
    .toLowerCase()
    .replace(/:\d+$/, '')
    .replace(/^www\./, '');
}

// Parses a sitemap XML document. Handles both <urlset> (page URLs) and
// <sitemapindex> (child sitemap URLs). Returns { urls, childSitemaps }.
export function parseSitemap(xml) {
  const urls = [];
  const childSitemaps = [];
  if (typeof xml !== 'string' || xml.trim() === '') {
    return { urls, childSitemaps };
  }
  const isIndex = /<\s*sitemapindex[\s>]/i.test(xml);
  const locRe = /<loc[^>]*>\s*(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?\s*<\/loc>/gi;
  for (const match of xml.matchAll(locRe)) {
    const loc = decodeXmlEntities(match[1].trim());
    if (!loc) {
      continue;
    }
    (isIndex ? childSitemaps : urls).push(loc);
  }
  return { urls, childSitemaps };
}

// Extracts Sitemap: directive URLs from a robots.txt body (directive is
// case-insensitive per the robots spec).
export function parseRobotsForSitemaps(text) {
  const sitemaps = [];
  if (typeof text !== 'string') {
    return sitemaps;
  }
  for (const line of text.split(/\r?\n/)) {
    const match = line.match(/^\s*sitemap\s*:\s*(\S+)/i);
    if (match) {
      sitemaps.push(match[1].trim());
    }
  }
  return sitemaps;
}

// Normalizes an absolute or relative URL into a same-site path key:
// strips hash/query/trailing slash, compares hosts case-insensitively
// (www-insensitive), and returns null for external hosts, mailto:/tel:/etc
// schemes, and asset URLs (.jpg, .pdf, .css, ...). "/" stays "/".
export function normalizeUrl(url, baseHost) {
  if (typeof url !== 'string') {
    return null;
  }
  const raw = url.trim();
  if (raw === '' || raw.startsWith('#')) {
    return null;
  }
  if (NON_PAGE_SCHEME_RE.test(raw)) {
    return null;
  }
  const expectedHost = hostKey(baseHost);
  if (!expectedHost) {
    return null;
  }
  let parsed;
  try {
    parsed = new URL(raw, `https://${expectedHost}/`);
  } catch {
    return null;
  }
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    return null;
  }
  if (hostKey(parsed.hostname) !== expectedHost) {
    return null;
  }
  let pathName = parsed.pathname.replace(/\/{2,}/g, '/');
  if (ASSET_EXTENSION_RE.test(pathName)) {
    return null;
  }
  if (pathName.length > 1) {
    pathName = pathName.replace(/\/+$/, '');
  }
  return pathName === '' ? '/' : pathName;
}

// Filesystem-safe slug for a normalized path: "/" -> "home", "/a/b-c" -> "a-b-c".
export function slugifyPath(pathKey) {
  const slug = String(pathKey || '/')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 120);
  return slug === '' ? 'home' : slug;
}

const countWords = (text) => (String(text || '').trim() === '' ? 0 : String(text).trim().split(/\s+/).length);

// Turns the serializable in-page snapshot collected by the crawler into the
// inventory record shape. Pure: derives the host from snapshot.url.
export function extractPageData(domSnapshot) {
  const snapshot = domSnapshot && typeof domSnapshot === 'object' ? domSnapshot : {};
  const url = typeof snapshot.url === 'string' ? snapshot.url : '';
  const host = hostKey(url);
  const h1s = (Array.isArray(snapshot.h1s) ? snapshot.h1s : [])
    .map((text) => String(text).trim())
    .filter(Boolean);
  const links = Array.isArray(snapshot.links) ? snapshot.links : [];
  const internalLinks = [
    ...new Set(links.map((link) => normalizeUrl(String(link), host)).filter(Boolean))
  ];
  const images = Array.isArray(snapshot.images) ? snapshot.images : [];
  const headingsOutline = (Array.isArray(snapshot.headingsOutline) ? snapshot.headingsOutline : [])
    .map((entry) => ({ level: Number(entry && entry.level) || 0, text: String((entry && entry.text) || '').trim() }))
    .filter((entry) => entry.level >= 1 && entry.level <= 3 && entry.text !== '');
  const path = normalizeUrl(url, host) || (() => {
    try {
      return new URL(url).pathname;
    } catch {
      return '';
    }
  })();

  return {
    url,
    path,
    status: snapshot.status === undefined ? null : snapshot.status,
    redirectedTo: snapshot.redirectedTo || null,
    title: String(snapshot.title || ''),
    metaDescription: String(snapshot.metaDescription || ''),
    canonical: String(snapshot.canonical || ''),
    og: {
      title: String(snapshot.ogTitle || ''),
      image: String(snapshot.ogImage || '')
    },
    robotsMeta: String(snapshot.robotsMeta || ''),
    h1: h1s,
    multiH1: h1s.length > 1,
    headingsOutline,
    wordCount: countWords(snapshot.mainText),
    imageCount: images.length,
    internalLinks,
    jsonLdTypes: [...new Set((Array.isArray(snapshot.jsonLdTypes) ? snapshot.jsonLdTypes : []).map(String))],
    fetchedAt: snapshot.fetchedAt || null
  };
}

// --- brand aggregation -------------------------------------------------------

const COLOR_KEYWORD_DROP = new Set(['', 'transparent', 'inherit', 'initial', 'unset', 'currentcolor', 'none', 'auto']);

// Normalizes a computed-style color (rgb()/rgba()/#hex) to lowercase 6-digit
// hex. Returns null for transparent/inherit/unparseable values.
export function normalizeCssColor(value) {
  const raw = String(value || '').trim().toLowerCase();
  if (COLOR_KEYWORD_DROP.has(raw)) {
    return null;
  }
  const hexMatch = raw.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/);
  if (hexMatch) {
    const hex = hexMatch[1];
    return hex.length === 3 ? `#${hex[0]}${hex[0]}${hex[1]}${hex[1]}${hex[2]}${hex[2]}` : `#${hex}`;
  }
  const rgbMatch = raw.match(/^rgba?\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*(?:,\s*([\d.]+)\s*)?\)$/);
  if (!rgbMatch) {
    return null;
  }
  if (rgbMatch[4] !== undefined && Number(rgbMatch[4]) === 0) {
    return null;
  }
  const channel = (part) => Math.min(255, Number(part)).toString(16).padStart(2, '0');
  return `#${channel(rgbMatch[1])}${channel(rgbMatch[2])}${channel(rgbMatch[3])}`;
}

// Selectors whose colors signal "accent" usage (buttons and links).
const ACCENT_SELECTOR_RE = /(?:^|\s|\W)(?:a|button)(?:$|\W)|btn/i;

function isSaturated(hex) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return Math.max(r, g, b) - Math.min(r, g, b) >= 30;
}

function firstFontFamily(stack) {
  const first = String(stack || '').split(',')[0].trim().replace(/^["']|["']$/g, '');
  if (first === '' || COLOR_KEYWORD_DROP.has(first.toLowerCase())) {
    return null;
  }
  return first;
}

const HEADING_SELECTOR_RE = /^h[1-6]$/i;

// Given per-page arrays (or a flat array) of computed-style samples
// {selector, color, backgroundColor, fontFamily}, returns:
//   palette: [{hex, count, roleGuess}] ranked by frequency
//     roleGuess: accent  = saturated non-neutral color seen on links/buttons
//                background = mostly seen as backgroundColor
//                text    = everything else
//   fonts: [{family, count, roleGuess: body|heading}] ranked by frequency.
export function aggregateBrand(samples) {
  const flat = [];
  for (const entry of Array.isArray(samples) ? samples : []) {
    if (Array.isArray(entry)) {
      flat.push(...entry);
    } else if (entry && typeof entry === 'object') {
      flat.push(entry);
    }
  }

  const colors = new Map(); // hex -> { count, asText, asBackground, onAccent }
  const fonts = new Map(); // family -> { count, onHeading }

  const tallyColor = (hex, selector, property) => {
    if (!hex) {
      return;
    }
    const stats = colors.get(hex) || { count: 0, asText: 0, asBackground: 0, onAccent: 0 };
    stats.count += 1;
    if (property === 'background') {
      stats.asBackground += 1;
    } else {
      stats.asText += 1;
    }
    if (ACCENT_SELECTOR_RE.test(String(selector || ''))) {
      stats.onAccent += 1;
    }
    colors.set(hex, stats);
  };

  for (const sample of flat) {
    if (!sample || typeof sample !== 'object') {
      continue;
    }
    const selector = String(sample.selector || '');
    tallyColor(normalizeCssColor(sample.color), selector, 'text');
    tallyColor(normalizeCssColor(sample.backgroundColor), selector, 'background');

    const family = firstFontFamily(sample.fontFamily);
    if (family) {
      const stats = fonts.get(family) || { count: 0, onHeading: 0 };
      stats.count += 1;
      if (HEADING_SELECTOR_RE.test(selector.trim())) {
        stats.onHeading += 1;
      }
      fonts.set(family, stats);
    }
  }

  const palette = [...colors.entries()]
    .map(([hex, stats]) => {
      let roleGuess = 'text';
      if (isSaturated(hex) && stats.onAccent > 0) {
        roleGuess = 'accent';
      } else if (stats.asBackground >= stats.asText) {
        roleGuess = 'background';
      }
      return { hex, count: stats.count, roleGuess };
    })
    .sort((a, b) => b.count - a.count || a.hex.localeCompare(b.hex));

  const rankedFonts = [...fonts.entries()]
    .map(([family, stats]) => ({
      family,
      count: stats.count,
      roleGuess: stats.count > 0 && stats.onHeading / stats.count >= 0.5 ? 'heading' : 'body'
    }))
    .sort((a, b) => b.count - a.count || a.family.localeCompare(b.family));

  return { palette, fonts: rankedFonts };
}

// --- redirect drafting -------------------------------------------------------

function normalizeSlug(slug) {
  let value = String(slug || '').trim().toLowerCase();
  if (value === '') {
    return null;
  }
  value = value.split(/[?#]/)[0];
  if (!value.startsWith('/')) {
    value = `/${value}`;
  }
  if (value.length > 1) {
    value = value.replace(/\/+$/, '');
  }
  return value === '' ? '/' : value;
}

function lastSegment(slug) {
  const parts = String(slug).split('/').filter(Boolean);
  return parts.length === 0 ? '' : parts[parts.length - 1];
}

function titleTokens(title) {
  return new Set(
    String(title || '')
      .toLowerCase()
      .split(/[^a-z0-9]+/)
      .filter(Boolean)
  );
}

function jaccard(setA, setB) {
  if (setA.size === 0 || setB.size === 0) {
    return 0;
  }
  let intersection = 0;
  for (const token of setA) {
    if (setB.has(token)) {
      intersection += 1;
    }
  }
  const union = setA.size + setB.size - intersection;
  return union === 0 ? 0 : intersection / union;
}

// Drafts a redirect map from the legacy inventory to the new page list.
// Match tiers (first hit wins): exact slug -> last path segment -> title
// token-overlap Jaccard >= 0.6. Matched rows get status 301 and
// notes `auto:<tier>:<score>`; unmatched rows get to:'' and notes
// NEEDS-MAPPING. Only legacy 200-status pages are considered, and the
// homepage "/" is skipped (it always maps to itself).
export function draftRedirects(legacyInventory, newPages) {
  const targets = (Array.isArray(newPages) ? newPages : [])
    .map((page) => ({
      slug: normalizeSlug(page && page.slug),
      tokens: titleTokens(page && page.title)
    }))
    .filter((page) => page.slug);

  const rows = [];
  for (const record of Array.isArray(legacyInventory) ? legacyInventory : []) {
    if (!record || typeof record !== 'object') {
      continue;
    }
    const from = normalizeSlug(record.path);
    if (!from || from === '/') {
      continue;
    }
    if (Number(record.status) !== 200) {
      continue;
    }

    let match = targets.find((page) => page.slug === from) || null;
    let notes = match ? 'auto:exact:1.00' : null;

    if (!match) {
      const segment = lastSegment(from);
      match = targets.find((page) => lastSegment(page.slug) === segment) || null;
      if (match) {
        notes = 'auto:segment:1.00';
      }
    }

    if (!match) {
      const tokens = titleTokens(record.title);
      let best = null;
      let bestScore = 0;
      for (const page of targets) {
        const score = jaccard(tokens, page.tokens);
        if (score > bestScore) {
          bestScore = score;
          best = page;
        }
      }
      if (best && bestScore >= 0.6) {
        match = best;
        notes = `auto:title:${bestScore.toFixed(2)}`;
      }
    }

    rows.push(
      match
        ? { from, to: match.slug, status: 301, notes }
        : { from, to: '', status: 301, notes: 'NEEDS-MAPPING' }
    );
  }
  return rows;
}

export const REDIRECTS_CSV_HEADER = 'from,to,status,notes';

// Serializes redirect rows to CSV. Header is exactly `from,to,status,notes`.
export function toCsv(rows) {
  const escape = (value) => {
    const text = String(value === undefined || value === null ? '' : value);
    return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
  };
  const lines = [REDIRECTS_CSV_HEADER];
  for (const row of Array.isArray(rows) ? rows : []) {
    lines.push([row.from, row.to, row.status, row.notes].map(escape).join(','));
  }
  return `${lines.join('\n')}\n`;
}
