// Agent-stage configuration + pure helpers for Supersonic Studio.
//
// Studio does NOT generate briefs/compositions/copy itself — it spawns the
// `claude` CLI headless with a one-line prompt that routes into the matching
// repo skill (.claude/skills/<skill>/SKILL.md), then runs the repo gate.
// THE GATE IS THE TRUTH: a stage only counts as complete when its npm gate
// exits 0 AND every expected artifact exists on disk. Studio never upgrades
// an agent's own claim of success into a verdict.
//
// Everything in this module is pure (no fs, no spawn) so the self-test can
// cover it with fixtures.

// Ordered pipeline stages. `skill` names the repo skill the prompt routes to,
// `gateScript` is the package.json script that proves the stage, `artifacts`
// are the files the stage must produce (review stages produce none — they
// only re-prove the existing artifact through the same gate).
export const AGENT_STAGES = [
  {
    id: 'seo-research',
    label: 'SEO research',
    skill: 'seo-strategist',
    prompt:
      'Run the seo-strategist skill for this site per .claude/skills/seo-strategist/SKILL.md. ' +
      'Work autonomously from data/site-intake.json and captured/inventory.json.',
    gateScript: 'seo:briefs:check',
    artifacts: ['data/seo-briefs.json']
  },
  {
    id: 'layout',
    label: 'Page layout',
    skill: 'layout-architect',
    prompt:
      'Run the layout-architect skill for this site per .claude/skills/layout-architect/SKILL.md. ' +
      'Work autonomously from data/site-intake.json and data/seo-briefs.json.',
    gateScript: 'compose:check',
    artifacts: ['data/page-compositions.json']
  },
  {
    id: 'copy',
    label: 'Copywriting',
    skill: 'copywriter',
    prompt:
      'Run the copywriter skill for this site per .claude/skills/copywriter/SKILL.md. ' +
      'Work autonomously from data/site-intake.json, data/seo-briefs.json, and data/page-compositions.json.',
    gateScript: 'copy:check',
    artifacts: ['data/copy-deck.json']
  },
  {
    id: 'copy-review',
    label: 'Copy review',
    skill: 'copy-review',
    prompt:
      'Run the copy-review skill for this site per .claude/skills/copy-review/SKILL.md. ' +
      'Work autonomously: grade data/copy-deck.json against BRAND.md and data/seo-briefs.json and apply rule-ID fixes.',
    gateScript: 'copy:check',
    artifacts: []
  },
  {
    id: 'layout-review',
    label: 'Layout review',
    skill: 'layout-review',
    prompt:
      'Run the layout-review skill for this site per .claude/skills/layout-review/SKILL.md. ' +
      'Work autonomously: grade data/page-compositions.json against docs/layout-standard.md and apply rule-ID fixes.',
    gateScript: 'compose:check',
    artifacts: []
  }
];

// Builds the argv for `claude` in headless mode. Flag choices (claude CLI,
// documented headless/print flags as of Claude Code 2.x):
//   -p <prompt>                  print mode: run one non-interactive turn and exit
//   --output-format stream-json  NDJSON event stream so Studio can show live progress
//   --verbose                    required by the CLI for stream-json in print mode
//   --permission-mode acceptEdits  auto-accept file edits ONLY — deliberately
//       conservative: the agent can write data/*.json artifacts without a TTY
//       prompt, but anything beyond edits still follows normal permission
//       rules. We do NOT use bypassPermissions/dangerously-skip-permissions.
//   --model <m>                  optional passthrough when the caller picks a model
export function buildClaudeArgs(stage, { model } = {}) {
  const args = [
    '-p',
    stage.prompt,
    '--output-format',
    'stream-json',
    '--verbose',
    '--permission-mode',
    'acceptEdits'
  ];
  if (model && String(model).trim() !== '') {
    args.push('--model', String(model).trim());
  }
  return args;
}

function textFromContent(content) {
  if (!Array.isArray(content)) {
    return '';
  }
  const texts = [];
  for (const block of content) {
    if (!block || typeof block !== 'object') {
      continue;
    }
    if (block.type === 'text' && typeof block.text === 'string' && block.text.trim() !== '') {
      texts.push(block.text.trim());
    } else if (block.type === 'tool_use' && typeof block.name === 'string') {
      texts.push(`[tool] ${block.name}`);
    }
  }
  return texts.join(' ');
}

// Tolerant parser for one line of `claude --output-format stream-json` output.
// Returns { type: 'assistant'|'result'|'error'|'system', text } for events
// worth showing, or null for blank/malformed/uninteresting lines. NEVER throws:
// the stream can contain partial lines, npm noise, or non-JSON warnings.
export function parseStreamEvent(line) {
  const raw = String(line ?? '').trim();
  if (raw === '' || raw[0] !== '{') {
    return null;
  }
  let event;
  try {
    event = JSON.parse(raw);
  } catch {
    return null;
  }
  if (!event || typeof event !== 'object') {
    return null;
  }
  if (event.type === 'assistant') {
    const text = textFromContent(event.message && event.message.content);
    return text === '' ? null : { type: 'assistant', text };
  }
  if (event.type === 'result') {
    const isError = event.is_error === true || /error/i.test(String(event.subtype || ''));
    const text =
      typeof event.result === 'string' && event.result.trim() !== ''
        ? event.result.trim()
        : `result: ${event.subtype || 'unknown'}`;
    return { type: isError ? 'error' : 'result', text };
  }
  if (event.type === 'system' && event.subtype === 'init') {
    return { type: 'system', text: `session started (model: ${event.model || 'unknown'})` };
  }
  return null;
}

// Pure stage verdict: gate exit 0 AND every artifact present.
// `artifactsExist` maps artifact path -> boolean (missing keys = missing file,
// so an incomplete map fails closed). Returns { ok, reason }.
export function stageGateResult(stage, gateExit, artifactsExist) {
  if (gateExit !== 0) {
    return { ok: false, reason: `gate "npm run ${stage.gateScript}" exited ${gateExit}` };
  }
  const exists = artifactsExist && typeof artifactsExist === 'object' ? artifactsExist : {};
  const missing = (Array.isArray(stage.artifacts) ? stage.artifacts : []).filter((file) => exists[file] !== true);
  if (missing.length > 0) {
    return { ok: false, reason: `gate passed but artifact(s) missing: ${missing.join(', ')}` };
  }
  return { ok: true, reason: `gate "npm run ${stage.gateScript}" passed and all artifacts exist` };
}
