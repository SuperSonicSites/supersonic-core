// Brand review flow: ranked palette/font picks from captured/brand.json into
// the intake (design.colors, design.fonts, brand.assets.logoPaths), with a
// schema-lite validation gate before any write (fail closed).

import { readFile, writeFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import * as p from '@clack/prompts';
import pc from 'picocolors';
import { take, swatch } from '../lib/ui.mjs';
import { checkAgainstSchema } from '../lib/schema-lite.mjs';

const INTAKE_PATH = 'data/site-intake.json';
const SCHEMA_PATH = 'data/site-intake.schema.json';
const BRAND_PATH = 'captured/brand.json';
const LOGO_DIR = 'captured/assets/logo-candidates';
const NONE = '__none__';

export async function brandFlow({ rootDir }) {
  p.log.step('Brand review — adopt captured palette/fonts/logos into the intake');

  let brand;
  try {
    brand = JSON.parse(await readFile(path.join(rootDir, BRAND_PATH), 'utf8'));
  } catch {
    p.log.warn(`${BRAND_PATH} not found or invalid — run "Capture legacy site" first.`);
    return;
  }

  let intake;
  let schema;
  try {
    intake = JSON.parse(await readFile(path.join(rootDir, INTAKE_PATH), 'utf8'));
    schema = JSON.parse(await readFile(path.join(rootDir, SCHEMA_PATH), 'utf8'));
  } catch (error) {
    p.log.error(`Cannot load intake/schema (${error.message}) — run the Init interview first.`);
    return;
  }
  if (!intake || typeof intake !== 'object' || !intake.design || typeof intake.design !== 'object') {
    p.log.error(`${INTAKE_PATH} has no design block — run the Init interview first.`);
    return;
  }

  const isTTY = Boolean(process.stdout.isTTY);
  const palette = Array.isArray(brand.palette) ? brand.palette : [];
  const fonts = Array.isArray(brand.fonts) ? brand.fonts : [];

  // Colors
  let chosenColors = [];
  if (palette.length === 0) {
    p.log.warn('Captured palette is empty — leaving design.colors unchanged.');
  } else {
    const currentColors = Array.isArray(intake.design.colors) ? intake.design.colors.map((c) => String(c).toLowerCase()) : [];
    chosenColors = take(
      await p.multiselect({
        message: 'Adopt which captured colors into design.colors? (space to toggle, enter to confirm)',
        options: palette.slice(0, 12).map((color) => ({
          value: color.hex,
          label: `${swatch(color.hex, isTTY)}  ${color.roleGuess} (${color.count} samples)`
        })),
        initialValues: palette.slice(0, 12).map((c) => c.hex).filter((hex) => currentColors.includes(hex.toLowerCase())),
        required: false
      })
    );
  }

  // Fonts
  const fontPick = async (role) => {
    if (fonts.length === 0) {
      return '';
    }
    const ranked = [...fonts].sort((a, b) => (b.roleGuess === role) - (a.roleGuess === role) || b.count - a.count);
    const value = take(
      await p.select({
        message: `${role === 'heading' ? 'Heading' : 'Body'} font candidate`,
        options: [
          ...ranked.map((font) => ({
            value: font.family,
            label: `${font.family} — guessed ${font.roleGuess} (${font.count} samples)`
          })),
          { value: NONE, label: 'None / keep current intake fonts' }
        ]
      })
    );
    return value === NONE ? '' : value;
  };
  const bodyFont = await fontPick('body');
  const headingFont = await fontPick('heading');

  // Logo candidates
  let chosenLogos = [];
  let logoFiles = [];
  try {
    logoFiles = (await readdir(path.join(rootDir, LOGO_DIR))).sort();
  } catch {
    logoFiles = [];
  }
  if (logoFiles.length > 0) {
    chosenLogos = take(
      await p.multiselect({
        message: `Adopt logo candidates into brand.assets.logoPaths? (${LOGO_DIR}/)`,
        options: logoFiles.map((name) => ({ value: `${LOGO_DIR}/${name}`, label: name })),
        required: false
      })
    );
  } else {
    p.log.info('No captured logo candidates found.');
  }

  // Apply
  const updated = JSON.parse(JSON.stringify(intake));
  const changes = [];
  if (chosenColors.length > 0) {
    updated.design.colors = chosenColors;
    changes.push(`design.colors -> [${chosenColors.join(', ')}]`);
  }
  const pickedFonts = [...new Set([bodyFont, headingFont].filter(Boolean))];
  if (pickedFonts.length > 0) {
    updated.design.fonts = pickedFonts;
    changes.push(`design.fonts -> [${pickedFonts.join(', ')}]`);
  }
  if (chosenLogos.length > 0) {
    if (!updated.brand || typeof updated.brand !== 'object') {
      updated.brand = { voice: [], writingStyle: 'TBD', phrasesToAvoid: [] };
    }
    const assets = updated.brand.assets && typeof updated.brand.assets === 'object' ? updated.brand.assets : {};
    assets.logoPaths = chosenLogos;
    updated.brand.assets = assets;
    changes.push(`brand.assets.logoPaths -> ${chosenLogos.length} file(s)`);
  }

  if (changes.length === 0) {
    p.log.message('Nothing selected — intake unchanged.');
    return;
  }

  // Fail closed: schema-validate before writing.
  const issues = checkAgainstSchema(updated, schema);
  if (issues.length > 0) {
    p.log.error(`Updated intake FAILS ${SCHEMA_PATH} — nothing was written:`);
    for (const issue of issues) {
      p.log.error(`  ${issue}`);
    }
    return;
  }

  p.note(changes.join('\n'), 'Intake changes');
  const write = take(await p.confirm({ message: `Write ${INTAKE_PATH}?` }));
  if (!write) {
    p.log.warn('Not written — selections discarded.');
    return;
  }
  await writeFile(path.join(rootDir, INTAKE_PATH), `${JSON.stringify(updated, null, 2)}\n`);
  p.log.success(`${INTAKE_PATH} updated (schema-valid). ${pc.dim('Remember: global design token changes still need explicit approval.')}`);
}
