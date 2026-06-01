# Theme Auto-Deploy Runbook

Push a new theme version to Hostinger **staging** from anywhere (including your
phone), without opening a computer or wp-admin. Production stays manual.

## How it works (one paragraph)

You trigger a GitHub Actions workflow. It validates, packages, and publishes a
checksummed **GitHub Release**, then pings a small endpoint on staging. The
Supersonic Site Core plugin on staging pulls that release, **verifies its
SHA-256**, and installs it through WordPress's own theme upgrader. The trigger
never carries code: the worst a leaked trigger credential can do is make staging
re-pull the official, checksum-verified theme. The security rationale is the
same one enforced throughout this runbook: staging only, least-privilege
credentials, no deploy payload, and checksum verification before install.

```text
You (GitHub mobile): Actions -> "Release theme to staging" -> Run workflow
   -> validate -> package -> checksum -> publish Release -> POST staging endpoint
   -> plugin verifies SHA-256 -> WordPress installs the theme
   -> you review staging + run QA
```

## One-time setup

These steps only you can do (they involve passwords and account settings). Do
them once; after that it is tap-and-go.

### 1. Install and activate the plugin on staging

The verified-update logic lives in the Supersonic Site Core plugin. Build and
upload it once:

```bash
npm run package   # creates packages/supersonic-site-core.zip
```

Upload `packages/supersonic-site-core.zip` in wp-admin (Plugins -> Add New ->
Upload) and **activate** it. Activation creates the least-privilege
`supersonic_deployer` role.

Do the same once for the theme zip (`packages/supersonic-site-theme.zip`) and
activate the theme, so there is an installed version for updates to replace.

### 2. Create the deploy user (least privilege)

In wp-admin on staging:

1. Users -> Add New.
2. Role: **Supersonic Deployer** (created by the plugin).
3. Save. This user can only update themes; it cannot edit content or manage users.
4. Open the new user -> **Application Passwords** -> add one named `github-deploy`.
5. Copy the generated application password (you will paste it into GitHub next).

### 3. Add GitHub Actions secrets

In the GitHub repo: Settings -> Secrets and variables -> Actions -> New
repository secret. Add three:

| Secret name | Value |
| --- | --- |
| `WP_STAGING_URL` | Your staging base URL, e.g. `https://staging.example.com` |
| `WP_DEPLOY_USER` | The deploy user's login (or its email) |
| `WP_DEPLOY_APP_PASSWORD` | The application password from step 2 |

If any of these are missing the workflow still publishes the Release; it just
skips the instant trigger and warns. Staging would then pick the update up on
its own schedule instead of within seconds.

### 4. Set the actual logo (so screenshots are not blank)

The header/footer use the native Site Logo block. On staging: Appearance ->
Site Identity (or Editor -> click the logo placeholder) -> upload the logo. Until
this is set, the frontend logo slot is empty.

## Every release (the repeatable part)

From the GitHub mobile app (or the web UI):

1. Actions -> **Release theme to staging** -> **Run workflow**.
2. Enter the new version `X.Y.Z` (or leave blank to auto-bump the patch number).
3. Run it. In ~1-2 minutes staging is updated.
4. Review staging and run QA per
   [`theme-pattern-certification.md`](theme-pattern-certification.md).

That's it. No computer required.

## Verify a deploy

- Workflow run: green check, and the Summary shows the version + SHA-256.
- `npm run certify:staging -- <theme-version> <plugin-version>` reports and
  enforces the active staging versions (run locally when you are back at a
  computer).
- Staging frontend reflects the change.

## Rollback

Every deploy is a numbered GitHub Release.

- **Fast:** re-run the workflow with the previous good version number. Because
  the updater compares versions, the cleanest rollback is to publish a new patch
  that restores the old code (recommended), since WordPress will not "update"
  to a lower version on its own.
- **Manual:** download the previous release's
  `supersonic-site-theme.zip` and upload it in wp-admin.
- **Full-site:** Updraft remains the database/site rollback layer.

## Security notes

- The deploy endpoint (`POST /wp-json/supersonic/v1/check-updates`) requires an
  authenticated user with `update_themes`, accepts no payload, and only triggers
  a verified pull.
- A checksum mismatch aborts the install.
- The CI credential is a scoped application password for the `supersonic_deployer`
  role only; revoke it anytime in wp-admin without touching your admin account.
- SSH and production credentials live in the human-only `.env.deploy` and are
  never used by this flow.
- Production is never deployed by this workflow.

## Troubleshooting

- **Workflow warns "secrets not set":** add the three Actions secrets (setup 3).
- **HTTP 401/403 from the trigger:** the deploy user lacks `update_themes` or the
  application password is wrong; recreate it.
- **"checksum mismatch" in WordPress:** the release zip and its published SHA-256
  disagree; re-run the release workflow to republish.
- **No update offered:** the release version is not higher than the installed
  version, or the plugin is inactive on staging.
