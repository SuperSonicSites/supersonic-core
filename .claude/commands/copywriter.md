---
description: Write or fill website body copy from the SEO briefs (copywriter) on Opus, grounded in client intake and brand voice, enforcing layout budgets and the never-em-dashes rule via copy:check. Fills body copy only; never SEO titles, meta, schema, or headings.
model: opus
---

Run the autonomous Phase 8 copy pass for the composed pages: $ARGUMENTS

Example: `/copywriter` or `/copywriter just the home and drain-cleaning pages`.

This command runs on Opus because the voice spec and the per-page copy contract are
the hard-to-reverse decisions that govern every line of copy. Follow `CLAUDE.md`,
`docs/agent-quality-standard.md`, and `.claude/skills/copywriter/SKILL.md`. It runs
after `seo-strategist` (briefs) and `layout-architect` (composition), and is fully
autonomous: drive every decision from the briefs, the composition, and the intake.
Never interview the user, and never run live writes (the copy deck is the
deliverable).

1. Read `CLAUDE.md`, `docs/agent-quality-standard.md`,
   `.claude/skills/copywriter/SKILL.md`, `data/seo-briefs.json`,
   `data/site-intake.json`, `BRAND.md` (voice + `Mechanical Copy Rules`),
   `data/page-compositions.json`, `data/pattern-certifications.json` (`copy_slots`),
   and `data/copy-deck.schema.json` + `data/copy-deck.example.json`. Check
   `git status --short` first; preserve unrelated local work.
2. If a required input (brief, composition, or intake for a page) is missing, fail
   closed (`blocked`) and route the gap back to `seo-strategist`, `layout-architect`,
   or `new-site-init`. Do not prompt. Never invent brand or market facts.
3. Define the contract: the page set, and per page the resolved slot manifest
   (composition x registry `copy_slots`; instantiate each repeatable slot to its
   `instances`; denormalize each slot's role, caps, and `sibling_group`). Resolving
   the manifest is a deterministic join; per the skill Model Policy you may delegate
   it and the final JSON assembly to a Haiku sub-agent with a fully specified
   contract, then verify the returned data against the proof gates.
4. Synthesize the voice spec (brand voice, writing style, CTA tone, mechanical
   rules) and the per-page copy contract (the `talking_points`, LSI terms, and
   keywords to weave per section).
5. Draft body copy into each slot on Sonnet 4.6 (the Opus voice spec anchors the
   voice), weaving the brief material and respecting the caps. Use straight
   apostrophes and quotes for natural English (only the curly forms are banned). If
   the resolved slot capacity cannot reach the brief `target_word_count`, do not pad
   or keyword-stuff: fail closed and route to `layout-architect` to add a
   content-bearing section.
6. Fit + balance: rewrite any slot over its cap and rebalance any uneven
   `sibling_group`. Write `data/copy-deck.json` and run `npm run copy:check`; fix
   every mechanical failure (Sonnet).
7. Hand the deck to `copy-review` (Opus, own context) for the independent voice /
   persuasion / claim-grounding / brief-coverage review. Apply its slot-level fixes —
   money-page slots on Opus, the rest on Sonnet — then re-run `npm run copy:check` and
   re-submit to `copy-review`; loop until the band is `approved`/`acceptable` with no
   blocker (cap ~2 rounds). Do not author `seo_title`, `meta_description`, `url_slug`,
   `schema`, or the heading outline, and do not create live pages.
8. Report with a `Proof Summary` (copy:check result, budget/registry consistency,
   ownership, grounding, the `copy-review` band + findings, manual-only gaps). If any
   proof is missing, fail closed with `blocked` or `needs-revision`; do not mark the
   pass complete. Hand off the deck for approval-gated placement and a `seo-auditor`
   pass.
