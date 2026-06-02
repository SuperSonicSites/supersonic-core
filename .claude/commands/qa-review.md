---
description: Run desktop/tablet/mobile QA review for a pattern or section against the proof-first QA checklist.
---

Run a QA review for: $ARGUMENTS

Follow `docs/agent-quality-standard.md`, `.claude/skills/visual-qa/SKILL.md`,
and `QA_CHECKLIST.md`.

1. Discover the target from the request, latest report, registry entry, source
   file, and staging read-only status before asking questions.
2. Define the QA contract: target, selector, expected desktop/tablet/mobile
   behavior, editor-control claims, and required interaction states.
3. Use cache-busted staging URLs for final proof.
4. On `qa-pattern-*` pages, target the reviewed pattern under `main`.
5. Capture desktop, tablet, and mobile screenshots.
6. Use `npm run pattern:proof` when a staging URL and selector are available to
   check visible target dimensions, horizontal overflow, and console/page errors.
7. Capture interaction-state evidence for headers, nav, overlays, accordions,
   hover menus, and any click/open/closed state.
8. Check one editable H1 per full page layout, token usage only, header
   navigation CSS scoped to `.supersonic-site-header`, approved shadow presets,
   accessibility basics, and SEO basics.
9. Report pass/fail per check with a `Proof Summary`, issues found, fixes made,
   manual-only gaps, and approval status.

If proof is incomplete, fail closed with `needs-revision`; do not approve. Fix
only the issues identified, then re-review. Do not deploy.
