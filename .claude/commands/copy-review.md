---
description: Grade a Supersonic copy deck against brand voice and the SEO briefs on Opus, fold in the mechanical copy:check, and feed slot-level rule-ID fixes back to the copywriter. Reviews copy only.
model: opus
---

Grade the website copy deck and drive its revision: $ARGUMENTS

Example: `/copy-review` or `/copy-review just the home page`.

Review only; never write copy, never deploy. This runs on Opus because the
voice/persuasion/claim judgment is the whole point. Follow `CLAUDE.md`,
`docs/agent-quality-standard.md`, and `.claude/skills/copy-review/SKILL.md`. It runs
after `copywriter` produces `data/copy-deck.json`, and is fully autonomous — discover
the target and inputs at runtime.

1. Read `.claude/skills/copy-review/SKILL.md`, `data/copy-deck.json`,
   `data/copy-deck.schema.json`, `data/seo-briefs.json`, `data/site-intake.json`,
   `BRAND.md` (voice + `Mechanical Copy Rules`), `data/page-compositions.json`, and
   `data/pattern-certifications.json` (`copy_slots`). Check `git status --short` first;
   preserve unrelated local work.
2. Define the review contract: the pages/slots under review, which slots are
   money-page slots, the rubric dimensions, which findings are gating blockers, and
   the brief material + intake facts each slot is judged against.
3. Mechanical floor: run `npm run copy:check` and fold its PASS/FAIL into dimension 7.
   A failure is a blocker; quote the failing lines.
4. Score each dimension (voice fidelity, persuasion/conversion, brief coverage, claim
   grounding, readability, ownership integrity, mechanical) as pass/minor/major/blocker
   with rule IDs and slot ids. Trace every factual claim to `data/site-intake.json`; an
   unsupported claim or an ownership violation is a blocker.
5. Compute the overall band by the worst-severity rule in
   `.claude/skills/copy-review/SKILL.md`: any blocker forces `needs-revision`/`blocked`.
   Do not soften a blocker to reach a passing band.
6. Produce the prioritized slot-level fix list (`slot_id`, rule, severity, evidence,
   recommended fix, money_page) and feed it back to `copywriter`, which rewrites the
   flagged slots (money-page slots on Opus) and re-submits. Re-score affected slots
   plus a regression pass; loop until band `approved`/`acceptable`, no blocker.
7. Route upstream root causes (thin composition, missing `copy_slots`, brief gap) to
   `layout-architect`, `pattern-builder`/`certify-pattern`, or `seo-strategist` rather
   than papering over them in copy.
8. Include a `Proof Summary` (mechanical result, voice, persuasion, claim-grounding,
   brief coverage, manual-only gaps). Fail closed with `needs-revision`/`blocked` if
   proof is incomplete or any blocker fires; use `approved` only when no blocker
   remains and `copy:check` passes. Never edit the deck yourself.
