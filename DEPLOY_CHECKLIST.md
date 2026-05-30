# Deploy Checklist

Production is protected and handled manually by the site owner. Claude must not deploy to production.

## Environments

- Source of truth: GitHub/Desktop repo
- Build and review: Hostinger staging
- Final deploy: Production, handled by the site owner
- Rollback: Updraft backups

## Before Staging Review

Confirm:

- latest stable WordPress target has been verified
- staging WordPress version matches the target or the mismatch is documented
- changes are tracked in Git
- theme/plugin edits are synced from repo
- no random Hostinger edits are left unsynced
- visual changes have section-level desktop, tablet, and mobile screenshots
- relevant QA checks are complete
- security-sensitive changes have been reviewed
- theme/pattern visual changes follow `docs/workflows/theme-pattern-certification.md`
- full page layouts include exactly one editable H1
- header/footer changes keep template parts as thin pattern mounts
- navigation CSS remains scoped to the header component
- shadows use approved theme presets only
- temporary QA pages are trashed/deleted or intentionally kept as drafts
- no QA pages are included in production deployment

## Before Owner Production Deploy

Before the site owner deploys production, confirm:

- latest staging review is complete
- screenshots are approved
- recent Updraft backup exists
- rollback plan is understood
- forms are tested
- navigation is checked
- redirects are checked, if applicable
- SEO titles and meta descriptions are checked
- robots and sitemap settings are checked
- SSL is valid
- analytics and tracking are checked, if applicable
- no live REST write is pending review
- no staging-only QA page is being promoted to production
- package zips were regenerated from source with `npm run package`
- `npm run validate` passed before handoff

## Production Deploy Rules

- Claude does not deploy to production.
- The site owner handles the final production push.
- Do not deploy a large unreviewed batch.
- Deploy small approved changes.
- Keep Git as the source of truth.
- Confirm production after deploy.
- Re-check affected pages on desktop, tablet, and mobile.

## Post-Launch QA

Check:

- homepage
- key service pages
- contact page
- forms
- navigation
- footer links
- mobile layout
- tablet layout
- desktop layout
- metadata
- analytics
- sitemap
- indexing settings

## Rollback

Use Updraft backups for full-site rollback when needed.

Before rollback, identify:

- change that caused the issue
- affected environment
- most recent safe backup
- content changes that may be lost
- Git changes that need correction
