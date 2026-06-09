---
name: copy-review
description: Use when reviewing, grading, or QA-ing website body copy in data/copy-deck.json against brand voice and the SEO briefs, including requests like "review the copy", "grade the copy deck", "is this copy on-brand", "QA the website copy", or "copy review". Scores voice fidelity, persuasion/conversion, brief coverage, claim grounding, readability, and ownership integrity, folds in the mechanical npm run copy:check result, and feeds prioritized slot-level rule-ID fixes back to the copywriter. Reviews copy only; never authors SEO titles, meta, schema, headings, or layout.
---

# Copy Review Skill

Use this skill to grade a finished `data/copy-deck.json` and drive its revision. It
is the copy-level QA counterpart to `copywriter`: an **independent, fresh-context
adversary** that judges the deck against `BRAND.md` and the SEO briefs, scores it,
and returns prioritized, slot-level rule-ID fixes that `copywriter` applies
(money-page slots on Opus). Re-review until the deck passes.
Also follow `docs/agent-quality-standard.md`.

It **reviews copy only** — it never writes copy, and it never touches SEO titles,
meta descriptions, slugs, schema, the heading outline, or layout. The mechanical
floor (banned glyphs, phrases-to-avoid, per-slot caps, `sibling_group` balance,
budget/registry consistency) is owned by `npm run copy:check`; this skill folds in
that result and adds the subjective voice/persuasion/claim judgment a validator
cannot make.

## Discovery

Establish what to review from repo facts first:

- `data/copy-deck.json` (the deck being graded) and `data/copy-deck.schema.json`
  (the contract).
- `data/seo-briefs.json` — per page `search_intent`, `archetype`, `outline.sections[]`
  (`talking_points`, `lsi_focus`), and keywords the copy must cover.
- `data/site-intake.json` — `brand.voice/writingStyle/phrasesToAvoid`,
  `audience.*`, `goals.*` (the facts every claim must trace to, the voice, the
  conversion target).
- `BRAND.md` — voice traits, CTA tone, and `Mechanical Copy Rules`.
- `data/page-compositions.json` + `data/pattern-certifications.json` -> `copy_slots`
  (which slots are money-page / sibling-grouped, and their caps).
- `npm run copy:check` result (the mechanical floor).

Determine each page's intent/archetype from the brief. Do not ask the user for a
target the deck or briefs already identify.

## Contract

Define before scoring:

- the pages/slots under review and, per slot, whether it is a **money-page slot**
  (CTA is `goals.primaryConversion`, OR page `archetype` in
  `home`/`landing`/`pricing`/`local-business`, OR `search_intent`
  `transactional`/`commercial`)
- the rubric dimensions and which findings are gating (blockers)
- the brief material each slot must cover and the intake facts each claim must
  trace to
- what evidence makes each dimension pass

## Scoring Rubric

Score each dimension; status **pass** / **nit** / **minor** / **major** / **blocker**.
Findings use the canonical severity scale `blocker | major | minor | nit` (nit is
the lowest, optional-polish tier) and cite rule IDs and the offending **slot id**.
The grading bands below (approved / acceptable / needs-revision / blocked) are a
separate, deck-level scale and are unaffected.

| # | Dimension | Rules | Gating? |
|---|-----------|-------|---------|
| 1 | Voice fidelity (BRAND traits, writing style, CTA tone; no hype/cliché) | `VOICE-*` | — |
| 2 | Persuasion & conversion (value prop, benefit-led, clear CTA, answers audience problems/triggers) | `CONV-*` | weak conversion copy on a money-page slot = major |
| 3 | Brief coverage (section `talking_points` covered; LSI/keywords woven, not stuffed; thin content measured by `copy:check` `COVERAGE-1`, realized prose words vs brief `target_word_count`) | `BRIEF-*` | keyword stuffing = major |
| 4 | Claim grounding (every factual claim traces to `data/site-intake.json`) | `CLAIM-*` | unsupported factual claim = **blocker** |
| 5 | Readability & redundancy (clarity, scannability; no repetition across slots / sibling cards) | `READ-*` | — |
| 6 | Ownership integrity (no SEO title/meta/slug/schema/heading text as an editable slot) | `OWN-*` | violation = **blocker** |
| 7 | Mechanical floor (`copy:check`: glyphs, phrases-to-avoid, caps, balance, budgets) | `MECH-*` | `copy:check` fail = **blocker** |

**Overall band — set by the worst severity present** (fail closed):

- **approved** — no major, no blocker (at most a couple of minors).
- **acceptable** — minors only.
- **needs-revision** — at least one major, no blocker.
- **blocked** — at least one blocker.

Any blocker forces `needs-revision` (or `blocked`) regardless of how good the rest
reads. Do not soften a blocker to a minor to reach a passing band.

## Proof Gates

- Run `npm run copy:check` and fold its PASS/FAIL into dimension 7. A FAIL is a
  blocker; quote the failing lines.
- Read each money-page slot against its brief section and the intake: confirm the
  value prop, the audience problem it answers, and the CTA — cite the slot id.
- For thin-content / brief-coverage findings, cite the `copy:check` `COVERAGE-1`
  measured word count (realized prose words vs the brief `target_word_count`); the
  `BRIEF-*` finding states that number rather than guessing whether a slot is thin.
- Trace every factual claim (licensing, hours, pricing, guarantees, counts) to a
  field in `data/site-intake.json`; any claim that cannot be sourced is a `CLAIM-*`
  blocker, not a minor.
- Confirm no slot `role` carries SEO metadata or heading text (`OWN-*`); headings
  live only in `locked_headings`.
- Write a `Proof Summary` using the canonical labels from
  `docs/agent-quality-standard.md`, never renamed — `Static proof` /
  `Staging proof` / `Visual proof` / `Interaction proof` / `Editor-control proof` /
  `Tool proof` / `Manual-only gaps`. For copy review:
  - **Static proof** — `copy:check` result, `compose:check`, and brief coverage
    (`COVERAGE-1` realized prose words vs each brief `target_word_count`).
  - **Tool proof** — JSON artifact paths from the validators above.
  - **Manual-only gaps** — unsourced claims and subjective judgment calls
    (voice, persuasion) a validator cannot make.
  - Use `n/a` for `Staging proof` / `Visual proof` / `Interaction proof` /
    `Editor-control proof` when copy review does not touch them; never drop a label.
- Findings conform to `data/review-finding.schema.json`.

## Failure Policy

Fail closed. Report `needs-revision` (or `blocked`) when proof is incomplete or any
blocker fires: a `copy:check` failure, an unsupported factual claim, an ownership
violation, or missing brief/intake to judge against. Name the missing proof, the
rule IDs, and the offending slot ids. Never approve off-brand voice, fabricated
claims, or keyword-stuffed copy to reach a passing band. Never edit the deck
yourself — return fixes for `copywriter` to apply.

## Feedback Loop

The primary output is a prioritized, slot-level fix list fed back to `copywriter`:

- Each finding conforms to `data/review-finding.schema.json`:
  `{id, rule_id, dimension, severity, target:{slot}, evidence, recommended_fix,
  status, money_page}`. The copy slot id goes in `target.slot`; `money_page` stays.
- `copywriter` rewrites the flagged slots (money-page slots on Opus, the rest on
  Sonnet), re-runs `npm run copy:check`, and re-submits; `copy-review` re-scores
  only the affected slots plus a regression pass.
- **Bounded loop (per the "Bounded feedback loop" rules in
  `docs/agent-quality-standard.md`):** max 2 rounds — round 1 scores and emits
  fixes, round 2 verifies the fixes. A **recurring blocker** (a finding with the
  same `rule_id` + `target` reappearing after a fix) escalates the band to
  `blocked` and routes the root cause upstream (`layout-architect` / `copywriter`
  via the brief); do **not** open round 3.
- `dismissed[]` is the authoritative do-not-re-flag set: findings dismissed as
  "considered and dismissed" are excluded in round 2 and never re-flagged.
- The synthesize handoff carries `round` and `escalated_upstream`.
- **Upstream routing:** if the root cause is upstream — a thin composition that
  can't reach the brief depth, a missing `copy_slots` budget, or a brief gap — file
  it to `layout-architect`, `pattern-builder`/`certify-pattern`, or `seo-strategist`
  rather than asking `copywriter` to paper over it.

## Report

Include scope (pages/slots reviewed, money-page slots), the dimension scorecard with
status + rule IDs, the overall band, the prioritized slot-level fix list fed back to
`copywriter`, the `npm run copy:check` result, a `Proof Summary`, manual-only gaps
(unsourced claims), and the approval status. Use `approved` only when no blocker
remains, every dimension is pass/minor, and `copy:check` passes.

## Execution Model — Agents And Model Tiers

| Stage | Model | Why |
| --- | --- | --- |
| **Discover** — read deck, briefs, intake, `BRAND.md`, registry caps; run `copy:check` | Haiku | Mechanical read/parse + run the gate. |
| **Review** (per dimension / per money-page slot) — score voice, persuasion, claim-grounding, brief coverage against the rules | Opus | Subjective, high-stakes copy judgment; this is the whole point of the skill. |
| **Synthesize** — dedupe, score dimensions, compute band, write the report + slot-level feedback | Opus | Cross-finding judgment + durable write-up. |

## Handoff Contract

Stages pass validated JSON, not prose. Findings conform to
`data/review-finding.schema.json`:

```jsonc
// Review -> Synthesize (per dimension)
{ "dimension": 2, "name": "persuasion", "status": "major",
  "findings": [ { "id": "CONV-1-hero-body", "rule_id": "CONV-1", "dimension": "persuasion",
                  "severity": "major", "target": { "slot": "hero-body" },
                  "evidence": "opens with company history, not the customer benefit",
                  "recommended_fix": "lead with the at-home convenience benefit + CTA",
                  "status": "open", "money_page": true } ] }

// Synthesize -> copywriter (the feedback list)
{ "band": "needs-revision", "copy_check": "pass", "round": 1, "escalated_upstream": false,
  "fixes": [ { "id": "CONV-1-hero-body", "rule_id": "CONV-1", "dimension": "persuasion",
               "severity": "major", "target": { "slot": "hero-body" },
               "status": "open", "money_page": true, "recommended_fix": "..." } ],
  "dismissed": [ { "id": "READ-2-faq-q3", "rule_id": "READ-2", "target": { "slot": "faq-q3" },
                   "reason": "considered, not a real defect" } ] }
```

Rules: every finding carries an `id`, a `rule_id`, and `target.slot` so fixes and
re-scores map 1:1; severity uses `blocker | major | minor | nit`; only real defects
reach the report; `dismissed[]` is recorded so the next round does not re-flag them;
the handoff carries `round` and `escalated_upstream` for the bounded loop.
