# Agent Instructions

This repo was originally structured for Claude Code, but the canonical project
instructions are agent-neutral.

Before making changes, read:

- `CLAUDE.md`
- `README.md`
- `SITE.md`

Treat `CLAUDE.md` as the main agent instruction file for this repo.

## Repo Skills

The repo-local runbooks live in `.claude/skills/`. Even though the folder is
Claude-named, these are canonical workflow instructions for all agents.

When a task matches one of these workflows, read the matching
`.claude/skills/<skill-name>/SKILL.md` before acting:

- `pattern-builder`
- `visual-qa`
- `accessibility-review`
- `seo-auditor`
- `security-review`
- `certify-pattern`
- `deployment-review`
- `new-site-init`

## Scoped Instructions

When working in these areas, also read the local instruction file:

- `wp-content/themes/supersonic-site-theme/CLAUDE.md`
- `wp-content/plugins/supersonic-site-core/CLAUDE.md`

## Operating Rules

Follow the approval gates, staging-only REST rules, screenshot QA rules,
WordPress compatibility checks, and definition of done from `CLAUDE.md`.

Do not deploy to production. Do not run live REST writes without explicit
approval. Keep Git as the source of truth.
