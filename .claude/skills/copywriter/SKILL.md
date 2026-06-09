---
name: copywriter
description: Use when writing or filling website body copy from the SEO briefs after layout-architect has composed the page, including requests like "write the homepage copy", "fill the service page body copy", "draft the copy for these sections", or "write the website copy from the brief". Fills body copy and CTA microcopy only into data/copy-deck.json, grounded in client intake and brand voice, weaving the brief's keywords, LSI terms, and talking points, and enforcing layout budgets (per-slot length caps and equal-text card groups) plus mechanical voice rules (never em dashes) via npm run copy:check. Never authors SEO titles, meta descriptions, slugs, schema, or the H1/H2/H3 heading outline.
---

# Copywriter Skill

Use this skill as the Phase 8 writer, after `seo-strategist` has authored the SEO
briefs and `layout-architect` has composed the page. It turns the briefs
(`data/seo-briefs.json`), the client intake (`data/site-intake.json`), the brand
voice (`BRAND.md`), and the page composition (`data/page-compositions.json`) into
per-page body copy written to `data/copy-deck.json`, then proves it with
`npm run copy:check`.
Also follow `docs/agent-quality-standard.md`.

This skill **fills body copy only**. It does not author SEO metadata, headings, or
schema, and it never writes live pages. The copy deck is the reviewable artifact;
placement into staging is a separate, approval-gated step.

## Ownership Boundary

The copy deck is downstream of the briefs and the layout. Read upstream decisions;
do not re-make them.

- The **copywriter owns** (writer-editable, in `data/copy-deck.json`): section body
  copy, CTA microcopy, and `talking_points` prose — the slot `text` values.
- `seo-strategist` **owns** (read-only here): `seo_title`, `meta_description`,
  `url_slug`, the keyword/LSI map, the H1/H2/H3 heading outline, the internal-link
  matrix, and the structured-data plan. These never appear as editable copy slots;
  the heading outline appears only as a read-only `locked_headings` echo.
- `layout-architect` **owns** structure and emits `data/page-compositions.json` (the
  ordered patterns and instance counts per page).
- The **pattern registry** (`data/pattern-certifications.json` -> `copy_slots`) owns
  the per-slot length budgets and equal-text (`sibling_group`) declarations. The
  copywriter denormalizes these into the deck; it does not invent caps.
- `copy-review` independently grades the deck — voice fidelity, persuasion,
  claim-grounding, brief coverage — and feeds slot-level rule-ID fixes back here.
  It reviews; it never writes copy.
- `seo-auditor` later validates the realized page against the brief.

## Model Policy

Pick the model per stage — quality-critical voice and judgment on the strongest
model, mechanical resolution and assembly on a fast one. Skills cannot pin a model
in frontmatter, so the orchestrator applies this policy and delegates per
`docs/agent-quality-standard.md` and `AGENTS.md`. The `/copywriter` command pins
`model: opus` so the top tier runs the judgment stages; the contracted draft, fit,
and assembly steps drop to Sonnet/Haiku via delegation.

The strong model belongs wherever final persuasive copy is *produced*, not only
where it is judged — so Opus anchors the voice spec, runs the independent review
(`copy-review`), and rewrites the specific slots that review flags. Every page
drafts on Sonnet 4.6; the Opus voice spec is the cheap anchor that keeps those
drafts on-brand.

| Stage | Model | Why |
|-------|-------|-----|
| 1. Discover — read briefs, intake, `BRAND.md`, `page-compositions.json`, registry `copy_slots` | **Haiku** | Mechanical read/parse; no judgment. |
| 2. Resolve the per-page slot manifest — join composition x registry, instantiate repeatable slots by `instances`, denormalize caps + `sibling_group` | **Haiku** | Deterministic join against a fully specified contract. |
| 3. Synthesize the voice spec + per-page copy contract — intent + audience + brand voice into a slot-by-slot plan | **Opus** | Hard-to-reverse decision that governs every draft; the cheap anchor that keeps Sonnet drafts on-brand. |
| 4. Draft body copy per slot — every page | **Sonnet 4.6** | Constrained, voiced writing; with the Opus voice spec anchoring it, Sonnet 4.6 carries the draft. |
| 5. Fit + balance + mechanical gate — reconcile over-cap / unbalanced `sibling_group` slots, then `npm run copy:check` | **Sonnet** | Tight rewrite to a known target; cheap deterministic gate. |
| 6. Independent QA review — hand the deck to `copy-review` (own context, Opus): score voice fidelity, persuasion, claim-grounding, brief coverage; return slot-level rule-ID fixes + a band | **Opus (`copy-review`)** | A fresh-context adversary, not grading its own draft; reusable, scored, auditable. |
| 7. Apply review fixes — rewrite each flagged slot (money-page slots on Opus, the rest on Sonnet), then re-run `copy:check` + `copy-review`; loop until band `approved`/`acceptable`, no blocker, cap ~2 rounds | **Opus (money slots) / Sonnet** | Spend the top tier only on the conversion-critical slots that actually failed review. |
| 8. Assemble the final `data/copy-deck.json` | **Haiku** | Mechanical assembly; verify the gates passed. |

**Money-page slots** = a slot whose CTA is `goals.primaryConversion`, OR whose page
`archetype` is one of `home`, `landing`, `pricing`, `local-business`, OR whose page
`search_intent` is `transactional` or `commercial`. Only those slots escalate to
Opus, and only the ones `copy-review` flags — so the top tier touches the voice
spec, the review, and the handful of flagged conversion slots, never every money
page wholesale.

## Discovery

This skill runs **autonomously** from the briefs and intake. It does not interview
the user; `new-site-init` and `seo-strategist` captured every input first.

Read:

- `CLAUDE.md`, `README.md`, `SITE.md` (read-only context).
- `data/seo-briefs.json` — per page: `search_intent`, `target_word_count`,
  `primary_keyword`/`secondary_keywords`, `lsi_terms`, and `outline.sections[]`
  (`h2`, `h3`, `talking_points`, `lsi_focus`). The brief drives what each section
  must say.
- `data/site-intake.json` — `brand.voice`, `brand.writingStyle`,
  `brand.phrasesToAvoid`, `audience.primaryAudience/problems/decisionTriggers`,
  `goals.primaryConversion/secondaryConversions`. The client facts the copy is
  grounded in.
- `BRAND.md` — the voice traits, CTA tone, and the `Mechanical Copy Rules` (never em
  dashes, no smart quotes, the phrases-to-avoid list).
- `data/page-compositions.json` — the ordered patterns and `instances` per page.
- `data/pattern-certifications.json` -> `copy_slots` — per-pattern budgets and
  sibling groups.
- `data/copy-deck.schema.json` (the output contract) and
  `data/copy-deck.example.json` (a worked example).
- `git status --short`; preserve unrelated local work.

If a required input is missing, fail closed and name it (see Failure Policy). Never
invent brand or market facts.

## Contract

Before writing any copy, define the contract:

- The page set to write (from `data/page-compositions.json`, scoped to pages with a
  matching brief).
- For each page, the **resolved slot manifest**: for each composed pattern, pull its
  `copy_slots` from the registry, instantiate each `repeatable` slot to the page's
  `instances` count, and carry each slot's `role`, `max_chars`/`max_words`, and
  `sibling_group` forward. This is the slot list the deck must fill.
- The **voice spec**: the brand voice, writing style, and CTA tone resolved from
  `data/site-intake.json` + `BRAND.md`, plus the mechanical rules.
- Per slot, the **brief material** to weave in: the section's `talking_points`,
  `lsi_focus`, and the page's keywords — woven naturally, never stuffed.
- The **capacity check**: sum the resolved slots' caps and compare against the brief
  `target_word_count`. If the composition cannot physically reach the target (a thin
  page), do not pad or keyword-stuff to hit the number — flag it and route back to
  `layout-architect` to add a content-bearing section.
- Output: `data/copy-deck.json`, valid against `data/copy-deck.schema.json` and
  passing `npm run copy:check`.

## Workflow

1. Read the Discovery inputs; if a required input is missing, fail closed and name
   it (do not prompt).
2. Resolve the per-page slot manifest (composition x registry `copy_slots`;
   instantiate repeatable slots; denormalize caps + `sibling_group`).
3. Synthesize the voice spec and the per-page copy contract.
4. Draft body copy into each slot on Sonnet 4.6, weaving the brief material and
   respecting the caps (the Opus voice spec from step 3 anchors the voice).
5. Fit + balance: rewrite any slot over its cap and rebalance any `sibling_group`
   that is uneven. Write `data/copy-deck.json` and run `npm run copy:check`; fix
   every mechanical failure (Sonnet).
6. Hand the deck to `copy-review` (Opus, its own context) for an independent
   voice / persuasion / claim-grounding / brief-coverage review. It returns a band
   and slot-level rule-ID fixes.
7. Apply the fixes: rewrite each flagged slot — money-page slots on Opus, the rest
   on Sonnet — then re-run `npm run copy:check` and re-submit to `copy-review`.
   Loop until the band is `approved`/`acceptable` with no blocker (cap ~2 rounds).
8. Report and hand off: the deck is ready for placement (a separate, approval-gated
   REST step) and for a `seo-auditor` pass on the realized page.

## Proof Gates

Use the cheapest proof that verifies each claim.

- Copy proof: `npm run copy:check` passes — no banned em/en dashes, no smart/curly
  quotes or ellipsis character (straight apostrophes and quotes are required and
  expected for natural English; never drop a possessive apostrophe to dodge a
  character), no phrases-to-avoid, every slot within its `max_chars`/`max_words`,
  every `sibling_group` balanced within 25%, page_ids resolve to briefs. Fail closed.
- Budget proof: every slot's caps and `sibling_group` match the pattern's registry
  `copy_slots` — proven by the registry-consistency check inside `copy:check` (each
  slot carries `pattern_slug` + `slot_ref`).
- Ownership proof: the deck contains no `seo_title`, `meta_description`, `url_slug`,
  or `schema`; headings appear only in `locked_headings`.
- Grounding proof: every factual claim (licensing, hours, pricing, guarantees)
  traces to `data/site-intake.json`. Name any claim that cannot be sourced as a
  manual-only gap rather than asserting it.
- Review proof: `copy-review` returns a band of `acceptable`/`approved` with no
  blocker, and its slot-level findings are applied (flagged money-page slots
  rewritten on Opus) or recorded as manual-only gaps.
- Report a `Proof Summary`.

## Failure Policy

Fail closed when evidence is incomplete; report `blocked` or `needs-revision`, not
`approved`. This skill never interviews the user — a missing input is a fail-closed
condition, not a prompt.

- Missing brief, composition, or intake for a page -> `blocked`; name the gap and
  route it back to `seo-strategist`, `layout-architect`, or `new-site-init`. Never
  invent brand/market facts.
- A pattern placed on a page has no `copy_slots` in the registry -> `needs-revision`;
  route to `pattern-builder`/`certify-pattern` to declare the pattern's copy slots
  before writing its copy.
- `npm run copy:check` fails (banned glyph, phrase-to-avoid, over-cap slot,
  unbalanced group, budget drift, orphan page) -> `needs-revision`; fix before
  handoff.
- `copy-review` returns a blocker (off-brand voice, an unsupported claim, or weak
  conversion copy on a money page) -> `needs-revision`; apply the flagged slot
  fixes (money-page slots on Opus) and re-review before handoff.
- A required claim cannot be sourced from the intake -> leave the slot to a safe,
  non-factual line and record the gap; do not fabricate the fact.
- The resolved slot capacity is far below the brief `target_word_count` (the
  composition is too thin for the page's intended depth) -> `needs-revision`; route
  to `layout-architect` to add a content-bearing section. Never pad or keyword-stuff
  to hit a word count.
- Never author SEO titles, meta descriptions, slugs, schema, or the heading outline.
  Never run live REST writes (the deck is the deliverable). Never overwrite unrelated
  local work.

## Report

Include:

- scope (pages written, total slots, money-page slots rewritten on Opus after review)
- the resolved slot manifest summary (patterns x instances per page)
- files created/changed (`data/copy-deck.json`)
- `Proof Summary` — copy-rules result, budget/registry consistency, ownership,
  grounding, the `copy-review` band + findings applied, and manual-only gaps
- the `npm run copy:check` result and the `copy-review` band
- known issues / open questions and the next recommended step (approval-gated
  placement into staging, then a `seo-auditor` pass on the realized page)
