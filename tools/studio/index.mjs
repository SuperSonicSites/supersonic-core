#!/usr/bin/env node
// Supersonic Studio — guided-wizard TUI for the engagement pipeline.
//
//   node tools/studio/index.mjs              # interactive TUI (needs a TTY)
//   node tools/studio/index.mjs --self-test  # offline pure-logic test, no prompts
//
// Studio operates the pipeline: intake interview -> legacy capture -> brand
// review -> redirect curation -> validate/package. AI agents do the generation
// (briefs, compositions, copy); Studio does structured input, deterministic
// tools, and gating. Every verdict shown comes from the repo validators
// themselves (fail-closed display — Studio never claims success a validator
// did not prove).

import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const rootDir = path.resolve(path.dirname(__filename), '..', '..');
const args = process.argv.slice(2);

if (args.includes('--self-test')) {
  const { runSelfTest } = await import('./self-test.mjs');
  process.exit(await runSelfTest());
}

// Non-interactive guard: the TUI is useless without a terminal.
if (!process.stdin.isTTY) {
  console.log('Studio needs an interactive terminal; use --self-test in CI.');
  process.exit(0);
}

const p = await import('@clack/prompts');
const { default: pc } = await import('picocolors');
const { loadState } = await import('./lib/state.mjs');
const { StudioCancel, renderStages } = await import('./lib/ui.mjs');
const { interviewFlow } = await import('./flows/interview.mjs');
const { captureFlow } = await import('./flows/capture.mjs');
const { brandFlow } = await import('./flows/brand.mjs');
const { redirectsFlow } = await import('./flows/redirects.mjs');
const { validateFlow } = await import('./flows/validate.mjs');
const { agentStageFlow } = await import('./flows/agent-stage.mjs');
const { renderStatusFlow } = await import('./flows/render-status.mjs');

const FLOWS = {
  interview: interviewFlow,
  capture: captureFlow,
  brand: brandFlow,
  redirects: redirectsFlow,
  agent: agentStageFlow,
  render: renderStatusFlow,
  validate: validateFlow
};

p.intro(pc.inverse(' Supersonic Studio '));
p.log.message(pc.dim(`repo: ${rootDir}`));

let running = true;
while (running) {
  // Pipeline status — default view above the menu, re-derived every loop.
  let stages = [];
  try {
    stages = await loadState(rootDir);
    p.note(renderStages(stages).join('\n'), 'Pipeline status');
  } catch (error) {
    p.log.warn(`Could not derive pipeline state: ${error.message}`);
  }
  const attention = stages.filter((stage) => stage.status === 'attention');
  for (const stage of attention) {
    p.log.warn(`${stage.label}: ${stage.detail}`);
  }

  const action = await p.select({
    message: 'What do you want to do?',
    options: [
      { value: 'interview', label: 'Init interview', hint: 'fill data/site-intake.json (schema-gated)' },
      { value: 'capture', label: 'Capture legacy site', hint: 'npm run capture:site -> captured/' },
      { value: 'brand', label: 'Brand review', hint: 'adopt captured palette/fonts/logos into the intake' },
      { value: 'redirects', label: 'Curate redirects', hint: 'disposition legacy URLs; gate: redirects:check' },
      { value: 'agent', label: 'Run agent stage', hint: 'claude headless: SEO research, layout, copy, reviews (gate-proven)' },
      { value: 'render', label: 'Render / QA status', hint: 'playground renders, baselines, visual diff' },
      { value: 'validate', label: 'Validate / package', hint: 'run all repo gates, then package' },
      { value: 'exit', label: 'Exit' }
    ]
  });

  if (p.isCancel(action) || action === 'exit') {
    running = false;
    break;
  }

  try {
    await FLOWS[action]({ rootDir });
  } catch (error) {
    if (error instanceof StudioCancel) {
      p.log.message(pc.dim('Cancelled — back to the menu.'));
    } else {
      p.log.error(`${action} flow crashed: ${error.stack || error.message}`);
    }
  }
}

p.outro('Studio closed. Nothing was committed — review changes with git status.');
