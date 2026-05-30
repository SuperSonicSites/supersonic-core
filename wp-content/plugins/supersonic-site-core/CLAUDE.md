# Site-Core Plugin Agent Instructions

This directory contains the small site-core plugin skeleton.

## Plugin Responsibility

The plugin controls functionality that should survive theme changes:

- custom post types
- taxonomies
- REST helpers
- schema helpers
- SEO helper functions
- integrations
- reusable business logic
- dynamic blocks only when approved and necessary

## Rules

- Keep the plugin small.
- Do not create functionality until the site needs it.
- Do not add third-party dependencies without approval.
- Do not create unauthenticated write actions.
- Every REST endpoint must use permission checks.
- Sanitize input and escape output.
- Use nonces for admin actions.
- Prepare database queries.
- Do not commit secrets.

## V1 Status

Phase 1 creates instructions and structure only.

Plugin functionality is deferred until later phases.

