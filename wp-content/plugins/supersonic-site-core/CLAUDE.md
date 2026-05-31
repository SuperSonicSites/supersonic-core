# Site-Core Plugin Agent Instructions

This directory contains the site-core plugin.

## Plugin Responsibility

The plugin controls functionality that should survive theme changes:

- custom post types
- taxonomies
- REST helpers
- schema helpers
- SEO helper functions
- integrations
- reusable business logic
- the verified theme auto-update layer
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

## Current Functionality

The plugin ships the theme auto-update system (see
`docs/workflows/theme-auto-deploy.md`):

- `includes/class-supersonic-theme-updater.php` — offers verified theme updates
  from GitHub Releases and checks SHA-256 before WordPress installs them.
- `includes/class-supersonic-deploy-controller.php` — registers
  `POST /wp-json/supersonic/v1/check-updates`, gated on the `update_themes`
  capability, payload-free, to trigger an immediate verified update.
- `includes/class-supersonic-deploy-role.php` — the least-privilege
  `supersonic_deployer` role used by CI, created on activation.

Keep new functionality aligned with these patterns: capability-checked REST
routes, no unauthenticated writes, least-privilege roles, and verification
before any install.
