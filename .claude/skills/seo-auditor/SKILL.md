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

## Check

- page intent
- one H1
- unique SEO title
- unique meta description
- useful heading structure
- internal links
- thin content
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
- proof summary
- issues found
- recommended fixes
- metadata notes
- schema notes, if relevant

