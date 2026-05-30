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
- Do not register business-critical data in the theme.
- Do not add custom post types or taxonomies here.
- Do not add REST endpoints here.
- Do not add schema logic here unless it is purely presentational, which should be rare.
- Do not change global design tokens without approval.
- Every visual change requires desktop, tablet, and mobile section-level screenshots from Hostinger staging.

## V1 Status

Phase 1 creates instructions and structure only.

Full templates, theme implementation, and patterns are deferred until later phases.
