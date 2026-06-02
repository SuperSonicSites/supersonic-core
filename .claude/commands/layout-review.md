---
description: Grade a composed Supersonic page layout against the layout standard and feed rule-ID fixes back, proof-first.
---

Grade a composed page layout and drive its revision: $ARGUMENTS

Example: `/layout-review service` or `/layout-review docs/layouts/sample-service-page.html`.

Review only; never deploy. Follow `CLAUDE.md`, `docs/agent-quality-standard.md`,
`docs/layout-standard.md`, and `.claude/skills/layout-review/SKILL.md`. This is
site-agnostic: discover the target, staging URL, and inputs at runtime.

1. Read `docs/layout-standard.md`, the `layout-architect` Layout Blueprint and
   the composed-page markup, `PAGE_MAP.md`, `SEO_STRATEGY.md`, `BRAND.md`, and
   `DESIGN_SYSTEM.md`. Read `package.json` version and the latest
   `docs/reports/*`.
2. Define the review contract: the page intent/archetype, the rubric dimensions,
   which findings are gating blockers, the cache-busted staging URL, the
   selectors for the full page and key sections, and the interaction states to
   capture.
3. Static proof: check heading count (exactly one H1), one `section-*` token per
   section, only approved patterns, no `core/html`, tokens only, placeholder
   alt/dimensions, archetype order (required sections present, no extras), the
   background sequence (`COLOR-6/7/8`), and control exposure (`FW-7`) against the
   source. Run `npm run validate`.
4. Visual proof: capture desktop (1440), tablet (768), and mobile (390)
   screenshots of the full page and key sections; run `npm run pattern:proof`
   for overflow/console/dimension assertions. Capture interaction states.
5. Cross-skill proof: run `accessibility-review` (contrast/keyboard/focus),
   `seo-auditor` (title/meta/H1/heading order/schema fit), and `visual-qa`
   (token spacing/overflow/responsive); fold results into the matching
   dimensions.
6. Score each of the 16 dimensions (pass/minor/major/blocker) citing rule IDs,
   then compute the overall band with the explicit formula in
   `.claude/skills/layout-review/SKILL.md` (any blocker forces `needs-revision`;
   offline-only runs mark staging-dependent dimensions DEFERRED and cap at
   `acceptable-pending-staging`).
7. Produce the prioritized fix list (rule ID, severity, breakpoint, evidence,
   suspected source, recommended fix) and feed it back to `layout-architect`.
   Re-score affected dimensions after fixes.
8. Record any recurring-gap standard/skill improvement suggestion as a proposal
   only — changing the standard is an approval gate.
9. Include a `Proof Summary`. Fail closed with `needs-revision` if proof is
   incomplete or any blocker fires; use `approved` only when no blocker remains
   and proof exists.
