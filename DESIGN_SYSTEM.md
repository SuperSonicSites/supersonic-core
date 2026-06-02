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
- Approved Supersonic shadow presets are available for images, cards, dropdowns, and featured elements
- Do not use arbitrary shadow values

## Page Heading Rule

The default page template does not force a page title above every page.

- Every AI-built page layout must include one clear editable H1.
- The H1 should usually live in the first hero or intro pattern.
- Do not create page layouts without an H1.
- Do not create page layouts with multiple H1s.

## Buttons

Buttons should be clear, accessible, and easy to tap.

Rules:

- Use consistent button styles.
- Use action-oriented labels.
- Avoid tiny tap targets.
- Do not use multiple competing primary buttons in the same section.

## Navigation

The site header and navigation are a first-class system primitive, not a pattern.

- The header is a pattern (`header-simple`); the `header` template part is a thin mount that references it via `wp:pattern`. The navbar itself is a native `core/navigation` block inside that pattern.
- Header layouts are modular and swappable: each is a sibling pattern bound to the header area, sharing one CSS/motion layer.
- Structure, color, and typography come from `theme.json`; interaction states and animation live in `assets/css/navigation.css`.
- The header is full-width, sticky, and rides the same 5% gutter as page content — it never adds its own horizontal inset.
- Desktop links use an animated accent underline and an active-state indicator.
- On mobile, navigation collapses to a hamburger that opens the customizable WordPress 7.0 overlay, animated with a fade/slide and staggered menu items.
- All navigation motion uses the shared transition tokens and is disabled under `prefers-reduced-motion`.
- Mega-menu support ships as a native sibling header pattern (`header-mega`): a wide multi-column link panel built from native `core/navigation` blocks (a top-level `supersonic-mega` submenu containing nested submenus styled as static columns) plus scoped CSS. It collapses into the hamburger overlay at the 1024px tablet boundary. The base navbar (`header-simple`) is unchanged. A richer Interactivity-API custom-block mega menu (for non-link content such as cards, images, and featured CTAs) remains a possible future increment requiring separate approval.

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

0.1.5 pattern categories:

- Supersonic Headers
- Supersonic Footers
- Supersonic Heroes
- Supersonic Intros
- Supersonic Media
- Supersonic Cards
- Supersonic Trust
- Supersonic Conversion
- Supersonic Info

Each pattern must:

- use native blocks where possible
- use design tokens
- choose one semantic section spacing token
- work on mobile, tablet, and desktop
- avoid overflow
- preserve readable text
- use accessible buttons and links

## Pattern Control Contracts

Every pattern must define which block owns each editor control before it is
built or changed. QA approval must include proof that the promised controls are
visible and truthful.

Global defaults:

- the outer section rides the theme 5% gutter and 1440px desktop container
- the outer section owns background color and vertical section spacing
- normal heading, paragraph, list, and quote text should inherit explicit
  section or local-surface text color unless a child override is intentional
- buttons own their normal color contract locally; button labels inherit an
  ancestor text color only when the button has no local text color
- typography belongs on text blocks, not on group wrappers
- plain inner wrappers do not add horizontal padding; only real local surfaces
  such as cards, CTA panels, form panels, and media/card surfaces may use
  tokenized interior padding

Category defaults:

- Heroes may promise visible left, center, and right positioning. If they do,
  the selected block must actually move the content rail.
- Media split sections use explicit image-left/text-right and
  text-left/image-right variants instead of generic group justification.
- Cards own local card surface, border, radius, shadow, padding, and local text
  choices.
- CTAs need light/dark contrast checks for headings, body copy, inline links,
  and buttons.
- Header and footer patterns follow template-part and navigation contracts
  before generic section rules.

FAQ sections that need schema should use the approved Rank Math FAQ block. The theme must not add duplicate FAQ JSON-LD.

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
