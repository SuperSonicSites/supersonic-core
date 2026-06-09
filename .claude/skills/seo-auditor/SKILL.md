---
name: seo-auditor
description: Use when auditing a Supersonic page or pattern for on-page SEO, including requests like "SEO audit", "on-page SEO review", "check the meta description and title", "heading structure check", or "is this page SEO-ready". Checks single H1, heading order, title tag, meta description, semantic HTML, image alt text, internal links, and structured data.
---

# SEO Auditor Skill

Use this skill when reviewing page structure, metadata, internal links, or schema opportunities.
Also follow `docs/agent-quality-standard.md`.

## Discovery

Inspect the page purpose, visible content, current headings, metadata source,
internal links, image alt text, structured data source, and relevant docs before
asking questions.

## Contract

Define the SEO scope before review: target page or pattern, search intent,
required metadata, heading expectations, internal-link expectations, schema
eligibility, and proof source.

## Proof Gates

- Prove one H1 and useful heading order from source or rendered page.
- Prove title/meta description are unique and aligned to visible content when
  those values are available.
- Prove schema matches visible content before recommending or approving it.
- Prove image alt text and internal links are useful for the page intent.

## Failure Policy

Fail closed when metadata, schema, H1, or visible-content proof is missing. Do
not approve keyword stuffing, generic metadata, duplicate content, or schema that
does not match visible content.

## Finding Shape

Emit every issue in the one canonical finding shape defined by
`data/review-finding.schema.json` (fields `id`, `rule_id`, `dimension`,
`severity`, `breakpoint`, `target`, `evidence`, `suspected_source`,
`recommended_fix`, `status`, `tool_proof`), so `layout-review` can merge this
audit deterministically. Use only the canonical severity enum
`blocker | major | minor | nit` — no other severity words. Put the measured
number or quote in `evidence`, and set `tool_proof` when the finding came from
`copy:check` or `a11y:check`.

## Check

- page intent
- one H1
- unique SEO title
- unique meta description
- useful heading structure (compare realized page H2s against the brief outline
  `h2`/`talking_points` in `data/seo-briefs.json`)
- internal links
- thin content — measured, not guessed: read the page `target_word_count` and
  outline from `data/seo-briefs.json`, then cite `npm run copy:check` `COVERAGE-1`
  (realized prose words vs brief `target_word_count`, floor 80%). Report the
  measured percentage and rule id as `evidence`; do not eyeball thinness.
- duplicate content
- schema fit

## Rules

- Do not keyword stuff.
- Do not add schema that does not match visible content.
- Do not approve generic metadata.
- Keep SEO recommendations tied to the page purpose.

## Report

Include:

- page or section reviewed
- proof summary (canonical labels below)
- issues found (in the `data/review-finding.schema.json` shape)
- recommended fixes
- metadata notes
- schema notes, if relevant

Use the canonical Proof Summary, never renaming a label and never dropping one
(use `n/a` when a label does not apply):

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

`Tool proof` lists the measured machine evidence: the `npm run copy:check`
`COVERAGE-1` result (realized words vs brief `target_word_count`) and any
`npm run a11y:check` result if it was run.

