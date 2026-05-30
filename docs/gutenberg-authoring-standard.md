# Gutenberg Authoring Standard

## Core Rule

All visual website output must remain editable and maintainable in the WordPress block editor.

Do not use Custom HTML blocks for layout or design work.

## Build Order

Use this order unless the user explicitly approves an exception:

1. Native WordPress core blocks
2. Theme block patterns
3. Synced patterns or template parts
4. Custom blocks
5. Plugin functionality

Custom blocks require approval and are deferred until native blocks and patterns are insufficient.

## Native Blocks And Patterns

Patterns should be composed of native block markup such as:

- `core/group`
- `core/columns`
- `core/heading`
- `core/paragraph`
- `core/buttons`
- `core/image`
- `core/list`
- `core/details`
- `core/query`

Pattern files may contain block comment markup like `<!-- wp:group -->`. That is normal Gutenberg block markup and is not the same as a Custom HTML block.

## Pattern Library Policy

The framework keeps the pattern library intentionally controlled.

- Core WordPress patterns are disabled in the theme.
- Remote WordPress.org pattern directory loading is disabled.
- Native blocks remain available.
- Supersonic-approved patterns belong in the theme `/patterns` folder.
- Build, upload, screenshot-review, and approve one pattern at a time.
- Do not use unreviewed core, remote, or third-party patterns as production layouts.

## Design Token Rules

Patterns must use the design tokens defined in `docs/design-tokens-standard.md` and implemented in `theme.json`.

For each section pattern:

- choose one semantic section spacing token: `section-none`, `section-small`, `section-medium`, or `section-large`
- use the default 5% site gutter unless the pattern intentionally needs full-width media
- use typography presets instead of arbitrary font sizes
- use semantic color tokens instead of arbitrary colors
- use radius tokens instead of one-off border radius values
- avoid shadows unless a project-specific shadow preset has been approved

## Forbidden In V1

- `core/html` blocks
- raw pasted layout HTML in post content
- hardcoded page HTML that bypasses editor controls
- arbitrary visual values when a theme token exists
- custom blocks without approval
- Gutenberg plugin-only features unless approved
- third-party block plugins unless approved

## Theme Responsibilities

The theme may define:

- `theme.json` settings and styles
- templates
- template parts
- block patterns
- editor-facing presentation rules
- frontend presentation CSS

The theme must not define business logic, custom post types, taxonomies, REST endpoints, or runtime integrations.

## Plugin Responsibilities

The site-core plugin may define functionality that should survive theme changes:

- custom post types
- taxonomies
- REST helpers
- schema helpers
- SEO helpers
- integrations
- custom blocks only when approved

## Custom Block Approval Standard

Before creating a custom block, document:

- why native blocks and patterns are insufficient
- what fields/settings the editor needs
- whether the block is static or dynamic
- accessibility requirements
- migration/deprecation expectations
- staging screenshot QA requirements

Do not create the custom block until the user approves.

## QA Requirements

Every visual pattern, template, or block must be reviewed on Hostinger staging with:

- desktop screenshot
- tablet screenshot
- mobile screenshot
- editor editability check
- frontend render check
- overflow check
- accessibility review
