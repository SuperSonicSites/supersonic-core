---
name: layout-review
description: Use when reviewing, grading, or QA-ing a composed page layout against the Supersonic layout standard, including requests like "layout review", "grade this page layout", "review the page composition", "score the homepage layout", "did the layout follow best practices", or "layout QA". Judges section order/archetype fit, hierarchy, spacing rhythm, alignment, responsive behavior, typography, color/contrast, conversion design, semantic structure, structured-data readiness, internal linking, imagery, Core Web Vitals, and accessibility against docs/layout-standard.md, scores each dimension, and feeds prioritized rule-ID fixes back to layout-architect. For a single section's pixels use visual-qa; for project setup use new-site-init.
---

# Layout Review Skill

Use this skill to grade a full composed page layout and drive its revision. It is
the page-level QA counterpart to `layout-architect`: it judges the whole page's
composition against `docs/layout-standard.md`, scores it, and returns
prioritized, rule-ID-tagged fixes that `layout-architect` applies. Re-review
until the page passes.

This skill is **site-agnostic** — discover the target, staging URL, and inputs at
runtime; never hardcode a site. Also follow `docs/agent-quality-standard.md`.

It **orchestrates and cross-checks** the existing skills rather than duplicating
them: defer detailed pixel/spacing/overflow review to `visual-qa`, contrast and
keyboard review to `accessibility-review`, and title/meta/heading/schema-fit
review to `seo-auditor`. `layout-review` owns the page-level composition
judgment and the overall score.

## Discovery

Establish what to review from repo facts first:

- The `layout-architect` **Layout Blueprint** and the composed-page markup (the
  contract being graded).
- `docs/layout-standard.md` (rule catalog, archetypes, scoring), `PAGE_MAP.md`
  (intended hierarchy + internal links), `SEO_STRATEGY.md`, `BRAND.md`,
  `DESIGN_SYSTEM.md`.
- `package.json` version, the latest `docs/reports/*` for open items, and
  `data/pattern-certifications.json` for the patterns used.
- Staging readiness: `WP_STAGING_URL` (the staging host; do not look in
  `SITE.md`) and `npm run rest:check`.

Determine the page intent/archetype from the blueprint and `PAGE_MAP.md`. Do not
ask the user for a target the blueprint or page map already identifies.

## Contract

Define before capturing or scoring:

- the reviewed page, its intent/archetype, and the expected section set
- the rubric dimensions and which findings are gating (blockers)
- the staging URL (cache-busted) and the selectors for the full page and the key
  sections
- the interaction states to capture (header/nav open+closed, hover, overlays,
  accordions, including details blocks only when they are part of an approved
  pattern)
- the cross-skill checks to run (`visual-qa`, `accessibility-review`,
  `seo-auditor`)
- what evidence makes each dimension pass

## Scoring Rubric

Score each dimension against its rules in `docs/layout-standard.md`. Per-finding
severity is the canonical four-word scale: **blocker** / **major** / **minor** /
**nit** (no other words). A dimension's status takes the worst severity among its
findings (`pass` when none). Findings cite rule IDs.

| # | Dimension | Rules | Gating? |
|---|-----------|-------|---------|
| 1 | Information architecture & section order | `IA-*` | — |
| 2 | Visual hierarchy & scanning | `HIER-*` | — |
| 3 | Spacing & rhythm | `SPACE-*` | — |
| 4 | Alignment, justification & measure | `ALIGN-*` | — |
| 5 | Grid & responsive (no overflow) | `GRID-*` | overflow = blocker |
| 6 | Typography | `TYPE-*` | — |
| 7 | Color & contrast | `COLOR-*` | AA contrast fail = blocker; requires axe Tool proof |
| 8 | Conversion design | `CONV-*` | — |
| 9 | Semantic structure & landmarks | `SEM-*` | `core/html` = blocker |
| 10 | Heading hierarchy | `HEAD-*` | 0 or >1 H1 = blocker |
| 11 | Structured-data plan readiness | `SD-*` | duplicate/mismatched schema = blocker |
| 12 | Internal linking | `LINK-*` | orphan target = major |
| 13 | Imagery & placeholders | `IMG-*` | missing alt/dims = major |
| 14 | Core Web Vitals (layout) | `CWV-*` | lazy-loaded hero = major; documented manual gate this pass (future `tools/cwv-audit.mjs` hook) |
| 15 | Accessibility (layout) | `A11Y-*` | target <24px / no focus = blocker; requires axe Tool proof |
| 16 | Framework & token compliance | `FW-*` | unapproved pattern / arbitrary value = blocker |

Dimension 7 also scores the background rhythm: two identical neutral backgrounds
adjacent (`COLOR-6`) = **major**; an integral background re-roled (`COLOR-7`) =
**major**; a colored/dark/gradient band without readable text (`COLOR-8/9`) =
**blocker** (same contract as `COLOR-2`/AA). Dimension 3 also scores stacking
seams: a base-colored margin/seam between two adjacent colored bands (`SPACE-7`)
= **major** — check it on the **composed** page, since it is invisible in
single-pattern QA. Dimension 16 also scores control exposure: a section that
flattens a control `theme.json` enables (`FW-7`) = **major**; an archetype-order
mismatch or unapproved extra section (`IA-1`/`FW-1`) = **major**.

**Measured proof for COLOR and A11Y.** The contrast (`COLOR-2`/`COLOR-8/9`) and
target-size/focus (`A11Y-*`) checks are no longer manual-only gaps. Run
`npm run a11y:check -- --url <staging>` (axe-core at all three viewports) and fold
its findings in as **Tool proof**, mapping axe impact to the canonical severity
(`critical -> blocker`, `serious -> major`, `moderate -> minor`, `minor -> nit`).
Prefer the axe Tool proof over an eyeballed judgment for the same dimension. The
CWV (`CWV-*`) dimension stays a documented manual gate this pass; a future
`tools/cwv-audit.mjs` hook will measure it.

**Overall score and band.** Score each of the 16 dimensions (`pass = 1`,
`minor = 0.5`, `major = 0`, `blocker = 0`); the percentage is `sum / 16`. The
**band is set by the worst severity present**, not the percentage:

- **strong** — no major, no blocker (at most a couple of minors; score ≥ 0.94).
- **acceptable** — minors only.
- **needs-revision** — at least one major, no blocker.
- **blocked** — at least one blocker.

**Any blocker forces `needs-revision` regardless of score (fail closed).** For an
**offline-only** run, dimensions whose proof needs staging (overflow, real AA
contrast, interaction, focus/target size) are marked **DEFERRED** — not `pass` —
and the band is capped at `acceptable-pending-staging` (never `strong`/`approved`)
until staging proof lands.

## Proof Gates

- Read the composed markup and blueprint for static rule checks (heading count;
  one section token per section; approved patterns; no `core/html`; tokens only;
  placeholder alt/dims; archetype order matches the page archetype with required
  sections present and no extras, `IA-1`/`FW-1`; background sequence obeys
  `COLOR-6/7/8`; each section preserves its `theme.json`-enabled controls,
  `FW-7`). Run `npm run validate`.
- Capture desktop (1440), tablet (768), mobile (390) screenshots of the full
  page and each key section on a cache-busted staging URL; run
  `npm run pattern:proof` for overflow/console/dimension assertions where a URL
  and selector are available.
- Capture required interaction states (header/nav open+closed, hover, overlays,
  accordions).
- Tool proof: run `npm run a11y:check -- --url <staging>` (axe-core at all three
  viewports) and fold its findings in as measured **Tool proof** for the COLOR
  (contrast) and A11Y (target-size/focus) dimensions.
- Cross-skill proof: run `accessibility-review` (contrast/keyboard/focus),
  `seo-auditor` (title/meta/H1/heading order/schema fit), and `visual-qa`
  (token spacing/overflow/responsive) and fold their results into the matching
  dimensions.
- Write a `Proof Summary` using the canonical labels, never renamed: **Static
  proof / Staging proof / Visual proof / Interaction proof / Editor-control proof
  / Tool proof / Manual-only gaps**. Use `n/a` for an inapplicable label; never
  drop one. `Tool proof` lists the axe JSON artifact path and any other machine
  evidence. Findings conform to `data/review-finding.schema.json`.

## Cross-Skill Merge

`layout-review` owns the deterministic merge. Because every review skill emits
the one finding shape in `data/review-finding.schema.json`, fold
`accessibility-review`, `seo-auditor`, and `visual-qa` (plus the axe Tool proof)
into this score using the "Cross-skill merge" rules in
`docs/agent-quality-standard.md`:

- **Worst-severity-wins** on the same `(rule_id, target)`: dedupe across skills
  and keep the maximum severity.
- **Map each merged finding to its parent dimension:** axe contrast ->
  **COLOR** (dim 7); axe target-size/focus -> **A11Y** (dim 15); seo H1/heading
  -> **HEAD** (dim 10); thin content / `COVERAGE-*` -> the content/conversion
  dimension (**CONV**, dim 8); visual-qa overflow/console -> the grid dimension
  (**GRID**, dim 5). The dimension's status takes the worst merged severity, and
  the existing worst-severity-wins rule then computes the overall band.

## Failure Policy

Fail closed. Report `needs-revision` (or `blocked`) when proof is incomplete or
any blocker fires: missing desktop/tablet/mobile screenshots, missing
interaction evidence, wrong selector targeting, console errors, horizontal
overflow, AA contrast failure, zero/multiple H1, an unapproved pattern, an
arbitrary value, `core/html`, or a staging version mismatch. Name the missing
proof and the rule IDs. Do not soften a blocker to a minor to reach a passing
score.

## Feedback Loop

The primary output is a prioritized fix list fed back to `layout-architect`.
Findings conform to `data/review-finding.schema.json`.

- **Bounded loop — max 2 rounds** (see "Bounded feedback loop" in
  `docs/agent-quality-standard.md`). Round 1 scores and emits fixes; round 2
  verifies the fixes. `layout-architect` applies fixes and re-submits; round 2
  re-scores only the affected dimensions plus a regression pass.
- **Recurring-blocker rule:** if a finding with the same `rule_id` + `target`
  reappears after a fix, do NOT open round 3. Escalate the band to `blocked` and
  route the root cause upstream (`layout-architect` / `pattern-builder` /
  `seo-strategist`) with the evidence.
- `dismissed[]` is the authoritative do-not-re-flag set; round 2 must exclude
  those ids. Otherwise loop until band is `strong` or `acceptable` and no blocker
  remains.
- **Block-level fix requests:** when a finding's root cause is a block/pattern or
  theme property — not a per-page composition choice — file a fix request to
  `pattern-builder` (pattern markup, CSS, or token) instead of patching the page.
  Stacking-only defects belong here: a `SPACE-7` base-colored seam between bands,
  a pattern's default margin fighting its neighbor, or an integral background that
  misbehaves when stacked. These are invisible in single-pattern QA, so
  `layout-review` is where they are caught and routed. Include the offending
  pattern slug(s), the composed evidence, and the proposed block/theme fix.
- **Standard/skill improvement suggestions (secondary):** when the same class of
  miss recurs across pages, or a real gap in `docs/layout-standard.md` is found,
  record a proposed rule/skill update in the report. Changing a theme-wide
  layout rule or the standard is an **approval gate** (see `CLAUDE.md`) — propose
  it; do not edit the standard without explicit approval.

## Report

Include scope (page + archetype), the dimension scorecard with status + rule
IDs, the overall score/band, the prioritized fix list fed back to
`layout-architect`, cross-skill results, `Proof Summary`, screenshot paths,
cache-busted staging URL, manual-only gaps, any approval-gated standard-
improvement suggestions, and the approval status. Use `approved` only when no
blocker remains, every dimension is pass/minor, and proof exists.

## Execution Model — Agents And Model Tiers

For a full page, run as a multi-agent fan-out (mirrors `.claude/workflows/visual-qa.js`).
Keep it site-agnostic — discover target, version, and staging at runtime.

| Stage | Model | Why |
| --- | --- | --- |
| **Discover** — read blueprint + composed markup, version, staging readiness, patterns used | Haiku | Mechanical read/parse. |
| **Review** (one agent per dimension) — score against the rule IDs, capture/inspect screenshots, run the matching cross-skill | Sonnet | Vision + checklist reasoning at fan-out scale. |
| **Verify** (one agent per finding) — adversarially refute the finding against the composed source | Opus | Kills false positives before the report. |
| **Synthesize** — dedupe, score dimensions, compute band, write the report + feedback list | Opus | Cross-finding judgment + durable write-up. |

## Handoff Contract

Stages pass validated JSON, not prose. Findings conform to
`data/review-finding.schema.json`.

```jsonc
// Discover -> Review
{ "page": "home", "archetype": "home", "version": "0.1.x",
  "blueprint": "docs/layouts/home-blueprint.md",
  "composed": "<markup path or page id>",
  "stagingUrl": "<cache-busted url>", "stagingReady": true,
  "patternsUsed": ["<theme>/hero-simple", "..."],
  "backgroundSequence": ["base", "surface", "base", "..."] }

// Review -> Verify (per dimension)
{ "dimension": 10, "name": "heading-hierarchy", "status": "blocker",
  "findings": [ { "id": "h1-1", "rule_id": "HEAD-1", "dimension": "HEAD",
                  "severity": "blocker", "breakpoint": "all",
                  "target": { "slot": "section-page-intro" },
                  "evidence": "2 H1s (hero + page-intro)",
                  "suspected_source": "section-page-intro",
                  "recommended_fix": "Demote intro to h2",
                  "status": "open" } ] }

// Verify -> Synthesize (per finding)
{ "id": "h1-1", "verdict": "real", "reasoning": "...", "sourceConfirmed": true }

// Synthesize handoff (loop control)
{ "band": "needs-revision", "round": 1, "escalated_upstream": false,
  "dismissed": ["..."] }
```

Rules: every finding carries a stable `id` and a `rule_id` so verify verdicts and
feedback map back 1:1; the `target` object holds `file`/`slot`/`selector`; only
`real` findings reach the report; dismissed ones are listed as "considered and
dismissed" so the next run does not re-flag them. The synthesize handoff carries
`round` and `escalated_upstream` so the bounded loop terminates at 2 rounds.
