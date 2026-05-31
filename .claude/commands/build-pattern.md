---
description: Build one Supersonic theme pattern end-to-end, following the framework build loop.
---

Build a single Supersonic Core theme pattern: $ARGUMENTS

Work on exactly one pattern. Follow the build loop and hard rules in CLAUDE.md.

1. Read CLAUDE.md, DESIGN_SYSTEM.md, docs/gutenberg-authoring-standard.md, docs/design-tokens-standard.md, docs/pattern-lessons.md, and wp-content/themes/supersonic-site-theme/CLAUDE.md.
2. Plan only this one pattern. State the chosen section spacing token (section-none/small/medium/large), where the single editable H1 lives if this pattern owns it, and which `active` lessons in docs/pattern-lessons.md apply to it.
3. Build it as a native block pattern file in wp-content/themes/supersonic-site-theme/patterns/. Use design tokens only — no core/html, no arbitrary sizes, colors, spacing, radii, or shadows. Satisfy every applicable lesson in docs/pattern-lessons.md.
4. Run `npm run validate` and fix any failures it reports for this pattern.
5. Self-check the pattern against each applicable lesson. Report what changed, files changed, checks run, lessons verified against, known issues, and the next recommended step. Do not run live REST writes or deploy.
