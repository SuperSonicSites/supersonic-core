# Layout Blueprint — Sample Service Page

> **SAMPLE / FIXTURE** — a forward-test of the `layout-architect` skill on the
> Service archetype. Generic mock content ("Acme Field Services"); **no real
> business**. These files are **not theme patterns** and are **not** scanned by
> `npm run validate`. The composed markup lives in
> [sample-service-page.html](sample-service-page.html); the staging payload is
> generated to `data/page-json/sample-service-page.json`.

```text
Page: Service (sample) — "Commercial HVAC Maintenance"
Intent / archetype: service
Primary conversion / secondary actions: Primary "Request a quote"; secondary "Call (555) 010-0143"
Market + audience notes: B2B field-services buyer (facilities manager); values
  uptime, response time, compliance. Voice: clear, confident, no hype (BRAND.md).
Section order (page content inside <main>; header/footer come from the template):
  1 hero-simple        -> headline value prop + primary CTA (owns the H1)
  2 section-page-intro -> problem framing / who it's for (H2)
  3 section-text-image -> how the service delivers the outcome
  4 section-process-steps -> how it works, 3 steps
  5 section-feature-grid  -> 3 differentiators (integral surface band, white cards)
  6 section-testimonial   -> attributed proof (dark punctuation band)
  7 section-pricing-cards -> 3 plan tiers (integral surface band, white cards)
  8 section-faq-rankmath  -> objection handling via approved Rank Math FAQ block
  9 cta-band              -> final CTA (accent punctuation band)
H1 owner section (exactly one): hero-simple (section-page-intro heading demoted to H2)
Background sequence (section -> role; integral pinned; punctuation marked) [COLOR-6/7/8]:
  hero=surface, page-intro=base, text-image=surface, process-steps=base,
  feature-grid=surface(integral), testimonial=contrast(punctuation, base text),
  pricing=surface(integral), faq=base, cta-band=accent(punctuation, accent-contrast text)
  Adjacency: surface→base→surface→base→surface→contrast→surface→base→accent
  (strict soft-neutral<->base alternation; surface & muted count as one soft neutral
  per refined COLOR-6; integral pins honored; punctuation bands set readable text)
Per-section spec: each section group owns one section-* token + background role +
  readable foreground; text left-aligned except short centered hero/CTA runs;
  card rows align-items stretch; typography from presets (heading-1/2/3, body, large).
Per-section exposed controls (preserved) [FW-7]: section background + text color,
  heading/paragraph typography presets, button labels/URLs/colors, image
  replacement + alt, card surface/radius/shadow, Rank Math FAQ question content.
Archetype-order check: matches the Service archetype in docs/layout-standard.md
  (pricing included = priced service); no unapproved extra sections.
Placeholder images (slot -> placehold.co URL + alt + WxH):
  hero 16:9    -> https://placehold.co/1600x900/1f6feb/ffffff?text=HVAC+Service
                  alt "Technician servicing a rooftop HVAC unit" 1600x900 (not lazy, CWV-1)
  text-image 4:3 -> https://placehold.co/800x600/f7f8fa/4b5563?text=On-site+Visit
                  alt "Field technician inspecting an air handler" 800x600
  testimonial avatar 1:1 (dark) -> https://placehold.co/96x96/111111/ffffff?text=DM
                  alt "Portrait of facilities manager Dana M." 96x96
Internal links (source phrase -> target, descriptive anchor):
  hero/CTA "Request a quote" -> /contact (conversion page; LINK-6)
  intro "emergency repair service" -> /services/emergency-hvac (contextual; LINK-2)
  feature "see all maintenance plans" -> /services/maintenance-plans
Structured-data plan (page-type -> types; emission deferred to plugin/SEO):
  Service (provider -> Organization @id, areaServed) + WebPage + BreadcrumbList.
  Content present: service name, provider, area, offers (pricing tiers). No hand
  JSON-LD emitted here (SD-1). FAQ content uses the approved Rank Math FAQ block
  so FAQ schema ownership stays in the SEO layer (SD-3).
Approved-pattern check: hero-simple, section-page-intro, section-text-image,
  section-process-steps, section-feature-grid, section-testimonial,
  section-pricing-cards, section-faq-rankmath, cta-band are all status=approved
  in data/pattern-certifications.json.
Expected proof: offline rule-ID scorecard (static) + live staging desktop/tablet/
  mobile screenshots + Rank Math FAQ render/schema ownership check.
Manual-only gaps (until staging runs): real AA contrast measurement, overflow at
  each breakpoint, focus/target-size, console-error check.
```

## Notes on test deviations

- **No FAQ block exception:** the fixture uses `section-faq-rankmath` /
  `rank-math/faq-block`, matching the approved-pattern contract (`FW-1`,
  `SD-3`).
- **Expanded per-instance markup** (not `wp:pattern` references) is used so the
  background rhythm and the single-H1 demotion are real on the page (`FW-3`).
- The sample page does not rely on the new gradient or `strong` shadow tokens,
  but the 0.1.30 certification still needs the theme package deployed so the
  stacked-section CSS fix is present on staging.
