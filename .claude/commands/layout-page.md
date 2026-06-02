---
description: Compose a full Supersonic page layout from approved patterns, following the proof-first framework build loop.
---

Compose a full page layout from approved Supersonic patterns: $ARGUMENTS

Example: `/layout-page service` or "Compose the home page layout".

Work on exactly one page. Follow `CLAUDE.md`, `docs/agent-quality-standard.md`,
`docs/layout-standard.md`, and `.claude/skills/layout-architect/SKILL.md`. This
is site-agnostic: read site facts at runtime and never modify site-memory docs
(`SITE.md`, `BRAND.md`, `PAGE_MAP.md`, `CONTENT_MODEL.md`, `SEO_STRATEGY.md`).

1. Read `CLAUDE.md`, `docs/layout-standard.md`,
   `docs/gutenberg-authoring-standard.md`, `docs/design-tokens-standard.md`,
   `BRAND.md`, `PAGE_MAP.md`, `CONTENT_MODEL.md`, `SEO_STRATEGY.md`, and
   `DESIGN_SYSTEM.md`.
2. Discover the page intent/archetype from `PAGE_MAP.md`, the available patterns
   in the theme `/patterns` folder, and which are `approved` in
   `data/pattern-certifications.json`. Check `git status --short` first.
3. Write the Layout Blueprint contract card before composing any markup. Cite the
   controlling rule IDs from `docs/layout-standard.md` for each per-section
   decision. Resolve only real product/brand/conversion tradeoffs with the user.
4. Confirm every archetype pattern exists and is approved. Route any missing or
   unapproved pattern to `pattern-builder` (approval-gated); do not invent
   bespoke section markup.
5. Compose the page from approved patterns, customizing each section per instance
   (content, background role, alignment) without forking structure (`FW-3`); keep
   header/footer/nav as referenced template parts. Set one `section-*` spacing
   token per section; plan the background rhythm from the Pattern Background Role
   table (alternate neutral `base`↔`surface`/`muted` with no two identical
   neutrals adjacent, keep integral backgrounds fixed, punctuation bands set
   readable text — `COLOR-6/7/8`); semantic color roles with readable foregrounds;
   left-aligned body (center only short runs); role→preset typography; exactly one
   H1 in the first hero/intro; primary solid `accent` CTAs repeated at decision
   points; preserve each section's editor controls (`FW-7`); and contextual
   internal links with descriptive anchors.
6. Fill every image slot with a `placehold.co` placeholder using brand-palette
   hex, the slot aspect ratio as `width`/`height`, and real descriptive alt text.
7. Plan structured data per page type and confirm the content it needs is
   present; do not emit JSON-LD (that is the plugin/Rank Math/SEO layer). No
   `core/html`, arbitrary sizes, colors, spacing, radii, or shadows.
8. Run `npm run validate` and fix failures.
9. Hand off to `layout-review` for scored visual/responsive/interaction proof,
   then fix only what it flags by rule ID and re-review.
10. Include a `Proof Summary` in the report. If proof is missing, fail closed
    with `needs-revision`; do not approve. Do not run live REST writes or deploy
    without a dry-run and explicit approval.
