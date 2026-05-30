---
name: new-site-init
description: Use when starting or initializing a new single-site WordPress website build from supersonic-core, including requests like "Initialize a new website", "Start a new website from supersonic-core", "Set up a new client site", "Begin a new WordPress build", "Create the project docs for this site", or "Run the init workflow". Guides repo inspection, client interview, project doc generation, phased planning, and approval before coding.
---

# New Site Init Skill

## Purpose

Initialize a new single-site WordPress website build from this framework before coding begins.

Use this skill to turn missing project context into practical repo documentation, a phased build plan, and clear approval gates.

This workflow reflects the Supersonic operating model:

- Repo is the source of truth for AI memory, docs, code, tools, and skills.
- Hostinger staging is the WordPress runtime, preview, screenshot QA, integration testing, and QA environment.
- Production is protected and handled manually by the site owner.
- Updraft is the full-site rollback layer.
- Git is the code and history layer.
- V1 does not assume DDEV, Docker, LocalWP, wp-env, or another local WordPress runtime.

Codex only needs staging REST access for V1 work:

- `WP_STAGING_URL`
- `WP_REST_USER`
- `WP_REST_APP_PASSWORD`

## When To Use

Use this skill when the user asks to:

- initialize a new website
- start a new website from `supersonic-core`
- set up a new client site
- begin a new WordPress build
- create project docs for a site
- run the init workflow

Do not use this skill to build templates, patterns, plugin functionality, or deploy changes.

## Files To Read First

Inspect the repo and read:

1. `AGENTS.md`
2. `README.md`
3. `SITE.md`
4. `BRAND.md`
5. `DESIGN_SYSTEM.md`
6. `PAGE_MAP.md`
7. `CONTENT_MODEL.md`
8. `SEO_STRATEGY.md`
9. `SECURITY.md`
10. `QA_CHECKLIST.md`
11. `DEPLOY_CHECKLIST.md`
12. `docs/wordpress-compatibility.md`
13. `docs/gutenberg-authoring-standard.md`
14. `docs/design-tokens-standard.md`
15. `data/site-intake.schema.json`
16. `data/site-intake.example.json`
17. `.agents/skills/`

If any required file or folder is missing, list it before interviewing the user.

Also check `git status --short` before editing docs. Preserve unrelated user changes.

## Workflow Steps

1. Inspect the repo structure and current docs.
2. Identify missing, vague, or placeholder project context.
3. Ask the first-round interview questions only.
4. Wait for the user's answers.
5. Generate or update project docs from the answers.
6. Preserve useful existing decisions and avoid overwriting specific context without reason.
7. Put unknowns in an `Open Questions` section instead of inventing details.
8. Produce a phased build plan adapted to the repo's current state.
9. Stop and ask for approval before any coding or build work begins.

Do not ask for production credentials, SSH credentials, database credentials, hosting account access, private backup files, or unrelated secrets.

## First-Round Interview Questions

Ask 10 to 15 questions maximum in the first round. Use these 12 questions unless the repo already answers some of them.

For questions with reasonable defaults, suggest the default and ask the user to confirm or correct it.

1. Client / business: What is the business name, business type, location or service area, and primary offer?
2. Website goals: What is the main conversion goal, and what secondary actions should visitors be able to take?
3. Target audience: Who is the primary audience, and what problem are they trying to solve?
4. Brand voice: Should the voice feel more professional, warm, premium, direct, technical, local, playful, or something else?
5. Design direction: Are there existing brand colors, fonts, logos, imagery, or reference sites to follow or avoid?
6. Required pages: Which pages are required for launch, and which can wait?
7. SEO priorities: What services, locations, keywords, or search intents matter most?
8. Content model: Is native pages/posts enough, or will the site need structured content such as services, testimonials, projects, team, FAQs, or locations?
9. Forms / integrations: What forms, booking tools, CRMs, email tools, analytics, or tracking need to exist on staging or production?
10. Staging / production / backups: What are the staging URL, production URL for documentation, and Updraft backup expectations?
11. Security considerations: Who needs admin access, are there role restrictions, and are there sensitive workflows such as forms, payments, memberships, or private content?
12. Launch priorities: What must be true for the first launch to be considered successful?

After the first round, ask follow-up questions only for blockers or high-risk ambiguity.

## Doc Generation Rules

After the user answers, create or update:

- `data/site-intake.json`
- `SITE.md`
- `BRAND.md`
- `DESIGN_SYSTEM.md`
- `docs/design-tokens-standard.md`
- `PAGE_MAP.md`
- `CONTENT_MODEL.md`
- `SEO_STRATEGY.md`
- `SECURITY.md`
- `QA_CHECKLIST.md`
- `DEPLOY_CHECKLIST.md`

Rules:

- Treat `data/site-intake.json` as committed project memory in cloned site repos.
- Make each file practical for future AI agents.
- Preserve existing useful decisions.
- Replace generic placeholders with project-specific answers.
- Do not leave vague filler.
- If an answer is unknown, add a clear `Open Questions` section.
- Keep theme and plugin responsibilities separated.
- Keep Hostinger staging, production protection, Updraft rollback, and Git source-of-truth rules visible.
- Make clear that production deployment is handled manually by the site owner.
- Do not add local dev setup instructions in V1 unless the user explicitly approves that direction later.
- Do not document third-party plugins as approved unless the user explicitly approves them.

## Build Plan Requirements

Produce a phased build plan after docs are updated. Adapt it to the repo's actual state.

Use this baseline:

```text
Phase 1: Project memory and repo setup
Phase 2: Design system and theme.json
Phase 3: Theme skeleton
Phase 4: Plugin skeleton
Phase 5: First pattern only
Phase 6: Screenshot QA
Phase 7: Page assembly
Phase 8: SEO/content pass
Phase 9: Security/deploy review
Phase 10: Production launch checklist
```

For each phase, include:

- goal
- files or environment touched
- approval needs
- screenshot or QA requirement, if visual

## Approval Gates

Stop and ask for approval before coding begins.

Require explicit approval before:

- creating or changing global design tokens
- building full templates
- creating plugin functionality
- creating patterns
- creating custom blocks
- adding third-party plugins
- running live REST writes
- deploying to production
- changing redirects
- changing user roles or permissions
- editing Hostinger files without syncing changes back to Git
- changing security settings
- deleting content

## Post-Approval Work Rules

After approval, remind the agent to work in small pieces:

- one pattern at a time
- one section at a time
- one page at a time
- desktop, tablet, and mobile screenshots for each visual section
- review, fix, re-screenshot, then continue
- commit approved work before moving on

Do not batch broad design, content, plugin, and deployment changes together.

## Definition Of Done

When this workflow runs, the init task is done only when the agent reports:

- repo files inspected
- missing files or folders found, if any
- interview questions asked
- user answers incorporated
- docs created or updated
- phased build plan produced
- approval requested before coding
- no coding/build work started
- assumptions and open questions
- next recommended step

Every later completed build task must report:

- what changed
- files changed
- screenshots if visual
- checks run
- known issues
- next recommended step



