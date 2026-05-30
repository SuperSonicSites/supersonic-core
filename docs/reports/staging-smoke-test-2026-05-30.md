# Staging Smoke Test - 2026-05-30

## Scope

Initial runtime certification for the V1 Supersonic Core theme and plugin packages after manual upload to Hostinger staging.

Reviewed:

- Supersonic Site Theme activation
- Supersonic Site Core plugin activation
- public frontend placeholder render
- read-only REST connectivity
- desktop, tablet, and mobile screenshots for the `main` placeholder section

Not reviewed:

- WordPress block editor browser session
- content creation or updates
- live REST writes
- production deployment

## Environment

- Runtime: Hostinger staging
- Source of truth: local/Git repo
- Production: not touched
- REST mode: read-only checks only

## Checks Run

- `npm run validate`
- `npm run rest:check`
- Playwright section screenshot capture with selector `main`
- frontend console and viewport metric check
- read-only REST checks for active theme and active plugins

## Results

- Theme package installed and active.
- Plugin package installed and active.
- Public frontend returned successfully.
- Authenticated REST read check passed.
- No frontend console errors were detected on desktop, tablet, or mobile.
- No horizontal document overflow was detected on desktop, tablet, or mobile.

## Screenshots

- `screenshots/after/staging-smoke/staging-placeholder-desktop.png`
- `screenshots/after/staging-smoke/staging-placeholder-tablet.png`
- `screenshots/after/staging-smoke/staging-placeholder-mobile.png`

## Issues Found

### Needs Fix Before V1 Certification

The placeholder section has insufficient horizontal breathing room on tablet and mobile.

Observed:

- desktop content is centered acceptably
- tablet content starts too close to the left edge
- mobile content starts at the viewport edge

Recommended fix:

- add a minimal global site gutter in the theme using WordPress theme/root padding rules
- repackage the theme
- upload the updated theme to staging
- recapture the same `main` section screenshots

This is a theme-wide layout rule change, so it requires approval before implementation.

## Security Notes

- No production actions were taken.
- No REST writes were sent.
- No secrets were committed.
- Existing staging plugins were observed during read-only review, but no third-party plugins were added to the repo.

## Status

Staging smoke test is partially passed, but V1 is not certified yet.

Next required action: approve and implement the small theme gutter fix, then rerun screenshot review.
