# Pattern Library

The pattern source lives in `wp-content/themes/supersonic-site-theme/patterns/`.
The human registry lives in `docs/pattern-registry.md`; the machine-readable
certification registry lives in `data/pattern-certifications.json`.

## Pattern Workflow

1. Build one pattern.
2. Create or reuse its published `qa-pattern-*` page on Hostinger staging.
3. Capture desktop, tablet, and mobile screenshots for that pattern.
4. Fix issues.
5. Update `data/pattern-certifications.json`.
6. Approve only after `npm run pattern:registry:check` passes.

## Approved Patterns

Approved status is tracked in `data/pattern-certifications.json`.
