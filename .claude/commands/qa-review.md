---
description: Run desktop/tablet/mobile QA review for a pattern or section against QA_CHECKLIST.md.
---

Run a QA review for: $ARGUMENTS

Follow QA_CHECKLIST.md. Review the specific section or pattern changed at desktop, tablet, and mobile widths. Reuse screenshots under screenshots/after/ or capture new ones with `npm run screenshot` when a staging URL is available.

Check: exactly one editable H1 per full page layout, design-token usage only, header navigation CSS scoped to .supersonic-site-header, approved shadow presets only, accessibility basics, and SEO basics.

Report pass or fail per check with the issues found. Fix only the issues identified, then re-review. Do not deploy.
