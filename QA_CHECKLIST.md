# QA Checklist

Use this checklist for staged review before changes are approved.

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

## Pattern Approval Criteria

A pattern is approved only when it:

- uses native blocks where possible
- uses design tokens
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

## Reporting

Every QA report should include:

- scope reviewed
- screenshots captured
- issues found
- fixes made
- remaining risks
- approval status

