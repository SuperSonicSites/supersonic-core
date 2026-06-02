# Layout Blueprint — Plumbing Home Page

> **SAMPLE / FIXTURE** — a forward-test of the `layout-architect` skill on the
> **Home** archetype for a mock plumbing service business ("Rapid Flow
> Plumbing"); **no real business**. Not a theme pattern; not scanned by
> `npm run validate`. Composed markup: [plumbing-home-page.html](plumbing-home-page.html);
> staging payload: `data/page-json/plumbing-home-page.json`.

```text
Page: Home (sample) — Rapid Flow Plumbing
Intent / archetype: home (hub — keeps global nav, offers multiple paths)
Primary conversion / secondary actions: Primary "Book a plumber" (-> /contact);
  secondary "Call (555) 010-7246"
Market + audience: homeowners + property managers; emergency + planned plumbing;
  values speed, trust, upfront pricing. Voice: clear, confident, no hype (BRAND.md).
Section order (page content inside <main>; header/footer from the template):
  1 hero-simple            -> value prop + primary CTA (owns the H1)
  2 section-logo-row       -> trust strip (licensed / insured / BBB / 24-7 badges)
  3 section-service-cards  -> top 3 services, each links to its service page
  4 section-text-image     -> why-choose-us + secondary CTA to /about
  5 section-stat-band      -> proof stats (dark punctuation band)
  6 section-testimonial-grid -> 3 attributed quotes
  7 cta-band               -> final CTA (accent punctuation band)
H1 owner section (exactly one): hero-simple
Background sequence (section -> role; integral pinned; punctuation marked) [COLOR-6/7/8]:
  hero=base, logo-row=surface, service-cards=base, text-image=surface,
  stat-band=contrast(punctuation, base text), testimonial-grid=base,
  cta-band=accent(punctuation, accent-contrast text)
  Adjacency: base->surface->base->surface->contrast->base->accent
  (strict soft-neutral<->base alternation; surface & muted are one soft neutral per
  refined COLOR-6; punctuation bands set readable text; no two soft-neutrals adjacent)
Per-section spec: one section-* token/section (section-large hero/CTA, section-medium
  rest); semantic color roles + readable foreground; left-aligned body, centered only
  short hero/CTA/heading runs; card rows align-items stretch; preset typography.
Per-section exposed controls (preserved) [FW-7]: section background + text color,
  heading/paragraph typography presets, button labels/URLs/colors, image
  replacement + alt, card border/radius, quote + attribution text.
Archetype-order check: matches the Home archetype in docs/layout-standard.md
  (hero -> proof strip -> services -> story -> stats -> testimonials -> final CTA);
  no unapproved extra sections.
Placeholder images (slot -> placehold.co URL + alt + WxH):
  hero 16:9      -> https://placehold.co/1600x900/1f6feb/ffffff?text=Rapid+Flow+Plumbing
                    alt "Plumber repairing pipes under a kitchen sink" 1600x900 (not lazy, CWV-1)
  logo strip x4  -> https://placehold.co/180x60/f1f3f5/4b5563?text=... (Licensed/Insured/BBB+A%2B/24%2F7)
                    descriptive badge alt, 180x60 (~3:1)
  text-image 4:3 -> https://placehold.co/800x600/f7f8fa/4b5563?text=Our+Team
                    alt "Uniformed plumber greeting a homeowner at the door" 800x600
Internal links (source phrase -> target, descriptive anchor):
  hero/CTA "Book a plumber" -> /contact (conversion page; LINK-6)
  service cards -> /services/drain-cleaning, /services/water-heaters,
    /services/emergency-plumbing (contextual into deeper pages; LINK-2/4)
  text-image "More about our team" -> /about
Structured-data plan (page-type -> types; emission deferred to plugin/SEO):
  LocalBusiness (Plumber subtype, provider @id) + WebSite + WebPage graph; NAP in
  the footer template; areaServed = metro. Stat figures are display only -- no
  self-serving aggregateRating/review schema (SD-4). No hand JSON-LD here (SD-1).
Approved-pattern check: sections map to the approved Supersonic library
  (hero-simple, section-logo-row, section-service-cards, section-text-image,
  section-stat-band, section-testimonial-grid, cta-band). Confirm each slug's
  status in data/pattern-certifications.json before staging; route any not-yet-
  approved pattern to pattern-builder (FW-2).
Expected proof: offline rule-ID scorecard (static) + live staging desktop/tablet/
  mobile screenshots once theme 0.1.30 is deployed (seam fix present).
Manual-only gaps (until staging runs): real AA contrast, overflow per breakpoint,
  focus/target-size, console-error check.
```

## Notes

- **Expanded per-instance markup** (not `wp:pattern` references) so the background
  rhythm and the single H1 are real on the page (`FW-3`).
- **Two punctuation bands** (dark stat band, accent CTA) break the neutral
  alternation and add rhythm; both declare readable text (`COLOR-8`).
- Uses only existing palette roles (no gradient/`strong` tokens), so it renders on
  the current staging theme — but the stacked-section seam fix (`SPACE-7`) needs
  theme 0.1.30 deployed to staging to be visible.
