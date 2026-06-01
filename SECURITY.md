# Security

Security is part of the framework from day one.

## Operating Model

- Repo is the source of truth.
- Hostinger staging is the build and QA environment.
- Production is protected and handled manually by the site owner.
- Daily Updraft backups are the full-site rollback layer.

## Critical Rules

- No secrets in the repo.
- No public API keys committed.
- No unauthenticated write actions.
- No live REST writes without approval.
- No production deploys by Claude.
- No random Hostinger file edits without syncing changes back to Git.
- REST endpoints must use permission checks.
- Admin users and roles must be reviewed before launch.
- Backups must exist before the site owner deploys production.

## Secrets Handling

Use `.env.example` to document required environment variables.

Claude and the scripts in `tools/` only read staging REST access:

- `WP_STAGING_URL`
- `WP_REST_USER`
- `WP_REST_APP_PASSWORD`

SSH and production credentials are human-only and live in a separate,
git-ignored `.env.deploy` (documented by `.env.deploy.example`). The agent and
`tools/` must never read `.env.deploy`. This split means a compromised agent
cannot reach production or SSH. Do not move SSH/production values back into
`.env`.

Never commit:

- real passwords
- API keys
- WordPress salts
- application passwords
- SSH keys
- database credentials
- backup files

Do not ask for production credentials, SSH credentials, database credentials, hosting credentials, or Updraft backup files.

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

## Temporary QA Page Rules

Temporary QA pages may be used on staging to isolate one pattern, template part, or approved block for review.

- QA pages are staging-only.
- Live QA page writes through `tools/` must target a host whose name starts with `staging.`.
- QA pages must never be deployed to production.
- REST creation requires explicit approval.
- REST cleanup requires explicit approval.
- Dry-run creation and cleanup before live REST requests.
- Published QA pages are allowed on staging because they are used for hosted screenshot QA.
- Draft QA pages are allowed when intentionally keeping a reusable staging draft.
- Delete/trash QA pages after approval unless the user wants to keep them in the staging pattern lab.
- Do not create QA pages that expose private client data, secrets, or production-only content.

## Automated Theme Deploy

The site-core plugin ships a verified theme auto-update path (see
`docs/workflows/theme-auto-deploy.md`). Its security model:

- The deploy endpoint `POST /wp-json/supersonic/v1/check-updates` requires an
  authenticated user with the `update_themes` capability and accepts no payload.
- The trigger carries no code. It only makes staging pull the official theme zip
  from a GitHub Release and install it after a SHA-256 match. A checksum mismatch
  aborts the install.
- CI authenticates as a dedicated `supersonic_deployer` role (application
  password), never the human admin. Revoke the application password anytime.
- The flow targets staging only. Production is never deployed by it.

## Production Protection

Production deploys are handled manually by the site owner.

Claude may prepare checklists and reviewed assets, but must not deploy to production.

Before the site owner deploys production, confirm:

- staging review is complete
- screenshots are approved
- no `qa-pattern-*` staging QA pages are being migrated to production
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
