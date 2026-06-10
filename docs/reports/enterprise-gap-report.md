# Enterprise Gap Report — Central Key & Safe Migration Battery Test

**Date:** 2026-06-10 · **Workspace:** `tmp/centralkeyandsafe-site` (isolated clone) · **Runtime:** LocalWP `centralkeyandsafe.local`, WordPress 7.0, theme 0.1.37

The test: rebuild https://www.centralkeyandsafe.com/ with the Supersonic framework until indistinguishable, with strictly better SEO, discovering every capability gap on the way. The full pipeline ran end-to-end: extraction → init → SEO briefs → tokens → patterns → certification → composition → copy → review loops → assembly → pixel convergence loops.

## Final fidelity matrix (pixelmatch vs live baselines)

| Page | Desktop mismatch | Desktop Δheight | Mobile mismatch | Mobile Δheight | Dominant residual cause |
| --- | --- | --- | --- | --- | --- |
| Home | 37.5% | -207px | 54.0% | +2366px | copy reflow; mobile art direction |
| Services | 30.1% | -51px | 45.7% | -3738px | mobile art direction |
| About | 70.3% | -902px | 58.8% | -3069px | long-form copy caps (GAP-2) |
| FAQ | 34.2% | +745px | 28.8% | +124px | open RM answers vs compact live list (intentional) |
| Contact | 36.0% | -659px | 59.3% | -971px | missing form solution (GAP-1) |

Reading the numbers: the mismatch % includes intentional differences (improved copy text, better headings, FAQPage schema rendering answers visibly). Desktop *structure* converged: section order, bands, colors, typography scale, buttons, imagery, header/footer all match; height deltas under ~200px on home/services are copy-reflow noise. The four big residuals are all attributable to the gaps below, not to tuning.

## SEO scorecard vs the live site (strictly better, verified)

- One valid H1 per page (live: hidden 14px H1, double H1 on contact, stray `â€` H1 on privacy)
- Heading hierarchy without level skips; FAQ questions grouped under topical H2s
- Rank Math active: unique titles/meta from the briefs on every page (live home meta had mojibake)
- FAQPage schema via Rank Math FAQ block (live had none); Locksmith LocalBusiness plan documented for plugin emission
- Slugs preserved 1:1 → `data/redirects.json` proves zero path redirects needed; host-level rules documented
- Hub-and-spoke internal links per the brief matrix; tel: primary CTAs aligned to the call conversion

## Capability gaps (the deliverable)

### GAP-1 · No form solution — **blocker for any lead-gen migration**
Native Gutenberg has no form block; the framework ships a shortcode mount awaiting an "approved form." The live contact form (name/email/message/consent) cannot be replicated functionally OR visually. ~-400px and the conversion path missing on contact.
**Enterprise fix:** approve a canonical forms approach (plugin like WPForms/Fluent Forms, or a custom plugin block) and give `contact-form-simple` a real default. One-time decision, every site needs it.

### GAP-2 · No long-form prose pattern — about/history pages can't hold their content
`section-text` caps body at 360 chars and the copy pipeline enforces it; the live about story (~600 words) had to compress to ~250, costing -902px and most of about's 70% mismatch.
**Enterprise fix:** a `section-prose` pattern + registry role with multi-paragraph budgets (e.g. 2,500 chars), and let briefs mark a page long-form so COVERAGE-1 targets scale.

### GAP-3 · No responsive art direction — mobile parity is structurally out of reach
Native blocks have one aspect-ratio per image, one column-stack behavior. The live site uses different crops/sizes per breakpoint *per page* (home mobile shrinks media; services mobile keeps tall images). Our uniform mobile-crop CSS contract helped home (+600px) while overshooting services — both can't be right globally.
**Enterprise fix:** per-pattern mobile crop variables (CSS custom properties set by the section, e.g. `--supersonic-mobile-crop`), and capture mobile baselines per section during certification. This is the single largest fidelity ceiling.

### GAP-4 · No carousel/slider primitive
The live gallery is a JS carousel; the framework (correctly) bans custom HTML and has no Interactivity-API gallery block. Replicated as a static strip — visually close on desktop, interaction absent.
**Enterprise fix:** an approved Interactivity-API gallery/carousel block in the site-core plugin (it's already the documented path for the mega-menu).

### GAP-5 · Pattern slot copy budgets couple fidelity to copy length
Sibling balance and max_chars produce *better* copy, but pixel parity suffers when the source site is wordier. Migration mode needs a documented acceptance rule: "design parity net of copy deltas" (height-per-section within tolerance, text regions excluded from the mismatch metric).
**Enterprise fix:** extend `pixel-diff.mjs` with text-region masking (render with `color: transparent` injected) so the loop scores design, not prose.

### GAP-6 · Assembly is hand-rolled
`assemble-services.mjs`/`assemble-rest.mjs` join deck + briefs + image map per page, but each page template is bespoke JS. The slot→block binding is informal (slot_ref has no machine mapping to a block position in the pattern).
**Enterprise fix:** formalize slot anchors in pattern markup (e.g. `data-slot="card-1-body"` comments or block metadata) so a generic assembler can instantiate any composition mechanically. This is the missing keystone between layout-architect and the editor.

### GAP-7 · Toolchain gaps fixed during the test (port to core)
Already built and proven here, ready to port: `extract-site.mjs` (SEO+design+baseline extraction), `harvest-site-images*.mjs` + img-inject (defeats CDN 403s, 43/43 recovered), `build-image-map.mjs`, `pixel-diff.mjs`, `band-profile.mjs`, `capture-page.mjs` — the Axis A pipeline. Plus validator generalizations: container-width consistency (was hardcoded 1440), split-hero rail, accent label headings, self-owned chip surfaces, **core preset slug-collision check (`defaultFontSizes`/`defaultSpacingSizes` — silently broke the whole type scale)**, local-host qaPageUrls; and the header-chrome exception to the on-dark button contract.

### GAP-8 · Workflow/infra friction observed
- Ubersuggest MCP auth did not propagate to a running session (SEO volumes remain estimates; re-verify in a fresh session).
- The framework's staging-only assumptions (REST tool host check, `.env`-coupled tooling) needed the owner-approved LocalWP mode built mid-test; wp-cli shim (`tools/tmp/wp.cmd`) now drives everything locally. Document this as a first-class "local runtime" mode in core docs.
- Disk exhaustion from Docker images nearly killed the run; LocalWP costs ~100MB vs Docker's multi-GB. Local-runtime guidance should prefer LocalWP on constrained machines.

## What the framework already does at enterprise level

The control plane is the standout: every phase had a machine gate that caught real defects (COMPOSE-2 forced pattern certification before composition; copy-review found 6 invented claims; the contract validators forced legal markup shapes five times; copy:check enforced voice/budgets perfectly). The token system expressed the entire live design (palette, type scale, radius, shadows, buttons) with zero arbitrary values, and the pattern QA loop (QA page → 3-viewport screenshots → fix → re-shoot) converged in one round per pattern.

## Recommended next steps

1. Decide GAP-1 (forms) — single highest-impact approval.
2. Port GAP-7 items to supersonic-core (one PR, all generic).
3. Build `section-prose` (GAP-2) and the slot-anchor assembler (GAP-6) — together they make migrations mostly mechanical.
4. Add text-masked diff scoring (GAP-5) and adopt "design parity net of copy" as the migration acceptance rule.
5. Schedule the responsive art-direction design work (GAP-3) — biggest fidelity ceiling, needs a real design decision, not just code.
