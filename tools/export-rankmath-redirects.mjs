// Export the curated redirect map to Rank Math's redirection importer format.
//
// Input  (Git source of truth): data/redirects.csv
//   header: from,to,status,notes
//   - from:   legacy path, must start with "/" (e.g. /old-services/)
//   - to:     new destination path or absolute URL; must be empty for 410 rows
//   - status: 301, 302, or 410
//   - notes:  free text (quote the field if it contains commas)
//
// Output (Rank Math redirection importer CSV): captured/rankmath-redirects.csv
//   header: source,matching,destination,type,category,status
//   Rank Math's redirection CSV importer matches `source` as a URI path
//   relative to the site root, WITHOUT a leading slash (this mirrors what its
//   own redirection export produces, e.g. source "old-services/" for
//   /old-services/). So we strip the leading slash from `from`.
//   - matching: always "exact"
//   - type:     the numeric HTTP status from our CSV (301 / 302 / 410)
//   - category: always empty (Rank Math redirect categories are unused here)
//   - status:   always "active"
//   For 410 rows the destination is empty: Rank Math serves 410 Gone without
//   a target.
//
// Usage:
//   node tools/export-rankmath-redirects.mjs            # writes captured/rankmath-redirects.csv
//   node tools/export-rankmath-redirects.mjs --out path # custom output path
//   node tools/export-rankmath-redirects.mjs --self-test
//
// Fails closed: any malformed row aborts the export with exit code 1.

import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const defaultRoot = path.resolve(__dirname, '..');

const INPUT_HEADER = ['from', 'to', 'status', 'notes'];
const OUTPUT_HEADER = ['source', 'matching', 'destination', 'type', 'category', 'status'];
const ALLOWED_STATUS = new Set(['301', '302', '410']);

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

function csvField(value) {
  if (/[",\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

// Parses and validates data/redirects.csv content, then converts it to Rank
// Math importer rows. Returns { issues, outputLines, count }. Any issue means
// the export must not be written (fail closed).
export function convertRedirects(text) {
  const issues = [];
  const outputLines = [OUTPUT_HEADER.join(',')];
  const lines = text.replace(/^﻿/, '').split(/\r\n|\r|\n/);

  const nonEmpty = [];
  lines.forEach((line, index) => {
    if (line.trim() !== '') {
      nonEmpty.push({ line, lineNumber: index + 1 });
    }
  });

  if (nonEmpty.length === 0) {
    issues.push('input is empty: expected header "from,to,status,notes"');
    return { issues, outputLines, count: 0 };
  }

  const header = parseCsvLine(nonEmpty[0].line);
  if (!header || header.map((field) => field.trim()).join(',') !== INPUT_HEADER.join(',')) {
    issues.push(
      `line ${nonEmpty[0].lineNumber}: header must be exactly "from,to,status,notes" (got "${nonEmpty[0].line.trim()}")`
    );
    return { issues, outputLines, count: 0 };
  }

  const seenFrom = new Map();
  let count = 0;

  for (const { line, lineNumber } of nonEmpty.slice(1)) {
    const fields = parseCsvLine(line);
    if (!fields) {
      issues.push(`line ${lineNumber}: unterminated quoted field`);
      continue;
    }
    if (fields.length !== INPUT_HEADER.length) {
      issues.push(
        `line ${lineNumber}: expected ${INPUT_HEADER.length} columns (from,to,status,notes), got ${fields.length}`
      );
      continue;
    }

    const [fromRaw, toRaw, statusRaw] = fields;
    const from = fromRaw.trim();
    const to = toRaw.trim();
    const status = statusRaw.trim();
    let rowValid = true;

    if (from === '') {
      issues.push(`line ${lineNumber}: "from" must not be empty`);
      rowValid = false;
    } else if (!from.startsWith('/')) {
      issues.push(`line ${lineNumber}: "from" must be a path starting with "/" (got "${from}")`);
      rowValid = false;
    } else if (from.replace(/^\/+/, '') === '') {
      issues.push(
        `line ${lineNumber}: "from" is the site root ("${from}"); Rank Math cannot import an empty source path — handle root changes in Rank Math settings instead`
      );
      rowValid = false;
    }

    if (!ALLOWED_STATUS.has(status)) {
      issues.push(`line ${lineNumber}: status must be 301, 302, or 410 (got "${status}")`);
      rowValid = false;
    }

    if (status === '410') {
      if (to !== '') {
        issues.push(`line ${lineNumber}: 410 rows must have an empty "to" (got "${to}")`);
        rowValid = false;
      }
    } else if (to === '') {
      issues.push(`line ${lineNumber}: "to" must not be empty for a ${status || 'redirect'} row`);
      rowValid = false;
    }

    if (from !== '') {
      const key = from.toLowerCase();
      if (seenFrom.has(key)) {
        issues.push(`line ${lineNumber}: duplicate "from" path "${from}" (first seen on line ${seenFrom.get(key)})`);
        rowValid = false;
      } else {
        seenFrom.set(key, lineNumber);
      }
    }

    if (!rowValid) {
      continue;
    }

    const source = from.replace(/^\/+/, '');
    const destination = status === '410' ? '' : to;
    outputLines.push(
      [csvField(source), 'exact', csvField(destination), status, '', 'active'].join(',')
    );
    count += 1;
  }

  return { issues, outputLines, count };
}

export async function exportRankMathRedirects({ rootDir = defaultRoot, outPath } = {}) {
  const inputPath = path.join(rootDir, 'data', 'redirects.csv');
  const resolvedOut = outPath
    ? path.resolve(rootDir, outPath)
    : path.join(rootDir, 'captured', 'rankmath-redirects.csv');

  let text;
  try {
    text = await readFile(inputPath, 'utf8');
  } catch (error) {
    return { ok: false, messages: [`FAIL: cannot read ${inputPath}: ${error.message}`] };
  }

  const { issues, outputLines, count } = convertRedirects(text);
  if (issues.length > 0) {
    return {
      ok: false,
      messages: issues.map((issue) => `FAIL: data/redirects.csv ${issue}`)
    };
  }

  await mkdir(path.dirname(resolvedOut), { recursive: true });
  await writeFile(resolvedOut, `${outputLines.join('\n')}\n`, 'utf8');
  return {
    ok: true,
    messages: [
      `PASS: exported ${count} redirect${count === 1 ? '' : 's'} to ${path.relative(rootDir, resolvedOut)} (Rank Math importer format)`
    ]
  };
}

function assertCase(results, name, condition) {
  results.push({
    status: condition ? 'pass' : 'fail',
    message: condition ? `self-test: ${name}` : `self-test FAILED: ${name}`
  });
}

export function runSelfTest() {
  const results = [];

  const good = [
    'from,to,status,notes',
    '/old-services/,/services/,301,main service hub',
    '',
    '/promo,/pricing,302,"temporary, until pricing launch"',
    '/retired-page/,,410,intentionally gone'
  ].join('\n');
  const goodResult = convertRedirects(good);
  assertCase(results, 'clean fixture has no issues', goodResult.issues.length === 0);
  assertCase(results, 'blank lines are skipped (3 rows exported)', goodResult.count === 3);
  assertCase(
    results,
    'output header is the Rank Math importer header',
    goodResult.outputLines[0] === 'source,matching,destination,type,category,status'
  );
  assertCase(
    results,
    '301 row maps to exact/active with leading slash stripped',
    goodResult.outputLines[1] === 'old-services/,exact,/services/,301,,active'
  );
  assertCase(
    results,
    'quoted note with comma parses as one row',
    goodResult.outputLines[2] === 'promo,exact,/pricing,302,,active'
  );
  assertCase(
    results,
    '410 row exports an empty destination',
    goodResult.outputLines[3] === 'retired-page/,exact,,410,,active'
  );

  const badStatus = convertRedirects('from,to,status,notes\n/a,/b,418,teapot');
  assertCase(
    results,
    'bad status fails closed',
    badStatus.issues.some((issue) => issue.includes('status must be 301, 302, or 410'))
  );

  const emptyTo = convertRedirects('from,to,status,notes\n/a,,301,missing target');
  assertCase(
    results,
    'empty "to" on a 301 fails closed',
    emptyTo.issues.some((issue) => issue.includes('"to" must not be empty'))
  );

  const malformed = convertRedirects('from,to,status,notes\n/a,/b,301');
  assertCase(
    results,
    'wrong column count fails closed',
    malformed.issues.some((issue) => issue.includes('expected 4 columns'))
  );

  const badHeader = convertRedirects('source,target,code,notes\n/a,/b,301,x');
  assertCase(
    results,
    'wrong header fails closed',
    badHeader.issues.some((issue) => issue.includes('header must be exactly'))
  );

  const duplicate = convertRedirects('from,to,status,notes\n/a,/b,301,x\n/a,/c,301,y');
  assertCase(
    results,
    'duplicate "from" fails closed',
    duplicate.issues.some((issue) => issue.includes('duplicate "from" path'))
  );

  const fortyTenWithTarget = convertRedirects('from,to,status,notes\n/a,/b,410,gone but targeted');
  assertCase(
    results,
    '410 with a destination fails closed',
    fortyTenWithTarget.issues.some((issue) => issue.includes('410 rows must have an empty "to"'))
  );

  const headerOnly = convertRedirects('from,to,status,notes\n');
  assertCase(
    results,
    'header-only input exports zero rows without issues',
    headerOnly.issues.length === 0 && headerOnly.count === 0
  );

  return results;
}

if (process.argv[1] === __filename) {
  const args = process.argv.slice(2);
  if (args.includes('--self-test')) {
    const results = runSelfTest();
    for (const result of results) {
      console.log(`${result.status === 'pass' ? 'PASS' : 'FAIL'}: ${result.message}`);
    }
    if (results.some((result) => result.status === 'fail')) {
      process.exit(1);
    }
  } else {
    const outIndex = args.indexOf('--out');
    const outPath = outIndex !== -1 ? args[outIndex + 1] : undefined;
    if (outIndex !== -1 && !outPath) {
      console.log('FAIL: --out requires a path argument');
      process.exit(1);
    }
    const { ok, messages } = await exportRankMathRedirects({ outPath });
    for (const message of messages) {
      console.log(message);
    }
    if (!ok) {
      process.exit(1);
    }
  }
}
