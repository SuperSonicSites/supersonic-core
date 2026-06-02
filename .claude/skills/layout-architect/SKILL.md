---
name: layout-architect
description: Use when composing or designing a full page layout from approved Supersonic patterns, including requests like "lay out the home page", "compose the homepage/service/about/contact/pricing page", "build a page layout", "assemble a page from sections", or "do the Phase 7 page assembly". Reads brand, sitemap, content model, SEO strategy, and design tokens, then produces a reviewable Layout Blueprint and composes the page from approved patterns with per-section spacing, color, alignment, placeholder imagery, one H1, a structured-data plan, and internal links. Not for building a single section (use pattern-builder) or project setup (use new-site-init).
---

# Layout Architect Skill

Use this skill when composing a full page layout from the framework's approved
patterns. It is the page-assembly layer above `pattern-builder`: `pattern-builder`
builds one section; `layout-architect` decides which sections a page needs, in
what order, with what per-block specs, and composes them by reference.

This skill is **site-agnostic**. Discover the site's facts at runtime from repo
docs; never hardcode a business name, URL, color, or page list, and never modify
site-memory docs.

Build to `docs/layout-standard.md` (the rule catalog and page archetypes) and
also follow `docs/agent-quality-standard.md`, `docs/gutenberg-authoring-standard.md`,
and `docs/design-tokens-standard.md`.

## Discovery

Before composing, inspect repo facts — do not ask the user for what the repo
answers:

- `CLAUDE.md`, `README.md`, `SITE.md` (read-only context).
- `BRAND.md` (voice, visual direction), `PAGE_MAP.md` (sitemap, nav, reusable
  CTAs, internal-link plan), `CONTENT_MODEL.md` (what content exists),
  `SEO_STRATEGY.md` (keywords, intents, internal-linking rules, schema
  opportunities), `DESIGN_SYSTEM.md` (token palette).
- `data/seo-briefs.json` when present — the `seo-strategist` brief for this page:
  authoritative `seo_title`/`meta_description`, the H1/heading outline, the
  internal-link matrix, and the structured-data plan. Realize this structure; do
  not rewrite the SEO metadata (titles/meta/schema are owned upstream by
  `seo-strategist`).
- `docs/layout-standard.md` (archetypes + rules), `docs/gutenberg-authoring-standard.md`,
  `docs/design-tokens-standard.md`.
- The theme `/patterns` folder and `data/pattern-certifications.json` — the
  available patterns and which are `approved`.
- `git status --short`; preserve unrelated local work.

Determine the page and its **intent/archetype** from `PAGE_MAP.md`. Ask the user
only for real product/brand/conversion tradeoffs the docs leave open (e.g. which
of two services this landing page targets, or which CTA is primary) — not for
facts already written down.

## Contract

Write a **Layout Blueprint** card before composing any markup:

```text
Page:
Intent / archetype:
Primary conversion / secondary actions:
Market + audience notes (from BRAND.md / SEO_STRATEGY.md):
Section order (pattern slug -> the one job each section does):
Background sequence (section -> role; integral pinned; punctuation marked) [COLOR-6/7/8]:
H1 owner section (exactly one):
Per-section spec (section-spacing token, color role, text alignment,
  justification/align-items, CTA role, image slots):
Per-section exposed controls (controls each section preserves; ref ownership matrix) [FW-7]:
Archetype-order check (order == archetype; required sections present; no extras):
Placeholder images (slot -> placehold.co URL + alt + WxH):
Internal links (source phrase -> target page, descriptive anchor):
Structured-data plan (page-type -> recommended types; emission deferred to plugin/SEO):
Approved-pattern check (every slug exists + approved? gaps -> pattern-builder):
Expected proof:
Manual-only gaps:
```

The blueprint is the contract `layout-review` grades and the artifact a human
approves before staging. Each per-section decision must cite the controlling
rule(s) from `docs/layout-standard.md` (e.g. `SPACE-1`, `ALIGN-2`, `CONV-1`).

## Compose

- Order sections from the archetype in `docs/layout-standard.md` for the page
  intent; omit sections that have no job, add only sections with a clear job.
- Insert each one-off page section from its approved pattern and customize it per
  instance — content, background role, alignment, and the controls it exposes —
  without forking the pattern's structure into bespoke markup (`FW-3`). Keep
  reusable components (header/footer/nav) as referenced template parts.
- Plan the background rhythm from the Pattern Background Role table: alternate
  flexible neutrals `base`↔`surface`/`muted` (no two identical neutrals adjacent),
  keep integral backgrounds fixed, and use accent/dark/gradient bands as sparse
  punctuation that set readable text (`COLOR-6/7/8/9`). Record the sequence.
- Set each block's spec from the Block-Spec Decision Guide: one `section-*`
  spacing token per section, semantic color role with a readable foreground,
  left-aligned body / centered only for short runs, native-control justification
  the pattern truly exposes, role→preset typography, primary solid `accent` CTA
  repeated at decision points. Preserve every control the section legitimately
  exposes (`FW-7`).
- Place exactly one H1 in the first hero or `section-page-intro` (`HEAD-1/2`).
- Fill every image slot with a `placehold.co` placeholder using brand-palette
  hex, the slot's aspect ratio as `width`/`height`, and real descriptive alt
  text (`IMG-*`, Placeholder Image Spec in the standard).
- Plan structured data per page type and ensure the content it needs is present;
  **do not emit JSON-LD** — that is the plugin/Rank Math/SEO layer (`SD-*`).
- Add contextual internal links per `SEO_STRATEGY.md` / `PAGE_MAP.md` with
  descriptive anchors (`LINK-*`).

## Delegation

If the archetype needs a pattern that does not exist or is not `approved` in
`data/pattern-certifications.json`, **stop and route it to `pattern-builder`**
with a precise control contract — do not invent bespoke section markup here.
Resume composing once that pattern is built and approved. Verify any delegated
work against the proof gates before accepting it.

## Proof Gates

Use the cheapest proof that verifies each claim.

- Static proof: `npm run validate` passes. The composed page uses only patterns
  present and `approved` in `data/pattern-certifications.json`; exactly one H1;
  one `section-*` token per section; no `core/html`; no arbitrary
  spacing/type/color/radius/shadow/gradient values; every placeholder has alt
  text and explicit `width`/`height`.
- Archetype-order proof: the composed section order matches the page archetype in
  `docs/layout-standard.md`; required sections present; no unapproved extras
  (`IA-1`, `FW-1`). Record the ordered slug list and the archetype checked.
- Background + control proof: the background sequence obeys `COLOR-6/7/8` (no two
  identical neutrals adjacent; integral backgrounds untouched; colored/dark bands
  set readable text); each section preserves its `theme.json`-enabled controls
  (`FW-7`).
- Composition proof: sections are inserted from approved patterns and customized
  per instance (`FW-3`), not forked into bespoke markup; the blueprint maps 1:1
  to the composed page.
- Visual / interaction / responsive proof: produced by `layout-review` (desktop,
  tablet, mobile screenshots and interaction states on staging). Do not
  self-certify visual outcomes — hand off and verify the returned report.
- Staging proof: any live page write goes through the gated REST QA-page flow
  with a dry-run and explicit approval, on a `staging.*` host, `noindex`
  (`FW-5`).
- Report a `Proof Summary` (shape from `docs/agent-quality-standard.md`): Static
  proof / Staging proof / Visual proof / Interaction proof / Editor-control proof
  / Manual-only gaps.

## Failure Policy

Fail closed when evidence is incomplete; use `needs-revision`, not `approved`.

- Zero or multiple H1s, a referenced pattern that is missing or unapproved,
  arbitrary values, `core/html`, or a placeholder without alt/dimensions →
  `needs-revision`.
- A needed pattern does not exist or is not approved → stop and delegate to
  `pattern-builder`; never fabricate section markup.
- Never modify `SITE.md` or any site-memory doc from a layout task — they are
  inputs (`FW-6`).
- Never push to staging without a dry-run and approval; never deploy to
  production.

## Report

Every layout report includes:

- scope (page + intent/archetype)
- the Layout Blueprint card
- files created/changed (blueprint artifact and composed-page markup location)
- `Proof Summary` (static, staging, visual via layout-review, manual-only gaps)
- the approved-pattern check and any patterns routed to `pattern-builder`
- the structured-data plan and internal-link plan
- screenshots if already captured, or a note that `layout-review` is the next
  step
- known issues / manual-only gaps and the next recommended step (run
  `layout-review`, then fix only what it flags)

## Workflow

1. Read the inputs in Discovery; determine page + intent + archetype.
2. Write the Layout Blueprint card; resolve real tradeoffs with the user only.
3. Confirm every archetype pattern exists and is approved; delegate gaps to
   `pattern-builder`.
4. Compose the page by referencing patterns; set each block's spec; place one
   H1; fill placeholders; plan schema; add internal links.
5. Run `npm run validate`; fix static failures.
6. Hand off to `layout-review` for scored visual/responsive/interaction proof.
7. Fix only what `layout-review` flags (by rule ID); re-review.
8. Report; request approval before any staging write or commit.
