// Supersonic site capture toolkit (WS1.1).
//
// Crawls an existing client website and captures everything a rebuild needs:
// page inventory, per-page content, images, fonts, logo candidates, a
// frequency-weighted brand palette, and a draft 301 redirect map against the
// new sitemap in data/site-intake.json.
//
// Usage:
//   node tools/capture-site.mjs --url https://client.com [--max-pages 200] [--delay-ms 500] [--out captured]
//   node tools/capture-site.mjs --self-test   (offline fixture regression checks; what CI runs)
//
// All parsing/aggregation logic lives in tools/lib/capture.mjs as pure
// functions; this file owns the network, the browser, and the filesystem.

import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { launchChromium, VIEWPORTS } from './lib/browser.mjs';
import {
  aggregateBrand,
  draftRedirects,
  extractPageData,
  hostKey,
  normalizeCssColor,
  normalizeUrl,
  parseRobotsForSitemaps,
  parseSitemap,
  REDIRECTS_CSV_HEADER,
  slugifyPath,
  toCsv
} from './lib/capture.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, '..');
const fixturesDir = path.join(__dirname, 'fixtures', 'capture');

const USER_AGENT = 'SupersonicCapture/1.0';
const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
const NAV_TIMEOUT_MS = 45000;
const CONCURRENCY = 2;

const args = process.argv.slice(2);

function getArg(name, fallback = undefined) {
  const index = args.indexOf(name);
  if (index === -1 || index === args.length - 1) {
    return fallback;
  }
  return args[index + 1];
}

function getNumberArg(name, fallback) {
  const value = getArg(name);
  if (value === undefined) {
    return fallback;
  }
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) {
    throw new Error(`${name} must be a non-negative number, got: ${value}`);
  }
  return parsed;
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// --- self-test (offline fixture regression checks) ---------------------------

async function runSelfTest() {
  const results = [];
  const assert = (name, condition) => {
    results.push({ pass: Boolean(condition), name });
  };
  const fixture = async (file) => readFile(path.join(fixturesDir, file), 'utf8');
  const jsonFixture = async (file) => JSON.parse(await fixture(file));

  // parseSitemap: urlset
  const urlset = parseSitemap(await fixture('sitemap.xml'));
  assert('sitemap urlset yields 3 urls and no child sitemaps', urlset.urls.length === 3 && urlset.childSitemaps.length === 0);
  assert(
    'sitemap urlset decodes &amp; entities in <loc>',
    urlset.urls.includes('https://legacy.example.com/services/roof-repair?utm_source=feed&ref=sitemap')
  );

  // parseSitemap: sitemapindex (incl. CDATA loc)
  const index = parseSitemap(await fixture('sitemapindex.xml'));
  assert('sitemapindex yields child sitemaps, not urls', index.urls.length === 0 && index.childSitemaps.length === 2);
  assert('sitemapindex handles CDATA <loc>', index.childSitemaps.includes('https://legacy.example.com/post-sitemap.xml'));

  // parseRobotsForSitemaps
  const robotsSitemaps = parseRobotsForSitemaps(await fixture('robots.txt'));
  assert(
    'robots.txt yields both Sitemap directives case-insensitively',
    robotsSitemaps.length === 2 &&
      robotsSitemaps[0] === 'https://legacy.example.com/sitemap_index.xml' &&
      robotsSitemaps[1] === 'https://legacy.example.com/news-sitemap.xml'
  );

  // normalizeUrl edge cases
  assert('normalizeUrl strips trailing slash', normalizeUrl('https://example.com/about/', 'example.com') === '/about');
  assert('normalizeUrl strips query and hash', normalizeUrl('/pricing?utm=1#top', 'example.com') === '/pricing');
  assert('normalizeUrl lowercases/ignores host case', normalizeUrl('https://EXAMPLE.com/contact', 'example.com') === '/contact');
  assert('normalizeUrl treats www host as same site', normalizeUrl('https://www.example.com/contact', 'example.com') === '/contact');
  assert('normalizeUrl keeps root as /', normalizeUrl('https://example.com/', 'example.com') === '/');
  assert('normalizeUrl rejects external host', normalizeUrl('https://other.com/page', 'example.com') === null);
  assert('normalizeUrl rejects mailto:', normalizeUrl('mailto:hi@example.com', 'example.com') === null);
  assert('normalizeUrl rejects tel:', normalizeUrl('tel:+15555550100', 'example.com') === null);
  assert('normalizeUrl rejects asset URLs', normalizeUrl('/img/logo.png', 'example.com') === null);

  // extractPageData
  const home = extractPageData(await jsonFixture('snapshot-home.json'));
  assert('home record has single H1 and multiH1=false', home.h1.length === 1 && home.multiH1 === false);
  assert('home record word count is 9', home.wordCount === 9);
  assert(
    'home internal links are normalized, deduped, internal-only',
    home.internalLinks.length === 2 && home.internalLinks.includes('/about-us') && home.internalLinks.includes('/services/roof-repair')
  );
  assert('home record keeps og title/image', home.og.title === 'Legacy Example' && home.og.image.endsWith('og-home.jpg'));
  assert('home record dedupes jsonLdTypes', home.jsonLdTypes.length === 2);
  assert('home path is /', home.path === '/' && home.imageCount === 2);

  const about = extractPageData(await jsonFixture('snapshot-about.json'));
  assert('about record flags multiple H1s', about.multiH1 === true && about.h1.length === 2);

  const moved = extractPageData(await jsonFixture('snapshot-moved.json'));
  assert('moved record keeps redirectedTo and zero word count', moved.redirectedTo === 'https://legacy.example.com/contact' && moved.wordCount === 0);

  // aggregateBrand
  const brand = aggregateBrand(await jsonFixture('brand-samples.json'));
  const byHex = new Map(brand.palette.map((entry) => [entry.hex, entry]));
  assert('brand normalizes rgb() to hex (#0066cc present)', byHex.has('#0066cc'));
  assert('brand guesses saturated link/button color as accent', byHex.get('#0066cc')?.roleGuess === 'accent');
  assert('brand guesses white as background', byHex.get('#ffffff')?.roleGuess === 'background');
  assert('brand guesses body text gray as text', byHex.get('#333333')?.roleGuess === 'text');
  assert('brand drops rgba(0,0,0,0)/transparent samples', !byHex.has('#000000'));
  const byFamily = new Map(brand.fonts.map((entry) => [entry.family, entry]));
  assert('brand strips quotes from font families', byFamily.has('Playfair Display') && byFamily.has('Inter'));
  assert('brand guesses heading font role', byFamily.get('Playfair Display')?.roleGuess === 'heading');
  assert('brand guesses body font role', byFamily.get('Inter')?.roleGuess === 'body');
  assert('brand ranks fonts by frequency', brand.fonts[0]?.family === 'Inter');
  assert('normalizeCssColor expands #abc shorthand', normalizeCssColor('#abc') === '#aabbcc');

  // draftRedirects: tier precedence + threshold
  const rows = draftRedirects(
    await jsonFixture('redirects-legacy-inventory.json'),
    await jsonFixture('redirects-new-pages.json')
  );
  const byFrom = new Map(rows.map((row) => [row.from, row]));
  assert('redirects skip the homepage /', !byFrom.has('/'));
  assert('redirects skip non-200 legacy pages', !byFrom.has('/old-promo'));
  assert(
    'redirects normalize trailing slash and exact-match slugs',
    byFrom.get('/about-us')?.to === '/about-us' && byFrom.get('/about-us')?.notes === 'auto:exact:1.00'
  );
  assert(
    'redirects exact tier beats segment tier',
    byFrom.get('/services/roof-repair')?.to === '/services/roof-repair' && byFrom.get('/services/roof-repair')?.notes === 'auto:exact:1.00'
  );
  assert(
    'redirects segment tier matches last path segment',
    byFrom.get('/company/roof-repair')?.to === '/services/roof-repair' && byFrom.get('/company/roof-repair')?.notes === 'auto:segment:1.00'
  );
  assert(
    'redirects title tier matches Jaccard >= 0.6 with score in notes',
    byFrom.get('/water-heater-installation')?.to === '/water-heaters' && byFrom.get('/water-heater-installation')?.notes === 'auto:title:0.80'
  );
  assert(
    'redirects title tier rejects 0.5 overlap (below 0.6 threshold)',
    byFrom.get('/emergency-plumbing-repair')?.to === '' && byFrom.get('/emergency-plumbing-repair')?.notes === 'NEEDS-MAPPING'
  );
  assert(
    'redirects unmatched page falls to NEEDS-MAPPING with status 301',
    byFrom.get('/legacy-blog/some-post')?.notes === 'NEEDS-MAPPING' && Number(byFrom.get('/legacy-blog/some-post')?.status) === 301
  );
  assert('redirects with no new pages all NEEDS-MAPPING', draftRedirects(await jsonFixture('redirects-legacy-inventory.json'), []).every((row) => row.notes === 'NEEDS-MAPPING'));

  // toCsv
  const csv = toCsv(rows);
  assert('csv header is exactly from,to,status,notes', csv.split('\n')[0] === REDIRECTS_CSV_HEADER && REDIRECTS_CSV_HEADER === 'from,to,status,notes');
  assert('csv has one line per row plus header', csv.trimEnd().split('\n').length === rows.length + 1);
  const quoted = toCsv([{ from: '/a', to: '', status: 301, notes: 'NEEDS-MAPPING, "review"' }]);
  assert('csv quotes fields containing commas/quotes', quoted.includes('"NEEDS-MAPPING, ""review"""'));

  for (const result of results) {
    console.log(`${result.pass ? 'PASS' : 'FAIL'}: ${result.name}`);
  }
  const failures = results.filter((result) => !result.pass).length;
  console.log(`\nSelf-test: ${results.length - failures}/${results.length} checks passed.`);
  return failures === 0;
}

// --- crawl helpers -----------------------------------------------------------

async function fetchText(url) {
  const response = await fetch(url, { headers: { 'user-agent': USER_AGENT }, redirect: 'follow' });
  if (!response.ok) {
    throw new Error(`HTTP ${response.status} for ${url}`);
  }
  return response.text();
}

async function fetchBinary(url) {
  const response = await fetch(url, { headers: { 'user-agent': USER_AGENT }, redirect: 'follow' });
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }
  const declared = Number(response.headers.get('content-length') || 0);
  if (declared > MAX_IMAGE_BYTES) {
    throw new Error(`exceeds ${MAX_IMAGE_BYTES} bytes (content-length ${declared})`);
  }
  const buffer = Buffer.from(await response.arrayBuffer());
  if (buffer.length > MAX_IMAGE_BYTES) {
    throw new Error(`exceeds ${MAX_IMAGE_BYTES} bytes (actual ${buffer.length})`);
  }
  return { buffer, contentType: response.headers.get('content-type') || '' };
}

// robots.txt -> sitemap URLs -> page URLs (recursing one level of sitemapindex).
async function discoverSitemapUrls(origin, host) {
  const pageUrls = new Set();
  let sitemapUrls = [];
  try {
    sitemapUrls = parseRobotsForSitemaps(await fetchText(`${origin}/robots.txt`));
  } catch (error) {
    console.warn(`robots.txt not readable (${error.message}); falling back to /sitemap.xml`);
  }
  if (sitemapUrls.length === 0) {
    sitemapUrls = [`${origin}/sitemap.xml`, `${origin}/sitemap_index.xml`];
  }

  const readSitemap = async (sitemapUrl, depth) => {
    let parsed;
    try {
      parsed = parseSitemap(await fetchText(sitemapUrl));
    } catch (error) {
      console.warn(`sitemap skipped: ${sitemapUrl} (${error.message})`);
      return;
    }
    for (const url of parsed.urls) {
      const key = normalizeUrl(url, host);
      if (key) {
        pageUrls.add(key);
      }
    }
    if (depth === 0) {
      for (const child of parsed.childSitemaps) {
        await readSitemap(child, 1);
      }
    } else if (parsed.childSitemaps.length > 0) {
      console.warn(`sitemap recursion capped at one level; skipping nested index in ${sitemapUrl}`);
    }
  };

  for (const sitemapUrl of sitemapUrls) {
    await readSitemap(sitemapUrl, 0);
  }
  return pageUrls;
}

// One page.evaluate collecting the full serializable snapshot: SEO/meta fields,
// headings, main text, images, links, JSON-LD types, computed-style brand
// samples, and asset leads (stylesheets, header imgs/SVGs, icons).
function collectInPage() {
  const meta = (name) => document.querySelector(`meta[name="${name}"]`)?.getAttribute('content') || '';
  const prop = (property) => document.querySelector(`meta[property="${property}"]`)?.getAttribute('content') || '';
  const clean = (text) => String(text || '').replace(/\s+/g, ' ').trim();

  const h1s = [...document.querySelectorAll('h1')].map((el) => clean(el.textContent)).filter(Boolean);
  const headingsOutline = [...document.querySelectorAll('h1, h2, h3')]
    .map((el) => ({ level: Number(el.tagName[1]), text: clean(el.textContent) }))
    .filter((entry) => entry.text);

  // Main text: <main> if present, else the largest of article/#content, else
  // body minus header/nav/footer chrome.
  let mainText = '';
  const mainEl = document.querySelector('main');
  if (mainEl) {
    mainText = mainEl.innerText || '';
  } else {
    for (const el of document.querySelectorAll('article, #content')) {
      const text = el.innerText || '';
      if (text.length > mainText.length) {
        mainText = text;
      }
    }
    if (!mainText && document.body) {
      const clone = document.body.cloneNode(true);
      clone.querySelectorAll('header, nav, footer, script, style, noscript, template').forEach((el) => el.remove());
      mainText = clone.textContent.replace(/\s+/g, ' ').trim();
    }
  }

  const images = [...document.images]
    .map((img) => ({
      src: img.currentSrc || img.src || '',
      alt: img.alt || '',
      naturalWidth: img.naturalWidth || 0,
      naturalHeight: img.naturalHeight || 0
    }))
    .filter((img) => img.src);

  const links = [...document.querySelectorAll('a[href]')].map((a) => a.href);

  const jsonLdTypes = [];
  for (const script of document.querySelectorAll('script[type="application/ld+json"]')) {
    try {
      const walk = (node) => {
        if (Array.isArray(node)) {
          node.forEach(walk);
        } else if (node && typeof node === 'object') {
          const type = node['@type'];
          if (typeof type === 'string') {
            jsonLdTypes.push(type);
          } else if (Array.isArray(type)) {
            type.forEach((t) => typeof t === 'string' && jsonLdTypes.push(t));
          }
          Object.values(node).forEach(walk);
        }
      };
      walk(JSON.parse(script.textContent));
    } catch {
      /* malformed JSON-LD: ignore */
    }
  }

  const brandSelectors = ['body', 'header', 'footer', 'h1', 'h2', 'a', 'button', '[class*="btn"]', 'nav a'];
  const brandSamples = [];
  for (const selector of brandSelectors) {
    for (const el of [...document.querySelectorAll(selector)].slice(0, 5)) {
      const style = getComputedStyle(el);
      brandSamples.push({
        selector,
        color: style.color,
        backgroundColor: style.backgroundColor,
        fontFamily: style.fontFamily
      });
    }
  }

  const stylesheets = [...document.querySelectorAll('link[rel="stylesheet"][href]')].map((link) => link.href);
  const headerImages = [...document.querySelectorAll('header img, [class*="logo"] img')]
    .map((img) => img.currentSrc || img.src || '')
    .filter(Boolean)
    .slice(0, 5);
  const headerInlineSvgs = [...document.querySelectorAll('header svg')].slice(0, 3).map((svg) => svg.outerHTML);
  const iconLinks = [...document.querySelectorAll('link[rel~="icon"], link[rel="apple-touch-icon"]')]
    .map((link) => link.href)
    .filter(Boolean);

  return {
    title: document.title || '',
    metaDescription: meta('description'),
    canonical: document.querySelector('link[rel="canonical"]')?.href || '',
    ogTitle: prop('og:title'),
    ogImage: prop('og:image'),
    robotsMeta: meta('robots'),
    h1s,
    headingsOutline,
    mainText,
    images,
    links,
    jsonLdTypes,
    brandSamples,
    stylesheets,
    headerImages,
    headerInlineSvgs,
    iconLinks
  };
}

async function capturePage(browser, pageUrl, host) {
  const context = await browser.newContext({
    viewport: { width: VIEWPORTS[0].width, height: VIEWPORTS[0].height },
    userAgent: USER_AGENT
  });
  try {
    const page = await context.newPage();
    const response = await page.goto(pageUrl, { waitUntil: 'domcontentloaded', timeout: NAV_TIMEOUT_MS });
    const status = response ? response.status() : 0;
    const finalUrl = page.url();
    const redirectedTo = normalizeUrl(finalUrl, host) !== normalizeUrl(pageUrl, host) || hostKey(finalUrl) !== host ? finalUrl : null;

    if (hostKey(finalUrl) !== host) {
      return { snapshot: { url: pageUrl, status, redirectedTo, fetchedAt: new Date().toISOString() }, offHost: true };
    }

    const collected = await page.evaluate(collectInPage);
    return {
      snapshot: {
        url: pageUrl,
        status,
        redirectedTo,
        fetchedAt: new Date().toISOString(),
        ...collected
      },
      offHost: false
    };
  } finally {
    await context.close();
  }
}

function extensionFor(url, contentType) {
  const fromUrl = (() => {
    try {
      const match = new URL(url).pathname.match(/\.([a-z0-9]{2,5})$/i);
      return match ? `.${match[1].toLowerCase()}` : '';
    } catch {
      return '';
    }
  })();
  if (fromUrl) {
    return fromUrl;
  }
  const map = {
    'image/jpeg': '.jpg',
    'image/png': '.png',
    'image/gif': '.gif',
    'image/webp': '.webp',
    'image/avif': '.avif',
    'image/svg+xml': '.svg',
    'image/x-icon': '.ico',
    'font/woff2': '.woff2',
    'font/woff': '.woff',
    'font/ttf': '.ttf',
    'font/otf': '.otf'
  };
  return map[String(contentType).split(';')[0].trim()] || '.bin';
}

function safeBaseName(url, fallback) {
  try {
    const base = path.posix.basename(new URL(url).pathname) || fallback;
    return base.replace(/[^a-zA-Z0-9._-]+/g, '-').slice(0, 80) || fallback;
  } catch {
    return fallback;
  }
}

async function loadNewPagesFromIntake() {
  try {
    const doc = JSON.parse(await readFile(path.join(root, 'data', 'site-intake.json'), 'utf8'));
    const pages = Array.isArray(doc.pages) ? doc.pages : [];
    return pages
      .filter(
        (page) =>
          page &&
          typeof page.slug === 'string' &&
          page.slug.trim() !== '' &&
          page.slug.trim().toUpperCase() !== 'TBD' &&
          String(page.title || '').trim().toUpperCase() !== 'TBD'
      )
      .map((page) => ({ slug: page.slug, title: String(page.title || '') }));
  } catch {
    return [];
  }
}

// --- crawl orchestration ------------------------------------------------------

async function crawl({ startUrl, maxPages, delayMs, outDir }) {
  const parsedStart = new URL(startUrl);
  const origin = `${parsedStart.protocol}//${parsedStart.host}`;
  const host = hostKey(parsedStart.hostname);

  await mkdir(path.join(outDir, 'pages'), { recursive: true });
  await mkdir(path.join(outDir, 'assets', 'images'), { recursive: true });
  await mkdir(path.join(outDir, 'assets', 'fonts'), { recursive: true });
  await mkdir(path.join(outDir, 'assets', 'logo-candidates'), { recursive: true });

  console.log(`Capturing ${origin} (max ${maxPages} pages, ${delayMs}ms delay, out: ${outDir})`);

  const sitemapPaths = await discoverSitemapUrls(origin, host);
  console.log(`Sitemap discovery: ${sitemapPaths.size} URLs.`);

  const queue = ['/'];
  const seen = new Set(queue);
  for (const pathKey of sitemapPaths) {
    if (!seen.has(pathKey) && seen.size < maxPages) {
      seen.add(pathKey);
      queue.push(pathKey);
    }
  }

  const inventory = [];
  const fullRecords = new Map(); // path -> { record, mainText }
  const brandSamplesByPage = new Map(); // path -> samples[]
  const imageLeads = new Map(); // src -> { alt, width, height, pages:Set }
  const stylesheetUrls = new Set();
  const logoLeads = new Set();
  const inlineSvgs = [];
  let crawlFailures = 0;

  const browser = await launchChromium('capture-site');
  try {
    let active = 0;
    const worker = async () => {
      while (true) {
        const pathKey = queue.shift();
        if (pathKey === undefined) {
          if (active === 0) {
            return;
          }
          await sleep(100);
          continue;
        }
        active += 1;
        const pageUrl = `${origin}${pathKey}`;
        try {
          const { snapshot, offHost } = await capturePage(browser, pageUrl, host);
          const record = extractPageData(snapshot);
          record.path = pathKey;
          inventory.push(record);

          if (!offHost) {
            fullRecords.set(pathKey, { ...record, mainText: snapshot.mainText || '' });
            brandSamplesByPage.set(pathKey, snapshot.brandSamples || []);
            for (const img of snapshot.images || []) {
              const lead = imageLeads.get(img.src) || { alt: img.alt, width: img.naturalWidth, height: img.naturalHeight, pages: new Set() };
              lead.pages.add(pathKey);
              imageLeads.set(img.src, lead);
            }
            for (const sheet of snapshot.stylesheets || []) {
              if (hostKey(sheet) === host) {
                stylesheetUrls.add(sheet);
              }
            }
            for (const lead of [...(snapshot.headerImages || []), ...(snapshot.iconLinks || [])]) {
              logoLeads.add(lead);
            }
            if (snapshot.ogImage) {
              logoLeads.add(snapshot.ogImage);
            }
            for (const svg of snapshot.headerInlineSvgs || []) {
              if (!inlineSvgs.includes(svg)) {
                inlineSvgs.push(svg);
              }
            }
            for (const link of record.internalLinks) {
              if (!seen.has(link) && seen.size < maxPages) {
                seen.add(link);
                queue.push(link);
              }
            }
          }
          console.log(`  [${record.status}] ${pathKey}`);
        } catch (error) {
          crawlFailures += 1;
          inventory.push({ url: pageUrl, path: pathKey, status: null, error: error.message, fetchedAt: new Date().toISOString() });
          console.warn(`  [fail] ${pathKey}: ${error.message}`);
        } finally {
          active -= 1;
        }
        await sleep(delayMs);
      }
    };
    await Promise.all(Array.from({ length: CONCURRENCY }, worker));
  } finally {
    await browser.close();
  }

  inventory.sort((a, b) => String(a.path).localeCompare(String(b.path)));
  await writeFile(path.join(outDir, 'inventory.json'), `${JSON.stringify(inventory, null, 2)}\n`);
  for (const [pathKey, record] of fullRecords) {
    await writeFile(path.join(outDir, 'pages', `${slugifyPath(pathKey)}.json`), `${JSON.stringify(record, null, 2)}\n`);
  }

  // Images: download unique sources, dedupe by sha256 content hash.
  const assetDelay = Math.min(delayMs, 200);
  const hashToFile = new Map();
  const imageManifest = [];
  let imagesDownloaded = 0;
  let imagesSkipped = 0;
  for (const [src, lead] of imageLeads) {
    try {
      const { buffer, contentType } = await fetchBinary(src);
      const hash = createHash('sha256').update(buffer).digest('hex');
      let file = hashToFile.get(hash);
      if (!file) {
        file = `${hash.slice(0, 16)}${extensionFor(src, contentType)}`;
        await writeFile(path.join(outDir, 'assets', 'images', file), buffer);
        hashToFile.set(hash, file);
        imagesDownloaded += 1;
      }
      imageManifest.push({ file, originUrl: src, alt: lead.alt, width: lead.width, height: lead.height, pages: [...lead.pages].sort() });
    } catch (error) {
      imagesSkipped += 1;
      console.warn(`  image skipped: ${src} (${error.message})`);
    }
    await sleep(assetDelay);
  }
  await writeFile(path.join(outDir, 'assets', 'images', 'manifest.json'), `${JSON.stringify(imageManifest, null, 2)}\n`);

  // Fonts: parse @font-face src URLs out of same-host stylesheets.
  const fontUrls = new Set();
  for (const sheetUrl of stylesheetUrls) {
    try {
      const css = await fetchText(sheetUrl);
      for (const block of css.match(/@font-face\s*\{[^}]*\}/gi) || []) {
        for (const match of block.matchAll(/url\(\s*(['"]?)([^'")]+)\1\s*\)/gi)) {
          try {
            fontUrls.add(new URL(match[2], sheetUrl).toString());
          } catch {
            /* unresolvable font URL: ignore */
          }
        }
      }
    } catch (error) {
      console.warn(`  stylesheet skipped: ${sheetUrl} (${error.message})`);
    }
  }
  let fontsDownloaded = 0;
  for (const fontUrl of fontUrls) {
    try {
      const { buffer, contentType } = await fetchBinary(fontUrl);
      const hash = createHash('sha256').update(buffer).digest('hex').slice(0, 8);
      const name = `${hash}-${safeBaseName(fontUrl, `font${extensionFor(fontUrl, contentType)}`)}`;
      await writeFile(path.join(outDir, 'assets', 'fonts', name), buffer);
      fontsDownloaded += 1;
    } catch (error) {
      console.warn(`  font skipped: ${fontUrl} (${error.message})`);
    }
    await sleep(assetDelay);
  }

  // Logo candidates: header imgs, icons, og:image, inline header SVG markup.
  let logoCandidates = 0;
  let logoIndex = 0;
  for (const lead of logoLeads) {
    logoIndex += 1;
    try {
      const { buffer, contentType } = await fetchBinary(lead);
      const name = `${String(logoIndex).padStart(2, '0')}-${safeBaseName(lead, `logo${extensionFor(lead, contentType)}`)}`;
      await writeFile(path.join(outDir, 'assets', 'logo-candidates', name), buffer);
      logoCandidates += 1;
    } catch (error) {
      console.warn(`  logo candidate skipped: ${lead} (${error.message})`);
    }
    await sleep(assetDelay);
  }
  for (let i = 0; i < inlineSvgs.length; i += 1) {
    await writeFile(path.join(outDir, 'assets', 'logo-candidates', `header-inline-${i + 1}.svg`), `${inlineSvgs[i]}\n`);
    logoCandidates += 1;
  }

  // Brand aggregation with per-page sample counts.
  const brand = aggregateBrand([...brandSamplesByPage.values()]);
  const samplesPerPage = {};
  for (const [pathKey, samples] of brandSamplesByPage) {
    samplesPerPage[pathKey] = samples.length;
  }
  await writeFile(
    path.join(outDir, 'brand.json'),
    `${JSON.stringify({ ...brand, samplePages: brandSamplesByPage.size, samplesPerPage }, null, 2)}\n`
  );

  // Draft redirects against the new sitemap from data/site-intake.json.
  const newPages = await loadNewPagesFromIntake();
  if (newPages.length === 0) {
    console.warn('data/site-intake.json has no usable pages[] (missing or TBD); all redirect rows will be NEEDS-MAPPING.');
  }
  const redirectRows = draftRedirects(inventory, newPages);
  await writeFile(path.join(outDir, 'redirects.draft.csv'), toCsv(redirectRows));

  const summary = {
    site: origin,
    capturedAt: new Date().toISOString(),
    pagesCrawled: inventory.length,
    pagesOk: inventory.filter((record) => record.status === 200).length,
    pagesFailed: crawlFailures,
    sitemapUrls: sitemapPaths.size,
    imagesDownloaded,
    imagesDeduped: imageManifest.length - imagesDownloaded,
    imagesSkipped,
    fontsDownloaded,
    logoCandidates,
    brandColors: brand.palette.length,
    brandFonts: brand.fonts.length,
    redirectRows: redirectRows.length,
    redirectsMatched: redirectRows.filter((row) => row.notes !== 'NEEDS-MAPPING').length,
    redirectsNeedsMapping: redirectRows.filter((row) => row.notes === 'NEEDS-MAPPING').length
  };
  await writeFile(path.join(outDir, 'summary.json'), `${JSON.stringify(summary, null, 2)}\n`);

  console.log('\nCapture summary:');
  for (const [key, value] of Object.entries(summary)) {
    console.log(`  ${key}: ${value}`);
  }
}

// --- entry point ---------------------------------------------------------------

function usage() {
  console.log('Usage: node tools/capture-site.mjs --url https://client.com [--max-pages 200] [--delay-ms 500] [--out captured]');
  console.log('       node tools/capture-site.mjs --self-test');
}

if (process.argv[1] === __filename) {
  if (args.includes('--self-test')) {
    const ok = await runSelfTest();
    process.exit(ok ? 0 : 1);
  }

  const url = getArg('--url');
  if (!url) {
    usage();
    console.error('\nMissing required --url.');
    process.exit(1);
  }
  try {
    new URL(url);
  } catch {
    console.error(`--url is not a valid URL: ${url}`);
    process.exit(1);
  }

  try {
    await crawl({
      startUrl: url,
      maxPages: getNumberArg('--max-pages', 200),
      delayMs: getNumberArg('--delay-ms', 500),
      outDir: path.resolve(root, getArg('--out', 'captured'))
    });
  } catch (error) {
    console.error(`Capture failed: ${error.message}`);
    process.exit(1);
  }
}
