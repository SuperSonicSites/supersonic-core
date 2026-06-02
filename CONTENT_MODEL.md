# Content Model

This file defines content structures and functionality that must be stable across theme changes.

For V1, keep the content model minimal. Do not create custom post types, taxonomies, or field systems until the site actually needs them.

## Default WordPress Content

Use native WordPress pages and posts first.

Recommended starting point:

- Pages for main site content
- Posts only if the site has an active publishing strategy
- Native media library for images and files
- Native navigation and template parts where possible

## Custom Post Types

No custom post types in Phase 1.

Possible future post types, only if needed:

- Services
- Testimonials
- Team Members
- Projects
- Locations
- FAQs

When Init keyword research reveals repeated entities (multiple services, locations, or FAQs), `seo-strategist` may flag a candidate structured type here for review. Flagging is not approval — creating a custom post type still requires the Human Approval Gate.

Custom post types belong in `wp-content/plugins/supersonic-site-core/`, not the theme.

## Taxonomies

No custom taxonomies in Phase 1.

Taxonomies belong in the site-core plugin when needed.

## Fields

Do not add ACF or another field plugin in V1 unless approved.

Prefer native block content and patterns first.

If structured fields become necessary, document:

- reason
- fields needed
- edit workflow
- alternatives considered
- approval status

## Reusable Content Rules

Use native patterns or synced patterns for reusable presentation content.

Use plugin functionality only when data must be structured, queried, reused, or protected from theme changes.

