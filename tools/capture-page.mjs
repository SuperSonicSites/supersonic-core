import { mkdir } from 'node:fs/promises';
import { VIEWPORTS, launchChromium, openMaskedPage } from './lib/browser.mjs';
const [, , url, label] = process.argv;
await mkdir('screenshots/after/pages', { recursive: true });
const browser = await launchChromium('page capture');
for (const viewport of VIEWPORTS) {
  const page = await openMaskedPage(browser, { viewport, url });
  await page.evaluate(async () => {
    await new Promise((resolve) => {
      let y = 0;
      const step = () => { y += 800; window.scrollTo(0, y); if (y >= document.body.scrollHeight) { window.scrollTo(0, 0); resolve(); } else setTimeout(step, 100); };
      step();
    });
  });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: `screenshots/after/pages/${label}-${viewport.name}.png`, fullPage: true });
  await page.context().close();
  console.log(`${label}-${viewport.name} captured`);
}
await browser.close();

