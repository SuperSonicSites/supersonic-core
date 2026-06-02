---
description: Run the Init SEO research and architecture pass (seo-strategist) on Opus — Ubersuggest keyword/competitor research into a non-cannibalizing sitemap and per-page content briefs.
model: opus
---

Run the autonomous SEO research and content-architecture pass for the site at
Init: $ARGUMENTS

Example: `/seo-research` or `/seo-research focus on the Dallas service area`.

This command runs on Opus because site architecture, keyword clustering, and
anti-cannibalization are the core, hard-to-reverse reasoning that shapes the whole
site. Follow `CLAUDE.md`, `docs/agent-quality-standard.md`, and
`.claude/skills/seo-strategist/SKILL.md`. It runs inside Init, after the
`new-site-init` interview and before the build-plan approval gate, and is fully
autonomous: drive every decision from `data/site-intake.json` and the Ubersuggest
MCP — never interview the user.

1. Read `CLAUDE.md`, `docs/agent-quality-standard.md`,
   `.claude/skills/seo-strategist/SKILL.md`, `data/site-intake.json`, `BRAND.md`,
   `PAGE_MAP.md`, `CONTENT_MODEL.md`, `SEO_STRATEGY.md`, `docs/layout-standard.md`,
   and `data/seo-briefs.schema.json`. Check `git status --short` first; preserve
   unrelated local work.
2. Confirm Ubersuggest MCP access with `auth_status`. If a required intake field
   (offer, business type/market, geography, page list) is missing, fail closed
   (`blocked`) and route the gap back to `new-site-init` — do not prompt.
3. Define the research contract: seed niche/topics, geography, 3-5 competitors
   (from `seo.competitors`, or derived via `serp_analysis` when empty), and one
   primary keyword per page with no cannibalization.
4. Research with the Ubersuggest MCP: competitor recon (`domain_overview`,
   `competitors`, `domain_top_pages`), keyword pulls (`keyword_suggestions`,
   `keyword_overview`, `match_keywords`) with Volume and SD, and intent/gap checks
   (`serp_analysis`, `content_ideas`). Per the skill Model Policy, you may delegate
   the bulk pulls + parsing and the final JSON assembly to a Haiku sub-agent with a
   fully specified contract, then verify the returned data against the proof gates.
   Never read raw `keyword_suggestions` output inline — it can exceed 300K
   characters; route it to the Haiku sub-agent, which reads any saved result file
   in chunks and returns only the parsed top-N terms.
5. Cluster keywords into a hub-and-spoke sitemap; assign one primary keyword and
   3-5 LSI terms per page; set lowercase, hyphen-separated slugs of 5 words or
   fewer. Author the authoritative `seo_title` (<=60), `meta_description` (<=160),
   heading outline, internal-link matrix, and structured-data plan — emission is
   left to the plugin / Rank Math; never emit JSON-LD here.
6. Write `data/seo-briefs.json`; enrich `SEO_STRATEGY.md`, `PAGE_MAP.md`, and
   `CONTENT_MODEL.md` (candidate structured types only). Do not create live pages
   or run a Ubersuggest project write without approval.
7. Run `npm run seo:briefs:check` and fix failures.
8. Report with a `Proof Summary` (data sourced from the MCP, anti-cannibalization,
   metadata limits, schema-plan fit, schema conformance). If any proof is missing,
   fail closed with `blocked` or `needs-revision`; do not mark the pass complete.
   Hand off to `layout-architect` (structure) and the writer (copy).
