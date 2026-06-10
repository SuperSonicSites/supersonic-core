# Theme Agent Instructions

This directory contains the custom lean block theme skeleton.

## Theme Responsibility

The theme controls presentation only:

- `theme.json`
- templates
- template parts
- block patterns
- CSS
- typography
- spacing
- colors
- layout
- frontend presentation

## Rules

- Use native WordPress blocks first.
- Use block patterns for reusable sections.
- Use `theme.json` design tokens for spacing, typography, colors, radius, and layout.
- Every section pattern must choose `section-none`, `section-small`, `section-medium`, or `section-large`.
- Keep the pattern library limited to approved Supersonic theme patterns.
- Do not re-enable core or remote WordPress pattern directories without approval.
- Do not use arbitrary font sizes, spacing values, colors, radii, or shadows without approval.
- Default page templates stay layout-neutral; AI-built page layouts must supply exactly one editable H1.
- Header and footer template parts should stay thin mounts for canonical pattern files.
- Header navigation interaction CSS must remain scoped to `.supersonic-site-header`.
- Shadows must use approved theme shadow presets.
- Do not register business-critical data in the theme.
- Do not add custom post types or taxonomies here.
- Do not add REST endpoints here.
- Do not add schema logic here unless it is purely presentational, which should be rare.
- Do not change global design tokens without approval.
- Every visual change requires desktop, tablet, and mobile section-level screenshots from Hostinger staging.
- Use `docs/workflows/theme-pattern-certification.md` before approving theme or pattern increments.

## Color and Personality Architecture

- The committed default palette is a monochrome chassis; client color arrives
  only via `npm run design:compile -- --write` (brand DNA, WCAG-gated).
- `accent` is the vivid brand fill (buttons, bands); `accent-ink` is the
  readable link/eyebrow/text role on light bands. Never use `accent` as text
  on light backgrounds; never muddy `accent` to make it readable.
- `styles/*.json` are colorless art-direction personalities (typography,
  shape, density only). Token slugs are identical across personalities.
- Dark tone variants (`hero-simple-dark`, `cta-band-dark`,
  `section-stat-band-dark`) provide band rhythm; bare buttons on dark bands
  invert to white by the on-dark contract in `assets/css/patterns.css`, and
  an explicit accent button opts into the brand-pop close.

## Status

The theme is fully implemented: templates, template parts, 32 registry
patterns, design tokens, motion system, and personalities. Every pattern
change must pass `npm run validate`, render clean in the Playground harness
(`npm run render -- --patterns <slug>`), and update visual baselines
deliberately (`npm run visual:diff`).
