import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { VIEWPORTS, launchChromium, openMaskedPage, cacheBust } from './lib/browser.mjs';

// a11y:check -- real, measured accessibility proof.
//
// Runs axe-core (WCAG 2.0/2.1 A + AA) against a staging URL at all three viewports and
// emits canonical review findings (see data/review-finding.schema.json). This replaces the
// "manual-only gap" that contrast, target-size, labels, and focus order used to ship as in
// every review report. axe impact maps onto the canonical severity scale; the gate fails on
// blocker/major (axe critical/serious) only -- minor/nit are reported but do not block, so
// the fail-closed signal stays meaningful.

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

const url = getArg('--url');
const include = getArg('--include'); // optional CSS selector to scope the scan to one region
const label = getArg('--label', 'a11y');
const outArg = getArg('--out'); // optional path to write the JSON report
const tags = (getArg('--tags', 'wcag2a,wcag2aa,wcag21aa')).split(',').map((tag) => tag.trim()).filter(Boolean);

if (!url) {
  console.error('Usage: npm run a11y:check -- --url <staging-url> [--include "main .selector"] [--label name] [--out path.json]');
  process.exit(1);
}

// axe impact -> the one canonical severity scale (data/review-finding.schema.json).
const IMPACT_TO_SEVERITY = { critical: 'blocker', serious: 'major', moderate: 'minor', minor: 'nit' };
const GATING_SEVERITIES = new Set(['blocker', 'major']);

let AxeBuilder;
try {
  ({ default: AxeBuilder } = await import('@axe-core/playwright'));
} catch {
  console.error('FAIL: @axe-core/playwright is required for a11y:check. Run `npm install` first, then retry.');
  process.exit(1);
}

const scanUrl = cacheBust(url, 'a11y');
const browser = await launchChromium('a11y audit');
const findings = [];
const byViewport = [];

try {
  for (const viewport of VIEWPORTS) {
    const page = await openMaskedPage(browser, { viewport, url: scanUrl });
    await page.waitForTimeout(500);

    let builder = new AxeBuilder({ page }).withTags(tags);
    if (include) {
      builder = builder.include(include);
    }
    const results = await builder.analyze();

    const violations = [];
    for (const violation of results.violations) {
      const severity = IMPACT_TO_SEVERITY[violation.impact] ?? 'minor';
      const nodes = Array.isArray(violation.nodes) ? violation.nodes : [];
      findings.push({
        id: `${label}-${viewport.name}-${violation.id}`,
        rule_id: `axe/${violation.id}`,
        dimension: violation.id,
        severity,
        breakpoint: viewport.name,
        target: { selector: (nodes[0] && Array.isArray(nodes[0].target) ? nodes[0].target.join(' ') : include) ?? 'page' },
        evidence: `${violation.help} (${nodes.length} node${nodes.length === 1 ? '' : 's'}); ${violation.helpUrl}`,
        status: 'open',
        tool_proof: { tool: 'axe', ruleId: violation.id, impact: violation.impact }
      });
      violations.push({
        id: violation.id,
        impact: violation.impact,
        severity,
        help: violation.help,
        nodes: nodes.map((node) => ({ target: node.target, failureSummary: node.failureSummary }))
      });
    }
    byViewport.push({ viewport: viewport.name, violationCount: violations.length, violations });

    await page.context().close();
  }
} finally {
  await browser.close();
}

// Stdout is the canonical review-finding envelope (data/review-finding.schema.json):
// skill + target_ref + findings. The optional --out artifact additionally carries the
// per-viewport breakdown and scan params for human/debug detail.
const envelope = { skill: 'a11y-audit', target_ref: scanUrl, findings };
const report = { ...envelope, include: include ?? null, tags, byViewport };

if (outArg) {
  const outPath = path.resolve(root, outArg);
  await mkdir(path.dirname(outPath), { recursive: true });
  await writeFile(outPath, JSON.stringify(report, null, 2), 'utf8');
}

console.log(JSON.stringify(envelope, null, 2));

const gating = findings.filter((finding) => GATING_SEVERITIES.has(finding.severity));
if (gating.length) {
  for (const finding of gating) {
    console.error(`FAIL: ${finding.rule_id} [${finding.severity}] ${finding.breakpoint}: ${finding.evidence}`);
  }
  process.exit(1);
}

const reported = findings.length - gating.length;
console.log(`PASS: a11y:check found no blocker/major axe violations (${reported} minor/nit reported)`);
