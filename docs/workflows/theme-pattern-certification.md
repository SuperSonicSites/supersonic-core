# Theme And Pattern Certification Workflow

Use this workflow before approving a new theme version or pattern increment.

## Purpose

Certify one small visual system change at a time on Hostinger staging.

This workflow applies to:

- theme token changes
- template part changes
- header and footer pattern changes
- section pattern changes
- navigation behavior changes
- screenshot-affecting CSS changes

## Rules

- Repo source is the source of truth.
- Hostinger staging is the review environment.
- Production is not touched by Claude.
- Build and review one pattern or system piece at a time.
- Every visual change needs desktop, tablet, and mobile screenshots.
- Live REST writes require explicit approval and a dry-run first.
- Published `qa-pattern-*` pages are allowed on staging for live hosted screenshots.
- QA page live writes must target a `staging.*` host and must never target production.
- Commit only after staging review passes.

## Preflight

Before packaging:

- confirm latest stable WordPress target
- run `npm run validate`
- confirm theme/plugin headers match the target
- confirm no Custom HTML blocks were added
- confirm no unapproved custom blocks, CPTs, taxonomies, REST routes, or third-party plugins were added
- confirm pattern files use approved design tokens

## Package

Run:

```text
npm run package
```

Upload only the generated WordPress asset zip needed for the change.

For theme changes:

- `packages/supersonic-site-theme.zip`

For plugin changes:

- `packages/supersonic-site-core.zip`

Generated zips are ignored by Git and must be reproducible from source.

## Staging Activation Check

After upload, run:

```text
npm run certify:staging -- <expected-theme-version> <expected-plugin-version>
```

Confirm:

- staging frontend returns `200`
- WordPress version matches the target or mismatch is documented
- active theme version is the expected version
- site-core plugin is active at the expected version
- approved patterns are registered as expected
- core and remote patterns remain absent unless explicitly approved

## Editor Check

Open `wp-admin` manually and confirm:

- block editor loads without errors
- native blocks are available
- Supersonic design presets are visible
- approved Supersonic patterns appear in the expected category
- default/core/remote patterns remain absent
- edited content remains fully maintainable

## Token Editability Check

For every pattern under review, confirm the content can be maintained without leaving the block editor.

Minimum per-pattern checks:

- edit text content
- edit links and button labels, if present
- replace media placeholders, if present
- change section vertical padding using approved spacing presets
- change text/background colors using approved color presets where relevant
- change typography using approved font-size presets where relevant
- confirm radius/shadow controls use approved presets where relevant
- undo the test edits or discard the QA page afterward
- confirm no block validation warning appears
- confirm the edit did not break gutter, max-width, or responsive stacking

For a large batch such as `0.1.5`, run a deeper token pass on one representative pattern in each registered category, then spot-check the remaining patterns for edit controls and block validity.

## Temporary QA Page Rule

Every new visual pattern, template part, or block should be reviewed on a dedicated published staging QA page. These pages form the staging pattern lab: they are live on staging so screenshots are real hosted WordPress output, but they must never be migrated to production.

This intentionally supersedes the audit assumption that QA pages should default
to draft. Published staging QA pages are the review surface for new patterns;
the safety controls are staging host enforcement, explicit confirmation, and
cleanup.

Use a QA page when reviewing:

- section patterns
- header patterns
- footer patterns
- page-layout patterns
- custom blocks, if approved later
- navigation or interactive visual components

Rules:

- QA pages are staging-only.
- QA page live writes through repo tools are refused unless `WP_STAGING_URL` is a `staging.*` host.
- QA pages must never be deployed to production.
- QA pages must contain only the pattern/block under review plus minimal context when needed.
- QA page title format: `QA - Pattern - [Pattern Name]`.
- QA page slug format: `qa-pattern-[pattern-slug]`.
- QA pages may be created through REST only after explicit approval.
- REST creation must be dry-run first.
- Cleanup must be dry-run first and requires explicit approval.
- After approval, delete/trash the QA page or keep it in the staging pattern lab for future review.

Dry-run helpers:

```text
npm run rest:qa-page:dry-run -- supersonic-site-theme/hero-simple
npm run rest:qa-page:trash-dry-run -- <page-id>
npm run rest:qa-pages
```

For live creation or cleanup, get explicit approval first, then use a separate implementation step.

## Page Heading Rule

Default page templates stay layout-neutral.

For full page layouts:

- the AI-built page layout must include exactly one editable H1
- the H1 usually belongs in the first hero or intro pattern
- QA fails pages with no H1 or multiple H1s

## Header And Footer Rule

Header and footer are modular components.

- header and footer layouts are pattern files
- `parts/header.html` and `parts/footer.html` are thin mounts
- future variants are sibling patterns
- native block patterns are preferred
- custom blocks require approval when native patterns are insufficient

## Navigation Rule

Header navigation CSS must be scoped to `.supersonic-site-header`.

Verify:

- footer navigation is not styled like the header unless intentionally approved
- in-content navigation is not affected by header hover/dropdown rules
- mobile overlay opens and closes
- reduced-motion preference disables animation

## Shadow Rule

Shadows are allowed when they use approved theme presets.

Allowed presets:

- `soft`
- `medium`

Do not add one-off `box-shadow` values in CSS or pattern markup.

## Screenshot Review

Capture desktop, tablet, and mobile screenshots for the specific changed section or pattern.

Use:

```text
npm run screenshot -- --url <staging-url> --selector "<section-selector>" --label <label> --out screenshots/after/<review-folder>
```

For QA pages, target the reviewed component selector rather than the whole page whenever possible.

Review:

- gutter and width behavior
- typography scale
- text wrapping
- button visibility
- mobile stacking
- horizontal overflow
- console errors
- header/footer behavior when relevant

## Report

Create a report in:

```text
docs/reports/
```

The report must include:

- scope reviewed
- QA page title, slug, URL, and cleanup status, if one was used
- active theme/plugin version
- checks run
- screenshots captured
- editor check result
- issues found
- fixes made
- remaining risks
- approval status

## Pattern Registry

Update `data/pattern-certifications.json` after every pattern review. The entry
must record the source file, QA page slug/URL, certification status, report path,
and screenshot paths when screenshots have been captured.

Run:

```text
npm run pattern:registry:check
```

The registry must pass before marking a pattern approved.

## Commit

Commit only after:

- static validation passes
- staging certification passes
- screenshots are reviewed
- editor check passes
- report is written
- pattern registry is updated

Keep ignored:

- `.env`
- `node_modules/`
- generated package zips
