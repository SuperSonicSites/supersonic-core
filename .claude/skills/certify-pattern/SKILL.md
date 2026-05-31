---
name: certify-pattern
description: Use when certifying, packaging, or uploading a Supersonic theme version or pattern increment before it ships, including requests like "certify this pattern", "run the certification workflow", "is this ready to package/upload", "certify theme 0.1.x", or "sign off this pattern increment". Runs preflight validation, packaging, staging activation + editor + token-editability checks, screenshot review, and a certification report before commit. Reviews and certifies only; never deploys to production.
---

# Certify Pattern Skill

Use this skill to certify one small visual system change at a time before packaging, upload, or a theme/plugin version bump.

It is the operational wrapper around `docs/workflows/theme-pattern-certification.md`. That workflow doc is the source of truth; this skill is the run order.

## When To Use

- certifying a new theme version or pattern increment
- packaging or uploading a theme/plugin asset zip
- before bumping a theme/plugin version

Applies to: theme token changes, template parts, header/footer patterns, section patterns, navigation behavior, and screenshot-affecting CSS.

Do not use this skill to author a brand-new pattern — use `pattern-builder` for that. Do not use it to deploy to production; production is manual and owner-only.

## Rules

- Repo source is the source of truth; Hostinger staging is the review environment; production is never touched.
- Certify one pattern or system piece at a time.
- Every visual change needs desktop, tablet, and mobile screenshots.
- Live REST writes require explicit approval and a dry-run first.
- Commit only after staging review passes.

## Workflow

Follow `docs/workflows/theme-pattern-certification.md` in order:

1. Preflight — run `npm run validate`; confirm the WordPress target and theme/plugin headers; confirm no Custom HTML and no unapproved blocks, CPTs, taxonomies, REST routes, or third-party plugins; confirm pattern files use approved design tokens.
2. Package — run `npm run package`; upload only the asset zip needed for the change.
3. Staging activation check — run `npm run rest:certify`; confirm staging returns `200`, the active theme/plugin version is expected, approved patterns are registered, and core/remote patterns remain absent unless approved.
4. Editor check — open `wp-admin` and confirm the block editor loads cleanly, native blocks and Supersonic presets are available, approved patterns appear in the expected category, and content stays maintainable.
5. Token editability check — for each pattern under review, prove it stays editable in the block editor (text, links/labels, media, section padding, colors, typography, radius/shadow presets) with no block validation warnings.
6. Rule audits — exactly one editable H1 per page layout, header/footer remain modular pattern files, header navigation CSS stays scoped to `.supersonic-site-header`, and shadows use only approved presets.
7. Screenshot review — capture section-level desktop, tablet, and mobile screenshots with `npm run screenshot`, targeting the changed component selector.
8. Report — write a certification report in `docs/reports/` (scope, QA page status, versions, checks, screenshots, editor result, issues, fixes, remaining risks, approval).
9. Commit — only after validation, staging certification, screenshots, the editor check, and the report all pass.

## Output

A certification report in `docs/reports/` plus a sign-off summary: scope certified, theme/plugin versions, checks run, screenshots reviewed, issues found and fixed, remaining risks, and approval status.
