// Prompt plumbing and terminal rendering helpers shared by Studio flows.
// (The only lib module that touches @clack/prompts — everything else in lib/
// is pure logic.)

import { isCancel } from '@clack/prompts';
import pc from 'picocolors';

// Thrown when the user cancels a clack prompt (Ctrl-C / Esc). The main menu
// loop catches it and returns to the menu instead of crashing.
export class StudioCancel extends Error {
  constructor() {
    super('cancelled');
    this.name = 'StudioCancel';
  }
}

// Unwraps a clack prompt result; throws StudioCancel on cancel.
export function take(value) {
  if (isCancel(value)) {
    throw new StudioCancel();
  }
  return value;
}

// Renders a color swatch for a hex color using a 24-bit background escape
// (picocolors has no bgHex). Falls back to the plain hex label when the
// stream is not a TTY.
export function swatch(hex, isTTY = Boolean(process.stdout.isTTY)) {
  const match = /^#([0-9a-f]{6})$/i.exec(String(hex || '').trim());
  if (!match || !isTTY) {
    return String(hex || '');
  }
  const r = parseInt(match[1].slice(0, 2), 16);
  const g = parseInt(match[1].slice(2, 4), 16);
  const b = parseInt(match[1].slice(4, 6), 16);
  return `\x1b[48;2;${r};${g};${b}m    \x1b[0m ${hex}`;
}

const GLYPHS = {
  done: () => pc.green('✓'),
  next: () => pc.cyan('●'),
  pending: () => pc.dim('○'),
  attention: () => pc.yellow('!')
};

// Formats the deriveState() stage list into display lines for the main menu.
export function renderStages(stages) {
  const labelWidth = Math.max(...stages.map((stage) => stage.label.length), 0);
  return stages.map((stage) => {
    const glyph = (GLYPHS[stage.status] || GLYPHS.pending)();
    const label = stage.label.padEnd(labelWidth);
    const detail =
      stage.status === 'attention' ? pc.yellow(stage.detail) : stage.status === 'next' ? stage.detail : pc.dim(stage.detail);
    return `${glyph} ${label}  ${detail}`;
  });
}
