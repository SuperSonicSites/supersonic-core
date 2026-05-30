# Architecture Notes

## Core Model

Supersonic Core separates the work into four layers:

- Docs: AI memory and project rules
- Theme: presentation
- Plugin: functionality
- Tools: automation and audits
- Data: versioned client intake and structured source information

## Environment Model

- Repo: source of truth
- Hostinger staging: WordPress runtime, review, screenshots, integration testing, QA
- Production: protected final deploy environment
- Updraft: daily backup and full-site rollback layer

## Compatibility Model

- Target WordPress core: 7.0
- Theme and plugin headers should declare the current WordPress target.
- Server recommendations are tracked in `docs/wordpress-compatibility.md`.
- Compatibility should be verified on Hostinger staging before production handoff.

## Intake Model

- `data/site-intake.json` is committed project memory in cloned site repos.
- `data/site-intake.example.json` is the starter example.
- `data/site-intake.schema.json` defines the expected structure.
- Secrets and credentials never belong in intake files.

## Design Token Model

- `docs/design-tokens-standard.md` defines the human-readable visual rules.
- `wp-content/themes/supersonic-site-theme/theme.json` implements the editable WordPress presets.
- Patterns must use theme tokens for typography, spacing, color, radius, and layout.
- Custom visual values require approval when a token already exists.

## V1 Boundary

V1 establishes the framework, instructions, and structure.

It does not include a local WordPress runtime, completed theme templates, plugin functionality, custom blocks, or third-party plugins.
