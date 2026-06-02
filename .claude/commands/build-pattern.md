---
description: Build one Supersonic theme pattern end-to-end, following the proof-first framework build loop.
---

Build a single Supersonic Core theme pattern: $ARGUMENTS

Work on exactly one pattern. Follow `CLAUDE.md`,
`docs/agent-quality-standard.md`, and
`.claude/skills/pattern-builder/SKILL.md`.

1. Read `CLAUDE.md`, `DESIGN_SYSTEM.md`,
   `docs/gutenberg-authoring-standard.md`,
   `docs/design-tokens-standard.md`, and
   `wp-content/themes/supersonic-site-theme/CLAUDE.md`.
2. Discover the existing pattern/category peers, registry entry if one exists,
   latest relevant report, and current Git status before asking questions.
3. Plan only this pattern. State the pattern category, section spacing token,
   H1 ownership if relevant, and approval gates.
4. Write the control contract card before editing:

```text
Pattern:
Category:
Selected block:
Promised controls:
Owning block for each control:
Expected proof:
Manual-only gaps:
```

5. Build it as a native block pattern file in
   `wp-content/themes/supersonic-site-theme/patterns/`. Use design tokens only:
   no `core/html`, arbitrary sizes, colors, spacing, radii, or shadows.
6. Keep the default outer layout on the theme gutter: 5% left/right padding and
   1440px desktop container. Do not add left/right padding to plain section or
   layout wrappers. Use local padding only on real surfaces such as cards, CTA
   panels, form panels, and media/card surfaces.
7. Make foreground controls truthful: section text color affects normal readable
   copy; button colors remain separately editable unless a button deliberately
   inherits ancestor text color; typography belongs on heading, paragraph, list,
   or quote blocks.
8. Apply category rules: heroes prove promised left/center/right positioning;
   media blocks own replacement/crop/alt controls; cards own local styling; CTAs
   need light/dark text and button contrast; header/footer remain thin
   template-part pattern systems.
9. Run `npm run validate` and fix failures for this pattern.
10. When staging proof is available, use cache-busted URLs, a selector under
    `main` for QA pages, and `npm run pattern:proof` for browser assertions and
    screenshots.
11. Include a `Proof Summary` in the report. If proof is missing, fail closed
    with `needs-revision`; do not approve. Do not run live REST writes or
    deploy.
