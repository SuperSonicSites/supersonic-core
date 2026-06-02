# Design Tokens Standard

This document defines the default visual tokens for Supersonic Core V1.

The implementation source is `wp-content/themes/supersonic-site-theme/theme.json`.

## Core Principle

Use a small set of named design tokens instead of arbitrary values.

Visual work should be editable in Gutenberg and should use theme presets for spacing, typography, color, radius, and layout wherever WordPress supports them.

## Layout Tokens

| Token | Value | Use |
| --- | --- | --- |
| `gutter` | `5%` | Default horizontal page padding |
| `maxWidth` | `1440px` | Maximum default content width |
| `narrowWidth` | `760px` | Text-heavy content width |

Rules:

- Default layouts use the 5% site gutter.
- Default constrained layouts center inside a 1440px max width.
- Text-heavy content should use a 760px content width, either on the selected
  section group when an editor-control contract depends on it or on a real inner
  content group when no parent justification control is promised.
- Full-width media is allowed only when the section intentionally needs edge-to-edge rendering.

### Horizontal Spacing Is Owned By The Theme

Patterns own vertical section rhythm only. They must never add horizontal inset on top of the base 5% gutter.

- A section pattern must not set explicit left/right padding. The 5% gutter comes from the theme root padding automatically.
- A full-width (`align:full`) section group must not set arbitrary left/right padding. It rides the theme's 5% root gutter and 1440px content container.
- A section group may own an approved `760px` content rail only when the block's editor-control contract depends on native Gutenberg content justification, such as `Hero: Simple`.
- Do not add nested constrained groups solely to create a text rail when that adds another `has-global-padding` layer.
- Nested `760px` text groups are still valid for patterns where the inner group is the actual edited content area and no parent justification control is promised.
- Layout-neutral page templates must not wrap section-pattern post content in constrained main or post-content layout. Section patterns own their outer gutter and 1440px container; text-only content belongs in the text-page template.
- This rule is enforced by `npm run validate`; a pattern that adds horizontal padding or uses an unapproved full-width section rail fails the check.

## Section Spacing Tokens

Every section pattern must choose one vertical rhythm setting.

| Token | Value | Use |
| --- | --- | --- |
| `section-none` | `0` | Flush or tightly attached sections |
| `section-small` | `clamp(1.5rem, 1rem + 1vw, 2rem)` | Compact sections |
| `section-medium` | `clamp(2.5rem, 1.75rem + 2vw, 4rem)` | Standard sections |
| `section-large` | `clamp(4rem, 2.5rem + 5vw, 8rem)` | Hero and major transition sections |

Rules:

- Do not invent one-off section padding.
- Use the same token for top and bottom unless the section has a clear reason to be asymmetrical.
- Prefer `section-medium` for normal content sections.
- Prefer `section-large` for page heroes and final calls to action.

## Primitive Spacing Tokens

| Token | Value |
| --- | --- |
| `0` | `0` |
| `2-xs` | `0.25rem` |
| `xs` | `0.5rem` |
| `s` | `1rem` |
| `m` | `1.5rem` |
| `l` | `2rem` |
| `xl` | `3rem` |
| `2-xl` | `4rem` |
| `3-xl` | `6rem` |
| `4-xl` | `8rem` |

Rules:

- Use primitive spacing for internal gaps, card padding, button groups, and small layout adjustments.
- Use semantic section spacing for top-level section padding.
- Custom spacing values are disabled in the editor by default.

## Motion Tokens

Animation durations are tokenized so motion stays consistent across components.

| Token | Value | Use |
| --- | --- | --- |
| `transition.fast` | `150ms` | Hover/focus color and small UI feedback |
| `transition.base` | `250ms` | Default reveal, underline, dropdown, overlay |
| `transition.slow` | `400ms` | Larger or deliberate transitions |

Rules:

- Use motion tokens instead of one-off durations.
- All non-trivial motion must be disabled under `prefers-reduced-motion: reduce`.

## Component Tokens

| Token | Value | Use |
| --- | --- | --- |
| `header.minHeight` | `4.5rem` | Minimum height of the sticky site header |

## Typography Tokens

| Token | Mobile Minimum | Desktop Maximum | Use |
| --- | ---: | ---: | --- |
| `small` | `14px` | `14px` | Captions, eyebrow text, compact UI text |
| `body` | `16px` | `18px` | Default body copy |
| `large` | `18px` | `22px` | Lead paragraphs and intro copy |
| `heading-3` | `24px` | `32px` | Card headings and subsection headings |
| `heading-2` | `32px` | `48px` | Section headings |
| `heading-1` | `40px` | `64px` | Page headings |
| `display` | `48px` | `80px` | Rare editorial or hero display text |

Rules:

- Use fluid typography presets from `theme.json`.
- Do not set arbitrary font sizes unless approved.
- Body copy uses `1.6` line height.
- Headings use tight line height, generally between `1.05` and `1.15`.
- Letter spacing is `0` unless brand rules explicitly require otherwise.

## Color Tokens

| Token | Use |
| --- | --- |
| `base` | Default page background |
| `contrast` | Primary text |
| `contrast-subtle` | Secondary text |
| `surface` | Elevated or separated surfaces |
| `muted` | Soft background bands |
| `border` | Borders and separators |
| `accent` | Primary action and link color |
| `accent-contrast` | Text on accent backgrounds |

Rules:

- Use semantic color roles instead of one-off colors.
- Custom colors are disabled in the editor by default.
- Keep contrast readable on all backgrounds.
- Do not add new palette colors until a real project need exists.

## Radius Tokens

| Token | Value | Use |
| --- | --- | --- |
| `none` | `0` | Flush full-width or editorial elements |
| `small` | `4px` | Small controls and subtle edges |
| `medium` | `8px` | Buttons, cards, default media |
| `large` | `16px` | Larger media or featured cards |
| `pill` | `999px` | Pills and rounded badges |

Rules:

- Default cards and buttons should use `medium`.
- Full-width media may use `none`.
- Do not use oversized radii for normal business-site cards.

## Shadows

Core WordPress shadow presets are disabled, but Supersonic provides a small approved shadow set.

| Token | Value | Use |
| --- | --- | --- |
| `soft` | `0 8px 24px rgb(17 17 17 / 0.08)` | Subtle dropdowns, light image lift, low-emphasis cards |
| `medium` | `0 16px 40px rgb(17 17 17 / 0.12)` | Featured images or cards that need stronger separation |
| `strong` | `0 24px 56px rgb(17 17 17 / 0.16)` | High-emphasis elevation: popovers, featured/spotlight cards |

Rules:

- Prefer borders and spacing over shadows.
- Use approved shadow presets when an element needs depth.
- Do not use one-off shadow values in CSS or patterns.
- Add a new shadow preset only when a project has a clear visual reason.

## Gradients

Custom gradients are disabled; Supersonic provides a small approved gradient set
for richer section backgrounds. Use them sparingly and keep readable text on the
same group.

| Token | Value | Use |
| --- | --- | --- |
| `surface-rise` | `linear-gradient(180deg, #ffffff 0%, #f7f8fa 100%)` | Gentle base→surface depth on neutral sections |
| `accent-veil` | `linear-gradient(135deg, #1f6feb 0%, #1a56c4 100%)` | Accent emphasis bands (hero/CTA); keep `accent-contrast` text |
| `muted-soft` | `linear-gradient(180deg, #ffffff 0%, #f1f3f5 100%)` | Subtle base→muted depth |

Rules:

- Use approved gradient presets only; custom gradients stay disabled.
- Keep AA contrast and set readable text on the same group for dark/accent bands.
- Prefer flat token bands for segmentation; gradients are accents, not defaults.

## Page Heading Rule

The default `page.html` template is layout-neutral and does not force a title above every page.

Rules:

- Every built page must still have exactly one clear H1.
- The H1 is supplied by the AI-built page layout, usually through the first hero or intro pattern.
- Do not rely on the default template to add the H1 for production pages.
- QA must fail any page layout that omits an H1 or creates multiple H1s.

## Pattern Authoring Checklist

Before approving a pattern:

- it uses native blocks
- it uses semantic section spacing
- it uses theme typography presets
- it uses semantic color tokens
- it uses the 5% gutter unless intentionally full-width
- it comes from the approved Supersonic theme `/patterns` library
- it does not rely on core, remote, or third-party pattern libraries
- it avoids Custom HTML blocks
- it avoids arbitrary CSS values
- it is reviewed with desktop, tablet, and mobile section screenshots
