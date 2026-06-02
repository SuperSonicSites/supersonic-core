import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

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

function getAllArgs(name) {
  const values = [];
  for (let i = 0; i < args.length; i += 1) {
    if (args[i] === name && i < args.length - 1) {
      values.push(args[i + 1]);
      i += 1;
    }
  }
  return values;
}

function getOption(name, positionalIndex, fallback = undefined) {
  const flagged = getArg(name);
  if (flagged) {
    return flagged;
  }

  const positional = [];
  for (let i = 0; i < args.length; i += 1) {
    if (args[i].startsWith('--')) {
      i += 1;
      continue;
    }
    positional.push(args[i]);
  }

  return positional[positionalIndex] ?? fallback;
}

async function loadPlaywright() {
  try {
    return await import('playwright');
  } catch {
    throw new Error('Playwright is required for pattern proof. Run `npm install` first, then retry `npm run pattern:proof -- --url <staging-url> --selector "main <selector>"`.');
  }
}

function cacheBust(inputUrl) {
  const parsed = new URL(inputUrl);
  parsed.searchParams.set('proof', String(Date.now()));
  return parsed.toString();
}

function selectorTargetsMain(url, selector) {
  const pathname = new URL(url).pathname;
  if (!pathname.includes('/qa-pattern-')) {
    return true;
  }

  const trimmed = selector.trim();
  return trimmed === 'main' ||
    trimmed.startsWith('main ') ||
    trimmed.startsWith('main>') ||
    trimmed.startsWith('main.') ||
    trimmed.startsWith('main#');
}

function parseInteraction(value) {
  const parts = value.split(':');
  if (parts.length < 3) {
    throw new Error(`Invalid --interaction "${value}". Use <viewport>:<action>:<selector>.`);
  }

  const [viewport, action, ...selectorParts] = parts;
  return {
    viewport,
    action,
    selector: selectorParts.join(':')
  };
}

async function applyInteraction(page, interaction) {
  const target = page.locator(interaction.selector).first();
  if (interaction.action === 'hover') {
    await target.hover({ timeout: 10000 });
  } else if (interaction.action === 'click') {
    await target.click({ timeout: 10000 });
  } else if (interaction.action === 'focus') {
    await target.focus({ timeout: 10000 });
  } else if (interaction.action === 'wait-visible') {
    await target.waitFor({ state: 'visible', timeout: 10000 });
  } else if (interaction.action === 'wait-hidden') {
    await target.waitFor({ state: 'hidden', timeout: 10000 });
  } else {
    throw new Error(`Unsupported interaction action "${interaction.action}". Use hover, click, focus, wait-visible, or wait-hidden.`);
  }
}

const url = getOption('--url', 0);
const selector = getOption('--selector', 1, 'main');
const label = getOption('--label', 2, 'pattern-proof');
const outputArg = getOption('--out', 3);
const interactions = getAllArgs('--interaction').map(parseInteraction);
const allowMultiple = args.includes('--allow-multiple');

if (!url) {
  console.error('Usage: npm run pattern:proof -- --url <staging-url> --selector "main <selector>" [--label name] [--out screenshots/after/folder] [--interaction desktop:hover:<selector>]');
  process.exit(1);
}

if (!selectorTargetsMain(url, selector)) {
  console.error('FAIL: QA page proof selectors must target the reviewed pattern under main, for example `main .supersonic-site-header`.');
  process.exit(1);
}

const viewports = [
  { name: 'desktop', width: 1440, height: 1000 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'mobile', width: 390, height: 844 }
];

const proofUrl = cacheBust(url);
const outputDir = outputArg ? path.resolve(root, outputArg) : null;
const { chromium } = await loadPlaywright();
if (outputDir) {
  await mkdir(outputDir, { recursive: true });
}

const browser = await chromium.launch();
const summary = {
  url: proofUrl,
  selector,
  screenshots: {},
  viewports: []
};
const failures = [];

try {
  for (const viewport of viewports) {
    const consoleErrors = [];
    const pageErrors = [];
    const page = await browser.newPage({ viewport });
    page.on('console', (message) => {
      if (message.type() === 'error') {
        consoleErrors.push(message.text());
      }
    });
    page.on('pageerror', (error) => {
      pageErrors.push(error.message);
    });

    await page.goto(proofUrl, { waitUntil: 'domcontentloaded', timeout: 45000 });
    await page.addStyleTag({
      content: `
        iframe[src*="tidio"],
        iframe[src*="tawk"],
        iframe[src*="intercom"],
        iframe[src*="crisp"],
        iframe[title*="chat" i],
        [id*="tidio" i],
        [class*="tidio" i],
        [id*="tawk" i],
        [class*="tawk" i],
        [id*="intercom" i],
        [class*="intercom" i],
        [id*="crisp" i],
        [class*="crisp" i],
        [aria-label*="chat" i],
        [title*="chat" i] {
          display: none !important;
          visibility: hidden !important;
        }
      `
    });

    const viewportInteractions = interactions.filter((interaction) =>
      interaction.viewport === viewport.name || interaction.viewport === 'all'
    );

    for (const interaction of viewportInteractions) {
      await applyInteraction(page, interaction);
    }

    await page.waitForTimeout(500);
    const target = page.locator(selector);
    const count = await target.count();
    if (count === 0) {
      failures.push(`${viewport.name}: selector "${selector}" matched no elements`);
    }
    if (count > 1 && !allowMultiple) {
      failures.push(`${viewport.name}: selector "${selector}" matched ${count} elements; tighten the selector or pass --allow-multiple intentionally`);
    }

    const firstTarget = target.first();
    await firstTarget.waitFor({ state: 'visible', timeout: 10000 });
    const box = await firstTarget.boundingBox();
    if (!box || box.width <= 0 || box.height <= 0) {
      failures.push(`${viewport.name}: target has zero or missing dimensions`);
    }

    const metrics = await page.evaluate(() => ({
      clientWidth: document.documentElement.clientWidth,
      scrollWidth: document.documentElement.scrollWidth
    }));
    if (metrics.scrollWidth > metrics.clientWidth + 1) {
      failures.push(`${viewport.name}: horizontal overflow (${metrics.scrollWidth}px scroll width vs ${metrics.clientWidth}px client width)`);
    }

    if (consoleErrors.length) {
      failures.push(`${viewport.name}: console errors: ${consoleErrors.join(' | ')}`);
    }
    if (pageErrors.length) {
      failures.push(`${viewport.name}: page errors: ${pageErrors.join(' | ')}`);
    }

    let screenshotPath = null;
    if (outputDir) {
      screenshotPath = path.join(outputDir, `${label}-${viewport.name}.png`);
      await firstTarget.screenshot({ path: screenshotPath });
      summary.screenshots[viewport.name] = path.relative(root, screenshotPath).replace(/\\/g, '/');
    }

    summary.viewports.push({
      viewport: viewport.name,
      targetCount: count,
      box,
      overflow: metrics.scrollWidth - metrics.clientWidth,
      interactions: viewportInteractions.map((interaction) => `${interaction.action}:${interaction.selector}`),
      consoleErrors,
      pageErrors,
      screenshot: screenshotPath ? path.relative(root, screenshotPath).replace(/\\/g, '/') : null
    });

    await page.close();
  }
} finally {
  await browser.close();
}

console.log(JSON.stringify(summary, null, 2));

if (failures.length) {
  for (const failure of failures) {
    console.error(`FAIL: ${failure}`);
  }
  process.exit(1);
}

console.log('PASS: pattern proof checks passed');
