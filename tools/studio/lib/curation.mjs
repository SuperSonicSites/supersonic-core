// Pure redirect-curation transforms for the Studio "Curate redirects" flow.
//
// CSV parsing/serialization stays in tools/lib/redirects.mjs (shared with the
// redirects:check gate and the Rank Math export) — this module only decides
// what a curated row looks like after a human decision, so the transform is
// unit-testable in the Studio self-test without prompts or filesystem.

import { normalizeRedirectPath } from '../../lib/redirects.mjs';

export const CURATED_NOTE = 'curated:studio';
export const NEEDS_MAPPING_RE = /NEEDS-MAPPING/;

// Applies one curation decision to a draft row. Decisions:
//   { kind: 'map', to, status? }  -> 301 (default) to a new-site path
//   { kind: 'gone' }              -> 410, empty "to"
//   { kind: 'accept' }            -> keep the auto-matched row as-is
//   { kind: 'skip' } / undefined  -> leave unchanged (NEEDS-MAPPING residue
//                                    stays visible so redirects:check still
//                                    fails closed — a skip is not a pass)
// Always returns a fresh { from, to, status, notes } object.
export function curateRow(row, decision) {
  const base = {
    from: String(row.from || ''),
    to: String(row.to || ''),
    status: String(row.status || ''),
    notes: String(row.notes || '')
  };
  if (!decision || decision.kind === 'skip' || decision.kind === 'accept') {
    return base;
  }
  if (decision.kind === 'gone') {
    return { from: base.from, to: '', status: '410', notes: `${CURATED_NOTE} 410 gone` };
  }
  if (decision.kind === 'map') {
    return {
      from: base.from,
      to: String(decision.to || ''),
      status: String(decision.status || '301'),
      notes: CURATED_NOTE
    };
  }
  return base;
}

// Builds the ordered, deduped new-page slug list curation targets come from:
// intake pages[] (TBD placeholders skipped) + data/page-compositions.json
// url_slugs, plus the "/" and "/blog/" allowlist redirects:check accepts.
// Returns display slugs (normalized paths).
export function buildNewPageSlugs(intake, compositionsDoc) {
  const seen = new Set();
  const slugs = [];
  const push = (raw) => {
    const normalized = normalizeRedirectPath(raw);
    if (normalized && !seen.has(normalized)) {
      seen.add(normalized);
      slugs.push(normalized);
    }
  };

  const pages = Array.isArray(intake && intake.pages) ? intake.pages : [];
  for (const page of pages) {
    const slug = page && typeof page.slug === 'string' ? page.slug.trim() : '';
    if (slug !== '' && !/^tbd$/i.test(slug)) {
      push(slug);
    }
  }

  const compositions = Array.isArray(compositionsDoc && compositionsDoc.compositions)
    ? compositionsDoc.compositions
    : [];
  for (const composition of compositions) {
    push(composition && composition.url_slug);
  }

  push('/');
  push('/blog/');
  return slugs;
}
