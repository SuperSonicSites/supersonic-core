// Agent-stage flow: spawn the `claude` CLI headless for one pipeline stage
// (SEO research, layout, copy, reviews), stream progress, then prove the
// result with the stage's npm gate. THE GATE IS THE TRUTH — Studio never
// upgrades the agent's own success claim into a verdict, and never auto-chains
// to the next stage without a passing gate plus explicit user confirmation.

import { spawn, spawnSync } from 'node:child_process';
import { existsSync, mkdirSync } from 'node:fs';
import { appendFile } from 'node:fs/promises';
import path from 'node:path';
import * as p from '@clack/prompts';
import pc from 'picocolors';
import { AGENT_STAGES, buildClaudeArgs, parseStreamEvent, stageGateResult } from '../lib/agent.mjs';
import { runNpm, summarize } from '../lib/run.mjs';
import { take } from '../lib/ui.mjs';

const LOG_DIR = path.join('tools', 'studio', '.agent-logs');

function claudeAvailable() {
  try {
    const probe = spawnSync('claude', ['--version'], { encoding: 'utf8', timeout: 15000 });
    return probe.status === 0;
  } catch {
    return false;
  }
}

function stageStatus(rootDir, stage) {
  const missing = stage.artifacts.filter((file) => !existsSync(path.join(rootDir, file)));
  if (stage.artifacts.length === 0) {
    return 'review stage (re-proves existing artifact)';
  }
  return missing.length === 0 ? `artifact present: ${stage.artifacts.join(', ')}` : `missing: ${missing.join(', ')}`;
}

// Runs the claude CLI for one stage, streaming parsed NDJSON progress into a
// clack spinner ticker and appending the raw stream to a log file.
function runClaudeStage(rootDir, stage, model, logPath) {
  return new Promise((resolve) => {
    const args = buildClaudeArgs(stage, { model });
    const child = spawn('claude', args, { cwd: rootDir, env: process.env });
    const spinner = p.spinner();
    spinner.start(`Running ${stage.label} agent (skill: ${stage.skill})...`);

    let pending = '';
    let lastError = '';
    const handleChunk = (chunk) => {
      pending += chunk;
      const lines = pending.split('\n');
      pending = lines.pop() ?? '';
      for (const line of lines) {
        appendFile(logPath, `${line}\n`).catch(() => {});
        const event = parseStreamEvent(line);
        if (!event) {
          continue;
        }
        if (event.type === 'error') {
          lastError = event.text;
        }
        const ticker = event.text.length > 100 ? `${event.text.slice(0, 100)}…` : event.text;
        spinner.message(`${stage.label}: ${ticker}`);
      }
    };
    child.stdout.on('data', handleChunk);
    child.stderr.on('data', (chunk) => {
      appendFile(logPath, String(chunk)).catch(() => {});
    });
    child.on('error', (error) => {
      spinner.stop(pc.red(`Could not run claude: ${error.message}`));
      resolve({ code: 1, lastError: error.message });
    });
    child.on('close', (code) => {
      const exit = code ?? 1;
      spinner.stop(exit === 0 ? `${stage.label} agent finished.` : pc.red(`${stage.label} agent exited ${exit}.`));
      resolve({ code: exit, lastError });
    });
  });
}

async function proveStage(rootDir, stage) {
  const gateSpinner = p.spinner();
  gateSpinner.start(`Proving with npm run ${stage.gateScript}...`);
  const gate = await runNpm(stage.gateScript, [], { cwd: rootDir });
  const summary = summarize(gate.lines);
  gateSpinner.stop(`Gate ${stage.gateScript}: ${summary.label} (exit ${gate.code})`);

  const artifactsExist = {};
  for (const file of stage.artifacts) {
    artifactsExist[file] = existsSync(path.join(rootDir, file));
  }
  const verdict = stageGateResult(stage, gate.code, artifactsExist);
  if (verdict.ok) {
    p.log.success(pc.green(`Stage complete — ${verdict.reason}`));
  } else {
    p.log.error(pc.red(`Stage NOT complete — ${verdict.reason}`));
    for (const line of summary.failLines) {
      p.log.error(line);
    }
  }
  return verdict.ok;
}

export async function agentStageFlow({ rootDir }) {
  if (!claudeAvailable()) {
    p.log.warn('The `claude` CLI is not available on PATH (or not authenticated).');
    p.log.message(pc.dim('Install Claude Code (https://code.claude.com) and run `claude` once to log in, then retry.'));
    return;
  }

  let continueRunning = true;
  while (continueRunning) {
    const options = AGENT_STAGES.map((stage) => ({
      value: stage.id,
      label: stage.label,
      hint: `${stage.skill} | gate: ${stage.gateScript} | ${stageStatus(rootDir, stage)}`
    }));
    options.push({ value: 'back', label: 'Back to main menu' });
    const choice = take(await p.select({ message: 'Which agent stage do you want to run?', options }));
    if (choice === 'back') {
      return;
    }
    const stage = AGENT_STAGES.find((entry) => entry.id === choice);

    const model = take(
      await p.select({
        message: 'Model for this stage?',
        options: [
          { value: '', label: 'Default (claude CLI configured model)' },
          { value: 'opus', label: 'opus', hint: 'strongest; use for research/review stages' },
          { value: 'sonnet', label: 'sonnet', hint: 'faster/cheaper' }
        ]
      })
    );

    const confirmed = take(
      await p.confirm({
        message: `Spawn claude headless for "${stage.label}" (skill ${stage.skill})? It will edit files in this repo.`
      })
    );
    if (!confirmed) {
      continue;
    }

    mkdirSync(path.join(rootDir, LOG_DIR), { recursive: true });
    const logPath = path.join(rootDir, LOG_DIR, `${stage.id}-${new Date().toISOString().replace(/[:.]/g, '-')}.log`);
    p.log.message(pc.dim(`Full agent log: ${path.relative(rootDir, logPath)}`));

    const result = await runClaudeStage(rootDir, stage, model, logPath);
    if (result.code !== 0 && result.lastError) {
      p.log.error(`Agent error: ${result.lastError}`);
    }

    const ok = await proveStage(rootDir, stage);
    const next = take(
      await p.select({
        message: ok ? 'Stage proven. What next?' : 'Stage failed its gate. What next?',
        options: ok
          ? [
              { value: 'another', label: 'Run another stage' },
              { value: 'back', label: 'Back to main menu' }
            ]
          : [
              { value: 'another', label: 'Re-run / pick a stage' },
              { value: 'back', label: 'Back to main menu' }
            ]
      })
    );
    continueRunning = next === 'another';
  }
}
