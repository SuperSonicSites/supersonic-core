---
name: deployment-review
description: Use when reviewing deployment readiness before a production handoff, including requests like "deploy readiness check", "run the deploy checklist", "are we ready to launch", "verify backups and screenshots before deploy", or "prepare a handoff for the site owner". Reviews readiness only and never deploys; production is pushed manually by the site owner.
---

# Deployment Review Skill

Use this skill before staging review completion or production deploy.
Also follow `docs/agent-quality-standard.md`.

## Discovery

Inspect Git status, latest reports, package artifacts, staging read-only status,
known risks, backup/deploy docs, and affected files before reviewing readiness.
Do not ask for production credentials.

## Contract

Define the deployment-readiness scope before review: environment, versions,
assets, staging evidence, manual owner steps, rollback path, approvals, and
what blocks handoff.

## Proof Gates

- Prove changes are committed or clearly list uncommitted work.
- Prove staging screenshots and QA reports exist for visual changes.
- Prove packages are reproducible from source.
- Prove no live REST writes or production steps occurred without approval.
- Prove rollback/backups are documented before production handoff.

## Failure Policy

Fail closed when staging evidence, package proof, Git source-of-truth proof,
backup/rollback proof, or approval proof is missing. Review readiness only;
never deploy to production.

## Environments

- repo: source of truth
- Hostinger staging: build and review
- production: protected final environment
- Updraft: rollback layer

## Staging Review

Check:

- changes are in Git
- Hostinger edits are synced back to Git
- screenshots are complete for visual changes
- QA checklist is complete for affected scope
- no unapproved live REST writes

## Production Deploy Review

Production deploy requires approval.

Check:

- staging review complete
- screenshots approved
- recent Updraft backup exists
- rollback path is clear
- forms tested
- SEO checked
- redirects checked, if applicable
- SSL and analytics checked, if applicable

## Report

Include:

- deploy scope
- environment
- proof summary
- checks completed
- blockers
- approval status

