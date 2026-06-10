// npm-script runner + house-style output summarizer for Supersonic Studio.
//
// Every repo validator prints `PASS: ...` / `FAIL: ...` / `SKIP: ...` /
// `NOTE: ...` lines and exits non-zero on any FAIL. Studio never re-interprets
// a validator's verdict: runNpm() returns the raw exit code and lines, and
// summarize() extracts the counts plus the FAIL lines VERBATIM (rule IDs
// intact) so flows can show "12 PASS, 2 FAIL" and the exact failures.
// summarize() is pure and covered by the Studio self-test.

import { spawn } from 'node:child_process';

const STATUS_RE = /^\s*(PASS|FAIL|SKIP|NOTE)\b/;

// Spawns `npm run <script> [-- <args>]` with the inherited environment,
// capturing stdout+stderr. Resolves (never rejects) with { code, lines }.
export function runNpm(script, args = [], { cwd } = {}) {
  return new Promise((resolve) => {
    const npmArgs = ['run', script];
    const extra = (Array.isArray(args) ? args : []).map(String);
    if (extra.length > 0) {
      npmArgs.push('--', ...extra);
    }
    let child;
    try {
      child = spawn('npm', npmArgs, {
        cwd,
        env: process.env,
        shell: process.platform === 'win32'
      });
    } catch (error) {
      resolve({ code: 1, lines: [`FAIL: could not spawn "npm run ${script}": ${error.message}`] });
      return;
    }
    let buffer = '';
    child.stdout.on('data', (chunk) => {
      buffer += chunk;
    });
    child.stderr.on('data', (chunk) => {
      buffer += chunk;
    });
    child.on('error', (error) => {
      resolve({ code: 1, lines: [`FAIL: could not spawn "npm run ${script}": ${error.message}`] });
    });
    child.on('close', (code) => {
      resolve({
        code: code === null || code === undefined ? 1 : code,
        lines: buffer.split(/\r?\n/).filter((line) => line.trim() !== '')
      });
    });
  });
}

// Pure. Extracts PASS/FAIL/SKIP/NOTE counts and keeps every FAIL line verbatim
// so rule IDs (RED-4, SEO-LEG-1, ...) survive into the Studio display.
// Returns { counts: {pass, fail, skip, note}, failLines, label }.
export function summarize(lines) {
  const counts = { pass: 0, fail: 0, skip: 0, note: 0 };
  const failLines = [];
  for (const raw of Array.isArray(lines) ? lines : []) {
    const match = STATUS_RE.exec(String(raw));
    if (!match) {
      continue;
    }
    counts[match[1].toLowerCase()] += 1;
    if (match[1] === 'FAIL') {
      failLines.push(String(raw).trim());
    }
  }
  const parts = [];
  if (counts.pass > 0) parts.push(`${counts.pass} PASS`);
  if (counts.fail > 0) parts.push(`${counts.fail} FAIL`);
  if (counts.skip > 0) parts.push(`${counts.skip} SKIP`);
  if (counts.note > 0) parts.push(`${counts.note} NOTE`);
  return {
    counts,
    failLines,
    label: parts.length > 0 ? parts.join(', ') : 'no PASS/FAIL output'
  };
}
