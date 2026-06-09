# Supersonic Layout Standard

This document is the source of truth for **page-level layout** in the Supersonic
framework: how to compose a full page from approved patterns, and how that page
is judged. It is **site-agnostic** — it defines rules, not a specific site's
pages. The `layout-architect` skill builds to this standard; the `layout-review`
skill grades against it. Both cite the rule IDs below.

It complements, and does not replace:

- `docs/gutenberg-authoring-standard.md` — native-blocks-first authoring and
  modularity (compose from patterns by reference).
- `docs/design-tokens-standard.md` — the token vocabulary (spacing, type, color,
  radius, shadow) every rule here reuses.
- `docs/agent-quality-standard.md` — contract-first, proof-first, fail-closed.

Layout decisions reuse existing tokens and patterns. This standard adds no new
tokens, patterns, or shadow presets; introducing any of those is an approval
gate (see `CLAUDE.md` → Human Approval Gates).

## How To Use

1. Identify the page and its **intent** (home, service, landing, about, contact,
   pricing, blog/article, FAQ, local). Intent selects the archetype.
2. Read the site inputs (`BRAND.md`, `PAGE_MAP.md`, `CONTENT_MODEL.md`,
   `SEO_STRATEGY.md`, `DESIGN_SYSTEM.md`) — never edit them.
3. Compose the page from **approved, registered patterns** (the archetype gives
   the order). Set each block's spec from the Block-Spec Decision Guide.
4. Prove the result against the rule catalog. `layout-review` scores each
   dimension and feeds prioritized, rule-ID-tagged fixes back.

## Rule ID Scheme

Rules are grouped by dimension and stable-numbered (`IA-1`, `SPACE-3`, …). QA
findings must cite the rule ID so fixes map back 1:1 and the standard stays
auditable. Recency-sensitive rules carry an inline date flag.

Severity convention for review: **blocker** (fails approval), **major**,
**minor**, **nit**.

---

## 1. Information Architecture & Section Order — `IA`

- **[IA-1]** Each page has exactly one intent and one primary conversion. Choose
  the archetype that matches the intent (see Page Archetypes).
- **[IA-2]** Each section does one job and communicates one idea. A reader should
  be able to summarize every section in a sentence.
- **[IA-3]** Default conversion sequence for long-form pages: hero → social proof
  → problem → benefits → features → how-it-works → detailed proof → pricing →
  FAQ → final CTA → footer. Adapt the set by intent; do not pad with sections
  that have no job.
- **[IA-4]** Lead with problem/benefit (outcomes) before features (mechanics).
- **[IA-5]** Place compact social proof high (logos/ratings near the hero) and
  detailed proof deep (attributed testimonials/stats near pricing/CTA).
- **[IA-6]** Dedicated landing pages (paid traffic) are single-goal: strip
  competing navigation, keep an attention ratio near 1:1, and match the hero
  headline to the ad/source message.
- **[IA-7]** Home pages are hubs, not funnels: keep global navigation and offer
  multiple paths into deeper pages.

## 2. Visual Hierarchy & Scanning — `HIER`

- **[HIER-1]** Put the value proposition and the primary CTA in the first
  viewport. Attention concentrates at the top (~57% of viewing time is above the
  fold; >65% in the top 40% of the page).
- **[HIER-2]** Engineer the "layer-cake" scan pattern: every section starts with
  a descriptive, scannable heading so a skimmer hitting only headings still
  understands the page.
- **[HIER-3]** Lead headings with the most information-bearing words (users often
  read only the first two words of a heading).
- **[HIER-4]** Establish hierarchy with size **and** weight **and** color — not
  size alone. The page must still read as hierarchical in grayscale.
- **[HIER-5]** One dominant focal point per section. If everything is emphasized,
  nothing is.
- **[HIER-6]** Do not create a "false floor" — a first viewport that looks
  complete and suppresses scrolling. Let content peek above the fold.
- **[HIER-7]** Use background segmentation to reinforce the layer-cake scan
  (`HIER-2`), not to decorate. A background-role change must coincide with a real
  section boundary, and contrast across that boundary must stay AA (`COLOR-3`).
  See the alternating-background rhythm in `COLOR-6` and the Pattern Background
  Role table.

## 3. Spacing & Rhythm — `SPACE`

- **[SPACE-1]** Every section group sets exactly one semantic section-spacing
  token on the vertical axis: `section-none`, `section-small`, `section-medium`,
  or `section-large`. Default content sections use `section-medium`; heroes and
  final CTAs use `section-large`.
- **[SPACE-2]** Never set section left/right padding. Horizontal inset is the
  theme's 5% root gutter (`gutter`); patterns own vertical rhythm only.
- **[SPACE-3]** Internal spacing < external spacing. Space within a group (a
  label and its input, a card's interior) is tighter than the space between
  groups. Use primitive spacing tokens (`2-xs`…`4-xl`) for internal gaps, card
  padding, and button-group spacing.
- **[SPACE-4]** Snap all spacing to the token scale; no arbitrary values. Custom
  spacing is disabled in the editor by design.
- **[SPACE-5]** Keep vertical rhythm consistent — reuse the same section token
  for sibling sections unless a transition deliberately needs more air.
- **[SPACE-6]** Marketing sections should breathe; do not import dashboard-level
  density onto a landing or home page.
- **[SPACE-7]** Adjacent full-width section bands **butt together** — no
  base-colored margin or seam between two colored bands. Vertical rhythm comes
  from each part/section's own padding, never from inter-section
  margin/block-gap. A base-colored seam between, e.g., a `muted` band and a
  `surface` band is a defect. The theme's root block-gap produces this seam at
  **two layout levels**, both of which must be zeroed: (1) the page wrapper —
  between the `.wp-site-blocks` siblings `header` / `main` / `footer` (the seams
  at the very top and bottom of the page), and (2) inside `main` — between the
  stacked section patterns (`.wp-block-post-content` children). **This defect is
  invisible when a pattern is reviewed alone and only appears once sections are
  stacked**, so it is caught at layout review (composed), not single-pattern QA,
  and its root-cause fix belongs at the block/theme level — `layout-review` files
  the fix request to `pattern-builder` (see Proof & Review).

## 4. Alignment, Justification & Measure — `ALIGN`

- **[ALIGN-1]** Body copy is left-aligned, ragged right. Never justify body text
  (`text-align: justify`) — it creates rivers of whitespace and slows reading.
- **[ALIGN-2]** Center text only for short runs (≤2–3 lines): headings,
  single-line subheads, short hero copy, buttons, captions. Never center a
  multi-line paragraph or a left-aligned list.
- **[ALIGN-3]** Cap the reading measure at ≤75 characters per line (~66 ideal;
  hard max 80, WCAG 1.4.8). Text-heavy content uses the `narrowWidth` (760px)
  rail — within the recommended 700–800px reading column. Body text never runs
  the full 1440px container on large screens.
- **[ALIGN-4]** Keep a consistent alignment axis within a section. Do not stack a
  centered heading over a left-aligned list over a centered button — the ragged
  optical edges read as broken.
- **[ALIGN-5]** Flex/grid intent: `justify-content` distributes on the main axis,
  `align-items` positions on the cross axis. Header rows use space-between +
  center; centered hero content uses center + center; equal-height card rows use
  `align-items: stretch` (the default) so cards match height.
- **[ALIGN-6]** A pattern's exposed justification control must visibly move
  content. For simple heroes, the section group owns the 760px rail and
  `justifyContent` so left/center/right is real (see gutenberg-authoring-standard
  hero contract). Do not promise an alignment control the layout cannot honor.

## 5. Grid & Responsive Layout — `GRID`

- **[GRID-1]** The layout shell is the 1440px container (`maxWidth`); the reading
  column is 760px (`narrowWidth`). Backgrounds and hero media may go full-width;
  text and primary content stay constrained.
- **[GRID-2]** Author mobile-first. Column counts degrade desktop 3–4 → tablet 2
  → mobile 1. Multi-column text never survives to mobile — columns stack.
- **[GRID-3]** Review at the framework breakpoints: desktop 1440px, tablet 768px,
  mobile 390px. No horizontal overflow at any breakpoint (scrollWidth ≤
  clientWidth + 1px).
- **[GRID-4]** Use `core/columns` for row layouts and card grids; reserve nested
  groups for real content-width purposes (do not add constrained groups solely
  to fake a gutter — that adds a redundant `has-global-padding` layer).
- **[GRID-5]** Drop to a single column whenever a card would fall below ~280–320px
  wide or text would exceed the measure.

## 6. Typography — `TYPE`

- **[TYPE-1]** Use the type-scale presets only (`small`, `body`, `large`,
  `heading-3`, `heading-2`, `heading-1`, `display`). No arbitrary font sizes.
- **[TYPE-2]** Map roles to presets: page H1 → `heading-1` (or `display` for
  editorial heroes); section heading → `heading-2`; card/subsection heading →
  `heading-3`; lead/intro paragraph → `large`; body → `body`; eyebrow/caption →
  `small`.
- **[TYPE-3]** The H1 must clearly dominate — roughly 2–3× body size. The preset
  scale already encodes this; do not flatten it.
- **[TYPE-4]** Line height: body `1.6`; headings tight (`1.05`–`1.15`). Letter
  spacing `0` unless brand rules require otherwise.
- **[TYPE-5]** Heading level is semantic, not visual. Choose the level by document
  structure (see `HEAD`), then style size with the preset — never pick a heading
  level to get a font size.
- **[TYPE-6]** Limit families to the theme's defined faces (heading + body). Do
  not introduce new typefaces without approval.

## 7. Color & Contrast — `COLOR`

- **[COLOR-1]** Use semantic color roles only: `base` (page background),
  `contrast` (primary text), `contrast-subtle` (secondary text), `surface` /
  `muted` (elevated/soft bands), `border`, `accent` (primary action + links),
  `accent-contrast` (text on accent). No one-off colors.
- **[COLOR-2]** Every section background change pairs with a readable foreground
  plan. Dark/accent bands set readable text color explicitly (see the
  gutenberg-authoring foreground contract).
- **[COLOR-3]** Text contrast ≥ 4.5:1 (normal) / ≥ 3:1 (large text ≥ 24px, or
  ≥ 18.66px bold). UI boundaries and focus indicators ≥ 3:1 (no rounding —
  2.99:1 fails). WCAG 2.2 AA.
- **[COLOR-4]** Never signal meaning by color alone (links, errors, states get
  text/icon/underline too). WCAG 1.4.1.
- **[COLOR-5]** `accent` is the link and primary-action color; `accent-contrast`
  is its on-color. Inline links and button links are separate color contracts —
  verify both on light and dark bands.
- **[COLOR-6]** Segment a long page with an **alternating background rhythm** so
  adjacent content sections are visually distinct. Treat `base` (white) and the
  **soft neutrals** (`surface`, `muted`) as the two sides of the rhythm and
  alternate `base` ↔ soft-neutral. **Hard sub-rule: never place two sections of
  the same side adjacent.** Because `surface` (#f7f8fa) and `muted` (#f1f3f5) are
  perceptually near-identical, they are the **same** side — putting `muted` next
  to `surface` reads as one undifferentiated band and is **not** a valid way to
  break a collision. When an integral soft-neutral band (`COLOR-7`) would sit next
  to another soft neutral, separate them with a `base` band, a punctuation band
  (`COLOR-8`), or an explicit section divider/border — not the other soft neutral.
  Precedence: an integral background is pinned and wins; the flexible neighbor
  yields to `base` (or a divider).
- **[COLOR-7]** Some patterns own their background as part of their design and
  must **not** be re-roled. Patterns whose default is `surface` with white
  (`base`) cards inside (`section-feature-grid`, `section-pricing-cards`) rely on
  the `surface`/`base` contrast to make cards read as elevated; forcing them to
  `base` erases the cards. Only patterns marked *flexible* in the Pattern
  Background Role table may be re-roled for rhythm.
- **[COLOR-8]** Accent and dark bands (`accent` → `cta-band`; `contrast` →
  `section-testimonial`) are deliberate **punctuation**, not part of the neutral
  alternation. Use them sparingly (typically 1–2 per page) at emphasis moments
  (final CTA, headline proof). Every punctuation band is a colored/dark section
  and **must set a readable text color on the same section group** — `accent`
  band → `accent-contrast` text; `contrast` band → `base` text — mirroring
  `COLOR-2` and the pattern foreground contract enforced in
  `validate-framework.mjs`. A punctuation band counts as a role change, so a
  neutral section may sit on either side of it.
- **[COLOR-9]** Approved gradient presets (`surface-rise`, `accent-veil`,
  `muted-soft`) may back hero, CTA, or punctuation bands for richer depth. Keep
  them on-token (no custom gradients), keep readable text on the same group
  (`COLOR-8`), and maintain AA contrast (`COLOR-3`). Segmentation comes from role
  changes, not from gradients on every section — use them sparingly.

### Pattern Background Role

Default background role per pattern, used to plan a page's color sequence.
*Flexible* roles may be re-roled to honor the rhythm (`COLOR-6`); *integral*
roles are pinned (`COLOR-7`); *punctuation* bands set readable text (`COLOR-8`).

| Pattern (slug) | Default role | Type | Notes |
|---|---|---|---|
| `header-*` / `footer-simple` | chrome (`muted` footer) | chrome | Outside the neutral rhythm. |
| `hero-simple` | `base` | flexible | First viewport (owns the H1). |
| `section-page-intro` | `base` | flexible | — |
| `section-text-image` / `section-image-text` | `base` | flexible | Re-role for rhythm. |
| `section-process-steps` | `base` | flexible | — |
| `section-service-cards` | `base` | flexible | Cards sit on the section background. |
| `section-comparison` | `base` | flexible | Nested panels own their own text color. |
| `section-faq-rankmath` | `base` | flexible | — |
| `cta-split` | `base` outer | flexible outer | Inner dark panel owns its text color; do not re-role the panel. |
| `section-feature-grid` | `surface` | integral | White cards need the `surface` ground (`COLOR-7`). |
| `section-pricing-cards` | `surface` | integral | White tier cards need `surface` ground. |
| `section-testimonial` | `contrast` (dark) | punctuation | Sets `base` text (`COLOR-8`). |
| `cta-band` | `accent` | punctuation | Sets `accent-contrast` text (`COLOR-8`). |
| All other section patterns | `base` (verify in source) | flexible unless integral | Read the pattern file and record its actual default before re-roling. |

Planning procedure: (1) lay sections in archetype order; (2) pin integral and
punctuation roles; (3) alternate flexible neutrals `base`↔`surface`/`muted` so no
two identical neutrals touch (`COLOR-6`), counting integral `surface` and
punctuation bands as role changes; (4) confirm every colored/dark band sets
readable text (`COLOR-8`); (5) record the final sequence in the Blueprint.

## 8. Conversion Design — `CONV`

- **[CONV-1]** One primary CTA per view, visually dominant: solid `accent` fill.
  Secondary actions are outline/ghost/text — never equal weight beside the
  primary.
- **[CONV-2]** Repeat the same primary action at decision points: hero, after
  benefits/features, after proof/pricing, and as the final CTA. Long pages get
  ≥3 CTA instances pointing at the same conversion.
- **[CONV-3]** Put trust signals next to friction — logos/ratings/guarantees
  adjacent to CTAs and forms.
- **[CONV-4]** Forms ask only what the first step needs: 3–5 fields for lead-gen;
  prefer a multi-step form over one long form. Every input has a visible label.
- **[CONV-5]** Reduce choice: one logical next step per view; avoid competing
  CTAs that cause decision fatigue (especially on landing pages, `IA-6`).

## 9. Semantic Structure & Landmarks — `SEM`

- **[SEM-1]** The page exposes exactly one `<main>`, one page-level `<header>`,
  and one `<footer>`. In this theme these come from the template + header/footer
  template parts; section patterns live inside `main`. Do not duplicate
  landmarks.
- **[SEM-2]** Build from native blocks so the output is semantic HTML. Never use
  `core/html` / Custom HTML for layout or design.
- **[SEM-3]** Use real lists (`core/list` → `<ul>`/`<ol>`) for menus, steps,
  feature lists, and breadcrumbs. Never fake a list with stacked groups or line
  breaks.
- **[SEM-4]** A grouped, headed region is a section with a heading; a styling-only
  wrapper is a plain group. Do not wrap content in extra constrained groups that
  imply structure they do not have.
- **[SEM-5]** `<nav>` is for major navigation only (primary nav, breadcrumb). Each
  navigation region has an accessible name. Header navigation interaction CSS
  stays scoped to `.supersonic-site-header`.
- **[SEM-6]** Prefer native semantic elements over ARIA roles; add roles only
  when a native element cannot express the semantics.

## 10. Heading Hierarchy — `HEAD`

- **[HEAD-1]** Exactly one H1 per page layout. QA fails a page with zero or
  multiple H1s. (Enforced for patterns by `npm run validate`: only hero and
  page-intro patterns carry an editable H1.)
- **[HEAD-2]** The H1 lives in the first hero or page-intro pattern and names the
  whole page.
- **[HEAD-3]** Do not skip heading levels going down (h1 → h2 → h3). Major
  sections are `h2`; items within them are `h3`. Returning up a level to start a
  new section is fine.
- **[HEAD-4]** Headings describe content, are meaningful, and are unique enough to
  navigate by. No empty headings; no heading used purely as a style hook.

## 11. Structured Data Planning — `SD`

The layout/theme layer **plans** structured data and ensures the page surfaces
the content the schema needs. It does **not** emit JSON-LD — emission is owned
by the site-core plugin / Rank Math / the SEO pass (theme = presentation, plugin
= functionality). Never hand-roll JSON-LD in a `core/html` block.

- **[SD-1]** Recommend the schema type(s) per page from the Page-Type →
  Structured-Data Plan map, and confirm the visible content exists to support
  them (NAP, breadcrumb trail, author, hours, etc.). Schema must match visible
  content.
- **[SD-2]** Local pages: ensure consistent NAP (name, address, phone) in the
  footer/contact, opening hours, and a map/area-served — the content a
  most-specific `LocalBusiness` subtype needs.
- **[SD-3]** Do **not** plan `HowTo` for rich results (deprecated 2023) and
  do **not** rely on `FAQPage` for rich results (Google retiring FAQ rich
  results through 2026). Build steps and FAQs as semantic HTML; in this
  framework FAQ schema, when needed, is owned by the approved `rank-math/faq-block`
  and must not be duplicated by a second FAQ schema source.
- **[SD-4]** Do **not** plan `WebSite` `SearchAction` / sitelinks searchbox
  (retired Nov 2024) or self-serving `aggregateRating`/`review` on the business's
  own `Organization`/`LocalBusiness`/`Product` (against Google policy).
- **[SD-5]** Articles/blog plan `BlogPosting` with a real author (`Person`) byline
  linking to a bio, plus `datePublished`/`dateModified` — surface that content in
  the layout. Breadcrumbs on all non-home pages.

## 12. Internal Linking — `LINK`

- **[LINK-1]** Anchor text is descriptive — never "click here", "read more", or a
  bare URL (also a WCAG 2.4.4 link-purpose requirement).
- **[LINK-2]** Place contextual in-content links to related/pillar pages where the
  topic is mentioned, following `SEO_STRATEGY.md` internal-linking rules and
  `PAGE_MAP.md` hierarchy — not only in nav/footer.
- **[LINK-3]** Breadcrumbs on all non-home pages (`<nav aria-label="Breadcrumb">`
  → `<ol>`), mirrored by a `BreadcrumbList` plan (`SD-1`).
- **[LINK-4]** Topic clusters: a pillar page links out to cluster pages; clusters
  link back up to the pillar and sideways to siblings.
- **[LINK-5]** No orphan pages — every page in `PAGE_MAP.md` has ≥1 inbound
  internal link. Keep important pages ≤3 clicks from home.
- **[LINK-6]** Links are real `<a href>` (native blocks), crawlable, not
  JS-only. Final CTAs link to the conversion page; no dead-end pages.

## 13. Imagery & Placeholders — `IMG`

- **[IMG-1]** Every image slot is a real `core/image` block that owns
  replacement, alt text, aspect/crop intent — never a styled empty group standing
  in for media.
- **[IMG-2]** During build, fill slots with `placehold.co` placeholders using
  brand-palette hex (see Placeholder Image Spec). Placeholders are staging
  mockups; real, optimized images replace them before production.
- **[IMG-3]** Set explicit width/height (or aspect ratio) on every image so the
  browser reserves space (prevents layout shift, `CWV-2`). Match the slot's
  aspect ratio.
- **[IMG-4]** Write real, descriptive alt text even for placeholders. Decorative
  images get empty `alt=""`; informative images describe their meaning;
  functional images describe the action/destination. No keyword stuffing.
- **[IMG-5]** Choose aspect ratios by slot: hero/banner 16:9, media-split 4:3 or
  3:2, card thumbnail 4:3 or 16:9, avatar/testimonial 1:1, logo ~3:1, icon 1:1.
  Keep one ratio per gallery/row.
- **[IMG-6]** Full-bleed images are for heroes and section bands; overlaid text
  keeps ≥4.5:1 contrast (add a scrim if needed). In-content explanatory images
  stay within the content column.

## 14. Core Web Vitals — `CWV`

Targets (75th percentile): **LCP ≤ 2.5s · CLS ≤ 0.1 · INP ≤ 200ms** (INP
replaced FID as a Core Web Vital on 12 Mar 2024).

- **[CWV-1]** Protect the LCP element. The hero image is a real, early
  `core/image` (so WordPress's automatic high-`fetchpriority` / no-lazy-load
  handling for the first large image applies). Never force lazy-loading on the
  hero.
- **[CWV-2]** Prevent layout shift: explicit media dimensions (`IMG-3`), reserved
  space for any embed/iframe, and no content injected above existing content
  after load.
- **[CWV-3]** Keep interactions cheap (INP): prefer native blocks and CSS-driven
  interactions (e.g. `core/details` accordions) over heavy custom JS. Custom
  blocks are an approval gate and a CWV risk.
- **[CWV-4]** Honor `prefers-reduced-motion: reduce` — disable non-trivial motion
  (parallax, autoplay, large transitions); use motion tokens, not one-off
  durations.

## 15. Accessibility (Layout) — `A11Y`

These overlap the `accessibility-review` skill; `layout-review` defers detailed
contrast/keyboard auditing to it and checks the layout-level rules here.

- **[A11Y-1]** Interactive targets ≥ 24×24 CSS px (WCAG 2.2 AA, new 2023); use
  44×44px for primary/mobile touch targets. Keep adequate spacing between small
  targets.
- **[A11Y-2]** Every interactive element has a visible focus indicator, and DOM
  order matches visual/reading order (do not reorder visually with CSS in a way
  that breaks focus order).
- **[A11Y-3]** Layout must reflow with no horizontal scrolling down to 320px and
  remain usable at 200% zoom; text must not clip when users increase line/letter
  spacing (use relative units, avoid fixed-height text containers).
- **[A11Y-4]** Forms have programmatic labels; links and buttons have discernible
  text; `<html lang>` is set.

## 16. Framework & Token Compliance — `FW`

- **[FW-1]** Compose only from approved, registered Supersonic patterns in the
  theme `/patterns` folder. No core, remote, or third-party patterns as page
  layout. The only approved external block is `rank-math/faq-block`.
- **[FW-2]** Prefer patterns whose `data/pattern-certifications.json` status is
  `approved`. If a layout needs a pattern that is unapproved or does not exist,
  stop and route it to `pattern-builder` (approval-gated) — `layout-architect`
  does not invent bespoke section markup.
- **[FW-3]** Compose pages from approved patterns, and keep reusable components
  canonical:
  - **Reusable components** (header, footer, nav — anything shared across pages)
    live as registered patterns and are composed **by reference** in templates
    and template parts (`<!-- wp:pattern {"slug":"<theme>/<slug>"} /-->`); the
    pattern file stays the single source of truth (see
    `docs/gutenberg-authoring-standard.md` → Modularity).
  - **One-off page sections** are inserted from an approved pattern and may be
    **customized per instance** — editable content, background role (within the
    Pattern Background Role table and `COLOR-6/7/8`), alignment, and the controls
    the pattern exposes. This expanded per-instance page markup is expected for
    page content and does not violate modularity.
  - **Forbidden:** forking a pattern's block *structure* into bespoke, non-token
    markup, or hand-authoring section markup the library does not provide — route
    structure gaps to `pattern-builder` (`FW-2`).
- **[FW-4]** Use tokens for all spacing, type, color, radius, shadow, and
  gradient. No arbitrary CSS values. Shadows only from approved presets (`soft`,
  `medium`, `strong`); gradients only from approved presets (`surface-rise`,
  `accent-veil`, `muted-soft`); no custom colors, sizes, or gradients.
- **[FW-5]** Staging QA pages are `noindex`, staging-only (`staging.*` host), and
  never reach production. Live REST writes require a dry-run + explicit approval.
- **[FW-6]** Do not modify site-memory docs (`SITE.md`, `BRAND.md`, `PAGE_MAP.md`,
  `CONTENT_MODEL.md`, `SEO_STRATEGY.md`) from a layout task — they are inputs.
- **[FW-7]** Each composed section must **preserve the editor controls**
  `theme.json` enables, so it stays editable after composition: palette
  background / text / link / button color, spacing presets (`section-*` plus the
  primitive scale), fluid typography presets, border color / radius / style /
  width, the shadow presets, and the approved gradient presets. Which block owns
  which control is defined once in `docs/gutenberg-authoring-standard.md` →
  *Editor Control Contracts* (outer section group owns background + section
  spacing; text blocks own typography + alignment; buttons own labels / URLs /
  colors; cards own surface / border / radius / shadow / padding; media owns
  replacement / alt / aspect). Do not duplicate that matrix — compose so those
  owners stay intact. Composition must not remove a control the pattern
  legitimately exposes, nor promise one it cannot honor (`ALIGN-6`).

---

## Page Archetypes

Section-order recipes expressed in the framework's approved patterns. Header and
footer are template-part mounts; the listed sections compose inside `main`. The
H1 is owned by the first hero or `section-page-intro`. Adapt to the page's real
content and `PAGE_MAP.md`; omit sections that have no job (`IA-2`).

| Intent | Section order (pattern slugs) | H1 owner | Notes |
|--------|-------------------------------|----------|-------|
| **Home** | `header-*` → `hero-*` → `section-logo-row` → (`section-feature-grid` or `section-service-cards`) → (`section-text-image`/`section-image-text`) → `section-stat-band` → `section-testimonial-grid` → (`cta-band` or `cta-split`) → `footer-simple` | hero | Hub: keep nav, multiple paths (`IA-7`). |
| **Service** | `header-*` → `hero-simple` → `section-page-intro` → `section-text-image` → `section-process-steps` → `section-feature-grid` → `section-testimonial` → `section-pricing-cards`* → `section-faq-rankmath` → `cta-band` → `footer-simple` | hero | Scoped to one service; problem→benefit→proof→FAQ→CTA. *if priced. |
| **Landing** (paid) | minimal `header-*` (logo-only) → `hero-centered` → `section-logo-row` → `section-feature-grid` → `section-stat-band` → `section-testimonial-grid` → `cta-split` → `footer-simple` | hero | Single goal, strip competing nav, ~1:1 attention ratio (`IA-6`). |
| **About** | `header-*` → `section-page-intro` → `section-text-image` → `section-stat-band` → (`section-card-row` or `section-feature-grid`) → `section-logo-row` → `cta-band` → `footer-simple` | page-intro | Narrative; lower CTA pressure; soft final CTA. |
| **Contact** | `header-*` → `section-page-intro` → `contact-map-info` → (`contact-form-simple` or `contact-simple`) → `section-faq-rankmath`* → `footer-simple` | page-intro | Lead with routing/answer; short form (`CONV-4`); NAP for local. |
| **Pricing** | `header-*` → (`hero-centered` or `section-page-intro`) → `section-pricing-cards` → `section-comparison` → `section-testimonial-grid` → `section-faq-rankmath` → `cta-band` → `footer-simple` | hero/intro | Highlight one recommended tier; FAQ handles billing objections. |
| **Blog / Article** | `text-page.html` (post-title H1) **or** `header-*` → `section-page-intro` → `section-text` → `section-testimonial`* → `cta-band` → `footer-simple` | post-title or page-intro | Breadcrumb (`LINK-3`); plan `BlogPosting` + `Person` author (`SD-5`). |
| **FAQ** | `header-*` → `section-page-intro` → `section-faq-rankmath` → `cta-band` → `footer-simple` | page-intro | FAQ schema via `rank-math/faq-block` only; no duplicate FAQ schema (`SD-3`). |
| **Local business** | Home archetype + `contact-map-info` with NAP/hours/map | hero | Plan most-specific `LocalBusiness` subtype; consistent NAP (`SD-2`). |

## Page-Type → Structured-Data Plan

**Plan only — the theme/layout never emits JSON-LD.** Recommend types, confirm
the content exists, and hand emission to the plugin / Rank Math / SEO pass.

| Page type | Recommended schema (plan) | Avoid |
|-----------|---------------------------|-------|
| Home | `Organization` (or `LocalBusiness` subtype) + `WebSite` + `WebPage` graph | `SearchAction`; self-review |
| Service | `Service` (+ provider, areaServed) + `WebPage` + `BreadcrumbList` | — |
| About | `AboutPage` + `Organization` + `Person[]` (team/author) | — |
| Contact | `ContactPage` + `Organization`/`LocalBusiness` (NAP, contactPoint) | — |
| Local / location | most-specific `LocalBusiness` subtype + `PostalAddress` + `geo` + `openingHoursSpecification` | self `aggregateRating`/`review` |
| Blog / article | `BlogPosting`/`Article` + `Person` author + `Organization` publisher + `BreadcrumbList` | — |
| Blog index / hub | `Blog`/`CollectionPage` + `BreadcrumbList` | orphan cluster pages |
| FAQ (page/section) | `FAQPage` via `rank-math/faq-block` — **optional, no rich result** | duplicate FAQ schema |
| Pricing | `WebPage` + `BreadcrumbList` (+ `Offer` only if a real product) | self-review |
| How-to content | semantic HTML `<ol>` steps — **no `HowTo`** | `HowTo` for Search |

## Placeholder Image Spec

Use `placehold.co` for every image slot during build. Pull hex from the active
`theme.json` palette (see `DESIGN_SYSTEM.md`; framework defaults shown): `accent`
`1f6feb`, `accent-contrast` `ffffff`, `surface` `f7f8fa`, `contrast-subtle`
`4b5563`, `muted` `f1f3f5`.

- **Format:** `https://placehold.co/{W}x{H}/{bgHex}/{fgHex}?text={Label}` — `+` for
  spaces, optional `.webp`/`.svg` suffix, optional `&font=roboto`.
- **On-brand emphasis (heroes, feature media):** `accent` bg + `accent-contrast`
  text, e.g. `https://placehold.co/1600x900/1f6feb/ffffff?text=Hero+Visual`.
- **Neutral (cards, secondary media):** `surface`/`muted` bg + `contrast-subtle`
  text, e.g. `https://placehold.co/600x400/f7f8fa/4b5563?text=Service`.
- **Dimensions match the slot aspect ratio (`IMG-5`)** and become the image's
  `width`/`height` so space is reserved (`IMG-3`, `CWV-2`):
  - Hero / banner 16:9 → `1600x900`
  - Media-split 4:3 → `800x600` (or 3:2 → `900x600`)
  - Card thumbnail → `600x400`
  - Avatar / testimonial 1:1 → `96x96`
  - Logo ~3:1 → `180x60`
  - Icon 1:1 → `64x64`
- **Always set descriptive alt text (`IMG-4`)** describing the intended real
  image, not "placeholder".

## Block-Spec Decision Guide

For each composed section, decide and record:

1. **Pattern** — the approved slug for the section's job (`FW-1`, `FW-2`).
2. **Section spacing** — one `section-*` token (`SPACE-1`); `section-large` for
   hero/final CTA, `section-medium` otherwise.
3. **Color role** — section background with a readable foreground (`COLOR-2`).
   Plan the sequence from the Pattern Background Role table: alternate flexible
   neutrals `base`↔`surface`/`muted` with no two identical neutrals adjacent
   (`COLOR-6`), keep integral backgrounds fixed (`COLOR-7`), and treat
   `accent`/`contrast`/gradient bands as sparse punctuation that set readable
   text (`COLOR-8/9`).
4. **Text alignment** — left for body/lists; center only for short hero/heading
   runs (`ALIGN-2`); consistent axis per section (`ALIGN-4`).
5. **Justification / align-items** — header space-between+center; centered hero
   center+center; card rows stretch (`ALIGN-5`); honor only controls the pattern
   truly exposes (`ALIGN-6`).
6. **Typography** — role→preset mapping (`TYPE-2`); one H1 placement (`HEAD-1/2`).
7. **Imagery** — slot aspect ratio + `placehold.co` fill + alt + dimensions
   (`IMG-*`).
8. **CTA** — primary solid `accent`, one per view, repeated at decision points
   (`CONV-1/2`).
9. **Links** — descriptive contextual links per `SEO_STRATEGY.md`/`PAGE_MAP.md`
   (`LINK-*`).
10. **Schema note** — type(s) this section's content supports (`SD-1`).
11. **Customization exposure** — the editor controls this section must keep
    editable (`FW-7`): background / text / link / button color, spacing,
    typography, alignment / justification, media replacement, radius, and shadow,
    per the control-ownership matrix in `docs/gutenberg-authoring-standard.md`.

## Copywriter Connection

After composition, `layout-architect` emits `data/page-compositions.json` — the
ordered patterns and instance counts per page. The `copywriter` skill joins this
manifest with each pattern's `copy_slots` in `data/pattern-certifications.json`
(per-slot role, length caps, and `sibling_group` balance rules) to derive the
per-page slot manifest for `data/copy-deck.json`. Every pattern with editable
body copy, CTA, or label copy must declare its `copy_slots` before the copywriter
can write for that pattern.

## Proof & Review

A composed layout is proven, not asserted. `layout-review` scores each dimension
above against the rule catalog, cross-checks `seo-auditor` (title/meta/H1/schema
fit), `accessibility-review` (contrast/keyboard/focus), and `visual-qa`
(token spacing, overflow, responsive screenshots), and **fails closed** when
proof is missing. Findings cite rule IDs and feed back to `layout-architect`.
See `docs/agent-quality-standard.md` for the Proof Summary shape.

Some defects only appear **once sections are stacked** — a base-colored seam
between two bands (`SPACE-7`), a too-tight boundary, or a pattern whose default
margin fights its neighbor. Single-pattern QA cannot see these because the
pattern is reviewed in isolation. `layout-review` is the first place they surface,
so when the root cause is a block/pattern (or theme) property rather than a
per-page composition choice, `layout-review` files a **block-level fix request to
`pattern-builder`** (pattern/CSS/token) instead of patching the one page — fixing
it once for every page that stacks those blocks.

## Sources

Layout / UX: Nielsen Norman Group (scrolling & attention, F-pattern, layer-cake,
alt text) — nngroup.com; Baymard Institute (line length, form fields) —
baymard.com; Refactoring UI (hierarchy, spacing, typography); CXL / Unbounce
(landing-page structure); MDN (flexbox alignment).

Semantic / SEO / schema: Google Search Central — developers.google.com/search
(title, snippet, canonical, links, structured data, HowTo/FAQ changes Aug 2023,
sitelinks searchbox Oct 2024, E-E-A-T); schema.org; MDN — developer.mozilla.org
(main/section/heading/lang/loading).

Accessibility: W3C WAI / WCAG 2.2 — w3.org/WAI (contrast 1.4.3, non-text contrast
1.4.11, target size 2.5.8, focus appearance 2.4.11, reflow 1.4.10, text spacing
1.4.12, link purpose 2.4.4).

Core Web Vitals: web.dev — web.dev/articles/vitals, optimize-lcp, optimize-cls,
inp; INP became a Core Web Vital 12 Mar 2024.
