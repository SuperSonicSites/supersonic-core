---
description: Certify a theme or pattern increment using the proof-first certification workflow before packaging or upload.
---

Certify the pattern or system piece: $ARGUMENTS

Follow `docs/agent-quality-standard.md`,
`.claude/skills/certify-pattern/SKILL.md`, and
`docs/workflows/theme-pattern-certification.md`. Do not skip proof gates.

1. Discover the changed source files, package/theme/plugin versions, matching
   registry entries, latest report, staging read-only status, and current Git
   status.
2. Define the certification contract: scope, expected versions, editor controls,
   selectors, screenshots, interaction states, registry updates, checks, and
   manual-only gaps.
3. Run static checks: `npm run agents:check`, `npm run validate`,
   `npm run pattern:registry:check`, `npm run package`, and
   `npm run package:determinism`.
4. Run read-only staging checks as relevant: `npm run rest:check` and
   `npm run certify:staging -- <theme-version> <plugin-version>`.
5. Any live REST write requires dry-run plus explicit approval first.
6. Use cache-busted staging URLs and target the reviewed component under `main`
   on QA pages.
7. Use `npm run pattern:proof` when a pattern URL and selector are available.
8. Capture and review desktop, tablet, and mobile screenshots.
9. Capture interaction-state evidence for headers, navigation, accordions,
   overlays, hover menus, and similar behavior.
10. Produce a report with `Proof Summary`, checks run, screenshots, interaction
    proof, issues/fixes, manual-only gaps, known issues, and next step.

If any required proof is missing, fail closed with `needs-revision` instead of
approval.
