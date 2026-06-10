// Render / QA status flow: read-only report on the Playground render +
// visual-regression artifacts, with optional self-test runs. The render and
// diff tools may not exist yet (they ship in their own workstream), so their
// absence is reported gracefully rather than treated as an error.

import { existsSync } from 'node:fs';
import { readdir } from 'node:fs/promises';
import path from 'node:path';
import * as p from '@clack/prompts';
import pc from 'picocolors';
import { runNode, summarize } from '../lib/run.mjs';
import { take } from '../lib/ui.mjs';

const RENDER_DIR = path.join('screenshots', 'render');
const BASELINE_DIR = path.join('screenshots', 'baseline');
const RENDER_TOOL = path.join('tools', 'playground-render.mjs');
const DIFF_TOOL = path.join('tools', 'visual-diff.mjs');

async function countPngs(dir) {
  const perSlug = new Map();
  let entries;
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch {
    return perSlug;
  }
  for (const entry of entries) {
    if (!entry.isDirectory()) {
      continue;
    }
    try {
      const files = await readdir(path.join(dir, entry.name));
      perSlug.set(entry.name, files.filter((file) => file.endsWith('.png')).length);
    } catch {
      perSlug.set(entry.name, 0);
    }
  }
  return perSlug;
}

async function runTool(rootDir, toolPath, args, label) {
  if (!existsSync(path.join(rootDir, toolPath))) {
    p.log.warn(`${label}: ${toolPath} not built yet.`);
    return;
  }
  const spinner = p.spinner();
  spinner.start(`${label}...`);
  const result = await runNode(path.join(rootDir, toolPath), args, { cwd: rootDir });
  const summary = summarize(result.lines);
  spinner.stop(`${label}: ${summary.label} (exit ${result.code})`);
  if (result.code !== 0) {
    for (const line of summary.failLines.length > 0 ? summary.failLines : result.lines.slice(-5)) {
      p.log.error(line);
    }
  }
}

export async function renderStatusFlow({ rootDir }) {
  const renders = await countPngs(path.join(rootDir, RENDER_DIR));
  const baselines = await countPngs(path.join(rootDir, BASELINE_DIR));

  const lines = [];
  lines.push(`Renders   (${RENDER_DIR}):   ${renders.size} pattern dir(s), ${[...renders.values()].reduce((a, b) => a + b, 0)} png(s)`);
  lines.push(`Baselines (${BASELINE_DIR}): ${baselines.size} pattern dir(s), ${[...baselines.values()].reduce((a, b) => a + b, 0)} png(s)`);
  const missingBaselines = [...renders.keys()].filter((slug) => !baselines.has(slug));
  if (missingBaselines.length > 0) {
    lines.push(pc.yellow(`Rendered patterns with NO baseline (visual diff will fail closed): ${missingBaselines.join(', ')}`));
  }
  if (renders.size === 0) {
    lines.push(pc.dim('No renders yet — run the Playground render (CI does this on every push).'));
  }
  p.note(lines.join('\n'), 'Render / QA status');

  const action = take(
    await p.select({
      message: 'Run a check?',
      options: [
        { value: 'render-self-test', label: 'Playground render self-test', hint: 'offline, no WordPress boot' },
        { value: 'diff-self-test', label: 'Visual diff self-test', hint: 'offline pixelmatch fixtures' },
        { value: 'diff', label: 'Run visual diff against baselines', hint: 'needs renders present' },
        { value: 'back', label: 'Back' }
      ]
    })
  );

  if (action === 'render-self-test') {
    await runTool(rootDir, RENDER_TOOL, ['--self-test'], 'Playground render self-test');
  } else if (action === 'diff-self-test') {
    await runTool(rootDir, DIFF_TOOL, ['--self-test'], 'Visual diff self-test');
  } else if (action === 'diff') {
    await runTool(rootDir, DIFF_TOOL, [], 'Visual diff');
  }
}
