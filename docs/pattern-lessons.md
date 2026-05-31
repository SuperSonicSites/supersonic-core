# Pattern Lessons — QA Feedback Registry

Durable, deduplicated build rules **derived from QA findings**. This is the institutional
memory that closes the loop between QA and pattern building:

```
pattern-builder ──builds──▶ patterns ──visual-qa──▶ docs/reports/<v>-*-qa.md
      ▲                                                      │
      │ reads active lessons before building     distill recurring findings
      │                                                      │
      └──────────────── docs/pattern-lessons.md ◀────────────┘
```

- **`pattern-builder`** reads the **Active Build Rules** checklist below before building and
  checks the new/changed pattern against every `active` lesson before reporting.
- **`visual-qa`** distills its report at the end of each run and **auto-appends** any recurring
  or systemic finding here as a new lesson (or bumps the `Seen` line of an existing one).
- **A human prunes**: edit `Status` to retire stale lessons, fix wording, or merge duplicates.

## How to use this file (for `pattern-builder`)

1. Read the **Active Build Rules** quick checklist — that's the actionable do/don't list.
2. For the specific pattern you're building, scan the detailed lessons whose **Applies to**
   matches (heroes, sections, CTAs, contact, header/footer).
3. Build so the pattern satisfies every `active` lesson. If you must violate one, say why in
   your report.

## How to append (for `visual-qa`)

A finding earns a lesson when it is **systemic** — it recurs across multiple patterns in one
release, or reappears across releases. One-off, pattern-specific defects stay in the report;
they do not belong here. When appending:

- Give it the next `PL-NNN` id (or `PL-QNN` for a QA-process lesson).
- Fill every field. Phrase **Do/Don't** as a rule a builder can follow *before* QA, not as a
  description of the bug.
- If the lesson already exists, don't duplicate — append the new report ref to its **Seen** line.
- Default `Status: active`. Use `pending-decision` when the fix needs a human library call,
  `graduated` once promoted into a hard-enforced standard, `retired` when no longer relevant.

## Status vocabulary

- **active** — a binding build rule; `pattern-builder` must satisfy it.
- **pending-decision** — recurring, but the fix needs a human/library-level call before it's
  binding. Builders should follow the current convention and flag the tension.
- **graduated** — promoted into a hard-enforced standard (`DESIGN_SYSTEM.md`,
  `design-tokens-standard.md`, or `npm run validate`). Kept here as a pointer so the lesson
  isn't re-learned.
- **retired** — no longer applicable (rule changed, pattern removed, false trend).

## Graduation

When an `active` lesson has held across several releases and is mechanically checkable, promote
it: encode it in `DESIGN_SYSTEM.md` / `docs/design-tokens-standard.md` and, where possible, in
`npm run validate`. Then set the lesson's `Status: graduated` with a pointer to where it now
lives. Graduating a rule into the global standards is a global-design-rule change and follows
the **Human Approval Gates** in `CLAUDE.md`.

---

## Active Build Rules — quick checklist

Distilled do/don'ts. Each links to its detailed lesson.

- **PL-001** Narrow inner groups: set `contentSize` to `760px` (the `narrowWidth` value), or drop the inner constraint. Never `860`/`920px`; `var:custom|...` does **not** resolve in layout `contentSize`.
- **PL-002** *(pending-decision)* Prefer real `core/image` slots for media placeholders over styled `core/group` "replace with image" wrappers.
- **PL-003** No hardcoded `minHeight` px (`420`/`460`/`520`) on media placeholders — use a token or fluid/aspect-ratio sizing.
- **PL-004** Section/card CTAs are `core/button` blocks with descriptive labels. `href="#"` is a tracked starter convention only — list it as known-open.
- **PL-005** Drop redundant `layout:constrained` on inner groups that set no `contentSize` — it's dead metadata.
- **PL-006** Quotes use `core/quote` + `cite`, never styled `core/paragraph`.
- **PL-007** Benefit/feature lists use `core/list`, not stacked `core/group` items.
- **PL-008** Every section pattern ships an H2 before any H3 — no heading-level skip.
- **PL-009** `core/site-logo` always pairs with a `core/site-title` fallback (header **and** footer).
- **PL-010** Use body-tier font tokens (`large`/`x-large`) for body and quote copy — never a `heading-*` scale token.
- **PL-011** Section bottom rhythm comes from the outer group's `padding-bottom` token, never a trailing `core/spacer`.
- **PL-012** Wrap wide third-party blocks (e.g. `rank-math/faq-block`) in a `760px` constrained group; don't let them inherit the 1440px content width.
- **PL-013** Final / standalone CTA sections use `section-large` spacing.
- **PL-014** Column and group section labels are `core/heading` (H2/H3), not `<strong>` inside a paragraph.
- **PL-Q01** *(QA process)* Capture each pattern on its own temporary `qa-pattern-[slug]` page — never the staging root, which renders default homepage content and produces byte-identical non-pattern PNGs.

---

## Lessons (detail)

### PL-001 — Bind narrow inner-group `contentSize` to the `narrowWidth` value (760px)
- **Status:** active
- **Do:** When an inner group needs the narrow reading width, set `contentSize` to the literal
  `760px` (the value of the `narrowWidth` token). If the section should span the full content
  width, omit the inner constraint and inherit 1440px.
- **Don't:** Use arbitrary inner widths like `860px` or `920px`, and don't expect
  `var:custom|...`/`var()` to resolve inside a layout `contentSize` — WordPress does not resolve
  custom-property tokens there, so the concrete `760px` is the compliant target.
- **Applies to:** heroes, intros, text / feature / pricing / cta / process sections.
- **Symptom in QA:** the recurring "contentSize sweep".
- **Seen:** 0.1.12 (9 patterns: cta-band, section-feature-grid, hero-centered, section-page-intro,
  section-process-steps, section-pricing-cards, section-media-feature 860px, section-testimonial
  920px); 0.1.13 (M9, M19, M21, L1, L3).
- **Reference implementation:** `section-text.php`.

### PL-002 — Media slots should be real `core/image` placeholders, not styled groups
- **Status:** pending-decision
- **Do:** Ship media placeholders as a real `core/image` block (with a defined aspect ratio) so
  editors get native upload + alt-text controls.
- **Don't:** Wrap a bare `core/image` (no `src`/`sizeSlug`) in a styled `core/group` that couples
  background/radius/padding/minHeight to the slot — it gives no native image affordance and is
  hard to swap real media into cleanly.
- **Pending:** This is a library-wide convention call (real images vs. documented styled-group
  convention). Until decided, follow the existing convention and flag it; don't silently diverge.
- **Applies to:** section-media-feature, section-image-text, section-text-image, contact-map-info.
- **Seen:** 0.1.12 (systemic theme 2); 0.1.13 (M1, M5, M7).

### PL-003 — No hardcoded `minHeight` px on media placeholders
- **Status:** active
- **Do:** Size media slots with a token or fluid/aspect-ratio sizing.
- **Don't:** Hardcode `minHeight: 420px / 460px / 520px` — these are non-token px values, and on
  mobile (390px) an empty media band can dominate the viewport. Resolves naturally once PL-002 is
  applied.
- **Applies to:** section-media-feature, section-image-text, section-text-image, contact-map-info.
- **Seen:** 0.1.12 (systemic theme 3); 0.1.13 (M2, M3, M4, M6).

### PL-004 — Section/card CTAs are `core/button` with real labels; `href="#"` is tracked-only
- **Status:** active
- **Do:** Author CTAs as `core/button` blocks with descriptive, action-oriented labels (good tap
  target on mobile). Where a starter `href="#"` is intentional, record it in the pattern's
  known-open href list so QA and launch prep can wire it.
- **Don't:** Use bare paragraph links as CTAs, ship generic labels ("Select", "View service one"),
  or leave `href="#"` untracked.
- **Applies to:** heroes, service-cards, pricing-cards, cta-split/band, contact, header, footer.
- **Seen:** 0.1.12 (systemic theme 4); 0.1.13 (M8, M12, M20, M22, M23, M26, L2, N5).

### PL-005 — Drop redundant `layout:constrained` on inner groups with no `contentSize`
- **Status:** active
- **Do:** Only set `layout:constrained` when it carries a real `contentSize`. Otherwise omit it
  (or use `flow`).
- **Don't:** Leave `layout:constrained` on inner card groups that set no width — it's dead
  metadata with no contentSize benefit.
- **Applies to:** card/grid/testimonial/comparison/contact-form patterns.
- **Seen:** 0.1.12 (systemic theme 5); 0.1.13 (L6, L8, L10, N1, N2, N3, N4).

### PL-006 — Quotes use `core/quote` + `cite`, not styled paragraphs
- **Status:** active
- **Do:** Author testimonial/quote copy as `core/quote` with a `cite` for attribution.
- **Don't:** Render quotes as styled `core/paragraph` (no quote/blockquote/cite semantics).
- **Applies to:** section-testimonial, section-testimonial-grid.
- **Seen:** 0.1.12 (systemic theme 6); 0.1.13 (M15, L7). *(section-testimonial single resolved — N7.)*

### PL-007 — Lists use `core/list`, not stacked groups
- **Status:** active
- **Do:** Author benefit/feature lists as `core/list` so assistive tech gets list semantics.
- **Don't:** Stack `core/group` items to fake a list.
- **Applies to:** section-icon-list (and any "list of points" section).
- **Seen:** 0.1.12 (low); 0.1.13 (M16).

### PL-008 — Every section pattern ships an H2 before any H3
- **Status:** active
- **Do:** Give each section an editable H2 section heading before any H3 card titles.
- **Don't:** Open a section at H3 with no H2 — it skips a heading level (WCAG 1.3.1) and breaks
  SEO hierarchy once patterns stack on a page.
- **Applies to:** all card/grid section patterns.
- **Seen:** 0.1.12 (the lone Medium — section-card-row); re-verify on assembled multi-pattern pages.

### PL-009 — `core/site-logo` always pairs with a `core/site-title` fallback
- **Status:** active
- **Do:** Pair `core/site-logo` with a `core/site-title` fallback so the brand mark renders even
  when no logo is set in Site Identity.
- **Don't:** Ship a logo-only header/footer that collapses to nothing (header) or description-only
  (footer) on an unset logo.
- **Applies to:** header-simple, footer-simple.
- **Seen:** 0.1.12 (header/footer low); 0.1.13 (H2, M10).

### PL-010 — Body/quote copy uses body-tier tokens, not heading-scale tokens
- **Status:** active
- **Do:** Use `large` / `x-large` body tokens for body and quote copy.
- **Don't:** Apply a `heading-*` font-size token (e.g. `heading-2`, ~40–56px) to non-heading copy —
  it breaks the typography hierarchy.
- **Applies to:** testimonials, intros, any large body copy.
- **Seen:** 0.1.13 (M13).

### PL-011 — Section bottom rhythm comes from padding, not a trailing spacer
- **Status:** active
- **Do:** Set the section's bottom rhythm with the outer group's `padding-bottom` token (one
  semantic section spacing token for the section).
- **Don't:** Split rhythm between a small `padding-bottom` and a trailing `core/spacer` — it's the
  only non-standard way to space a section and fights the token model.
- **Applies to:** all section patterns (flagged on section-faq-rankmath).
- **Seen:** 0.1.12 (low); 0.1.13 (M24).

### PL-012 — Constrain wide third-party blocks in a 760px group
- **Status:** active
- **Do:** Wrap third-party blocks that render text (e.g. `rank-math/faq-block`) in a `760px`
  constrained group.
- **Don't:** Let a third-party block sit at pattern root and inherit the 1440px content width —
  too wide for a text accordion on desktop.
- **Applies to:** section-faq-rankmath and any future third-party-block pattern.
- **Seen:** 0.1.13 (M25).

### PL-013 — Final / standalone CTA sections use `section-large`
- **Status:** active
- **Do:** Use `section-large` spacing for a final or standalone CTA section per
  `design-tokens-standard.md`.
- **Don't:** Use `section-medium` for a closing CTA.
- **Applies to:** cta-split, cta-band, cta-band-fullpage.
- **Seen:** 0.1.13 (L9).

### PL-014 — Section labels are headings, not bold paragraphs
- **Status:** active
- **Do:** Author column/section labels as `core/heading` (H2/H3) so they carry a document-structure
  heading level.
- **Don't:** Use `<strong>` inside a paragraph as a faux heading.
- **Applies to:** footer-simple (column labels) and any labelled-column pattern.
- **Seen:** 0.1.13 (L5).

### PL-Q01 — Capture each pattern on its own QA page, never the staging root
- **Status:** active
- **Audience:** `visual-qa` (process lesson, not a pattern build rule).
- **Do:** Create a temporary `qa-pattern-[slug]` page per pattern (dry-run → approve → create →
  capture → trash) so the screenshot actually renders the pattern.
- **Don't:** Capture the staging root with selector `main` — it renders the default WordPress
  "Hello world!" homepage, producing byte-identical PNGs that don't depict the named pattern and
  silently degrade the run to source-only review.
- **Seen:** 0.1.13 (H1, and the report's coverage caveat).
