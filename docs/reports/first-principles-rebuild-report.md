# First-Principles Rebuild Report: Supersonic Core

Date: 2026-06-09
Scope: full-repo audit (theme, plugin, tools/CI, AI workflow layer) plus a ground-up redesign proposal.
Method: four parallel deep audits of every subsystem, synthesized into one rebuild thesis.

---

## 1. Verdict

Supersonic Core, as built, is a **correctness machine**. Its proof spine — fail-closed validators with embedded self-tests, a certification state machine, a single review-finding schema, blame-routed handoff contracts (COMPOSE-1..6, COVERAGE-1, REG-CB-1), deterministic packaging, and a checksum-verified pull-based deploy — is more rigorous than most human agencies' processes. That spine is the real asset and should survive any rebuild intact.

But the rigor is pointed almost entirely at the **floor** (token compliance, single H1, glyph bans, contrast minimums) while the things that make a website worth $20,000 — distinctive art direction, real imagery, motion, measured performance, strategic depth, and a client revision relationship — are either fixed framework defaults or unowned gaps. As designed, the system reliably produces a clean, compliant, on-brief **$5k template site**. Every site it ships will look like the framework, because the framework ships exactly one design.

The rebuild thesis in one sentence: **keep the proof spine, replace the fixed design ceiling with a generative art-direction layer, move rendering local, and make the rules data instead of prose.**

---

## 2. What the audits found (condensed)

### Theme (`wp-content/themes/supersonic-site-theme`)
- **Strong:** semantic token system with custom values fully locked (an agent literally cannot leave the tokens); real fluid typography; two-tier spacing model; the on-dark button-inversion contract and full-bleed seam-killer in `patterns.css`; pure-CSS mega menu; thin-mount template parts.
- **Weak:** template coverage is critically incomplete — no `single.html`, `archive.html`, `home.html`, `search.html`, or `404.html`, and `index.html` has no Query Loop, so the theme **cannot run a blog at all**. One footer, no header variants beyond mega, no style variations, no dark mode, no JS/Interactivity API. The logo wall is bold text reading "Logo." `section-faq-rankmath.php` hard-couples the theme to a third-party plugin. Pricing cards use `&nbsp;` spacer paragraphs. Accent `#1f6feb` is borderline AA on `surface`. `wideSize === contentSize` makes wide alignment a no-op while ~12 patterns hardcode `760px` instead of the `narrowWidth` token. Two of four shipped font families are referenced by nothing.

### Plugin (`wp-content/plugins/supersonic-site-core`)
- **Strong:** the theme auto-updater is genuinely better than most commercial updaters — payload-free deploy trigger, least-privilege `supersonic_deployer` role, `guard_download()` re-resolving the release instead of trusting the transient package URL, strict exactly-one-asset parser with a WordPress-free fixture test.
- **Weak:** it is a deploy bootstrap, not a site-core plugin. The plugin `CLAUDE.md` responsibility list (CPTs, taxonomies, REST helpers, schema/SEO helpers, integrations) is ~90% aspirational. No SEO/meta/OG/JSON-LD/sitemap handling, no forms, no redirects, no analytics hooks, no security headers, no deploy log, no concurrency lock or GitHub-API backoff on the deploy endpoint. The SHA-256 sidecar lives in the same release as the zip, so the trust root is the GitHub account itself — no release signing.

### Tools & CI
- **Strong:** deterministic from-scratch ZIP writer + double-build hash check; `validate-framework.mjs` is a real static analyzer (parses the Gutenberg block-comment tree, enforces the plugin security policy statically); validators carry rule IDs with blame routing and self-testing regression fixtures; dry-run-first REST gates with staging-host assertion.
- **Weak:** CI runs only half the gate set (`copy:check`, `compose:check`, `seo:briefs:check`, `agents:check` never run in `validate.yml`); no PHPUnit/PHPCS/ESLint; no Lighthouse/CWV budget despite layout-review claiming CWV as a dimension; no visual-regression diffing (screenshots are compared by judgment only); only the theme auto-deploys — the plugin that contains the updater itself is a manual wp-admin zip upload; helper functions are copy-pasted across five tools with already-diverged regexes; `package-wordpress-assets.ps1` is a non-deterministic dead duplicate; the staging guard is a `startsWith('staging.')` string check.

### AI workflow layer (skills, commands, docs)
- **Strong:** machine gates between every handoff make the JSON artifacts real contracts; one finding schema + bounded 2-round review loops + adversarial verification; clean ownership boundaries (strategist owns metadata, architect owns structure, writer owns body); `docs/layout-standard.md` is genuine expertise.
- **Weak:** massive prose duplication — the one-H1 rule is restated in ≥9 files, the control contract card in 5, the report format in 4 slightly different versions; already-visible drift (shadow-preset lists contradict each other across three docs; `AGENTS.md` omits the two newest skills; `docs/pattern-registry.md` says most patterns "need staging QA" while the registry shows all 28 approved). Commands front-load 9–14 docs per task despite `CLAUDE.md` saying not to. The framework declares itself single-site while every skill insists on being site-agnostic, with no clone/upstream-merge mechanism. And entire premium phases simply don't exist: art direction, imagery, motion, performance measurement, client revision workflow, post-launch governance.

---

## 3. First principles: what is actually being sold at $20k?

A $20k website is not a more-compliant $5k website. The buyer is paying for:

1. **Distinction** — the site looks like *their* brand, not like a framework. Requires per-client art direction, not one fixed `theme.json`.
2. **Evidence** — real photography/illustration, real performance numbers, real accessibility proof. Placeholders and "manual gate pending" don't survive a $20k invoice.
3. **Feel** — motion, interaction polish, perceived speed. Currently three transition tokens and a nav animation.
4. **Strategy** — positioning and conversion architecture, not just keyword non-cannibalization. The current discovery is one 12-question interview round.
5. **A relationship** — presentation artifacts, structured revision rounds, post-launch plan. Every current "approval gate" is the operator approving the agent; the client doesn't exist in the system.

The current architecture optimizes for **consistency under automation**. The rebuild must keep that property while adding **controlled variation per client** — which is an architecture problem, not an effort problem.

---

## 4. The rebuild

### 4.1 Invert the design system: compile `theme.json`, don't ship it

Today `theme.json` *is* the design. Rebuilt, it becomes a **build artifact** compiled from a per-client design spec:

- New artifact: `data/design-dna.json` (schema-validated like the others) capturing brand personality axes — type pairing, color seed + generated ramp (accent-hover, accent-strong, dark-surface tier, semantic success/warning), radius personality, density, motion personality, section-rhythm scale.
- New tool: `tools/compile-theme-tokens.mjs` deterministically generates `theme.json` (and the font subset list) from the DNA file. The lockdown posture is preserved — custom values stay disabled — but the *locked values* are per-client.
- New phase between intake and pattern work: **art direction**. A `design-director` skill generates 3 candidate DNA files, compiles each to a style variation, renders the same 5 patterns under each (locally — see 4.3), and presents 3 screenshot boards. The client/operator picks one. This is the single highest-leverage change for "doesn't look like a template."
- Style variations (`styles/*.json`) stop being a missing feature and become the natural output of DNA candidates.

This keeps the framework's best property (agents cannot exit the token system) while killing its worst (every site is `#1f6feb` Inter/Montserrat).

### 4.2 Make the rules data, not prose

The doc layer is the system's memory and it is already drifting. Rebuild:

- One machine-readable `data/rules.json`: every rule gets an ID, severity, owning validator, owning skill, and one-line statement (the H1 policy, shadow allowlist, spacing contract, ownership boundaries, report format — all of it).
- Validators import rules from it; skills and docs **reference rule IDs** instead of restating prose; a generator emits the human-readable standards docs from it. The shadow-preset contradiction and the 9-way H1 duplication become structurally impossible.
- Collapse the command → skill → standard triplication: commands become 5-line launchers (model pin + skill invoke + args), skills hold procedure, `rules.json` holds law. Delete `docs/pattern-library.md` (pure indirection) and regenerate `docs/pattern-registry.md` from `pattern-certifications.json` so the human summary can never lie again.

### 4.3 Move rendering local: WordPress Playground changes the V1 constraint

The "no local runtime" V1 rule predates WordPress Playground maturing. `@wp-playground/cli` boots a real WordPress in Node/WASM in seconds — no Docker, no DDEV, no hosting dependency. This dissolves the framework's biggest structural weakness: **every visual proof currently requires Hostinger staging and network access.**

- New tool: `tools/playground-render.mjs` — boot Playground, install the packaged theme+plugin zips (the deterministic packager already produces exactly the right input), create a page per pattern, screenshot at the existing 1440/768/390 matrix.
- CI gains what it cannot have today: **visual regression** (pixelmatch against committed baselines — a one-line addition once rendering is local), axe a11y on every pattern, Lighthouse CI with enforced budgets (LCP/CLS/total-weight/font-bytes), and a smoke test that the blog templates actually render.
- Hostinger staging is demoted from "the only render surface" to what it should be: pre-production integration + final client preview. The certify loop's latency collapses from "deploy, wait, screenshot over the network" to seconds in CI.

### 4.4 Finish the theme as a product

Treat the current theme as the v2 skeleton and complete the inventory:

- **Templates:** `home.html`, `single.html`, `archive.html`, `search.html`, `404.html`; fix `index.html` with a Query Loop. A theme that can't run a blog can't anchor the content-marketing story that justifies premium pricing.
- **Layout:** real `wideSize` (e.g. 1200/1440 split); replace the ~12 hardcoded `760px` values with the `narrowWidth` token; `svh` instead of `100vh` in the fullscreen hero.
- **Patterns:** team, blog-card/Query Loop, gallery, video, native `<details>` FAQ (decoupling the theme from Rank Math — move the Rank Math variant behind a plugin-active condition or into the plugin), logo wall with real image slots, newsletter signup, 2–3 footer variants, CTA-button header variant, dark-section variants. Delete the `&nbsp;` pricing spacers (use grid alignment).
- **Interaction:** adopt the **Interactivity API** (core, no build step required for modest use) for mobile nav, accordion, and a tasteful scroll-reveal tied to the motion tokens — with `prefers-reduced-motion` already handled by the existing CSS discipline.
- **Tokens:** accent ramp (hover/strong/soft tiers) fixing the borderline AA contrast; drop the two dead font families; document breakpoints in `settings.custom`.
- **A11y debt:** fix the mega-menu focusable-but-unclickable column headings; keyboard/touch toggle semantics for the mega panel.

### 4.5 Make the plugin earn its name

- **SEO decision, formally:** either document Rank Math as an approved dependency per the repo's own plugin policy (`SECURITY.md`), or build the minimal in-house layer (titles/meta/OG/canonical + JSON-LD emitters + sitemap). Pick one; today the system half-assumes Rank Math without owning the decision.
- **Forms:** one native form handler (honeypot + time-trap + mail + store-as-CPT) — currently a dead `[approved_contact_form]` shortcode with zero code behind it.
- **Redirects:** a manager that consumes the already-existing-but-orphaned `data/redirects.csv` on deploy.
- **Hardening in code, not prose:** security headers, XML-RPC/user-enumeration lockdown, login throttling — `SECURITY.md` is a strong process doc that the plugin enforces almost none of.
- **Updater upgrades:** ed25519-sign the release checksum with the public key pinned in the plugin (today a compromised GitHub account ships code to every site); concurrency lock + GitHub-API backoff on the deploy endpoint; admin-visible deploy log; a `release-plugin.yml` workflow mirroring the theme's (the component that ships updates currently has no shipping path of its own).
- **Structure:** namespace + Composer autoloader + WPCS in CI before the feature surface grows.

### 4.6 Add the missing premium phases to the pipeline

The skill chain (init → SEO → patterns → layout → copy → QA → certify → deploy) gains:

1. **Art direction** (4.1) — after intake, before any pattern work.
2. **Imagery** — an `image-director` skill owning the brief-to-asset path: per-section art-direction notes from the layout blueprint, sourcing/licensing record, generation or stock selection, crop/focal-point spec, WebP/AVIF optimization, alt-text authored with the copy deck. IMG-2 ("real images replace placeholders before production") finally gets an owner. This is the single largest visible gap between current output and a $20k site.
3. **Motion pass** — a scoped review applying the DNA's motion personality via the Interactivity API patterns, with interaction-state evidence (the cert workflow already demands this evidence; now there's something to evidence).
4. **Performance gate** — Lighthouse CI budgets enforced in CI (4.3), plus a real-staging CWV check in `deployment-review`. "CWV is a documented manual gap" stops being an acceptable Proof Summary line.
5. **Client presentation & revision** — a generated client-facing presentation artifact (direction boards, page walkthroughs with annotated screenshots the pipeline already captures), a structured feedback-capture format that maps client notes onto the existing finding schema, and a revision-round contract (N rounds, scope rules). The machinery exists; it's just never been pointed at the client.
6. **Launch & post-launch** — legal/privacy page generation, analytics measurement plan (events, not just "GA4 installed"), 90-day content calendar seeded from the unused-keyword pool the SEO strategist already produces, and a maintenance-handoff doc. This is also what makes the *price* defensible: the deliverable includes an operating plan, not just files.

### 4.7 Resolve the single-site / multi-client identity

The framework says "not a multi-client platform" while every skill insists on being site-agnostic. Pick the obvious resolution:

- `supersonic-core` becomes a **template repo** (framework code, skills, tools, schemas, no client data).
- Each client gets a generated instance repo (intake, DNA, briefs, deck, compositions, certifications, compiled theme.json).
- A small `tools/upstream-sync.mjs` + documented merge workflow propagates framework fixes to instances. Sample client artifacts (`docs/layouts/plumbing-*`, filled `site-intake.json`) move out of core.

### 4.8 CI: run everything you built

- `validate.yml` runs **all** validators (`copy:check`, `compose:check`, `seo:briefs:check`, `agents:check` are pure-local and currently skipped).
- Add: PHPCS/WPCS + PHPStan for PHP, ESLint for the tools, secret scanning, Playground render + visual regression + axe + Lighthouse budgets (4.3).
- Extract the five copy-pasted helper sets into `tools/lib/` (the `hasUnscopedHeaderCss` regexes have already diverged — a latent drift bug). Delete the dead PowerShell packager.

---

## 5. Keep list (do not rebuild these)

- Deterministic ZIP writer + double-build determinism check.
- Pull-based, checksum-verified theme deploy with payload-free trigger and least-privilege role — extend with signing, don't replace.
- `guard_download()` re-resolving the release record; the strict exactly-one-asset parser and its WordPress-free test harness pattern.
- The certification registry as a state machine (approval impossible without on-disk screenshots + Proof Summary + staging URL).
- The single review-finding schema, severity merge, bounded 2-round loops, adversarial verification.
- The COMPOSE/COVERAGE handoff contracts with rule-ID blame routing.
- Self-testing validators (fixtures that fail the run if a detector goes lax).
- Token lockdown posture (`custom: false` everywhere) — keep the cage, change the contents per client.
- `patterns.css` button-inversion contract and full-bleed seam-killer; thin-mount template parts; the shortcode-in-paragraph render filter.
- Dry-run-first REST gates with explicit confirm tokens.

## 6. Delete list

- `tools/package-wordpress-assets.ps1` (non-deterministic, divergent, unreferenced).
- `docs/pattern-library.md` (pointer page) and hand-maintained `docs/pattern-registry.md` (replace with generation from the registry JSON).
- Open Sans + Cormorant Garamond font files (referenced by nothing).
- `&nbsp;` spacer paragraphs in `section-pricing-cards.php`.
- The duplicated prose copies of the contract card, control matrix, H1 rule, and report format (subsumed by `rules.json`).
- The theme-side `section-faq-rankmath.php` hard dependency (relocate behind plugin detection).

---

## 7. Sequenced roadmap

**Phase 1 — Foundation truth (1–2 weeks).** Playground render harness; CI runs all validators + visual regression + axe + Lighthouse budgets; complete the template set (blog actually works); fix a11y/`&nbsp;`/`760px`/contrast debt; delete list executed; `rules.json` extraction started.

**Phase 2 — Variation engine (2–3 weeks).** Design-DNA schema + token compiler + 3-direction art-direction skill; accent ramp + dark tier; pattern inventory expansion (team, blog cards, gallery, FAQ details, footers, logo wall); Interactivity API mobile nav + accordion.

**Phase 3 — Plugin becomes real (2 weeks).** SEO decision implemented; forms; redirects consumer; hardening; signed releases + plugin release workflow + deploy log.

**Phase 4 — Premium pipeline (2–3 weeks).** Imagery skill + optimization step; motion pass; client presentation/revision artifacts; launch & post-launch deliverables; template-repo split + upstream sync.

Each phase ends shippable; Phase 1 alone removes every "this would embarrass us in a $20k handoff" item, and Phase 2 is where the output stops looking like the framework.

---

## 8. Closing assessment

The hardest part of this system — making autonomous agents provably not screw up — is already built, and built well. What's missing is everything that was deferred as "V1 scope": variation, imagery, motion, measurement, and the client. None of those gaps require new research; they require pointing the existing proof discipline at the ceiling instead of the floor. The architecture that locks an agent inside a token system is exactly the architecture that can safely let a generator *choose* the tokens. That inversion — fixed cage, generated contents — is the whole rebuild.
