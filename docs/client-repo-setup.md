# Client Repo Setup (Manual Stopgap)

How to start a new client engagement from `supersonic-core` today. This is a
manual checklist; a real `init-client-repo` tool arrives in a later phase and
will replace it.

## Checklist

1. Clone and rename:

   ```bash
   git clone git@github.com:SuperSonicSites/supersonic-core.git client-name-site
   cd client-name-site
   ```

2. Point the repo at the client remote and keep the framework as upstream:

   ```bash
   git remote rename origin upstream
   git remote add origin git@github.com:SuperSonicSites/client-name-site.git
   git push -u origin main
   ```

   `upstream` lets you pull future framework improvements; `origin` is the
   client repo.

3. Reset client data files:

   - copy `data/site-intake.example.json` over `data/site-intake.json`, then
     blank the example values back to TBD placeholders (or run `new-site-init`,
     which fills it from the interview)
   - delete any `data/seo-briefs.json`, `data/copy-deck.json`, and
     `data/page-compositions.json` left from previous work
   - clear `screenshots/after/` (and any old QA capture folders)
   - reset `SITE.md`, `BRAND.md`, and `PAGE_MAP.md` to their TBD/template
     state so the init interview repopulates them

4. Set the environment:

   ```bash
   cp .env.example .env
   ```

   Fill `WP_STAGING_URL`, `WP_REST_USER`, `WP_REST_APP_PASSWORD` with the
   client's Hostinger staging values. Never add production or SSH credentials
   to `.env` — see `docs/environment-and-secrets.md`.

5. Verify the clone works:

   ```bash
   npm install && npm run validate
   ```

6. Run the `new-site-init` skill to interview, generate project docs, and
   produce the phased build plan. For redesigns, capture the legacy site first
   (see the Redesign Branch in `.claude/skills/new-site-init/SKILL.md`).

## Notes

- Commit the reset state as the first client commit before init work begins.
- Do not carry over `data/pattern-certifications.json` history edits, QA
  screenshots, or redirects from another client.
