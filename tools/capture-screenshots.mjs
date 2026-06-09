import { mkdir } from 'node:fs/promises';
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

const url = getOption('--url', 0);
const selector = getOption('--selector', 1, 'main');
const label = getOption('--label', 2, 'staging');
const outputDir = path.resolve(root, getOption('--out', 3, 'screenshots/after'));

if (!url) {
  console.error('Usage: npm run screenshot -- --url <staging-url> [--selector "main"] [--label name] [--out screenshots/after]');
  process.exit(1);
}

await mkdir(outputDir, { recursive: true });

const browser = await launchChromium('screenshot capture');
try {
  for (const viewport of VIEWPORTS) {
    const page = await openMaskedPage(browser, { viewport, url });
    const filePath = path.join(outputDir, `${label}-${viewport.name}.png`);
    const target = page.locator(selector).first();
    await target.waitFor({ state: 'visible', timeout: 10000 });
    await page.waitForTimeout(500);
    await target.screenshot({ path: filePath });
    await page.context().close();
    console.log(`Captured ${path.relative(root, filePath)} from selector "${selector}"`);
  }
} finally {
  await browser.close();
}
