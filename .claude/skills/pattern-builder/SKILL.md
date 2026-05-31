---
name: pattern-builder
description: Use when building or changing exactly one WordPress block pattern or section in the Supersonic theme, including requests like "build a hero pattern", "create a CTA section", "add a pricing pattern", or "modify the testimonial pattern". Builds with native blocks and theme design tokens, then captures section-level desktop, tablet, and mobile screenshots.
---

# Pattern Builder Skill

Use this skill when creating or changing one WordPress block pattern.

## Rules

- Build one pattern at a time.
- Use native WordPress blocks first.
- Use design tokens from `DESIGN_SYSTEM.md` and theme settings.
- Build so the pattern satisfies every `active` lesson in `docs/pattern-lessons.md` — these are
  recurring QA defects already turned into build rules. Don't reintroduce a solved mistake.
- Do not create custom blocks unless approved.
- Do not change global tokens unless approved.
- Do not add third-party plugins.

## Workflow

1. Read `CLAUDE.md`, `DESIGN_SYSTEM.md`, `BRAND.md`, the theme `CLAUDE.md`, and
   `docs/pattern-lessons.md` (start with its **Active Build Rules** checklist).
2. Define the single pattern being built. Note which lessons in `docs/pattern-lessons.md` apply to
   it (match on **Applies to**: heroes, sections, CTAs, contact, header/footer).
3. Build only that pattern, satisfying every applicable `active` lesson.
4. Sync to Hostinger staging when needed.
5. Capture section-level desktop, tablet, and mobile screenshots.
6. Fix only the issues found in review.
7. Before reporting, self-check the pattern against each applicable lesson. Report files changed,
   screenshots reviewed, checks run, the lessons you verified against, and remaining risks. If you
   had to violate a lesson, say which and why.
