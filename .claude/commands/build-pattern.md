---
description: Build one Supersonic theme pattern end-to-end, following the framework build loop.
---

Build a single Supersonic Core theme pattern: $ARGUMENTS

Work on exactly one pattern. Follow the build loop and hard rules in CLAUDE.md.

1. Read CLAUDE.md, DESIGN_SYSTEM.md, docs/gutenberg-authoring-standard.md, docs/design-tokens-standard.md, and wp-content/themes/supersonic-site-theme/CLAUDE.md.
2. Plan only this one pattern. State the pattern category, the editor-control contract, the chosen section spacing token (section-none/small/medium/large), and where the single editable H1 lives if this pattern owns it.
3. Build it as a native block pattern file in wp-content/themes/supersonic-site-theme/patterns/. Use design tokens only — no core/html, no arbitrary sizes, colors, spacing, radii, or shadows.
4. Keep the default outer layout on the theme gutter: 5% left/right padding and 1440px desktop container. Do not add left/right padding to plain section or layout wrappers. Use local padding only on real surfaces such as cards, CTA panels, form panels, and media/card surfaces.
5. Make foreground controls truthful: section text color should affect normal readable copy; button colors remain separately editable unless a button deliberately inherits ancestor text color; typography belongs on the heading/paragraph/list/quote blocks, not on a group wrapper.
6. Apply category rules: heroes must prove any promised left/center/right positioning; media blocks own replacement/crop/alt controls; cards own local card styling; CTAs need light/dark text and button contrast; header/footer must remain thin template-part pattern systems.
7. Run `npm run validate` and fix any failures it reports for this pattern.
8. Report what changed, files changed, checks run, known issues, and the next recommended step. Do not run live REST writes or deploy.
