// Generic live-site extraction tool for migrations/redesigns (Axis A).
// Crawls a list of paths on a base URL and produces:
//   - full-page desktop/tablet/mobile baseline screenshots per page
//   - per-page SEO snapshot (title, meta, canonical, og, JSON-LD, heading outline)
//   - per-page image + link inventory
//   - a global design probe (palette, typography, buttons, header/footer, CSS vars)
// Output: screenshots/before/<label>/ and data/site-extraction.json
//
// Usage: node tools/extract-site.mjs --base https://www.example.com --label example \
//          --paths "/,/about-us,/services"

import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { VIEWPORTS, launchChromium, openMaskedPage } from './lib/browser.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const args = process.argv.slice(2);

function getArg(name, fallback = undefined) {
  const index = args.indexOf(name);
  if (index === -1 || index === args.length - 1) {
    return fallback;
  }
  return args[index + 1];
}

const base = getArg('--base');
const label = getArg('--label', 'site');
const paths = getArg('--paths', '/').split(',').map((p) => p.trim()).filter(Boolean);

if (!base) {
  console.error('Usage: node tools/extract-site.mjs --base <url> [--label name] [--paths "/,/about"]');
  process.exit(1);
}

const shotsDir = path.resolve(root, 'screenshots/before', label);
const dataDir = path.resolve(root, 'data');
await mkdir(shotsDir, { recursive: true });
await mkdir(dataDir, { recursive: true });

// Serializes the page facts the migration needs: SEO head, heading outline,
// media inventory, and internal links. Runs in the browser context.
function pageSnapshotScript() {
  const pick = (sel, attr) => {
    const el = document.querySelector(sel);
    return el ? (attr ? el.getAttribute(attr) : el.textContent.trim()) : null;
  };
  const headings = [...document.querySelectorAll('h1,h2,h3,h4')].map((h) => ({
    level: h.tagName,
    text: h.textContent.replace(/\s+/g, ' ').trim()
  }));
  const jsonLd = [...document.querySelectorAll('script[type="application/ld+json"]')]
    .map((s) => { try { return JSON.parse(s.textContent); } catch { return { parseError: true, raw: s.textContent.slice(0, 500) }; } });
  const images = [...document.querySelectorAll('img')].map((img) => ({
    src: img.currentSrc || img.src,
    alt: img.alt || null,
    width: img.naturalWidth,
    height: img.naturalHeight,
    loading: img.loading || null
  }));
  const links = [...document.querySelectorAll('a[href]')]
    .map((a) => ({ href: a.getAttribute('href'), text: a.textContent.replace(/\s+/g, ' ').trim().slice(0, 80) }))
    .filter((l) => l.href && !l.href.startsWith('javascript:'));
  return {
    title: document.title,
    metaDescription: pick('meta[name="description"]', 'content'),
    canonical: pick('link[rel="canonical"]', 'href'),
    robots: pick('meta[name="robots"]', 'content'),
    ogTitle: pick('meta[property="og:title"]', 'content'),
    ogDescription: pick('meta[property="og:description"]', 'content'),
    ogImage: pick('meta[property="og:image"]', 'content'),
    generator: pick('meta[name="generator"]', 'content'),
    lang: document.documentElement.lang || null,
    headings,
    jsonLd,
    images,
    links,
    bodyTextLength: document.body.innerText.length
  };
}

// Computed-style design probe: typography scale, palette usage with frequency,
// button treatments, header/footer/section backgrounds, and :root CSS variables.
function designProbeScript() {
  const style = (el, props) => {
    const cs = getComputedStyle(el);
    return Object.fromEntries(props.map((p) => [p, cs.getPropertyValue(p)]));
  };
  const typoProps = ['font-family', 'font-size', 'font-weight', 'line-height', 'letter-spacing', 'color', 'text-transform'];
  const boxProps = ['background-color', 'color', 'border-radius', 'border', 'box-shadow', 'padding', 'font-size', 'font-weight', 'font-family', 'text-transform', 'letter-spacing'];

  const sample = {};
  for (const sel of ['body', 'h1', 'h2', 'h3', 'h4', 'p', 'a']) {
    const el = document.querySelector(sel);
    if (el) sample[sel] = style(el, typoProps);
  }

  // Buttons and button-looking links, deduped by visual signature.
  const buttonEls = [...document.querySelectorAll('button, a')].filter((el) => {
    const cs = getComputedStyle(el);
    const bg = cs.backgroundColor;
    const hasBg = bg && bg !== 'rgba(0, 0, 0, 0)' && bg !== 'transparent';
    const rounded = parseFloat(cs.borderRadius) > 0;
    const padded = parseFloat(cs.paddingLeft) >= 8;
    return el.tagName === 'BUTTON' ? true : (hasBg && padded) || (rounded && hasBg);
  });
  const buttonMap = new Map();
  for (const el of buttonEls.slice(0, 60)) {
    const s = style(el, boxProps);
    const key = `${s['background-color']}|${s['border-radius']}|${s['font-size']}`;
    if (!buttonMap.has(key)) {
      buttonMap.set(key, { text: el.textContent.replace(/\s+/g, ' ').trim().slice(0, 40), tag: el.tagName, styles: s, count: 0 });
    }
    buttonMap.get(key).count += 1;
  }

  // Palette frequency across all elements.
  const colorCount = new Map();
  const addColor = (val) => {
    if (!val || val === 'rgba(0, 0, 0, 0)' || val === 'transparent') return;
    colorCount.set(val, (colorCount.get(val) || 0) + 1);
  };
  for (const el of document.querySelectorAll('*')) {
    const cs = getComputedStyle(el);
    addColor(cs.backgroundColor);
    addColor(cs.color);
  }
  const palette = [...colorCount.entries()].sort((a, b) => b[1] - a[1]).slice(0, 30)
    .map(([color, count]) => ({ color, count }));

  // :root CSS custom properties (design tokens of the source site, if any).
  const rootVars = {};
  for (const sheet of document.styleSheets) {
    let rules;
    try { rules = sheet.cssRules; } catch { continue; }
    for (const rule of rules || []) {
      if (rule.selectorText === ':root' && rule.style) {
        for (const prop of rule.style) {
          if (prop.startsWith('--')) rootVars[prop] = rule.style.getPropertyValue(prop).trim();
        }
      }
    }
  }

  const header = document.querySelector('header') || document.querySelector('[class*="header" i]');
  const footer = document.querySelector('footer') || document.querySelector('[class*="footer" i]');
  const sections = [...document.querySelectorAll('main section, body section')].slice(0, 20).map((s) => ({
    heading: (s.querySelector('h1,h2,h3')?.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 60),
    styles: style(s, ['background-color', 'padding-top', 'padding-bottom', 'margin-top', 'margin-bottom'])
  }));

  return {
    sample,
    buttons: [...buttonMap.values()],
    palette,
    rootVars,
    header: header ? style(header, ['background-color', 'height', 'position', 'box-shadow', 'padding']) : null,
    footer: footer ? style(footer, ['background-color', 'color', 'padding-top', 'padding-bottom']) : null,
    sections,
    containerWidth: (() => {
      const main = document.querySelector('main') || document.body;
      const candidates = [...main.querySelectorAll('div')].slice(0, 200)
        .map((d) => d.getBoundingClientRect().width)
        .filter((w) => w > 600 && w < window.innerWidth);
      if (!candidates.length) return null;
      const freq = new Map();
      for (const w of candidates) { const r = Math.round(w); freq.set(r, (freq.get(r) || 0) + 1); }
      return [...freq.entries()].sort((a, b) => b[1] - a[1])[0][0];
    })()
  };
}

const browser = await launchChromium('site extraction');
const extraction = { base, label, capturedAt: new Date().toISOString(), pages: {}, design: null };

try {
  for (const p of paths) {
    const url = new URL(p, base).toString();
    const slug = p === '/' ? 'home' : p.replace(/^\/+|\/+$/g, '').replace(/[^a-z0-9-]+/gi, '-');
    console.log(`Extracting ${url}`);

    for (const viewport of VIEWPORTS) {
      const page = await openMaskedPage(browser, { viewport, url });
      // Let lazy images/fonts settle, then force-load lazy content by scrolling.
      await page.evaluate(async () => {
        await new Promise((resolve) => {
          let y = 0;
          const step = () => {
            y += 800;
            window.scrollTo(0, y);
            if (y >= document.body.scrollHeight) { window.scrollTo(0, 0); resolve(); }
            else setTimeout(step, 120);
          };
          step();
        });
      });
      await page.waitForTimeout(1200);

      if (viewport.name === 'desktop') {
        extraction.pages[p] = await page.evaluate(pageSnapshotScript);
        if (p === '/') {
          extraction.design = await page.evaluate(designProbeScript);
        }
      }
      await page.screenshot({ path: path.join(shotsDir, `${slug}-${viewport.name}.png`), fullPage: true });
      await page.context().close();
    }
    console.log(`  ✓ ${slug}: 3 baselines + snapshot`);
  }
} finally {
  await browser.close();
}

const outFile = path.join(dataDir, 'site-extraction.json');
await writeFile(outFile, JSON.stringify(extraction, null, 2));
console.log(`\nWrote ${path.relative(root, outFile)}`);
console.log(`Baselines in ${path.relative(root, shotsDir)}`);
