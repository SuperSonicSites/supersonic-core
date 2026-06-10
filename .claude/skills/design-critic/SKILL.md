---
name: design-critic
description: Use when judging or improving the AESTHETIC quality of a rendered Supersonic page or pattern, including requests like "design critique", "make this page look premium", "is this tasteful", "art-direct this page", "why does this look generic", or "run the design critic". Works from real rendered screenshots (local Playground harness), compares against the curated reference library in docs/design-references/, and returns capped, prioritized, mechanical directives (CRIT rule IDs) for layout-architect or pattern-builder to apply. Distinct from layout-review (standards compliance) and visual-qa (pixel correctness) — this skill judges taste.
---

# Design Critic Skill

Grade what a page LOOKS like, not whether it follows the rules — the gates
already enforce rules. The critic closes the taste gap: it compares rendered
screenshots against curated references and converts aesthetic judgment into
mechanical, appliable directives. Follow `docs/agent-quality-standard.md`.

Run on the strongest available model (Opus) — taste judgment degrades faster
than mechanical work on smaller models.

## Discovery

Discover all inputs from repo facts; never ask the user for what the repo knows.

1. Rendered screenshots — desktop/tablet/mobile from the LOCAL harness
   (`npm run render -- --patterns <slug>` for sections; the composed-page
   boot for full pages). Never critique from source markup alone.
2. `docs/design-references/` — load the industry-matching case studies and
   the general annotations. If none match the industry, say so in the report
   and use the general set.
3. Brand DNA + personality — `data/site-intake.json` design block, the
   compiled `theme.json`, and which `styles/*.json` personality is active.
4. Imagery — `captured/asset-inventory.json` and `data/image-plan.json`.

## Critique Axes (score each 1-5, anchor against references)

| Axis | What 5 looks like | Rule ID |
|------|-------------------|---------|
| Type contrast | Clear size/weight jumps between display, heading, body; no timid scale | CRIT-TYPE |
| Band rhythm | Light/tinted/dark alternation with a deliberate dark close; no 3+ same-background runs | CRIT-RHYTHM |
| Color courage | The brand fill used vividly where it earns attention (CTAs, bands); never muddied, never wallpaper | CRIT-COLOR |
| Imagery | Best-scored real photos placed where they carry emotion (hero, story); no placeholder art, no unused hero-grade assets | CRIT-IMAGE |
| Density & whitespace | Generous, consistent breathing room; nothing cramped, nothing hollow | CRIT-SPACE |
| Premium tells | No "AI-made" tells: default-looking buttons, equal-weight everything, centered-everything monotony | CRIT-TELL |

Mandatory mechanical checks (always run, cheap):
- any image-plan slot using an asset scoring < 60% of the highest UNUSED
  photo in the inventory → CRIT-IMAGE finding naming both files
- personality vs industry mismatch per the reference annotations → CRIT-TELL

## Contract

A capped list (max 6) of directives, each: rule ID, severity, the screenshot
evidence (file + what to look at), and a MECHANICAL fix the executing skill
can apply without re-judging (e.g. "swap hero-simple -> hero-simple-dark",
"assign captured/assets/images/X.jpg to home#1#1", "move stat band between
services and testimonial"). Never emit "make it more premium" — if a finding
cannot be stated mechanically, describe the smallest experiment that would
make it mechanical.

## Iteration Loop

critique -> apply (layout-architect / pattern-builder) -> re-render -> re-critique.
Max 3 rounds; stop early when no directive exceeds severity "minor". Each round
re-renders through the local harness — never judge stale screenshots.

## Proof Gates

Every critique report ends with a Proof Summary listing: screenshots reviewed
(paths + viewports), references compared against, axes scored with anchors,
directives issued, and what was NOT verified (e.g. no industry references
available). A critique without fresh-render evidence is invalid — fail closed.

## Failure Policy

Fail closed. No renders available -> do not critique from markup; run the
harness first or stop and say what is missing. No references for the
industry -> proceed with the general set but mark every score
"unanchored" in the report. If a directive cannot be re-verified by a
re-render in the same session, mark it "issued, unverified" — never
"done".

## Report

The critique report contains: per-axis scores with reference anchors, the
capped directive list (rule ID, severity, evidence, mechanical fix), the
iteration round number, and the Proof Gates summary. Deliver it to the user
and hand the directives to layout-architect / pattern-builder unchanged.
