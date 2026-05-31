# QA Checklist

Use this checklist for staged review before changes are approved.

## Compatibility Checks

Before packaging, staging review, or visual QA:

- verify the latest stable WordPress core version from official WordPress sources
- confirm theme and plugin headers target that version
- confirm `theme.json` schema targets that version
- confirm staging is running the intended WordPress version before treating screenshots as final
- report any staging/core version mismatch before continuing

## Screenshot Review

Every visual change requires screenshots for the specific section or pattern changed.

Capture:

- desktop
- tablet
- mobile

Store screenshots in:

- `screenshots/before/`
- `screenshots/after/`

Review:

- spacing
- alignment
- text readability
- image cropping
- overflow
- CTA visibility
- hierarchy
- mobile stacking
- tablet layout
- desktop layout

## Token Editability Review

Every new pattern should prove that the design system is editable through WordPress controls.

For each pattern, confirm:

- text content can be edited
- links and button labels can be edited
- section vertical padding can use approved spacing presets
- text/background colors can use approved color presets where the block supports them
- typography can use approved font-size presets where the block supports them
- radius and shadow controls use approved presets where applicable
- media placeholders can be replaced with real media, if present
- edits do not create block validation errors
- edits do not break the 5% gutter, 1440px max width, or mobile stacking

For a large batch QA, do a focused token pass on one representative pattern in each category, then spot-check the remaining patterns for edit controls and block validity.

## Theme And Pattern Certification

For theme or pattern increments, follow:

- `docs/workflows/theme-pattern-certification.md`

Confirm:

- expected theme version is active on staging
- expected patterns are registered
- editor loads normally
- native blocks remain available
- Supersonic presets are visible
- default/core/remote patterns remain absent
- header/footer template parts mount patterns instead of duplicating markup
- navigation CSS is scoped to `.supersonic-site-header`
- shadows use approved theme presets only
- FAQ patterns that need schema use `rank-math/faq-block`
- Rank Math SEO and its Schema module are active before FAQ schema QA

## Temporary QA Pages

For new visual patterns, template parts, and approved custom blocks:

- use a dedicated staging-only QA page when it makes review clearer
- title format is `QA - Pattern - [Pattern Name]`
- slug format is `qa-pattern-[pattern-slug]`
- page contains only the reviewed component plus minimal context
- REST creation had a dry-run first
- REST cleanup had a dry-run first
- screenshots target the reviewed component, not unrelated page chrome
- QA page is trashed/deleted after approval unless intentionally kept as draft

## Pattern Approval Criteria

A pattern is approved only when it:

- uses native blocks where possible
- avoids Custom HTML blocks
- uses design tokens
- uses one approved section spacing token
- exposes practical editor controls for text, links, media, colors, spacing, and typography where relevant
- avoids arbitrary font sizes, spacing values, colors, radii, and shadows
- includes exactly one editable H1 when reviewing a full page layout
- comes from the approved Supersonic theme pattern library
- does not depend on core, remote, or third-party pattern libraries
- uses only approved external blocks; V1 currently allows `rank-math/faq-block` for FAQ schema
- works on mobile, tablet, and desktop
- has no overflow
- has no arbitrary one-off CSS
- matches the brand
- has readable text
- has accessible buttons and links
- uses appropriate image cropping

## Accessibility Checks

Check:

- one clear H1 per page
- logical heading order
- descriptive links
- visible focus states
- color contrast
- form labels
- alt text
- keyboard navigation
- landmark structure

## SEO Checks

Check:

- page intent is clear
- title is unique
- meta description is unique
- H1 is unique
- headings support the page topic
- internal links are useful
- schema matches visible content
- no thin or duplicate content

## Technical Checks

Check:

- no console errors
- no obvious layout shift
- no broken links
- images are not oversized
- forms submit correctly on staging
- REST writes, if any, were approved and reviewed
- no unapproved custom blocks, CPTs, taxonomies, REST routes, or third-party plugins were added

## Reporting

Every QA report should include:

- scope reviewed
- screenshots captured
- issues found
- fixes made
- remaining risks
- approval status
