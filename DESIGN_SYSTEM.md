# Design System

This file defines the human-readable design rules for the site framework.

The matching implementation belongs in `wp-content/themes/supersonic-site-theme/theme.json` when the theme is initialized.

## Design Principles

- Build mobile-first.
- Use native WordPress blocks where possible.
- Use theme tokens for spacing, color, typography, and layout.
- Keep patterns consistent and easy to edit.
- Do not invent arbitrary font sizes, spacing values, shadows, border radii, or breakpoints.
- Review every visual change with desktop, tablet, and mobile screenshots.

## Layout Widths

- Default content width: 1200px
- Narrow text width: 760px
- Wide media width: 1440px

## Section Padding

- Desktop vertical padding: 80px
- Tablet vertical padding: 56px
- Mobile vertical padding: 40px

## Horizontal Padding

- Desktop: 40px
- Tablet: 32px
- Mobile: 20px

## Typography

- Body text: 16px to 18px
- Small text: 14px
- Body line height: 1.5 to 1.7
- Heading line height: 1.05 to 1.2
- Letter spacing: 0 unless a brand rule explicitly requires otherwise

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
- work on mobile, tablet, and desktop
- avoid overflow
- preserve readable text
- use accessible buttons and links

## Design Do-Nots

- Do not create arbitrary one-off CSS for spacing.
- Do not use custom blocks when a native block pattern is enough.
- Do not hide important content behind sliders.
- Do not rely on busy image backgrounds for critical copy.
- Do not add decorative effects that hurt readability.
- Do not change global design tokens without approval.

