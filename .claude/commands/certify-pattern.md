---
description: Certify a theme or pattern increment using the certification workflow before packaging or upload.
---

Certify the pattern or system piece: $ARGUMENTS

Follow docs/workflows/theme-pattern-certification.md exactly; do not skip steps. Run `npm run validate` and the read-only staging checks (`npm run rest:check`, `npm run certify:staging -- <theme-version> <plugin-version>`) as the workflow requires. Any live REST write requires a dry-run (`npm run rest:dry-run`) plus explicit approval first.

Produce the certification report: what changed, files changed, screenshots reviewed, checks run, known issues, and the next recommended step.
