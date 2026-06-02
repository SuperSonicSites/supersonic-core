# Layout Review - Sample Service Page

> **SAMPLE / FIXTURE** - `layout-review` of
> [sample-service-page.html](sample-service-page.html), graded against
> `docs/layout-standard.md`. This report is the current source-state review after
> the layout workflow upgrade. It is **not an approval report** until the 0.1.30
> theme is deployed to staging and recaptured.

- **Scope:** Service (sample) - "Commercial HVAC Maintenance"
- **Archetype:** service
- **Theme/package target:** 0.1.30
- **Plugin target:** 0.1.8
- **Current staging proof:** pending; no live staging write or deploy was run for
  this source update.
- **Historical staging run:** `https://staging.yukonrealestateconnection.ca/qa-pattern-sample-service-page/`
  was created as id 340, captured, and trashed during the original 0.1.29 run.
  Those screenshots are retained as defect evidence only.
- **Background sequence (current source, refined COLOR-6):** surface -> base ->
  surface -> base -> surface -> contrast -> surface -> base -> accent.

## What Changed Since The Historical Run

The first staging run proved the layout workflow end to end, but it also surfaced
two stack-only defects that are not visible in single-pattern QA:

1. **Weak separation between two soft-neutral bands.** The original sequence put
   `muted` next to `surface`, which read as one band. `COLOR-6` now treats
   `surface` and `muted` as the same soft-neutral side, and the fixture was
   corrected to strict soft-neutral/base alternation.
2. **Base-colored seam between stacked bands.** The default post-content
   `blockGap` left a white seam between full-width bands. `SPACE-7` and the
   `assets/css/patterns.css` seam fix now make stacked section children butt
   together so section padding, not inter-section margin, owns vertical rhythm.

This pass also removes the fixture-only `core/details` FAQ exception. The sample
now uses the approved `section-faq-rankmath` / `rank-math/faq-block` path, so the
framework compliance proof matches `FW-1`, `FW-2`, and `SD-3`.

## Scorecard (Current Source)

| # | Dimension | Status | Evidence |
|---|-----------|--------|----------|
| 1 | IA & section order | pass | Service order matches the archetype; priced service includes pricing; FAQ uses approved Rank Math path (`IA-1`, `FW-1`) |
| 2 | Visual hierarchy & scanning | pass | One H1; each major section has a scannable H2 |
| 3 | Spacing & rhythm | deferred | Source uses one `section-*` token/section and includes the `SPACE-7` CSS fix; staging screenshot proof still pending |
| 4 | Alignment & measure | pass | Left body copy, centered only for short heading/CTA runs, 760px text rails |
| 5 | Grid & responsive | deferred | Historical run stacked correctly, but current 0.1.30 source needs recapture at 1440/768/390 |
| 6 | Typography | pass | Preset sizes only (`TYPE-1/2`) |
| 7 | Color & contrast | needs-revision | Historical screenshots showed a low-contrast highlighted pricing card; corrected source needs accessibility review and recapture |
| 8 | Conversion design | pass | Primary quote CTA repeats; secondary call/plan actions are lower weight (`CONV-1/2`) |
| 9 | Semantic & landmarks | pass | Native blocks only; no `core/html`; single template-provided `main` |
| 10 | Heading hierarchy | pass | Exactly one H1; section headings descend to H2/H3 (`HEAD-1/3`) |
| 11 | Structured-data plan | pass | Service + WebPage + BreadcrumbList planned; FAQ schema ownership stays with Rank Math (`SD-1/3`) |
| 12 | Internal linking | pass | Descriptive contextual anchors (`LINK-1/2/6`) |
| 13 | Imagery & placeholders | pass | Placeholder images have alt text and dimensions (`IMG-3/4/5`) |
| 14 | Core Web Vitals (layout) | deferred | Media dimensions are present; staging proof for current source is pending |
| 15 | Accessibility (layout) | needs-revision | Full keyboard/focus/target-size and pricing-card contrast proof are pending |
| 16 | Framework & token compliance | pass | Uses approved pattern structures, approved tokens, `rank-math/faq-block`, and no arbitrary values (`FW-1/4/7`) |

- **Band:** `needs-revision`
- **Approval status:** not approved; staging certification and accessibility proof
  are required before this fixture can be marked `strong`.

## Proof Summary

```text
- Static proof: PASS - `npm run validate`, `npm run agents:check`,
  `npm run version:check`, `npm run package`, `npm run package:determinism`,
  sample payload/source equality, and package zip token/CSS checks pass.
  Source has one H1, no core/html, one section token per section, the approved
  Rank Math FAQ path, tokenized spacing, tokenized shadow/radius usage, and
  image alt/dimensions.
- Staging proof: PENDING - the current 0.1.30 source has not been deployed or
  written to a staging QA page.
- Visual proof: PENDING - existing screenshots are historical 0.1.29 defect
  evidence only and do not approve the corrected source.
- Interaction proof: PENDING - no custom interaction is introduced; Rank Math FAQ
  rendering still needs staging verification.
- Cross-skill proof: PENDING - run layout-review with visual-qa,
  accessibility-review, and seo-auditor coverage after staging recapture.
- Manual-only gaps: re-stage 0.1.30, update/create the sample QA page from
  data/page-json/sample-service-page.json, capture desktop/tablet/mobile,
  run pattern:proof for overflow/console checks, verify pricing-card contrast,
  verify keyboard/focus/target-size, and trash the QA page after approval.
```

## Approval-Gated Theme Changes

The implementation request explicitly keeps these theme changes in scope for
certification:

- Gradient presets: `surface-rise`, `accent-veil`, `muted-soft`.
- Shadow preset: `strong`.
- Theme-wide section stacking rule: `.supersonic-section-page > .wp-block-post-content > * + * { margin-block-start: 0; }`.

They are accepted as intended source changes for the 0.1.30 certification path,
but they are **not visually approved** until the staged 0.1.30 package is
captured and reviewed.

## Required Next Proof

1. With explicit approval, deploy the verified 0.1.30 theme package to staging
   only.
2. With explicit approval, dry-run then create/update the sample QA page using
   `--content data/page-json/sample-service-page.json`.
3. Capture desktop, tablet, and mobile screenshots; run overflow/console proof;
   complete accessibility and SEO cross-checks.
4. Only if those checks pass, update this report from `needs-revision` to
   `strong`.
