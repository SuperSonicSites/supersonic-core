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

## Modularity: Compose From Patterns

Reusable UI is built as registered patterns, not as bespoke markup embedded in a template or template part. Modularity is a default, not an exception.

- A reusable component (header/navbar, footer, hero, section, CTA, etc.) is authored as a pattern file in the theme `/patterns` folder and is the single source of truth for that component.
- Templates and template parts should compose those patterns by reference using `<!-- wp:pattern {"slug":"theme/pattern-slug"} /-->`, rather than duplicating the component's markup.
- Do not copy a component's block markup into both a template part and a pattern. The pattern is canonical; the part is a thin mount that references it.
- Selectable layout variants (for example multiple header styles) are sibling patterns bound to the relevant area (`Block Types: core/template-part/header`) so a site can swap one for another without editing markup.

## Pattern Library Policy

The framework keeps the pattern library intentionally controlled.

- Core WordPress patterns are disabled in the theme.
- Remote WordPress.org pattern directory loading is disabled.
- Native blocks remain available.
- Supersonic-approved patterns belong in the theme `/patterns` folder.
- Build, upload, screenshot-review, and approve one pattern at a time.
- Do not use unreviewed core, remote, or third-party patterns as production layouts.

Approved V1 categories:

- `supersonic-headers`
- `supersonic-footers`
- `supersonic-heroes`
- `supersonic-intros`
- `supersonic-media`
- `supersonic-cards`
- `supersonic-trust`
- `supersonic-conversion`
- `supersonic-info`

## Approved External Blocks

The only approved non-core block in V1 is `rank-math/faq-block`, and only for FAQ sections that need Rank Math-owned FAQ schema.

Rules for this exception:

- the Rank Math SEO plugin and Schema module must be active on staging before FAQ QA
- the theme must not generate duplicate FAQ JSON-LD
- the visible FAQ content must match the schema content
- do not combine the Rank Math FAQ block with another FAQ schema source on the same page
- any other external block requires explicit approval first

## Design Token Rules

Patterns must use the design tokens defined in `docs/design-tokens-standard.md` and implemented in `theme.json`.

For each section pattern:

- choose one semantic section spacing token: `section-none`, `section-small`, `section-medium`, or `section-large`
- apply section spacing on the vertical axis only (top/bottom); never add left/right padding
- full-width section groups inherit the theme default 5% gutter and 1440px container; only approved control contracts may set a narrower section-level content rail
- simple heroes that promise Gutenberg left/center/right justification may set the selected section group to the approved `760px` content rail so the section-level justification control visibly moves the content
- use the default 5% site gutter unless the pattern intentionally needs full-width media
- use typography presets instead of arbitrary font sizes
- use semantic color tokens instead of arbitrary colors
- use radius tokens instead of one-off border radius values
- use approved shadow presets when shadows are needed
- avoid arbitrary one-off shadow values

## Editor Control Contracts

Patterns must be built around the editor controls they actually support. A
visible Gutenberg control is a promise: if an editor can reasonably expect the
control to affect the pattern, the pattern structure must make the effect clear.

Control ownership:

- outer section group owns background color and vertical section spacing
- inner layout group owns readable width and horizontal positioning unless the
  section group must own a native Gutenberg justification control
- text blocks own text alignment and typography presets
- buttons block owns button-group justification and button spacing
- individual buttons own button labels, URLs, width, and button colors
- media blocks own replacement, crop/aspect intent, and alt text
- card groups own card surface, border, radius, shadow, and internal padding

Foreground behavior:

- section background changes must be paired with a readable foreground strategy
- section text color should affect normal readable copy unless child blocks
  intentionally own their own color
- button colors are a separate contract and should not inherit section text
  color in a way that harms contrast
- inline text links and button links are separate color contracts
- group typography is not a reliable primary control when child text blocks use
  explicit font-size presets

Category behavior:

- hero patterns that expose a justification control must make left, center, and
  right content positioning visibly available through the selected section
  group; use separate approved variants for fixed-position hero layouts
- media split patterns should use explicit image/text ordering variants instead
  of generic section justification
- card and grid patterns should keep section-level controls separate from
  card-level controls
- CTA patterns must be checked on light and dark backgrounds for text, inline
  links, and button readability
- header and footer patterns follow template-part and navigation contracts before
  generic section contracts

## Page Heading Rule

The default page template stays layout-neutral so it does not force the same title treatment onto every website.

- Every AI-built page layout must include exactly one editable H1.
- The H1 should normally live in the first hero or intro pattern.
- Do not depend on `page.html` to add the page H1.
- QA must reject pages with no H1 or multiple H1s.

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
