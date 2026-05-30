# Security

Security is part of the framework from day one.

## Operating Model

- Repo is the source of truth.
- Hostinger staging is the build and QA environment.
- Production is protected.
- Daily Updraft backups are the full-site rollback layer.

## Critical Rules

- No secrets in the repo.
- No public API keys committed.
- No unauthenticated write actions.
- No live REST writes without approval.
- No production deploys without approval.
- No random Hostinger file edits without syncing changes back to Git.
- REST endpoints must use permission checks.
- Admin users and roles must be reviewed before launch.
- Backups must exist before production deploys.

## Secrets Handling

Use `.env.example` to document required environment variables.

Never commit:

- real passwords
- API keys
- WordPress salts
- application passwords
- SSH keys
- database credentials
- backup files

## Plugin Policy

Do not add third-party plugins casually.

Before adding a plugin, document:

- reason for plugin
- alternatives considered
- maintenance status
- security history
- performance impact
- rollback plan
- approval status

## Custom Plugin Security

Every custom plugin feature must follow these rules:

- sanitize input
- escape output
- use nonces for admin actions
- prepare database queries
- require capability checks
- avoid unauthenticated write actions
- keep permissions narrow

## REST/API Rules

- REST writes require explicit approval.
- Dry-run first.
- Validate payloads before writing.
- Review output after writing.
- Screenshot and audit affected pages after content changes.

## Production Protection

Production deploys require approval and should happen only after:

- staging review is complete
- screenshots are approved
- forms are tested
- SEO metadata is checked
- backups are confirmed
- rollback plan is clear

## Updraft Rollback Layer

Daily Updraft backups are the rollback layer for:

- database
- media/uploads
- themes
- plugins
- WordPress settings
- full-site recovery

Before major production changes, confirm a recent backup exists.

