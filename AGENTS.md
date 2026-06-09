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
- `seo-strategist`
- `copywriter`
- `copy-review`

## Scoped Instructions

When working in these areas, also read the local instruction file:

- `wp-content/themes/supersonic-site-theme/CLAUDE.md`
- `wp-content/plugins/supersonic-site-core/CLAUDE.md`

## Operating Rules

Follow the approval gates, staging-only REST rules, screenshot QA rules,
WordPress compatibility checks, and definition of done from `CLAUDE.md`.

Follow `docs/agent-quality-standard.md` for discovery, contract, proof gates,
failure policy, reporting, and delegation.

## Codex Delegation Rules

Codex acts as the orchestrator by default.

The orchestrator owns:

- repo discovery
- task routing to the right repo-local skill
- contract definition
- approval-gate decisions
- proof-gate selection
- final accept/reject judgment
- final user report

Codex may delegate execution to a focused implementation sub-agent only after
the contract is fully defined. The executor receives the contract, affected
files, constraints, and required checks. It should not make product, design,
security, deployment, or approval decisions.

If Codex-native sub-agent tooling is unavailable, Codex must simulate the same
split in one thread:

1. finish discovery and contract thinking first
2. execute only the contracted change
3. inspect the diff
4. run the required proof gates
5. accept, reject, or revise based on evidence

Delegated or self-executed work is not accepted until Codex verifies it against
the proof gates. Missing proof fails closed.

Do not deploy to production. Do not run live REST writes without explicit
approval. Keep Git as the source of truth.
