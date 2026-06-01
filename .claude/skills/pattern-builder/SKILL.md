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
- Define the editor-control contract before writing markup.
- Do not create custom blocks unless approved.
- Do not change global tokens unless approved.
- Do not add third-party plugins.

## Control Ownership Contract

Every pattern must make clear which block owns each editor control. Do not rely
on a parent-level control if child blocks override it or if the pattern layout
cannot make the change visible.

- Outer section group owns background color and vertical section spacing.
- Inner layout group owns content width and horizontal positioning unless the
  section group must own a native Gutenberg justification control.
- Text blocks own text alignment and typography presets.
- Buttons block owns button-group justification and internal button spacing.
- Individual buttons own button labels, URLs, button colors, and width.
- Media blocks own media replacement, crop/aspect intent, and alt text.
- Card groups own card background, border, radius, shadow, and internal padding.

If a control appears in the editor, either structure the pattern so it visibly
works or document that the control is intentionally local to a child block.

## Category Contracts

- Heroes: must support visible left, center, and right content positioning when
  the pattern exposes a justification control. For simple heroes, the selected
  section group should own the approved `760px` content rail and
  `justifyContent` setting so Gutenberg can move the rail left, center, or
  right inside the default 5% gutter / 1440px container. Do not add a nested
  constrained group solely to create the text rail when that adds another
  `has-global-padding` layer. Ship separate approved variants when a hero layout
  has fixed positioning by design.
- Intros and text sections: prioritize narrow readable width and text-block
  alignment controls. Do not imply full-section justification changes the text.
- Media split sections: use explicit image-left/text-right and text-left/image-right
  variants instead of relying on generic group justification.
- Cards and grids: the section group controls the band; each card controls its
  own background, radius, border, shadow, padding, and local text.
- Trust sections: preserve quote, list, logo, or stat semantics before adding
  decorative controls.
- Conversion sections and CTAs: verify light and dark foreground/background
  combinations for headings, body copy, inline links, and button variants.
- Headers and footers: template-part structure and navigation rules override
  normal section behavior.

## Foreground And Typography Rules

- Section background changes must have a deliberate readable foreground plan.
- Section text color should affect normal readable copy unless a child block
  intentionally owns its own text color.
- Buttons keep a separate color contract by default. If an editor explicitly
  applies text color to an ancestor, button labels without their own text color
  inherit that color; buttons with explicit text color keep their local setting.
- Inline links and button links are separate color contracts.
- Group typography is not the primary typography control when child text blocks
  use preset font sizes. Test typography at the intended text block.

## Workflow

1. Read `CLAUDE.md`, `DESIGN_SYSTEM.md`, `BRAND.md`, and the theme `CLAUDE.md`.
2. Define the single pattern being built and its category contract.
3. Define which controls are expected to work at the section, inner group,
   text, button, media, and card levels.
4. Build only that pattern.
5. Test the control contract in the editor, including dark background/light text
   and any promised alignment or justification controls.
6. Sync to Hostinger staging when needed.
7. Capture section-level desktop, tablet, and mobile screenshots.
8. Fix only the issues found in review.
9. Report files changed, screenshots reviewed, checks run, and remaining risks.
