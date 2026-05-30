# Supersonic Core

Supersonic Core is the source-of-truth repo for a lean AI-driven WordPress website production workflow.

The goal is to provide a controlled framework for building one high-quality WordPress website at a time using:

- a custom lean block theme
- native WordPress blocks
- reusable block patterns
- a small site-core plugin
- clear AI instructions
- focused skills
- screenshot-based QA
- safe staging and production rules
- latest stable WordPress compatibility checks
- a small editable Gutenberg design token system
- a controlled approved-pattern-only editing workflow

## Compatibility Target

This framework currently targets WordPress 7.0.

WordPress.org recommends PHP 8.3 or greater and MySQL 8.0 or MariaDB 10.6 or greater for the current release. See `docs/wordpress-compatibility.md` for the repo compatibility rules.

Visual output must remain editable in the WordPress block editor. See `docs/gutenberg-authoring-standard.md` for the native-blocks-first authoring rules.

Default visual decisions are governed by `docs/design-tokens-standard.md` and implemented in `wp-content/themes/supersonic-site-theme/theme.json`.

## Operating Model

This repo is not intended to run a full local WordPress environment in V1.

Instead:

- Desktop/GitHub repo: source of truth for documentation, instructions, theme/plugin code, tools, and skills
- Hostinger staging: real WordPress runtime, preview environment, screenshot review, integration testing, and QA
- Production: protected final deploy environment
- Updraft: daily backup and full-site rollback layer

## V1 Scope

V1 contains:

- project memory files
- agent instructions
- skill instructions
- theme skeleton
- plugin skeleton
- QA and deploy checklists
- security rules
- workflow documentation

V1 does not include:

- a local WordPress runtime
- full theme templates
- plugin functionality
- custom blocks
- third-party plugin decisions
- production deployment automation

## Working Rules

Build one system piece or pattern at a time.

Every visual change must be reviewed with desktop, tablet, and mobile screenshots for the specific section or pattern changed.

Do not run live REST writes without approval.

Do not deploy to production. Production deployment is handled manually by the site owner.

Do not edit Hostinger files randomly without syncing changes back to Git.

## Folder Overview

```text
.agents/skills/                  AI skill instructions
data/                            structured source data and planned imports
docs/                            architecture and workflow notes
screenshots/before/              visual review baselines
screenshots/after/               reviewed visual output
tools/                           automation scripts and audits
wp-content/themes/               custom lean block theme skeleton
wp-content/plugins/              small site-core plugin skeleton
```

## Tooling

```text
npm run package       Build WordPress upload zips from source
npm run validate      Run static framework checks
npm run rest:check    Check staging REST availability
npm run rest:dry-run  Validate a planned staging REST write without sending it
npm run screenshot    Capture desktop/tablet/mobile screenshots when Playwright is installed
```

## Recommended First Build Step

After Phase 1 is approved, create the minimal theme and plugin files without building full templates, patterns, or plugin features.
