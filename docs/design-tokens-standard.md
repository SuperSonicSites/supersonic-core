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
- Text-heavy inner groups should use a 760px content width.
- Full-width media is allowed only when the section intentionally needs edge-to-edge rendering.

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

Core WordPress shadow presets are disabled.

Rules:

- Prefer borders and spacing over shadows.
- Add a shadow preset only when a project has a clear visual reason.
- Do not use one-off shadow values in patterns.

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
