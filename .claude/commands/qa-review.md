---
description: Run desktop/tablet/mobile QA review for a pattern or section against QA_CHECKLIST.md.
---

Run a QA review for: $ARGUMENTS

Follow QA_CHECKLIST.md. Review the specific section or pattern changed at desktop, tablet, and mobile widths. Reuse screenshots under screenshots/after/ or capture new ones with `npm run screenshot` when a staging URL is available.

Check: exactly one editable H1 per full page layout, design-token usage only, header navigation CSS scoped to .supersonic-site-header, approved shadow presets only, accessibility basics, and SEO basics.

Report pass or fail per check with the issues found. Fix only the issues identified, then re-review. Do not deploy.

This command is the single-pass `QA_CHECKLIST.md` review (visual + accessibility + SEO + single-H1 + header-nav scoping). For a multi-pattern responsive screenshot fan-out — creating a temporary QA page per pattern, capturing three breakpoints, adversarially verifying findings, and writing a release report — use the `visual-qa` skill or run the `visual-qa` workflow instead. That workflow is visual-only; it does not repeat the a11y/SEO checks this command covers.
