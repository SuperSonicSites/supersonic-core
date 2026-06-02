---
name: security-review
description: Use when reviewing security for plugin code, REST endpoints, or sensitive workflows, including requests like "security review", "security audit", "check this REST endpoint", "is this plugin code safe", or "review sanitization and nonces". Checks input sanitization, output escaping, nonces, prepared queries, capability checks, unauthenticated writes, and committed secrets.
---

# Security Review Skill

Use this skill when reviewing plugin code, REST/API automation, deploy changes, user roles, forms, or third-party plugin requests.
Also follow `docs/agent-quality-standard.md`.

## Discovery

Inspect touched plugin/theme files, REST helpers, roles/capabilities, forms,
package dependencies, environment handling docs, and `git status --short` before
reviewing. Do not ask for secrets or production credentials.

## Contract

Define the security scope before acting: files reviewed, data flows, actors,
capabilities, write paths, approval gates, and required proof.

## Proof Gates

- Prove secrets are not committed.
- Prove REST endpoints and write actions have explicit capability checks.
- Prove inputs are sanitized and outputs escaped at the right boundary.
- Prove admin actions use nonces where applicable.
- Prove third-party plugin recommendations include alternatives, maintenance,
  risk, performance, rollback, and explicit approval status.
- Prove live writes had dry-run plus approval or do not proceed.

## Failure Policy

Fail closed when permissions, sanitization, escaping, nonces, dependency risk,
or approval proof is missing. Do not approve unauthenticated writes, broad roles,
committed secrets, or production-impacting changes without approval.

## Check

- secrets are not committed
- REST endpoints have permission checks
- inputs are sanitized
- outputs are escaped
- admin actions use nonces
- database queries are prepared
- user roles are least privilege
- live writes have approval
- production deploy has approval
- Updraft backup exists before major production changes

## Plugin Review

Before approving a third-party plugin, document:

- reason
- alternatives
- maintenance status
- security history
- performance impact
- rollback plan
- approval status

## Report

Include:

- scope
- proof summary
- risks
- required fixes
- approval status

