# Supersonic Core Agent Instructions

## Purpose

This repo is the source of truth for the Supersonic AI website framework.

It is not a multi-client platform and it is not a full local WordPress runtime. It is the controlled framework for AI-driven website production: documentation, instructions, theme skeleton, plugin skeleton, tools, skills, and review workflows.

## Operating Model

1. Repo is the source of truth.
2. Hostinger staging is the real WordPress build, preview, integration testing, screenshot review, and QA environment.
3. Production is protected and requires explicit approval before deploy.
4. Daily Updraft backups are the full-site rollback layer for the WordPress database, uploads, settings, plugins, themes, and full-site recovery.
5. Do not edit Hostinger files randomly without syncing changes back to Git.
6. Do not run live REST writes without explicit approval.
7. Do not deploy to production without explicit approval.
8. Every visual change must be reviewed with desktop, tablet, and mobile screenshots for the specific section or pattern changed.
9. Build and review one pattern or system piece at a time.

## Files To Read First

Before starting meaningful work, read:

1. `AGENTS.md`
2. `README.md`
3. `SITE.md`
4. `BRAND.md`
5. `DESIGN_SYSTEM.md`
6. `PAGE_MAP.md`
7. `CONTENT_MODEL.md`
8. `SEO_STRATEGY.md`
9. `SECURITY.md`
10. `QA_CHECKLIST.md`
11. `DEPLOY_CHECKLIST.md`

When working inside the theme, also read `wp-content/themes/supersonic-site-theme/AGENTS.md`.

When working inside the plugin, also read `wp-content/plugins/supersonic-site-core/AGENTS.md`.

## Architecture Rules

Theme equals presentation.

Plugin equals functionality.

Tools equal automation.

Docs equal project memory.

The theme owns:

- `theme.json`
- templates
- template parts
- native block patterns
- CSS
- typography
- colors
- spacing
- layout
- frontend presentation

The plugin owns:

- custom post types
- taxonomies
- REST helpers
- schema helpers
- SEO helper functions
- integrations
- reusable business logic
- dynamic blocks only when native blocks and patterns are not enough

## Native Blocks First

Preferred build order:

1. Native WordPress blocks
2. Block patterns
3. Synced patterns or template parts
4. Custom blocks
5. Plugin functionality

Do not create custom blocks unless native blocks and patterns cannot solve the need cleanly.

## Human Approval Gates

Require explicit approval before:

- adding third-party plugins
- creating custom blocks
- changing global design tokens
- changing theme-wide layout rules
- running live REST writes
- deploying to production
- changing redirects
- deleting content
- changing user roles or permissions
- editing security settings
- directly editing files on Hostinger without a Git sync plan

## Build Loop

Use small controlled tasks:

1. Plan the single piece of work.
2. Build only that piece.
3. Deploy or sync to Hostinger staging when needed.
4. Capture desktop, tablet, and mobile screenshots for that section or pattern.
5. Review against design, accessibility, SEO, and security rules as relevant.
6. Fix only the identified issues.
7. Re-review.
8. Commit after approval.
9. Move to the next piece.

## Definition Of Done

A task is done only when the final report includes:

- what changed
- files changed
- screenshots reviewed, if visual
- checks run
- known issues
- next recommended step

For visual work, screenshots are required.

For plugin/security work, security review is required.

For REST work, dry-run and approval are required before live writes.

## V1 Constraints

Do not prioritize DDEV, Docker, LocalWP, or wp-env in V1.

Do not build a full local WordPress development setup unless the user later decides it is necessary.

Do not add third-party plugins unless approved.

Do not build V2 framework features before the first useful starter flow is stable.

