# Environment And Secrets

This repo uses separate credentials for local staging checks, human-only hosting
operations, and GitHub Actions release automation. Do not mix them.

| Location | Values | Purpose | Who uses it |
| --- | --- | --- | --- |
| Local `.env` | `WP_STAGING_URL`, `WP_REST_USER`, `WP_REST_APP_PASSWORD` | Read-only staging checks, dry-runs, and approved staging QA page lifecycle actions | Codex/local tools |
| Human-only `.env.deploy` | Hosting or production deploy values, when needed by the site owner | Manual production or hosting operations outside repo automation | Site owner only |
| GitHub Actions secrets | `WP_STAGING_URL`, `WP_DEPLOY_USER`, `WP_DEPLOY_APP_PASSWORD` | Theme release workflow trigger for staging to pull a verified GitHub Release | GitHub Actions |

Rules:

- Never request or store production credentials for Codex-local work.
- Never read `.env.deploy` from repo tools.
- GitHub deploy credentials must belong to the least-privilege deploy user.
- Local REST credentials are for staging only and must not target production.
- Live QA page writes must use a `staging.*` host and explicit confirmation.

## Audit Disposition: Staging QA Pages

The audit recommended draft QA pages because it assumed review-only hidden
pages. The accepted operating model is different: pattern QA happens live on a
hosted `staging.*` site so desktop, tablet, and mobile screenshots represent
the real WordPress runtime.

Therefore, `qa-pattern-*` pages may be published on staging when explicitly
created for review. They must never migrate to production, and they should be
trashed after approval unless the site owner intentionally keeps them as a
staging pattern lab.
