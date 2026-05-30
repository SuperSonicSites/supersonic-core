# Deployment Review Skill

Use this skill before staging review completion or production deploy.

## Environments

- repo: source of truth
- Hostinger staging: build and review
- production: protected final environment
- Updraft: rollback layer

## Staging Review

Check:

- changes are in Git
- Hostinger edits are synced back to Git
- screenshots are complete for visual changes
- QA checklist is complete for affected scope
- no unapproved live REST writes

## Production Deploy Review

Production deploy requires approval.

Check:

- staging review complete
- screenshots approved
- recent Updraft backup exists
- rollback path is clear
- forms tested
- SEO checked
- redirects checked, if applicable
- SSL and analytics checked, if applicable

## Report

Include:

- deploy scope
- environment
- checks completed
- blockers
- approval status

