---
name: security-review
description: Use when reviewing security for plugin code, REST endpoints, or sensitive workflows, including requests like "security review", "security audit", "check this REST endpoint", "is this plugin code safe", or "review sanitization and nonces". Checks input sanitization, output escaping, nonces, prepared queries, capability checks, unauthenticated writes, and committed secrets.
---

# Security Review Skill

Use this skill when reviewing plugin code, REST/API automation, deploy changes, user roles, forms, or third-party plugin requests.

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
- risks
- required fixes
- approval status

