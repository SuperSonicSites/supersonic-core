# SEO Strategy

This file defines SEO direction and review rules.

For `supersonic-core`, this is a starter template. For a cloned site repo, replace placeholders with real keywords, page intent, and local/service strategy.

This file is produced and maintained by the `seo-strategist` skill during Init, using the Ubersuggest MCP. The authoritative, machine-readable per-page briefs live in `data/seo-briefs.json` (contract: `data/seo-briefs.schema.json`); this file is the human-readable summary. SEO titles, meta descriptions, slugs, and schema plans are owned here by `seo-strategist` — not by the writer, who fills body copy only. Validate the briefs with `npm run seo:briefs:check`.

## SEO Output Ownership

Rank Math (free, approved in `SECURITY.md`) owns all SEO output on the live site: meta titles and descriptions, Open Graph tags, JSON-LD schema, XML sitemaps, and 301 redirects. The theme and the supersonic-site-core plugin emit none of these. `data/redirects.csv` is the Git source of truth for redirects; it flows into Rank Math via `tools/export-rankmath-redirects.mjs` and the Rank Math redirection importer.

## SEO Principles

- Each important page needs a clear search intent.
- Each page should have one H1.
- Page titles and meta descriptions should be unique.
- Internal links should support user journeys and topic relevance.
- Avoid thin pages with generic filler copy.
- Do not add schema blindly. Use schema only when it matches visible content and page purpose.

## Keyword Planning

One primary keyword per page, no cannibalization. Volume and SEO Difficulty (SD) come from the Ubersuggest MCP. Slugs are lowercase, hyphen-separated, and 5 words or fewer.

| Page | URL Slug | Primary Keyword | Volume | SD | Intent | Secondary / LSI |
| --- | --- | --- | --- | --- | --- | --- |
| Home | `/` | TBD | TBD | TBD | TBD | TBD |
| Services | `/services` | TBD | TBD | TBD | TBD | TBD |
| About | `/about` | TBD | TBD | TBD | TBD | TBD |
| Contact | `/contact` | TBD | TBD | TBD | TBD | TBD |

## Keyword Clusters (Hub & Spoke)

Group keywords into topic clusters so a hub page links to its supporting spoke pages and back. Keep each cluster's primary keyword unique to one page.

| Cluster | Hub page | Spoke pages | Notes |
| --- | --- | --- | --- |
| TBD | TBD | TBD | TBD |

## Internal Link Matrix

Each drafted page links to 2-4 targets with descriptive anchor text. `layout-architect` places the links; the writer writes the surrounding copy.

| Source page | Target page | Anchor text |
| --- | --- | --- |
| TBD | TBD | TBD |

## Metadata Rules

- SEO title should be specific and readable.
- Meta description should summarize the page and include a useful reason to click.
- Do not stuff keywords.
- Avoid duplicate metadata.

## Heading Rules

- One H1 per page.
- Use headings to describe section topics.
- Do not skip heading levels for visual styling.
- Do not use headings for decorative text.

## Internal Linking Rules

- Link from service summaries to detailed pages when they exist.
- Link final CTAs to the main conversion page.
- Avoid dead-end pages.
- Use descriptive link text.

## Schema Opportunities

Potential schema types, only when applicable:

- Organization
- LocalBusiness
- Service
- FAQPage
- BreadcrumbList

`seo-strategist` records the per-page schema **plan** (type + required fields) in `data/seo-briefs.json`; it never emits JSON-LD. Emission belongs to Rank Math (see SEO Output Ownership above) — not the theme and not the site-core plugin.

