---
name: seo-strategist
description: Use when researching site SEO architecture and keywords at the start of a new build, including requests like "run the SEO research", "do the keyword research", "plan the site architecture from Ubersuggest", "build the SEO strategy and content briefs", or "kick off the Init SEO pass". Uses the Ubersuggest MCP to turn a niche, offer, and geography into a hub-and-spoke sitemap, a non-cannibalizing keyword map, authoritative titles/meta/schema plans, and per-page content briefs that hand off to layout-architect and the writer. Runs fully autonomously from the new-site-init intake — it never interviews the user.
---

# SEO Strategist Skill

Use this skill as the first research agent in the Init stage, after `new-site-init`
has produced the project-memory skeletons and before `layout-architect` composes
pages. It turns the intake (`data/site-intake.json`) into a researched site
architecture and a machine-readable content brief per page, using the Ubersuggest
MCP for real search data.
Also follow `docs/agent-quality-standard.md`.

This skill **plans**; it never writes live pages or emits JSON-LD. It owns the
authoritative SEO metadata (titles, meta descriptions, slugs, schema plan,
keyword map, heading outline, internal-link matrix) and hands structure to
`layout-architect` and copy to the writer.

## Ownership Boundary

Single source of truth for machine-facing SEO. Downstream agents read it; they do
not re-decide it.

- `seo-strategist` **owns** (authoritative, in the brief): primary/secondary
  keywords, LSI terms, search intent, URL slug, `seo_title`, `meta_description`,
  the heading outline (H1/H2/H3 targets), the internal-link matrix, and the
  structured-data plan (schema type + required fields).
- `layout-architect` (Phase 7) **realizes structure**: picks the archetype and
  approved patterns, places exactly one H1 and the heading slots, fills image
  slots, and positions the internal links — it does not rewrite titles/meta/schema.
- The **writer** (Phase 8) **fills body copy only** into the composed patterns,
  guided by primary keyword, LSI terms, intent, voice, and word count. The writer
  does **not** author SEO titles, meta descriptions, or schema.
- The **plugin / Rank Math / SEO layer** emits the JSON-LD from the schema plan.
  This skill records the plan; it does not inject schema via REST.
- `seo-auditor` later validates the realized page against the brief.

## Ubersuggest MCP

Confirm access with `auth_status` before any research; fail closed if the MCP is
unavailable. Resolve geography with `location_suggest` / `location_details` from
`data/site-intake.json` -> `seo.locations`. Use:

- Competitor recon: `domain_overview`, `competitors`, `domain_top_pages`,
  `domain_keywords` — establish baseline topics, authority, and content gaps.
- Keyword research: `keyword_suggestions`, `keyword_overview`, `keyword_metrics`,
  `match_keywords`, `google_suggestions` — pull variations with Search Volume and
  SEO Difficulty (SD).
- Gap + intent: `content_ideas`, `seo_opportunities`, `serp_analysis`,
  `estimate_serp_clicks` — confirm a real gap and the SERP intent per cluster.
- Optional rank tracking: `create_project`, `add_project_keywords`,
  `add_project_competitors` — only with approval, because a project write is a
  live write.

Cite Volume and SD per keyword from the MCP. Do not invent metrics.

**Oversized outputs:** some tools — notably `keyword_suggestions`, and broad
`domain_keywords` / `page_keywords` pulls — can return hundreds of thousands of
characters (a single `keyword_suggestions` call can exceed 300K) and will
overflow the strategy context. Never read a raw blob inline. Delegate these bulk
pulls to a Haiku sub-agent (see Model Policy) that fetches, reads any saved
result file in chunks (offset/limit), and returns only the parsed top-N terms
with Volume and SD; verify the returned data against the Proof Gates.

## Model Policy

Pick the model per sub-task — quality-critical reasoning on the strongest model,
mechanical bulk work on a fast one. Skills cannot pin a model in frontmatter, so
the orchestrator applies this policy, delegating to sub-agents per
`docs/agent-quality-standard.md` and `AGENTS.md` when it splits the work:

- **Site architecture, keyword clustering, intent mapping, anti-cannibalization
  -> Opus.** The core, hard-to-reverse reasoning that shapes the whole site; use
  the strongest model.
- **SEO title / meta description / heading-outline authoring -> Sonnet.**
  Constrained writing (<=60 / <=160 chars, brand voice, keyword fit) — strong and
  efficient; use Opus if brand nuance is critical.
- **Bulk Ubersuggest pulls + parsing (volume/SD extraction, dedup) and final JSON
  assembly + `npm run seo:briefs:check` -> Haiku.** Mechanical, high-volume,
  low-reasoning; delegate to a fast model with a fully specified contract (which
  keywords to pull, what fields to return), then verify the returned data against
  the Proof Gates. This includes oversized responses (`keyword_suggestions` can
  exceed 300K characters): the sub-agent reads any saved result file in chunks and
  returns only parsed top-N terms — never the raw blob into the strategy context.

Run the strategy itself on Opus; only the contracted bulk steps drop to Haiku.
The `/seo-research` command pins `model: opus` for the run so the top tier is
enforced, not just advisory; the bulk steps still drop to Haiku via delegation.

## Discovery

This skill runs **fully autonomously** from the site intake — it does not
interview the user and does not prompt mid-run. `new-site-init` captures every
input it needs first.

Read:

- `CLAUDE.md`, `README.md`, `SITE.md` (read-only context).
- `data/site-intake.json` — the Init answers it drives every decision from:
  `client` (business, market, service area, offer), `audience` (who + problems +
  decision triggers), `brand` (voice, writing style, phrases to avoid), `goals`
  (primary/secondary conversions), planned `pages`, and `seo`
  (`primaryTopics`, `locations`, `competitors`, `schemaOpportunities`).
- `BRAND.md` (voice/positioning), `PAGE_MAP.md` (current sitemap),
  `CONTENT_MODEL.md`, `SEO_STRATEGY.md` (the table this skill fills),
  `docs/layout-standard.md` (Page Archetypes and the Page-Type ->
  Structured-Data Plan).
- `data/seo-briefs.schema.json` (the output contract) and
  `data/seo-briefs.example.json` (a worked example).
- `git status --short`; preserve unrelated local work.

Drive every decision from the intake plus Ubersuggest data. Derive competitors
from `serp_analysis` when `seo.competitors` is empty, and resolve page intent
from SERP evidence — never by asking. If a required intake field is missing, fail
closed and name what `new-site-init` must capture (see Failure Policy).

## Contract

Before writing anything, define the research contract:

- Seed niche/topics, target geography, and 3-5 competitor domains — all from
  `data/site-intake.json` (`client`, `seo.primaryTopics`, `seo.locations`,
  `seo.competitors`); derive competitors from SERP analysis if intake lists none.
- The page list and one **primary keyword per page** — no two pages share a
  primary keyword (no cannibalization).
- For each page: archetype, search intent, secondary + 3-5 LSI terms, `seo_title`
  (<=60 chars), `meta_description` (<=160 chars), URL slug (lowercase,
  hyphen-separated, <=5 words, mapped to the primary keyword), heading outline,
  2-4 internal links with descriptive anchors, and the structured-data plan.
- Outputs: enrich `SEO_STRATEGY.md`, `PAGE_MAP.md`, and `CONTENT_MODEL.md`
  (candidate structured types only), and write `data/seo-briefs.json` validated
  against the schema.

Site-memory docs are inputs to downstream agents; only this Init research pass
authors the SEO strategy and briefs.

## Workflow

1. `auth_status`; read the Discovery inputs; if a required intake field is
   missing, fail closed and name it (do not prompt). Resolve geography.
2. Competitor recon -> baseline topics, authority, and content gaps.
3. Pull and cluster keywords by intent; assign one primary keyword per
   cluster/page (enforce no shared primary keyword); extract 3-5 LSI terms.
4. Map clusters to the hub-and-spoke sitemap and archetypes; set slugs.
5. For each page, author the authoritative `seo_title`, `meta_description`,
   heading outline, internal-link matrix, and structured-data plan.
6. Write `data/seo-briefs.json`; enrich `SEO_STRATEGY.md`, `PAGE_MAP.md`, and
   `CONTENT_MODEL.md`.
7. Run `npm run seo:briefs:check`; fix failures.
8. Report and hand off to `layout-architect` (structure) and the writer (copy).

## Proof Gates

Use the cheapest proof that verifies each claim.

- Data proof: `auth_status` ok; every keyword's Volume/SD is sourced from the
  Ubersuggest MCP, not invented. Fail closed if the MCP is unavailable.
- Anti-cannibalization proof: no two pages share a primary keyword; each slug is
  unique. Proven by `npm run seo:briefs:check`.
- Metadata proof: every page has a unique `seo_title` (<=60) and
  `meta_description` (<=160), and a slug that is lowercase, hyphen-separated,
  <=5 words, mapped to the primary keyword. Proven by `seo:briefs:check`.
- Schema-plan proof: each page records a schema type that matches its visible
  intent (per `docs/layout-standard.md`), with emission left to the plugin/SEO
  layer — no JSON-LD emitted or injected here.
- Schema conformance: `npm run seo:briefs:check` passes — document shape plus the
  slug, title/meta length, anti-cannibalization, and schema-emitter rules from
  `data/seo-briefs.schema.json`.
- Report a `Proof Summary`.

## Failure Policy

Fail closed when evidence is incomplete; report `blocked` or `needs-revision`,
not `approved`. This skill never interviews the user — a missing input is a
fail-closed condition, not a prompt.

- Required intake field missing (no offer, business type/market, geography, or
  page list) -> `blocked`; name the gap and route it back to `new-site-init`.
  Never invent brand/market facts and never prompt the user to fill it.
- Ubersuggest MCP unavailable or `auth_status` fails -> `blocked`; do not invent
  volumes, difficulty, or competitor data.
- Two pages share a primary keyword, a slug breaks the format rule, or a
  title/meta exceeds its limit -> `needs-revision`; fix before handoff.
- A schema plan that does not match the page's visible content -> drop it.
- Never create live pages or inject JSON-LD via REST; never run a Ubersuggest
  project write without approval; never overwrite unrelated site-memory content.

## Report

Include:

- scope (niche, geography, competitor set, page count)
- the research contract and the per-page keyword/slug/intent map
- files created/changed (`data/seo-briefs.json`, enriched docs)
- `Proof Summary` (data, anti-cannibalization, metadata, schema-plan, schema
  conformance, manual-only gaps)
- the `npm run seo:briefs:check` result
- the handoff: which briefs feed `layout-architect` (structure) and the writer
  (copy)
- known issues / open questions and the next recommended step (run
  `layout-architect` for the highest-priority page)
