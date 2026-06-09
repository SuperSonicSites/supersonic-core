---
name: accessibility-review
description: Use when reviewing a Supersonic pattern, section, or page for accessibility, including requests like "accessibility review", "a11y check", "WCAG audit", "check color contrast", "keyboard navigation review", or "screen-reader check". Checks WCAG AA contrast, heading order, single H1, alt text, keyboard operability, focus states, reduced motion, and form labels across desktop, tablet, and mobile.
---

# Accessibility Review Skill

Use this skill when reviewing accessibility for a page, pattern, template, or interactive element.
Also follow `docs/agent-quality-standard.md`.

## Discovery

Inspect the reviewed page or pattern source, relevant QA report, screenshots,
pattern registry entry if applicable, and any interactive controls before
judging accessibility. Ask only for user intent that source cannot answer.

## Contract

Define the accessibility scope before review: target, viewport set, keyboard
states, expected landmarks/headings, media/form/link/button obligations, and
required proof.

## Proof Gates

Primary proof is a measured tool run, not prose judgment. Run
`npm run a11y:check -- --url <staging> [--include "main <selector>"]`; it runs
axe-core (WCAG 2.0/2.1 A + AA) at desktop, tablet, and mobile and emits findings
with `tool_proof: {tool:"axe", ruleId, impact}`. Prefer these measured findings
over an eyeballed judgment for the same dimension.

- Contrast, interactive target size (>=24/44px), labels, and focus order are
  MEASURED by axe via `a11y:check`, not manual-only gaps.
- The gate fails on blocker/major (axe `critical`/`serious`).
- Verify one H1 per full page layout and logical heading order.
- Verify alt text, reduced motion, link names, and landmark structure from
  source, browser output, or the axe run.
- For visual accessibility claims, use desktop, tablet, and mobile evidence.
- Keyboard operation and visible-focus behavior that axe cannot fully verify
  remain a named manual check under "Manual-only gaps".

## Failure Policy

Fail the gate on any `blocker` or `major` finding (axe `critical`/`serious`).
Fail closed when the `a11y:check` run, keyboard behavior, alt text, or heading
proof is missing. Do not approve inaccessible forms, hidden essential content, or
interactive states that cannot be reached without a mouse.

## Check

Measured by axe (`a11y:check`):

- color contrast
- interactive target size
- form labels
- focus order
- descriptive/readable link and button names
- landmark structure

Verified from source, browser output, or the axe run:

- one H1 per page
- logical heading order
- alt text
- reduced motion

Manual-only (axe cannot fully verify):

- keyboard operation reaches every interactive control
- visible-focus indicator on each focusable element

## Rules

- Do not treat visual headings as decoration only.
- Do not use vague links like "click here".
- Do not hide essential content from keyboard or screen reader users.
- Do not approve inaccessible forms.

## Finding Shape

Emit every issue in the one canonical finding shape defined by
`data/review-finding.schema.json`:
`{id, rule_id, dimension, severity, breakpoint, target:{file?,slot?,selector?},
evidence, suspected_source?, recommended_fix?, status, money_page?, tool_proof?}`.
axe findings set `tool_proof:{tool:"axe", ruleId, impact}`.

Use the one severity enum: `blocker | major | minor | nit`. Map axe impact
`critical/serious/moderate/minor` -> `blocker/major/minor/nit`.

## Report

Include:

- scope
- `Proof Summary` (canonical labels below)
- findings in the canonical shape above
- recommended fixes
- approval status

Use this exact `Proof Summary` structure; never rename or drop a label, and use
`n/a` where a label does not apply:

```text
## Proof Summary

- Static proof:
- Staging proof:
- Visual proof:
- Interaction proof:
- Editor-control proof:
- Tool proof:
- Manual-only gaps:
```

`Tool proof` lists the `a11y:check` JSON artifact / axe result. `Manual-only
gaps` names the keyboard-operation and visible-focus checks axe cannot fully
verify.

