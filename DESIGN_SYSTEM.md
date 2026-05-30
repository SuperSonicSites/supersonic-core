# Design System

This file defines the human-readable design rules for the site framework.

The matching implementation belongs in `wp-content/themes/supersonic-site-theme/theme.json` when the theme is initialized.

The detailed token reference lives in `docs/design-tokens-standard.md`.

## Design Principles

- Build mobile-first.
- Use native WordPress blocks where possible.
- Use theme tokens for spacing, color, typography, and layout.
- Keep patterns consistent and easy to edit.
- Do not invent arbitrary font sizes, spacing values, shadows, border radii, or breakpoints.
- Review every visual change with desktop, tablet, and mobile screenshots.

## Layout Widths

- Default content max width: 1440px
- Narrow text width: 760px
- Wide media max width: 1440px
- Default horizontal gutter: 5%
- Constrained layouts should use `margin-left: auto` and `margin-right: auto`
- Intentional full-width image/media sections may extend to the viewport edge when the pattern requires it

## Section Padding

- `section-none`: no top/bottom padding
- `section-small`: compact vertical padding
- `section-medium`: default section padding, up to about 64px
- `section-large`: major section padding, up to about 128px

Every section pattern must choose one of these spacing presets.

## Horizontal Padding

- Default: 5%
- Full-width exceptions: only when the section or media treatment intentionally needs edge-to-edge rendering

## Typography

- Small text: 14px
- Body text: 16px to 18px
- Large/lead text: 18px to 22px
- Heading 3: 24px to 32px
- Heading 2: 32px to 48px
- Heading 1: 40px to 64px
- Display: 48px to 80px, used rarely
- Body line height: 1.6
- Heading line height: 1.05 to 1.15
- Letter spacing: 0 unless a brand rule explicitly requires otherwise
- Use fluid typography presets from `theme.json`
- Do not use arbitrary font sizes without approval

## Colors

Use semantic color roles:

- `base`
- `contrast`
- `contrast-subtle`
- `surface`
- `muted`
- `border`
- `accent`
- `accent-contrast`

Do not add one-off colors in patterns. Add new palette colors only when a project need is documented and approved.

## Radius And Shadows

- Default radius: 8px
- Small radius: 4px
- Large radius: 16px
- Pill radius: 999px
- Full-width media may use no radius
- Prefer borders and spacing over shadows
- Core WordPress shadow presets are disabled by default

## Buttons

Buttons should be clear, accessible, and easy to tap.

Rules:

- Use consistent button styles.
- Use action-oriented labels.
- Avoid tiny tap targets.
- Do not use multiple competing primary buttons in the same section.

## Grids

- Use simple responsive grids.
- Columns should stack on mobile unless there is a strong reason not to.
- Keep card grids consistent in spacing and height behavior.
- Avoid dense layouts that cause cramped mobile views.

## Images

- Use real, relevant images when possible.
- Avoid busy text-over-image layouts on mobile.
- Review image cropping at desktop, tablet, and mobile sizes.
- Use meaningful alt text unless the image is decorative.
- Avoid oversized images.

## Patterns

Common V1 pattern types:

- hero
- intro section
- feature grid
- CTA band
- FAQ section
- testimonial section
- service card grid
- image/text section

Each pattern must:

- use native blocks where possible
- use design tokens
- choose one semantic section spacing token
- work on mobile, tablet, and desktop
- avoid overflow
- preserve readable text
- use accessible buttons and links

## Pattern Library Policy

The editor pattern library should stay intentionally small.

- Core WordPress patterns are disabled.
- Remote WordPress.org pattern directory loading is disabled.
- Native blocks remain available.
- Approved Supersonic theme patterns live in the theme `/patterns` folder.
- Add one pattern at a time only after desktop, tablet, and mobile screenshot review.
- Do not rely on random bundled patterns from WordPress core, remote directories, or third-party plugins for production layouts.

## Design Do-Nots

- Do not create arbitrary one-off CSS for spacing.
- Do not create arbitrary one-off font sizes, colors, radii, or shadows.
- Do not use custom blocks when a native block pattern is enough.
- Do not hide important content behind sliders.
- Do not rely on busy image backgrounds for critical copy.
- Do not add decorative effects that hurt readability.
- Do not change global design tokens without approval.
