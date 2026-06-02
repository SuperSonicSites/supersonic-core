# Architecture Notes

## Core Model

Supersonic Core separates the work into four layers:

- Docs: AI memory and project rules
- Theme: presentation
- Plugin: functionality
- Tools: automation and audits
- Data: versioned client intake and structured source information

## Environment Model

- Repo: source of truth
- Hostinger staging: WordPress runtime, review, screenshots, integration testing, QA
- Production: protected final deploy environment
- Updraft: daily backup and full-site rollback layer

## Compatibility Model

- Target WordPress core: 7.0
- Theme and plugin headers should declare the current WordPress target.
- Server recommendations are tracked in `docs/wordpress-compatibility.md`.
- Compatibility should be verified on Hostinger staging before production handoff.

## Intake Model

- `data/site-intake.json` is committed project memory in cloned site repos.
- `data/site-intake.example.json` is the starter example.
- `data/site-intake.schema.json` defines the expected structure.
- Secrets and credentials never belong in intake files.

## SEO Research Model

- `seo-strategist` is the first research agent in Init. It runs autonomously from
  `data/site-intake.json` (it never re-interviews the user) and the Ubersuggest
  MCP. `new-site-init` must capture every input it needs, including
  `seo.competitors`.
- It executes **inside the Init stage**, after the `new-site-init` interview and
  draft docs and before the single build-plan approval gate, so its SEO-informed
  sitemap and priorities shape the plan the user approves. Init order:
  interview/draft docs -> `seo-strategist` -> build-plan approval -> build.
- It owns the authoritative SEO metadata — keywords, slugs, titles, meta
  descriptions, heading outlines, internal links, and the schema plan — and
  writes per-page briefs to `data/seo-briefs.json` (contract:
  `data/seo-briefs.schema.json`, validated by `npm run seo:briefs:check`).
- The briefs feed `layout-architect` (page structure) and the writer (body copy
  only). The plugin / Rank Math emits the JSON-LD from the schema plan; this agent
  never emits or injects it. `seo-auditor` validates the realized page.
- Model policy: the orchestrator runs the architecture/clustering reasoning on
  Opus, authors titles/meta on Sonnet, and delegates bulk Ubersuggest pulls and
  JSON assembly to Haiku (see the Model Policy in the `seo-strategist` skill).

## Design Token Model

- `docs/design-tokens-standard.md` defines the human-readable visual rules.
- `wp-content/themes/supersonic-site-theme/theme.json` implements the editable WordPress presets.
- Patterns must use theme tokens for typography, spacing, color, radius, and layout.
- Custom visual values require approval when a token already exists.

## V1 Boundary

V1 establishes the framework, instructions, and structure.

It does not include a local WordPress runtime, completed theme templates, plugin functionality, custom blocks, or third-party plugins.
