---
name: visual-qa
description: Use when reviewing a Supersonic pattern or section visually on Hostinger staging, including requests like "visual QA", "screenshot review", "responsive check", "review this section at mobile/tablet/desktop", or "check spacing and overflow". Verifies token-based spacing, typography, and color, approved shadows, no horizontal overflow, no console errors, and layout intent across breakpoints.
---

# Visual QA Skill

Also follow `docs/agent-quality-standard.md`.

## Discovery

Start by discovering the QA scope from repo facts: latest report, package
version, pattern registry entry, affected source file, staging readiness, and
available QA page status. Do not ask the user for a target that the latest
report, registry, or user request already identifies.

## Contract

Define the reviewed target, selector, viewport set, expected layout behavior,
editor-control claims, and interactive states before capturing screenshots.
For a pattern, include the control contract card from `pattern-builder`.

## Proof Gates

- Use cache-busted staging URLs for final screenshots and browser assertions.
- Capture desktop, tablet, and mobile screenshots of the reviewed target.
- On `qa-pattern-*` pages, target the reviewed pattern under `main`.
- Assert the target is visible with non-zero dimensions.
- Assert no horizontal overflow and no console/page errors.
- Capture required interaction states: header/nav open and closed, desktop hover
  panels, mobile/tablet overlays, accordions, details blocks, and any other
  stateful UI.
- Run `npm run pattern:proof` when a staging URL and selector are available.
- Run `npm run a11y:check -- --url <staging>` for the measured accessibility pass
  (axe: contrast, target-size, labels, focus). Record its result under `Tool proof`.
- Update the report with a `Proof Summary`. Findings conform to
  `data/review-finding.schema.json`.

## Failure Policy

If proof is incomplete, report `needs-revision` instead of approval. Missing
desktop/tablet/mobile screenshots, missing interaction-state evidence, wrong
selector targeting, console errors, overflow, or a staging version mismatch all
block approval.

## Report

Include scope, target selector, cache-busted URL, screenshots, static/staging
checks, interaction evidence, issues, fixes, manual-only gaps, and approval
status. Findings conform to `data/review-finding.schema.json`. For pattern
reviews, update `data/pattern-certifications.json` and pass
`npm run pattern:registry:check`.

The `Proof Summary` uses the single canonical structure — these exact labels,
never renamed, with `n/a` for inapplicable rows (never drop a label):

```text
## Proof Summary

- Static proof:
- Staging proof:
- Visual proof:
- Interaction proof:
- Editor-control proof:
- Tool proof:
- Manual-only gaps:
```

Keep the interaction-state proof requirements: header/nav open and closed,
desktop hover panels, mobile/tablet overlays, accordions, details blocks, and
any other stateful UI. Record `npm run a11y:check` output under `Tool proof`.

A self-contained runbook for screenshot-based visual QA on Hostinger staging.
Follow these steps in order — do not re-derive the process or re-read the whole doc set.

## Step 0 — Establish WHAT to QA (always start here)

**Always read the latest QA report first** to know what to look for — even when the
user names a target. The latest report is the source of truth for the current release's
open visual items.

1. Read the `version` field in `package.json` (e.g. `0.1.13`).
2. Open the latest report in `docs/reports/` — the highest-versioned `*-qa.md` /
   release report (e.g. `0.1.12-full-qa.md`). This is the release record; there is no
   separate changelog file.
3. Build the QA target list from its **Prioritized fix list** and **Remaining risks /
   verify visually on staging** sections — those are the open visual items.

Then scope:

- If the user named a specific pattern, section, or page, QA that — but still cross-check
  it against the latest report's findings for that area so nothing open is missed.
- If the user named nothing, QA the full open list from the report.
- If no report exists in `docs/reports/`, ask the user what to QA before capturing anything.

## Step 1 — Confirm staging is ready

- The staging URL is the `WP_STAGING_URL` environment variable. Do not look for it in SITE.md.
- If `WP_STAGING_URL` is unset, ask the user for the staging URL — do not guess.
- Recommended: `npm run rest:check` to confirm staging is up and on the expected theme
  version before treating screenshots as final. Report any version mismatch.
- Screenshots require Playwright. If the capture command fails with a Playwright error,
  run `npm install` once, then retry.

## Step 2 — Capture screenshots

Use the project tool. It captures all three breakpoints automatically —
**desktop 1440px, tablet 768px, mobile 390px** — so you only run it once per target.

PowerShell:

```powershell
npm run screenshot -- --url "$env:WP_STAGING_URL/<page-or-qa-page-slug>" --selector "<section-selector>" --label "<short-label>" --out "screenshots/after/<review-folder>"
```

- `--selector` targets the specific section/pattern, not the whole page (default is `main`).
  Prefer a tight selector so the review focuses on the change.
- `--label` names the files: produces `<label>-desktop.png`, `<label>-tablet.png`, `<label>-mobile.png`.
- Output lands in `screenshots/after/<review-folder>`; keep baselines in `screenshots/before/` if comparing.

**Capture each pattern in isolation — never screenshot the staging root.** If a pattern
is not already placed on a real page, the root URL renders default content, not the
pattern. Use a temporary staging-only QA page per pattern (created, captured, then
trashed). The commands are gated and refuse to write without `confirm`:

```powershell
# 1. dry-run to show the payload (for approval)
npm run rest:qa-page:dry-run -- <theme-slug>/<pattern>
# 2. create the page (publishes so it is screenshot-able; idempotent — reuses if it exists)
npm run rest:qa-page:create -- confirm <theme-slug>/<pattern>
# 3. screenshot the returned link, then ALWAYS clean up:
npm run rest:qa-page:trash -- confirm <page-id>
```

`npm run rest:qa-pages` lists staging QA pages (read-only) so you can find and
trash any leftover `qa-pattern-*` pages. QA page writes are refused unless
`WP_STAGING_URL` is a `staging.*` host. QA pages are staging-only and must never
reach production.

Then read each captured PNG to review it.

## Step 3 — Review

Full criteria live in `QA_CHECKLIST.md` (Screenshot Review + Token Editability). Do not
duplicate them here — open that file. Key checks per breakpoint:

- spacing uses approved tokens; section uses one semantic spacing token
- no horizontal overflow; respects 5% gutter and 1440px max width
- typography scale, text wrapping, readability
- alignment, visual hierarchy, image cropping
- CTA visibility; mobile column stacking; tablet layout
- approved shadow presets only (`soft`, `medium`)
- no console errors
- consistency with `DESIGN_SYSTEM.md`

## Step 4 — Report

Include:

- scope reviewed (which release items from the report, or which pattern)
- active theme/plugin version on staging
- screenshots captured (paths)
- pattern registry status, if this was a theme pattern
- issues found, with severity
- recommended fixes
- approval status (pass/fail per item)

Fix only the issues identified, then re-capture and re-review. Do not deploy.

## Execution model — agents and model tiers

For anything beyond a single pattern, run this SOP as a multi-agent fan-out. The saved
workflow `.claude/workflows/visual-qa.js` implements exactly the stages below; prefer
running it (`Workflow {name:"visual-qa"}`) over hand-rolling agents. Keep all of this
repo-agnostic: discover the theme, version, targets, and docs at runtime — never hardcode
a site name, URL, or pattern list.

Assign the cheapest model that can do each stage well:

| Stage | Model | Why |
| --- | --- | --- |
| **Discover scope** — read `package.json` version, find latest `docs/reports/*qa*.md`, glob theme `patterns/`, confirm staging via `npm run rest:check` | **Haiku** | Mechanical glob/read/parse; no judgment. |
| **Capture + review** (one agent per target) — create a temp QA page, run `npm run screenshot`, read the 3 PNGs, check against `QA_CHECKLIST.md` + `DESIGN_SYSTEM.md` tokens, then trash the page | **Sonnet** | Vision + checklist reasoning at fan-out scale; best price/perf. The full page lifecycle lives in one agent so the page is always cleaned up. |
| **Adversarial verify** (one agent per finding) — try to refute the finding against the pattern source file | **Opus** | Highest judgment; kills false positives before they reach the report. |
| **Synthesize report** — dedupe, prioritize by severity, write `docs/reports/<version>-*-qa.md` | **Opus** | Cross-finding judgment and the durable write-up. |

## Handoff contract — how agents communicate

Stages pass **validated JSON**, not prose, so each agent consumes the previous one
deterministically. The workflow enforces these with schemas; keep the shapes stable:

```jsonc
// Discover  →  Review
{ "version": "0.1.13",
  "themeDir": "wp-content/themes/<theme>",
  "stagingReady": true,
  "targets": [ { "name": "hero-simple", "type": "pattern",
                 "file": "wp-content/themes/<theme>/patterns/hero-simple.php",
                 "url": "<page-or-qa-page>", "selector": ".wp-block-..." } ],
  "knownOpenFindings": [ "<title from latest report>" ] }

// Review  →  Verify   (per target)
// Findings conform to data/review-finding.schema.json.
{ "target": "hero-simple",
  "screenshots": ["screenshots/after/<folder>/hero-simple-desktop.png", "...tablet.png", "...mobile.png"],
  "findings": [ { "id": "hero-simple-1", "rule_id": "<rule>", "title": "...",
                  "severity": "blocker|major|minor|nit",
                  "breakpoint": "desktop|tablet|mobile|all", "evidence": "...",
                  "target": { "file": "<file>", "selector": "<selector>" },
                  "suspected_source": "<file>:<line or token>", "status": "open" } ] }

// Verify  →  Synthesize   (per finding)
{ "id": "hero-simple-1", "verdict": "real|false-positive",
  "reasoning": "...", "sourceConfirmed": true }
```

Rules for the handoff:
- Every finding carries a stable `id` so verify verdicts map back 1:1 at synthesis.
- Only findings with `verdict:"real"` reach the report; false-positives are listed
  separately as "considered and dismissed" so the next run doesn't re-flag them.
- The report must match the existing format in `docs/reports/` (scope, active versions,
  screenshots, prioritized fixes, remaining risks, approval status).
- Pattern reviews must update `data/pattern-certifications.json` and pass
  `npm run pattern:registry:check` before approval.
