# Supersonic Core Agent Instructions

## Purpose

This repo is the source of truth for the Supersonic AI website framework.

It is not a multi-client platform and it is not a full local WordPress runtime. It is the controlled framework for AI-driven website production: documentation, instructions, theme skeleton, plugin skeleton, tools, skills, and review workflows.

## Operating Model

1. Repo is the source of truth.
2. Hostinger staging is the real WordPress build, preview, integration testing, screenshot review, and QA environment.
3. Production is protected and handled manually by the site owner.
4. Daily Updraft backups are the full-site rollback layer for the WordPress database, uploads, settings, plugins, themes, and full-site recovery.
5. Do not edit Hostinger files randomly without syncing changes back to Git.
6. Do not run live REST writes without explicit approval.
7. Do not deploy to production. Prepare reviewed assets and checklists only.
8. Every visual change must be reviewed with desktop, tablet, and mobile screenshots for the specific section or pattern changed.
9. Build and review one pattern or system piece at a time.

## Environment Access

Claude only needs these local environment values:

- `WP_STAGING_URL`
- `WP_REST_USER`
- `WP_REST_APP_PASSWORD`

Do not request production credentials, SSH credentials, database credentials, backup files, or hosting account access.

## WordPress Compatibility

Current latest stable core target: WordPress 7.0.

Before creating or packaging theme/plugin work:

- verify the current latest stable WordPress core version from official WordPress sources
- keep theme/plugin headers aligned with the target core version
- keep `theme.json` schema aligned with the target core version
- prefer native block theme and Gutenberg APIs supported by the target core version
- avoid Custom HTML blocks for editable design work
- document compatibility assumptions in `docs/wordpress-compatibility.md`

Do not use beta, nightly, trunk, or Gutenberg plugin-only features unless explicitly approved.

## Gutenberg Authoring

Read `docs/gutenberg-authoring-standard.md` before building templates, template parts, patterns, or blocks.

Read `docs/design-tokens-standard.md` before making visual or layout changes.

Read `docs/workflows/theme-pattern-certification.md` before packaging, uploading, or certifying a visual theme/pattern change.

Hard rules:

- all visual output must remain editable in the WordPress block editor
- use native blocks first
- use patterns before custom blocks
- use theme design tokens for spacing, typography, colors, radius, and layout
- every section pattern must choose one semantic section spacing token
- keep the pattern inserter limited to Supersonic-approved theme patterns
- every AI-built page layout must include exactly one editable H1; do not rely on the default page template to add it
- do not use `core/html` or Custom HTML blocks for design work
- do not use arbitrary font sizes, spacing values, colors, radii, or shadows without approval
- do not create custom blocks without approval

## Files To Read First

Always read first (cheap, orienting):

1. `CLAUDE.md`
2. `README.md`
3. `SITE.md`

Then read only what the task needs — do not front-load every doc:

- Visual / pattern / layout work: `DESIGN_SYSTEM.md`, `docs/gutenberg-authoring-standard.md`, `docs/design-tokens-standard.md`, `docs/pattern-lessons.md` (QA-derived build rules — don't re-introduce solved defects), `QA_CHECKLIST.md`, `docs/workflows/theme-pattern-certification.md`, and `wp-content/themes/supersonic-site-theme/CLAUDE.md`
- Plugin / functionality work: `SECURITY.md`, `docs/wordpress-compatibility.md`, and `wp-content/plugins/supersonic-site-core/CLAUDE.md`
- REST / staging writes: `SECURITY.md` and `docs/workflows/theme-pattern-certification.md`
- Deployment handoff: `DEPLOY_CHECKLIST.md` and `SECURITY.md`
- Content / SEO work: `CONTENT_MODEL.md`, `PAGE_MAP.md`, `SEO_STRATEGY.md`, and `BRAND.md`

For visual QA specifically, invoke the `visual-qa` skill — it is the operational runbook (what to QA, capture command, breakpoints, review checklist) and avoids re-reading the whole doc set.

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

## Modularity First

Reusable UI components are patterns, not bespoke markup baked into templates.

- Author reusable components (header/navbar, footer, sections, CTAs) as pattern files in the theme `/patterns` folder; that file is the single source of truth.
- Templates and template parts compose components by reference with `<!-- wp:pattern {"slug":"theme/pattern-slug"} /-->`; never duplicate a component's markup into both a part and a pattern.
- Offer layout variants as sibling patterns bound to the relevant template-part area so sites can swap them without editing markup.
- See `docs/gutenberg-authoring-standard.md` for the full rule.

## Page Layout Responsibility

Default page templates stay layout-neutral and do not force the same H1 treatment onto every site.

- Every AI-built page layout must include exactly one editable H1.
- The H1 usually belongs in the first hero or intro pattern.
- QA fails full page layouts with no H1 or multiple H1s.
- Use `text-page.html` only when a classic title-first content page is intentionally needed.

## Navigation And Shadow Rules

- Header navigation interaction CSS must stay scoped to `.supersonic-site-header`.
- Footer and in-content navigation must not inherit header-specific animation, underline, or dropdown styling.
- Shadows are allowed only through approved theme shadow presets.
- Do not add arbitrary `box-shadow` values in CSS or block markup.

## Human Approval Gates

Require explicit approval before:

- adding third-party plugins
- creating custom blocks
- changing global design tokens
- changing theme-wide layout rules
- changing page-heading responsibility rules
- adding or changing shadow presets
- running live REST writes
- preparing production deployment instructions
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
4. Create or use a temporary staging QA page for the pattern/block when visual isolation helps review.
5. Capture desktop, tablet, and mobile screenshots for that section or pattern.
6. Review against design, accessibility, SEO, and security rules as relevant.
7. Fix only the identified issues.
8. Re-review.
9. Clean up the temporary QA page after approval, with explicit approval for REST cleanup.
10. Commit after approval.
11. Move to the next piece.

## Temporary QA Pages

Use temporary staging-only QA pages for new visual patterns, template parts, and approved custom blocks.

- QA pages are staging-only and must never deploy to production.
- Title format: `QA - Pattern - [Pattern Name]`.
- Slug format: `qa-pattern-[pattern-slug]`.
- Create only after explicit approval.
- Run a dry-run before any REST creation or cleanup.
- Keep the QA page focused on the single component under review.
- Delete/trash the QA page after approval unless the user wants to keep it as a draft.

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
