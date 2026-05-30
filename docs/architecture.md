# Architecture Notes

## Core Model

Supersonic Core separates the work into four layers:

- Docs: AI memory and project rules
- Theme: presentation
- Plugin: functionality
- Tools: automation and audits

## Environment Model

- Repo: source of truth
- Hostinger staging: WordPress runtime, review, screenshots, integration testing, QA
- Production: protected final deploy environment
- Updraft: daily backup and full-site rollback layer

## V1 Boundary

V1 establishes the framework, instructions, and structure.

It does not include a local WordPress runtime, completed theme templates, plugin functionality, custom blocks, or third-party plugins.

