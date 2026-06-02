# Layout Review — Plumbing Home Page

> **SAMPLE / FIXTURE** — `layout-review` of
> [plumbing-home-page.html](plumbing-home-page.html), graded against
> `docs/layout-standard.md`. Static + live staging proof. The staging page was
> temporary (`qa-pattern-plumbing-home-page`, id 342), captured, and **trashed**.

- **Scope:** Home (sample) — Rapid Flow Plumbing
- **Archetype:** home · **Source version:** 0.1.30 · **Staging theme at capture:** 0.1.29
- **Staging:** `https://staging.yukonrealestateconnection.ca/qa-pattern-plumbing-home-page/` (created → captured → trashed)
- **Background sequence (rendered, verified):** base → surface → base → surface →
  contrast → base → accent (strict soft-neutral↔base; two punctuation bands; no two
  soft-neutrals adjacent — refined `COLOR-6`)
- **Screenshots:** `screenshots/after/plumbing-home-page/plumbing-home-page-{desktop,tablet,mobile}.png`

## Scorecard

| # | Dimension | Status | Evidence |
|---|-----------|--------|----------|
| 1 | IA & section order | pass | Home archetype: hero → proof strip → services → story → stats → testimonials → final CTA (`IA-1/7`) |
| 2 | Visual hierarchy & scanning | pass | one H1; every section leads with a scannable H2; strong dark stat-band focal point (desktop shot) |
| 3 | Spacing & rhythm | pass* | one `section-*` token/section. **Expected `SPACE-7` band seam visible** — staging runs theme 0.1.29; the fix ships in 0.1.30. Recheck after deploy |
| 4 | Alignment & measure | pass | left body; centered short hero/CTA/heading runs; 760px text rails |
| 5 | Grid & responsive | pass | live: overflow **0** at 1440/768/390; columns stack 3→1 on mobile (`GRID-2/3`) |
| 6 | Typography | pass | preset sizes only (`TYPE-1/2`) |
| 7 | Color & contrast | pass | `COLOR-6` rhythm; `COLOR-8` dark band → `base` text, accent CTA → `accent-contrast`; white-on-accent **4.63:1** AA, white-on-dark high |
| 8 | Conversion design | pass | one primary "Book a plumber" repeated (hero, final CTA); per-service + about secondary (`CONV-1/2`) |
| 9 | Semantic & landmarks | pass | native blocks only; no `core/html`; single `<main>` (targetCount 1) |
| 10 | Heading hierarchy | pass | exactly one H1 (hero); sections H2; cards H3 (`HEAD-1/3`) |
| 11 | Structured-data plan | pass | LocalBusiness(Plumber) + WebSite + WebPage planned; no self-review; no JSON-LD emitted (`SD-1/4`) |
| 12 | Internal linking | pass | descriptive anchors to /contact, three /services/* pages, /about (`LINK-1/2/6`) |
| 13 | Imagery & placeholders | pass | 6 `placehold.co` slots, real alt + WxH, 16:9/3:1/4:3; no console errors (`IMG-3/4/5`) |
| 14 | Core Web Vitals (layout) | pass | hero eager + early; media dims set; no console/page errors at any breakpoint |
| 15 | Accessibility (layout) | pass* | AA contrast (computed/visual); targets ~44px. Full keyboard/focus sweep via `accessibility-review` recommended |
| 16 | Framework & token compliance | pass | approved-library pattern structures; tokens only (sole literal: 1px card border); controls preserved (`FW-4/7`) |

`pass*` = passes except a noted item pending the 0.1.30 deploy / a recommended deeper sweep.

## Overall

- **Band: `acceptable-pending-staging`.** No blocker, no major. The Home-archetype
  composition, alternating rhythm, dark/accent punctuation, responsive stacking,
  zero overflow, and no console errors are all proven live. The only open visual
  item is the **expected `SPACE-7` seam** (staging runs 0.1.29; the fix is in the
  0.1.30 source, already pushed). Reaches `strong`/`approved` after theme 0.1.30 is
  deployed and the seam is reconfirmed gone.

## Proof Summary

```text
- Static proof:     PASS — one H1; no core/html; one section token/section; tokens only;
                    refined COLOR-6 sequence; 6 images alt+dims; dark/accent bands set
                    readable text. agents:check = 0; validate = 0.
- Staging proof:    PASS — page created on staging.* (id 342), captured, then trashed.
- Visual proof:     PASS (composition) — desktop/tablet/mobile reviewed: alternating bands,
                    3→1 stacking, bordered service cards, dark stat band, accent CTA all correct.
                    Open item: expected SPACE-7 seam between bands (0.1.29 theme).
- Browser assertions: overflow 0 / consoleErrors [] / pageErrors [] at all 3 viewports.
- Interaction proof: n/a — no custom-JS interactive components on this page.
- Cross-skill proof: targeted — heading order/semantic/alt/links pass; AA contrast computed.
                    Full accessibility-review keyboard/focus sweep recommended before production.
- Manual-only gaps: (1) deploy theme 0.1.30 to staging + re-stage to confirm the seam is gone;
                    (2) full accessibility-review sweep; (3) page <title>/meta are QA-page
                    defaults (set per page by the editor/SEO plugin, not the layout skill).
```

## Feedback to layout-architect

No blocking findings — the composition follows the refined standard (clean
`base↔soft-neutral` rhythm with dark + accent punctuation, one H1, descriptive
internal links, deferred LocalBusiness schema). The seam is a deploy gap already
fixed in source (`SPACE-7`), not an authoring defect.
