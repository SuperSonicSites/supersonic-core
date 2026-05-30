# Deploy Checklist

Production is protected. Do not deploy to production without explicit approval.

## Environments

- Source of truth: GitHub/Desktop repo
- Build and review: Hostinger staging
- Final deploy: Production
- Rollback: Updraft backups

## Before Staging Review

Confirm:

- changes are tracked in Git
- theme/plugin edits are synced from repo
- no random Hostinger edits are left unsynced
- visual changes have section-level desktop, tablet, and mobile screenshots
- relevant QA checks are complete
- security-sensitive changes have been reviewed

## Before Production Deploy

Require approval, then confirm:

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

## Production Deploy Rules

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

