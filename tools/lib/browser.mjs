// Shared Playwright/Chromium setup for the Supersonic browser tools (pattern-proof,
// capture-screenshots, a11y-audit). Extracted so the viewport matrix, the chat-widget
// mask, the lazy Playwright import, and the staging-safe page setup live in ONE place
// instead of being copy-pasted into every tool.

// The canonical responsive matrix. Every browser tool reviews at these three widths.
export const VIEWPORTS = [
  { name: 'desktop', width: 1440, height: 1000 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'mobile', width: 390, height: 844 }
];

// Hides third-party chat widgets so they never pollute screenshots, overflow checks, or
// accessibility scans of the reviewed pattern.
export const CHAT_WIDGET_MASK_CSS = `
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
`;

// Appends a cache-busting query param so staging caches never serve a stale render to a
// proof, screenshot, or audit. param differs per tool to avoid colliding in logs.
export function cacheBust(inputUrl, param = 'proof') {
  const parsed = new URL(inputUrl);
  parsed.searchParams.set(param, String(Date.now()));
  return parsed.toString();
}

// Lazy import so the tools fail with a helpful message (rather than a module-not-found
// stack) when dependencies are not installed yet. context names the calling tool.
export async function loadPlaywright(context = 'this tool') {
  try {
    return await import('playwright');
  } catch {
    throw new Error(`Playwright is required for ${context}. Run \`npm install\` first, then retry.`);
  }
}

export async function launchChromium(context = 'this tool') {
  const { chromium } = await loadPlaywright(context);
  return chromium.launch();
}

// Opens a page at the given viewport, navigates, and applies the chat-widget mask. Optional
// onConsoleError / onPageError collectors are attached BEFORE navigation so nothing is
// missed. Returns the ready page; the caller drives interactions, assertions, and capture,
// then closes the context with `await page.context().close()`.
//
// Pages are created via an explicit per-viewport browser context (not browser.newPage)
// because @axe-core/playwright requires a context-owned page; each page already had its own
// implicit context before, so this is behavior-preserving for the screenshot/proof tools.
export async function openMaskedPage(browser, { viewport, url, timeout = 45000, onConsoleError, onPageError } = {}) {
  const context = await browser.newContext(viewport ? { viewport } : {});
  const page = await context.newPage();
  if (typeof onConsoleError === 'function') {
    page.on('console', (message) => {
      if (message.type() === 'error') {
        onConsoleError(message.text());
      }
    });
  }
  if (typeof onPageError === 'function') {
    page.on('pageerror', (error) => onPageError(error.message));
  }
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout });
  await page.addStyleTag({ content: CHAT_WIDGET_MASK_CSS });
  return page;
}
