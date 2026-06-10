#!/usr/bin/env node
/**
 * Design-DNA compiler: turns the curated brand in data/site-intake.json
 * (design.colors hex list + design.fonts names) into the theme's token
 * values — same palette SLUGS (patterns and CSS reference preset slugs, so
 * editability and certified markup are untouched), new VALUES derived from
 * the brand with WCAG gates.
 *
 * Rules (fail closed):
 *   DNA-1  every design.colors entry must be a valid 6-digit hex
 *   DNA-2  accent text color (white or black) must reach >= 4.5:1 on accent
 *   DNA-3  body text (contrast slot) must reach >= 4.5:1 on base and surface
 *   DNA-4  no brand color usable as accent (all near-neutral) -> fail with guidance
 *
 * Usage:
 *   node tools/compile-design-dna.mjs                 plan (dry-run, prints slot diff + contrast report)
 *   node tools/compile-design-dna.mjs --write         apply to the theme's theme.json
 *   node tools/compile-design-dna.mjs --check         exit 1 if theme.json differs from compiled DNA
 *   node tools/compile-design-dna.mjs --intake <p> --theme-json <p>   alternate inputs
 *   node tools/compile-design-dna.mjs --self-test     offline fixture checks
 *
 * Changing global design tokens is approval-gated (CLAUDE.md): --write is the
 * mechanical step AFTER that approval; the default dry-run is the proposal.
 * Font compilation swaps fontFamily stacks only — bundling licensed font
 * FILES stays a manual, approval-gated step.
 */

import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const DEFAULT_INTAKE = 'data/site-intake.json';
const DEFAULT_THEME_JSON = 'wp-content/themes/supersonic-site-theme/theme.json';

// --- color math (pure) ---------------------------------------------------------

export function parseHex(value) {
  const match = /^#([0-9a-f]{6})$/i.exec(String(value ?? '').trim());
  if (!match) {
    return null;
  }
  const n = parseInt(match[1], 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

export function toHex({ r, g, b }) {
  const c = (v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0');
  return `#${c(r)}${c(g)}${c(b)}`;
}

export function relativeLuminance(rgb) {
  const lin = (v) => {
    const s = v / 255;
    return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * lin(rgb.r) + 0.7152 * lin(rgb.g) + 0.0722 * lin(rgb.b);
}

export function contrastRatio(hexA, hexB) {
  const la = relativeLuminance(parseHex(hexA));
  const lb = relativeLuminance(parseHex(hexB));
  const [hi, lo] = la >= lb ? [la, lb] : [lb, la];
  return (hi + 0.05) / (lo + 0.05);
}

function rgbToHsl({ r, g, b }) {
  const rn = r / 255, gn = g / 255, bn = b / 255;
  const max = Math.max(rn, gn, bn), min = Math.min(rn, gn, bn);
  const l = (max + min) / 2;
  if (max === min) {
    return { h: 0, s: 0, l };
  }
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h;
  if (max === rn) h = ((gn - bn) / d + (gn < bn ? 6 : 0)) / 6;
  else if (max === gn) h = ((bn - rn) / d + 2) / 6;
  else h = ((rn - gn) / d + 4) / 6;
  return { h, s, l };
}

function hslToRgb({ h, s, l }) {
  if (s === 0) {
    const v = l * 255;
    return { r: v, g: v, b: v };
  }
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  const hue = (t) => {
    let x = t;
    if (x < 0) x += 1;
    if (x > 1) x -= 1;
    if (x < 1 / 6) return p + (q - p) * 6 * x;
    if (x < 1 / 2) return q;
    if (x < 2 / 3) return p + (q - p) * (2 / 3 - x) * 6;
    return p;
  };
  return { r: hue(h + 1 / 3) * 255, g: hue(h) * 255, b: hue(h - 1 / 3) * 255 };
}

export function adjustLightness(hex, delta) {
  const hsl = rgbToHsl(parseHex(hex));
  hsl.l = Math.max(0, Math.min(1, hsl.l + delta));
  return toHex(hslToRgb(hsl));
}

export function mix(hexA, hexB, weightB) {
  const a = parseHex(hexA), b = parseHex(hexB);
  const w = Math.max(0, Math.min(1, weightB));
  return toHex({ r: a.r + (b.r - a.r) * w, g: a.g + (b.g - a.g) * w, b: a.b + (b.b - a.b) * w });
}

// --- DNA compilation (pure) ----------------------------------------------------

function isNearNeutral(hex) {
  const { s, l } = rgbToHsl(parseHex(hex));
  return s < 0.25 || l > 0.85 || l < 0.08;
}

// Picks the accent (first saturated, non-extreme color), the darkest neutral
// as text contrast candidate, and the lightest near-white as base candidate.
export function classifyBrandColors(colors) {
  const accent = colors.find((c) => !isNearNeutral(c)) ?? null;
  const sorted = [...colors].sort((a, b) => relativeLuminance(parseHex(a)) - relativeLuminance(parseHex(b)));
  const darkest = sorted[0] ?? null;
  const lightest = sorted[sorted.length - 1] ?? null;
  return {
    accent,
    text: darkest && rgbToHsl(parseHex(darkest)).l < 0.25 ? darkest : null,
    base: lightest && rgbToHsl(parseHex(lightest)).l > 0.95 ? lightest : null
  };
}

// Compiles intake design DNA into values for the theme's fixed palette slugs.
// Returns { ok, failures: [{rule, detail}], palette: {slug: hex}, fonts, report }.
export function compileDna(design) {
  const failures = [];
  const colors = Array.isArray(design.colors) ? design.colors : [];
  for (const color of colors) {
    if (!parseHex(color)) {
      failures.push({ rule: 'DNA-1', detail: `design.colors entry "${color}" is not a 6-digit hex color` });
    }
  }
  if (failures.length > 0) {
    return { ok: false, failures };
  }
  const valid = colors.map((c) => c.toLowerCase());
  const { accent, text, base } = classifyBrandColors(valid);
  if (valid.length > 0 && !accent) {
    failures.push({
      rule: 'DNA-4',
      detail: 'no brand color is saturated enough to serve as the accent; add a primary brand color to design.colors'
    });
    return { ok: false, failures };
  }

  const palette = {
    base: base ?? '#ffffff',
    contrast: text ?? '#111111',
    'contrast-subtle': '#4b5563',
    surface: '#f7f8fa',
    muted: '#f1f3f5',
    border: '#d9dde3',
    accent: accent ?? '#1a5fd0',
    'accent-hover': null,
    'accent-strong': null,
    'accent-contrast': null
  };
  // Derived neutrals: whisper-tints of the accent keep the neutral system in
  // the brand's temperature instead of generic gray.
  palette.surface = mix('#f7f8fa', palette.accent, 0.03);
  palette.muted = mix('#f1f3f5', palette.accent, 0.05);
  palette.border = mix('#d9dde3', palette.accent, 0.08);
  palette['contrast-subtle'] = mix('#4b5563', palette.accent, 0.12);
  palette['accent-hover'] = adjustLightness(palette.accent, -0.08);
  palette['accent-strong'] = adjustLightness(palette.accent, -0.16);

  const whiteOnAccent = contrastRatio('#ffffff', palette.accent);
  const blackOnAccent = contrastRatio('#111111', palette.accent);
  palette['accent-contrast'] = whiteOnAccent >= blackOnAccent ? '#ffffff' : '#111111';

  const report = [];
  const accentTextRatio = Math.max(whiteOnAccent, blackOnAccent);
  report.push({ pair: `accent-contrast on accent`, ratio: accentTextRatio });
  if (accentTextRatio < 4.5) {
    failures.push({
      rule: 'DNA-2',
      detail: `neither white (${whiteOnAccent.toFixed(2)}) nor black (${blackOnAccent.toFixed(2)}) reaches 4.5:1 on accent ${palette.accent}; darken or lighten the brand color`
    });
  }
  for (const bg of ['base', 'surface', 'muted']) {
    const ratio = contrastRatio(palette.contrast, palette[bg]);
    report.push({ pair: `contrast on ${bg}`, ratio });
    if (ratio < 4.5) {
      failures.push({ rule: 'DNA-3', detail: `text ${palette.contrast} on ${bg} ${palette[bg]} is ${ratio.toFixed(2)}:1 (< 4.5:1)` });
    }
  }

  const fontNames = (Array.isArray(design.fonts) ? design.fonts : []).map((f) => String(f).trim()).filter(Boolean);
  const stack = (name) => `${/\s/.test(name) ? `"${name}"` : name}, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
  const fonts =
    fontNames.length === 0
      ? null
      : {
          heading: stack(fontNames[0]),
          body: stack(fontNames[1] ?? fontNames[0])
        };

  return { ok: failures.length === 0, failures, palette, fonts, report };
}

// Applies compiled values onto a parsed theme.json: palette slot values by
// slug (names/slugs untouched), and fontFamily stacks (montserrat slot =
// heading, inter slot = body — slugs are load-bearing in styles/patterns, so
// they stay; the human-readable name follows the new family).
export function applyDna(themeJson, dna) {
  const next = structuredClone(themeJson);
  const slots = next?.settings?.color?.palette;
  if (!Array.isArray(slots)) {
    throw new Error('theme.json has no settings.color.palette array');
  }
  for (const slot of slots) {
    if (dna.palette[slot.slug]) {
      slot.color = dna.palette[slot.slug];
    }
  }
  if (dna.fonts) {
    const families = next?.settings?.typography?.fontFamilies ?? [];
    for (const family of families) {
      if (family.slug === 'montserrat') {
        family.fontFamily = dna.fonts.heading;
        family.name = `Heading (${dna.fonts.heading.split(',')[0].replace(/"/g, '')})`;
      } else if (family.slug === 'inter') {
        family.fontFamily = dna.fonts.body;
        family.name = `Body (${dna.fonts.body.split(',')[0].replace(/"/g, '')})`;
      }
    }
  }
  return next;
}

// --- CLI -----------------------------------------------------------------------

function parseArgs(argv) {
  const opts = { intake: DEFAULT_INTAKE, themeJson: DEFAULT_THEME_JSON, write: false, checkMode: false, selfTest: false };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--intake') opts.intake = argv[++i];
    else if (arg === '--theme-json') opts.themeJson = argv[++i];
    else if (arg === '--write') opts.write = true;
    else if (arg === '--check') opts.checkMode = true;
    else if (arg === '--self-test') opts.selfTest = true;
    else {
      console.error(`FAIL: unknown argument ${arg}`);
      process.exit(2);
    }
  }
  return opts;
}

async function run(opts) {
  const intake = JSON.parse(await readFile(path.resolve(ROOT, opts.intake), 'utf8'));
  const design = intake.design ?? {};
  if (!Array.isArray(design.colors) || design.colors.length === 0) {
    console.error(`FAIL: ${opts.intake} design.colors is empty — curate brand colors first (Studio "Brand review" or edit the intake).`);
    process.exit(1);
  }
  const dna = compileDna(design);
  for (const entry of dna.report ?? []) {
    console.log(`NOTE: ${entry.pair} = ${entry.ratio.toFixed(2)}:1`);
  }
  if (!dna.ok) {
    for (const failure of dna.failures) {
      console.error(`FAIL ${failure.rule}: ${failure.detail}`);
    }
    process.exit(1);
  }

  const themePath = path.resolve(ROOT, opts.themeJson);
  const themeRaw = await readFile(themePath, 'utf8');
  const themeJson = JSON.parse(themeRaw);
  const compiled = applyDna(themeJson, dna);
  const serialized = `${JSON.stringify(compiled, null, '\t')}\n`;

  const current = themeJson.settings.color.palette;
  for (const slot of current) {
    const next = dna.palette[slot.slug];
    if (next && next !== String(slot.color).toLowerCase()) {
      console.log(`PLAN: ${slot.slug}: ${slot.color} -> ${next}`);
    }
  }
  if (dna.fonts) {
    console.log(`PLAN: heading font -> ${dna.fonts.heading}`);
    console.log(`PLAN: body font -> ${dna.fonts.body}`);
    console.log('NOTE: font FILES are not bundled by this tool; bundling licensed fonts stays a manual, approval-gated step.');
  }

  if (opts.checkMode) {
    if (themeRaw !== serialized) {
      console.error('FAIL: theme.json does not match the compiled design DNA. Run with --write after approval.');
      process.exit(1);
    }
    console.log('OK: theme.json matches the compiled design DNA.');
    return;
  }
  if (!opts.write) {
    console.log('OK: dry-run only. Re-run with --write after design-token approval to apply.');
    return;
  }
  await writeFile(themePath, serialized, 'utf8');
  console.log(`OK: wrote ${opts.themeJson}. Re-run the render harness + visual diff and review before committing.`);
}

// --- self-test -------------------------------------------------------------------

function selfTest() {
  const results = [];
  const checkCase = (name, fn) => {
    try {
      fn();
      results.push(`PASS: ${name}`);
    } catch (error) {
      results.push(`FAIL: ${name} — ${error.message}`);
    }
  };
  const assert = (cond, msg) => {
    if (!cond) {
      throw new Error(msg);
    }
  };

  checkCase('hex parse + roundtrip', () => {
    assert(toHex(parseHex('#1A5FD0')) === '#1a5fd0', 'roundtrip failed');
    assert(parseHex('not-a-color') === null && parseHex('#fff') === null, 'invalid hex accepted');
  });

  checkCase('contrast ratio matches known values', () => {
    assert(Math.abs(contrastRatio('#ffffff', '#000000') - 21) < 0.01, 'white/black should be 21');
    assert(Math.abs(contrastRatio('#ffffff', '#ffffff') - 1) < 0.01, 'same color should be 1');
  });

  checkCase('lightness adjustment darkens', () => {
    const darker = adjustLightness('#1a5fd0', -0.08);
    assert(relativeLuminance(parseHex(darker)) < relativeLuminance(parseHex('#1a5fd0')), 'not darker');
  });

  checkCase('accent classification skips neutrals', () => {
    const picked = classifyBrandColors(['#ffffff', '#d9dde3', '#0b7a3e', '#111111']);
    assert(picked.accent === '#0b7a3e', `picked ${picked.accent}`);
  });

  checkCase('DNA-1 invalid hex fails closed', () => {
    const dna = compileDna({ colors: ['#12345'] });
    assert(!dna.ok && dna.failures[0].rule === 'DNA-1', JSON.stringify(dna.failures));
  });

  checkCase('DNA-4 all-neutral brand fails with guidance', () => {
    const dna = compileDna({ colors: ['#ffffff', '#eeeeee'] });
    assert(!dna.ok && dna.failures[0].rule === 'DNA-4', JSON.stringify(dna.failures));
  });

  checkCase('accent text reaches 4.5 even at the WCAG crossover (DNA-2 is defensive)', () => {
    // max(white, black) contrast bottoms out at ~4.58:1 around luminance 0.179,
    // so DNA-2 can only fire if the math regresses — prove the crossover holds.
    const dna = compileDna({ colors: ['#3b82f6'] });
    assert(dna.ok, JSON.stringify(dna.failures));
    const accentReport = dna.report.find((entry) => entry.pair.includes('accent'));
    assert(accentReport.ratio >= 4.5, `crossover ratio ${accentReport.ratio}`);
  });

  checkCase('green brand compiles: derived hover/strong darker, contrast picked, tinted neutrals', () => {
    const dna = compileDna({ colors: ['#0b7a3e', '#111111'], fonts: ['Poppins', 'Open Sans'] });
    assert(dna.ok, JSON.stringify(dna.failures));
    assert(dna.palette.accent === '#0b7a3e', dna.palette.accent);
    assert(relativeLuminance(parseHex(dna.palette['accent-hover'])) < relativeLuminance(parseHex(dna.palette.accent)), 'hover not darker');
    assert(relativeLuminance(parseHex(dna.palette['accent-strong'])) < relativeLuminance(parseHex(dna.palette['accent-hover'])), 'strong not darkest');
    assert(dna.palette['accent-contrast'] === '#ffffff', 'white should win on dark green');
    assert(dna.palette.surface !== '#f7f8fa', 'surface should be accent-tinted');
    assert(dna.fonts.heading.startsWith('Poppins,'), dna.fonts.heading);
    assert(dna.fonts.body.startsWith('"Open Sans",'), dna.fonts.body);
  });

  checkCase('applyDna patches slot values, keeps slugs, renames fonts', () => {
    const theme = {
      settings: {
        color: { palette: [{ slug: 'accent', color: '#1a5fd0', name: 'Accent' }, { slug: 'base', color: '#ffffff', name: 'Base' }] },
        typography: { fontFamilies: [{ slug: 'montserrat', fontFamily: 'Montserrat', name: 'Montserrat' }, { slug: 'inter', fontFamily: 'Inter', name: 'Inter' }] }
      }
    };
    const dna = compileDna({ colors: ['#0b7a3e'], fonts: ['Poppins'] });
    const next = applyDna(theme, dna);
    assert(next.settings.color.palette[0].color === '#0b7a3e', 'accent not applied');
    assert(next.settings.color.palette[0].slug === 'accent' && next.settings.color.palette[0].name === 'Accent', 'slug/name must not change');
    assert(next.settings.typography.fontFamilies[0].fontFamily.startsWith('Poppins'), 'heading font not applied');
    assert(theme.settings.color.palette[0].color === '#1a5fd0', 'input mutated');
  });

  checkCase('deterministic compile', () => {
    const a = JSON.stringify(compileDna({ colors: ['#0b7a3e'], fonts: ['Poppins'] }));
    assert(a === JSON.stringify(compileDna({ colors: ['#0b7a3e'], fonts: ['Poppins'] })), 'not deterministic');
  });

  for (const line of results) {
    console.log(line);
  }
  const failed = results.filter((line) => line.startsWith('FAIL')).length;
  console.log(failed === 0 ? `OK: ${results.length}/${results.length} self-test checks passed` : `FAIL: ${failed} check(s) failed`);
  process.exit(failed === 0 ? 0 : 1);
}

const opts = parseArgs(process.argv.slice(2));
if (opts.selfTest) {
  selfTest();
} else {
  await run(opts);
}
