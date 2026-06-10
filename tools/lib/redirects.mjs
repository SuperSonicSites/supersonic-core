// Shared parsing for the redirect map (data/redirects.csv).
//
// Both redirect tools consume this file so they can never disagree on what a
// row means:
//   - tools/export-rankmath-redirects.mjs (Git CSV -> Rank Math importer CSV)
//   - tools/validate-redirects.mjs        (redirects:check gate)
//
// CSV contract (header exactly `from,to,status,notes`):
//   - from:   legacy path, must start with "/" (e.g. /old-services/)
//   - to:     new destination path; must be empty for 410 rows
//   - status: 301, 302, or 410
//   - notes:  free text (quote the field if it contains commas)
//
// Everything here is pure (no filesystem, no network) so fixtures can drive
// the functions directly in each tool's --self-test.

export const REDIRECTS_INPUT_HEADER = ['from', 'to', 'status', 'notes'];
export const ALLOWED_REDIRECT_STATUS = new Set(['301', '302', '410']);

// Minimal RFC-4180-ish line parser: handles quoted fields and "" escapes.
// Returns null when the line has an unterminated quote.
export function parseCsvLine(line) {
  const fields = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    if (inQuotes) {
      if (char === '"') {
        if (line[i + 1] === '"') {
          current += '"';
          i += 1;
        } else {
          inQuotes = false;
        }
      } else {
        current += char;
      }
    } else if (char === '"' && current === '') {
      inQuotes = true;
    } else if (char === ',') {
      fields.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  if (inQuotes) {
    return null;
  }
  fields.push(current);
  return fields;
}

// Parses data/redirects.csv content into trimmed row objects.
// Returns { issues, rows }:
//   issues: preformatted "line N: ..." strings for empty input, a wrong
//           header, unterminated quotes, and wrong column counts
//   rows:   [{ from, to, status, notes, lineNumber }] for every line that
//           parsed into exactly 4 fields (semantic validity NOT checked here;
//           see checkRedirectRowStructure)
// Blank lines are skipped; a leading BOM is stripped.
export function parseRedirectsCsv(text) {
  const issues = [];
  const rows = [];
  const lines = String(text === undefined || text === null ? '' : text)
    .replace(/^﻿/, '')
    .split(/\r\n|\r|\n/);

  const nonEmpty = [];
  lines.forEach((line, index) => {
    if (line.trim() !== '') {
      nonEmpty.push({ line, lineNumber: index + 1 });
    }
  });

  if (nonEmpty.length === 0) {
    issues.push('input is empty: expected header "from,to,status,notes"');
    return { issues, rows };
  }

  const header = parseCsvLine(nonEmpty[0].line);
  if (!header || header.map((field) => field.trim()).join(',') !== REDIRECTS_INPUT_HEADER.join(',')) {
    issues.push(
      `line ${nonEmpty[0].lineNumber}: header must be exactly "from,to,status,notes" (got "${nonEmpty[0].line.trim()}")`
    );
    return { issues, rows };
  }

  for (const { line, lineNumber } of nonEmpty.slice(1)) {
    const fields = parseCsvLine(line);
    if (!fields) {
      issues.push(`line ${lineNumber}: unterminated quoted field`);
      continue;
    }
    if (fields.length !== REDIRECTS_INPUT_HEADER.length) {
      issues.push(
        `line ${lineNumber}: expected ${REDIRECTS_INPUT_HEADER.length} columns (from,to,status,notes), got ${fields.length}`
      );
      continue;
    }
    rows.push({
      from: fields[0].trim(),
      to: fields[1].trim(),
      status: fields[2].trim(),
      notes: fields[3].trim(),
      lineNumber
    });
  }

  return { issues, rows };
}

// Shared per-row structural rules both tools enforce identically.
// Returns preformatted "line N: ..." issue strings; empty array = valid row.
export function checkRedirectRowStructure(row) {
  const issues = [];
  const { from, to, status, lineNumber } = row;

  if (from === '') {
    issues.push(`line ${lineNumber}: "from" must not be empty`);
  } else if (!from.startsWith('/')) {
    issues.push(`line ${lineNumber}: "from" must be a path starting with "/" (got "${from}")`);
  }

  if (!ALLOWED_REDIRECT_STATUS.has(status)) {
    issues.push(`line ${lineNumber}: status must be 301, 302, or 410 (got "${status}")`);
  }

  if (status === '410') {
    if (to !== '') {
      issues.push(`line ${lineNumber}: 410 rows must have an empty "to" (got "${to}")`);
    }
  } else if (to === '') {
    issues.push(`line ${lineNumber}: "to" must not be empty for a ${status || 'redirect'} row`);
  }

  return issues;
}

// Normalizes a redirect path for comparisons (loops, duplicates, coverage):
// lowercase, query/hash stripped, leading slash ensured, trailing slashes
// stripped (root stays "/"). Returns null for empty input. Mirrors
// normalizeSlug in tools/lib/capture.mjs so capture-drafted rows and curated
// rows compare identically.
export function normalizeRedirectPath(value) {
  let path = String(value === undefined || value === null ? '' : value).trim().toLowerCase();
  if (path === '') {
    return null;
  }
  path = path.split(/[?#]/)[0];
  if (!path.startsWith('/')) {
    path = `/${path}`;
  }
  if (path.length > 1) {
    path = path.replace(/\/+$/, '');
  }
  return path === '' ? '/' : path;
}
