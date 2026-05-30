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
- Do not create custom blocks unless approved.
- Do not change global tokens unless approved.
- Do not add third-party plugins.

## Workflow

1. Read `CLAUDE.md`, `DESIGN_SYSTEM.md`, `BRAND.md`, and the theme `CLAUDE.md`.
2. Define the single pattern being built.
3. Build only that pattern.
4. Sync to Hostinger staging when needed.
5. Capture section-level desktop, tablet, and mobile screenshots.
6. Fix only the issues found in review.
7. Report files changed, screenshots reviewed, checks run, and remaining risks.
