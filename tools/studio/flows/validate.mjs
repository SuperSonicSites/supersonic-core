// Validate / package flow: checklist-runs every repo gate, showing each
// script's PASS/FAIL counts and the FAIL lines verbatim (rule IDs intact),
// then optionally runs package + package:determinism. Fail-closed display:
// a script's verdict comes only from its exit code, never from Studio.

import * as p from '@clack/prompts';
import pc from 'picocolors';
import { take } from '../lib/ui.mjs';
import { runNpm, summarize } from '../lib/run.mjs';

const CHECKS = [
  'validate',
  'pattern:registry:check',
  'seo:briefs:check',
  'copy:check',
  'compose:check',
  'redirects:check',
  'agents:check'
];
const PACKAGE_STEPS = ['package', 'package:determinism'];
const MAX_FAIL_LINES = 20;

async function runOne(rootDir, script, results) {
  const spinner = p.spinner();
  spinner.start(`npm run ${script}`);
  const { code, lines } = await runNpm(script, [], { cwd: rootDir });
  const { label, failLines } = summarize(lines);
  const ok = code === 0;
  spinner.stop(ok ? pc.green(`✓ ${script} — ${label}`) : pc.red(`✗ ${script} (exit ${code}) — ${label}`));
  if (!ok) {
    const shown = failLines.slice(0, MAX_FAIL_LINES);
    for (const line of shown) {
      p.log.error(`  ${line}`);
    }
    if (failLines.length > shown.length) {
      p.log.error(`  ... +${failLines.length - shown.length} more FAIL line(s)`);
    }
    if (failLines.length === 0) {
      // Non-house output (npm errors, crashes): show the tail so nothing is swallowed.
      for (const line of lines.slice(-8)) {
        p.log.error(`  ${line}`);
      }
    }
  }
  results.push({ script, ok, label });
  return ok;
}

export async function validateFlow({ rootDir }) {
  p.log.step('Validate / package — runs every repo gate and reports verbatim');

  const results = [];
  for (const script of CHECKS) {
    await runOne(rootDir, script, results);
  }

  const failedChecks = results.filter((result) => !result.ok);
  let ranPackage = false;
  if (failedChecks.length > 0) {
    p.log.warn(`${failedChecks.length} of ${results.length} checks FAILED — packaging is pointless until they pass.`);
  } else {
    const wantPackage = take(
      await p.confirm({ message: 'All checks passed. Run npm run package + package:determinism now?' })
    );
    if (wantPackage) {
      ranPackage = true;
      for (const script of PACKAGE_STEPS) {
        const ok = await runOne(rootDir, script, results);
        if (!ok) {
          break;
        }
      }
    }
  }

  const failed = results.filter((result) => !result.ok);
  p.note(
    results
      .map((result) => `${result.ok ? pc.green('✓') : pc.red('✗')} ${result.script.padEnd(24)} ${pc.dim(result.label)}`)
      .join('\n'),
    'Run summary'
  );
  if (failed.length > 0) {
    p.log.error(`${failed.length} of ${results.length} script(s) FAILED: ${failed.map((result) => result.script).join(', ')}`);
  } else if (ranPackage) {
    p.log.success(`All ${results.length} scripts passed, including packaging.`);
  } else {
    p.log.success(`All ${results.length} checks passed (packaging not run).`);
  }
}
