# WordPress Compatibility

## Current Latest Stable Target

- WordPress core target: 7.0
- Theme minimum WordPress version: 7.0
- Plugin minimum WordPress version: 7.0
- Tested up to: 7.0

WordPress 7.0 was released on May 20, 2026. The official WordPress download page lists WordPress 7.0 as the current download.

Before any theme, plugin, pattern, or block work, verify the latest stable WordPress core release from official WordPress sources. Do not target beta, nightly, trunk, or Gutenberg plugin-only behavior unless the user explicitly approves it.

## Server Environment

WordPress.org recommends:

- PHP 8.3 or greater
- MySQL 8.0 or greater
- MariaDB 10.6 or greater

The theme and plugin currently declare `Requires PHP: 8.0` because the code does not use PHP 8.3-only syntax. Before production launch, staging should still be reviewed against the WordPress.org recommended server stack when hosting allows it.

## Build Rules

- Build for WordPress 7.0 core first.
- Use native blocks and block theme APIs where possible.
- Do not use Custom HTML blocks for editable design work.
- Keep `theme.json` schema pinned to the supported WordPress target.
- Use custom blocks only when native blocks and patterns are insufficient.
- Require approval before using Gutenberg plugin-only features.
- Test all visual changes on Hostinger staging with desktop, tablet, and mobile screenshots.
- Repackage the theme and plugin after compatibility metadata changes.

## Compatibility Review

Before upload to staging:

- Confirm `theme.json` parses.
- Confirm theme and plugin headers declare the current WordPress target.
- Confirm no unsupported custom block or plugin APIs were added.
- Confirm packages contain only WordPress upload assets.
- Confirm archive paths use `/` separators.

Before production handoff:

- Confirm staging is running the intended WordPress core version.
- Confirm PHP version is acceptable for the host and project.
- Confirm no console errors or editor errors appear.
- Confirm theme activation, plugin activation, editor load, and frontend render.
