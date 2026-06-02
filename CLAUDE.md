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

See `docs/environment-and-secrets.md` for the split between local `.env`,
human-only `.env.deploy`, and GitHub Actions deploy secrets.

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

## Task Routing — Skills First

Always read first (cheap, orienting): `CLAUDE.md`, `README.md`, `SITE.md`.

Then route by task. **Invoke the matching skill first** — each skill is the operational runbook (steps, capture commands, breakpoints, checklists) and pulls in the docs it needs, so you avoid re-reading the whole doc set. Read the reference docs directly only for depth a skill does not cover. Do not front-load every doc.

| Task | Invoke this skill | Reference docs for depth |
|------|-------------------|--------------------------|
| Start / initialize a new site build | `new-site-init` | repo docs it generates |
| Build or change one pattern or section | `pattern-builder` | `DESIGN_SYSTEM.md`, `docs/gutenberg-authoring-standard.md`, `docs/design-tokens-standard.md`, theme `CLAUDE.md` |
| Visual / responsive screenshot review | `visual-qa` | `QA_CHECKLIST.md` |
| Accessibility review | `accessibility-review` | `QA_CHECKLIST.md` |
| On-page SEO audit | `seo-auditor` | `SEO_STRATEGY.md`, `CONTENT_MODEL.md`, `PAGE_MAP.md`, `BRAND.md` |
| Plugin, REST, or security review | `security-review` | `SECURITY.md`, `docs/wordpress-compatibility.md`, plugin `CLAUDE.md` |
| Certify / package / upload a theme or pattern change | `certify-pattern` | `docs/workflows/theme-pattern-certification.md` |
| Deploy readiness / owner handoff | `deployment-review` | `DEPLOY_CHECKLIST.md`, `SECURITY.md` |

Any live REST or staging write also follows `docs/workflows/theme-pattern-certification.md` (dry-run + explicit approval first).

These repo skills in `.claude/skills/` are canonical; prefer them over similarly named global skills (use this repo's `visual-qa` and `pattern-builder`, not generic look-alikes).

## Agent Quality Standard

All repo-local agents and commands must follow `docs/agent-quality-standard.md`.

Default behavior:

- discover repo facts before asking the user
- ask only for real product, design, security, deployment, or approval tradeoffs
- define the contract before acting
- prove critical claims with static checks, staging/browser checks, screenshots,
  reports, or clearly named manual-only gaps
- fail closed when proof is missing
- preserve unrelated local work

Pattern work must include a control contract card before editing. Visual QA and
certification reports must include a `Proof Summary`. Header, footer,
navigation, accordion, overlay, and hover/click behavior needs interaction-state
evidence before approval.

## Gutenberg Authoring & Build Order

Build in this order; only move down the list when the levels above genuinely cannot solve the need cleanly:

1. Native WordPress blocks
2. Block patterns
3. Synced patterns or template parts
4. Custom blocks (approval required — see Human Approval Gates)
5. Plugin functionality

Hard rules:

- all visual output must remain editable in the WordPress block editor
- use theme design tokens for spacing, typography, colors, radius, and layout; no arbitrary font sizes, spacing values, colors, radii, or shadows without approval
- every section pattern must choose one semantic section spacing token
- keep the pattern inserter limited to Supersonic-approved theme patterns
- one editable H1 per page layout — see Page Layout Responsibility
- do not use `core/html` or Custom HTML blocks for design work

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
- QA pages may be published on staging for live hosted screenshot QA.
- Live QA page writes through repo tools must target a `staging.*` host.
- Title format: `QA - Pattern - [Pattern Name]`.
- Slug format: `qa-pattern-[pattern-slug]`.
- Create only after explicit approval.
- Run a dry-run before any REST creation or cleanup.
- Keep the QA page focused on the single component under review.
- Delete/trash the QA page after approval unless the user wants to keep it in the staging pattern lab.

## Definition Of Done

A task is done only when the final report includes:

- what changed
- files changed
- screenshots reviewed, if visual
- checks run
- known issues
- next recommended step

For visual work, screenshots are required.

For pattern certification work, update `data/pattern-certifications.json` and run `npm run pattern:registry:check`.

For plugin/security work, security review is required.

For REST work, dry-run and approval are required before live writes.

## V1 Constraints

Do not prioritize DDEV, Docker, LocalWP, or wp-env in V1.

Do not build a full local WordPress development setup unless the user later decides it is necessary.

Do not add third-party plugins unless approved.

Do not build V2 framework features before the first useful starter flow is stable.
