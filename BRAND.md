# Brand Context

This file defines voice, visual direction, and content rules.

For `supersonic-core`, keep examples generic. For a cloned site repo, replace these placeholders with client-specific brand rules.

## Brand Voice

- Clear
- Useful
- Confident
- Human
- Direct

## Writing Style

Use plain language. Prefer specific benefits over vague claims.

Avoid filler, hype, and generic marketing copy.

Good copy should explain:

- who the offer is for
- what problem it solves
- why it is credible
- what action the visitor should take next

## CTA Tone

CTAs should be concrete and low-friction.

Examples:

- Book a consultation
- Request a quote
- View services
- Get started
- Contact us

## Visual Direction

The visual system should be clean, structured, and easy to scan.

Use design tokens from `DESIGN_SYSTEM.md` and `theme.json`.

Avoid arbitrary one-off styles.

## Words And Phrases To Avoid

- best-in-class
- cutting-edge
- game-changing
- next-level
- revolutionary
- unlock your potential
- tailored solutions, unless explained specifically

## Mechanical Copy Rules

These are hard rules enforced by `tools/validate-copy.mjs` (run via `npm run copy:check`). Every copy slot must pass all of them before the deck ships.

### Banned characters

- **Em dash** (U+2014, `—`) and **en dash** (U+2013, `–`) are banned. Use a comma, a period, or the word "to" instead.
- **Smart/curly quotes** (`'`, `'`, `"`, `"`) and the **ellipsis character** (U+2026, `…`) are banned. Use straight apostrophes and straight double quotes, and write three separate periods (`...`) when a trailing pause is needed.
- **Straight apostrophes and straight quotes are required** for natural English. Do not drop a possessive apostrophe (e.g. `client's`) or contract (e.g. `it's`) just to avoid the character. Those are straight marks and are correct.

### Words and phrases to avoid

The following phrases are banned in all copy slots (case-insensitive, whole-word match). The list is a framework floor; a site's `data/site-intake.json` `brand.phrasesToAvoid` field may extend it but never shrinks it.

- `best-in-class`
- `cutting-edge`
- `game-changing`
- `next-level`
- `revolutionary`
- `unlock your potential`
- `tailored solutions`

### Slot length and sibling balance

- Every slot must stay within its declared `max_chars` and `max_words` budgets, which are set by the pattern registry (`data/pattern-certifications.json` `copy_slots`).
- Slots that share a `sibling_group` (e.g. cards in a row) must be balanced: the longest slot may be at most 1.25x the character length of the shortest. Unbalanced groups cause the boxes to misalign at render time.

### Validator

Run `npm run copy:check` to verify all of the above. The checker is binary pass/fail; a single violation fails the whole deck. Fix every failure before handoff.

## Content Rules

- One clear H1 per page.
- Each section should have a clear job.
- Avoid duplicate CTAs that compete with each other.
- Prefer concrete service, product, or outcome language.
- Keep important content visible without relying on sliders or hidden tabs.

