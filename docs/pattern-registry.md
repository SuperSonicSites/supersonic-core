# Pattern Registry

This registry tracks Supersonic theme patterns.

The machine-readable source of truth is `data/pattern-certifications.json`.
This Markdown file is the human-readable summary.

Patterns are added as source first. A pattern is not approved until it has passed staging editor review plus desktop, tablet, and mobile screenshot review for that specific pattern or section.

Run:

```text
npm run pattern:registry:check
```

The registry check confirms every pattern file has a registry entry, every entry
points to an existing source file, evidence paths exist when recorded, and local
documentation links resolve.

## 0.1.5 Source-Ready Pattern Set

| Pattern | Slug | Category | Status | Notes |
| --- | --- | --- | --- | --- |
| Header: Simple | `supersonic-site-theme/header-simple` | Supersonic Headers | Source ready, needs staging QA | Default modular header pattern mounted by the header template part. |
| Header: Mega | `supersonic-site-theme/header-mega` | Supersonic Headers | Approved in theme v0.1.29 | Multi-column link mega menu; native navigation blocks + scoped CSS, collapses to the hamburger overlay at the 1024px tablet boundary. |
| Footer: Simple | `supersonic-site-theme/footer-simple` | Supersonic Footers | Source ready, needs staging QA | Default modular footer pattern mounted by the footer template part. |
| Hero: Simple | `supersonic-site-theme/hero-simple` | Supersonic Heroes | Source ready, needs staging QA | Left-aligned page hero with editable H1. |
| Hero: Centered | `supersonic-site-theme/hero-centered` | Supersonic Heroes | Source ready, needs staging QA | Centered page hero with editable H1. |
| Hero: Fullscreen Image | `supersonic-site-theme/hero-fullscreen-image` | Supersonic Heroes | Source ready, needs staging QA | Fullscreen image hero with editable H1 and overlay controls. |
| Section: Page Intro | `supersonic-site-theme/section-page-intro` | Supersonic Intros | Source ready, needs staging QA | Compact page intro with one editable H1. |
| Section: Text | `supersonic-site-theme/section-text` | Supersonic Intros | Source ready, needs staging QA | Narrow editorial text section. |
| Section: Text + Image | `supersonic-site-theme/section-text-image` | Supersonic Media | Approved in theme v0.1.31 | Two-column copy, CTA buttons, and visual placeholder; image stacks first on mobile. |
| Section: Image + Text | `supersonic-site-theme/section-image-text` | Supersonic Media | Approved in theme v0.1.31 | Reverse two-column visual and copy section with CTA buttons; image stacks first on mobile. |
| Section: Media Feature | `supersonic-site-theme/section-media-feature` | Supersonic Media | Source ready, needs staging QA | Large media placeholder with supporting text. |
| Section: Feature Grid | `supersonic-site-theme/section-feature-grid` | Supersonic Cards | Source ready, needs staging QA | Three benefit cards with approved shadow preset. |
| Section: Service Cards | `supersonic-site-theme/section-service-cards` | Supersonic Cards | Source ready, needs staging QA | Three linked service cards. |
| Section: Card Row | `supersonic-site-theme/section-card-row` | Supersonic Cards | Source ready, needs staging QA | Compact row of short cards. |
| Section: Icon List | `supersonic-site-theme/section-icon-list` | Supersonic Cards | Source ready, needs staging QA | Numbered benefit list using editable text markers. |
| Section: Testimonial | `supersonic-site-theme/section-testimonial` | Supersonic Trust | Source ready, needs staging QA | Single prominent quote section. |
| Section: Testimonial Grid | `supersonic-site-theme/section-testimonial-grid` | Supersonic Trust | Source ready, needs staging QA | Three-card social proof grid. |
| Section: Logo Row | `supersonic-site-theme/section-logo-row` | Supersonic Trust | Source ready, needs staging QA | Editable logo/partner proof row placeholders. |
| Section: Stat Band | `supersonic-site-theme/section-stat-band` | Supersonic Trust | Source ready, needs staging QA | Three-number proof band. |
| CTA: Band | `supersonic-site-theme/cta-band` | Supersonic Conversion | Source ready, needs staging QA | Full-width centered CTA band. |
| CTA: Split | `supersonic-site-theme/cta-split` | Supersonic Conversion | Source ready, needs staging QA | Split CTA with primary and secondary actions. |
| Contact: Simple | `supersonic-site-theme/contact-simple` | Supersonic Conversion | Source ready, needs staging QA | Email, phone, and address section. |
| Contact: Map + Info | `supersonic-site-theme/contact-map-info` | Supersonic Conversion | Source ready, needs staging QA | Map placeholder plus address, phone, email, and directions CTA. |
| Contact: Form Mount | `supersonic-site-theme/contact-form-simple` | Supersonic Conversion | Source ready, needs staging QA | Native shortcode mount for an approved project form. |
| Section: Process Steps | `supersonic-site-theme/section-process-steps` | Supersonic Info | Source ready, needs staging QA | Three-step process section. |
| Section: FAQ by Rank Math | `supersonic-site-theme/section-faq-rankmath` | Supersonic Info | Source ready, needs staging QA | Uses the approved `rank-math/faq-block`; theme does not generate duplicate schema. |
| Section: Comparison | `supersonic-site-theme/section-comparison` | Supersonic Info | Source ready, needs staging QA | Two-column comparison section. |
| Section: Pricing Cards | `supersonic-site-theme/section-pricing-cards` | Supersonic Info | Source ready, needs staging QA | Three editable package/pricing cards. |

## Category Map

| Category | Intended Use |
| --- | --- |
| Supersonic Headers | Header template-part patterns only. |
| Supersonic Footers | Footer template-part patterns only. |
| Supersonic Heroes | Page hero and above-the-fold starter sections. |
| Supersonic Intros | Page intros, text openings, and editorial sections. |
| Supersonic Media | Image, media, and visual proof sections. |
| Supersonic Cards | Reusable cards, feature grids, service summaries, and benefit lists. |
| Supersonic Trust | Testimonials, proof rows, logos, and stats. |
| Supersonic Conversion | CTA, contact, and form-mount sections. |
| Supersonic Info | FAQ, process, comparison, and pricing-style information sections. |

## Status Definitions

- Source ready: pattern source exists and static validation passes.
- QA page created: a published `qa-pattern-*` page exists on the staging host for live review.
- Screenshots captured: desktop, tablet, and mobile screenshots exist and are linked in the registry.
- Approved: pattern passed editor check and desktop, tablet, mobile screenshots.
- Needs revision: pattern failed a QA check and needs a focused fix.

## Pattern Rules

- Use native WordPress blocks first.
- Use theme design tokens for color, spacing, typography, border radius, and shadows.
- Avoid Custom HTML blocks.
- Avoid arbitrary visual values when a token exists.
- Do not add section-level left/right padding; horizontal rhythm comes from the theme's 5% root gutter and 1440px max width.
- Card interiors may use tokenized internal padding.
- Full page layouts must include exactly one editable H1.
- Component and section patterns should use H2/H3 unless the pattern is explicitly a page intro or page hero.
- Header and footer template parts should mount canonical patterns.
- Header navigation CSS must stay scoped to `.supersonic-site-header`.
- Shadows must use approved theme presets.
- FAQ schema must be handled by Rank Math, not by theme-side JSON-LD.
- New visual patterns, template parts, and blocks should be reviewed on a published staging-only QA page.
- QA pages must live only on `staging.*` hosts and must never be migrated to production.
- QA pages may be cleaned up after approval or retained on staging as the pattern lab reference.
- Screenshot review each pattern section before approval.

## Certification Workflow

Use `docs/workflows/theme-pattern-certification.md` before marking a pattern approved.
