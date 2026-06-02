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

- Verify one H1 per full page layout and logical heading order.
- Check contrast for normal, hover, focus, dark, and light states where present.
- Verify keyboard access and visible focus for links, buttons, menus, forms, and
  overlays.
- Verify alt text, labels, link names, and landmark structure from source or
  browser output.
- For visual accessibility claims, use desktop, tablet, and mobile evidence.

## Failure Policy

Fail closed when keyboard behavior, contrast, labels, alt text, or heading proof
is missing. Do not approve inaccessible forms, hidden essential content, or
interactive states that cannot be reached without a mouse.

## Check

- one H1 per page
- logical heading order
- descriptive link text
- readable button labels
- color contrast
- alt text
- form labels
- focus states
- keyboard navigation
- landmark structure

## Rules

- Do not treat visual headings as decoration only.
- Do not use vague links like "click here".
- Do not hide essential content from keyboard or screen reader users.
- Do not approve inaccessible forms.

## Report

Include:

- scope
- proof summary
- issues
- severity
- recommended fixes
- approval status

