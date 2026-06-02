import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const results = [];

const requiredSections = [
  '## Discovery',
  '## Contract',
  '## Proof Gates',
  '## Failure Policy',
  '## Report'
];

function pass(message) {
  results.push({ status: 'pass', message });
}

function fail(message) {
  results.push({ status: 'fail', message });
}

async function readText(relativePath) {
  return readFile(path.join(root, relativePath), 'utf8');
}

async function listMarkdownFiles(relativePath) {
  const absolutePath = path.join(root, relativePath);
  const entries = await readdir(absolutePath, { withFileTypes: true });
  const files = [];

  for (const entry of entries.sort((a, b) => a.name.localeCompare(b.name))) {
    const child = path.join(relativePath, entry.name);
    if (entry.isDirectory()) {
      files.push(...await listMarkdownFiles(child));
    } else if (entry.name.endsWith('.md')) {
      files.push(child.replace(/\\/g, '/'));
    }
  }

  return files;
}

function includesAll(content, needles) {
  const lower = content.toLowerCase();
  return needles.every((needle) => lower.includes(needle.toLowerCase()));
}

function hasProofSummary(content) {
  return /(^|\n)##\s+Proof Summary\b/i.test(content);
}

function hasUnscopedHeaderCss(content) {
  const mediaBlocks = [...content.matchAll(/@media\s*\(min-width:\s*600px\)\s*and\s*\(max-width:\s*1023px\)\s*\{([\s\S]*?)\n\}/g)];
  return mediaBlocks.some((block) =>
    /\.supersonic-site-header\b/.test(block[1]) &&
    !/\.supersonic-site-header--mega\b/.test(block[1])
  );
}

function parseFrontmatter(content) {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match) {
    return null;
  }

  const fields = [];
  for (const line of match[1].split(/\r?\n/)) {
    // Only treat a line as a new field if it starts at column zero (no leading whitespace).
    // Indented continuation lines are appended to the previous field's value.
    const field = line.match(/^([A-Za-z0-9_-]+):\s*(.*)$/);
    if (field) {
      fields.push({ name: field[1], value: field[2] });
    } else if (/^[ \t]/.test(line) && fields.length > 0) {
      fields[fields.length - 1].value += ' ' + line.trim();
    }
  }
  return fields;
}

function sectionBody(content, heading) {
  const sectionName = heading.replace(/^##\s+/, '');
  const headingRegex = new RegExp('(^|\\n)##\\s+' + sectionName + '\\b');
  const match = headingRegex.exec(content);
  if (!match) {
    return '';
  }
  const afterHeading = content.slice(match.index + match[0].length);
  const nextHeading = afterHeading.search(/(^|\n)##\s+/);
  const body = nextHeading === -1 ? afterHeading : afterHeading.slice(0, nextHeading);
  return body;
}

async function validateSkills() {
  const files = await listMarkdownFiles('.claude/skills');

  for (const file of files) {
    const content = await readText(file);
    const frontmatter = parseFrontmatter(content);
    const fieldNames = new Set(frontmatter?.map((field) => field.name) ?? []);

    if (frontmatter && fieldNames.has('name') && fieldNames.has('description')) {
      pass(`${file} has required skill frontmatter`);
    } else {
      fail(`${file} must start with YAML frontmatter containing name and description`);
    }

    const extraFields = [...fieldNames].filter((field) => !['name', 'description'].includes(field));
    if (extraFields.length === 0) {
      pass(`${file} frontmatter stays limited to name and description`);
    } else {
      fail(`${file} frontmatter must not include extra fields: ${extraFields.join(', ')}`);
    }

    const description = frontmatter?.find((field) => field.name === 'description')?.value ?? '';
    if (description.trimStart().toLowerCase().startsWith('use when')) {
      pass(`${file} description declares use context`);
    } else {
      fail(`${file} description must include clear "Use when" trigger language`);
    }

    const frontmatterName = frontmatter?.find((field) => field.name === 'name')?.value ?? '';
    const dir = path.basename(path.dirname(path.join(root, file)));
    if (frontmatterName === dir) {
      pass(`${file} frontmatter name matches its directory`);
    } else {
      fail(`${file} frontmatter name "${frontmatterName}" must match directory "${dir}"`);
    }

    for (const section of requiredSections) {
      const sectionName = section.replace(/^##\s+/, '');
      const headingRegex = new RegExp('(^|\\n)##\\s+' + sectionName + '\\b');
      if (headingRegex.test(content)) {
        pass(`${file} includes ${section}`);
        const body = sectionBody(content, section);
        if (body.trim().length > 0) {
          pass(`${file} ${section} has content`);
        } else {
          fail(`${file} ${section} must not be empty`);
        }
      } else {
        fail(`${file} missing ${section}`);
      }
    }

    if (content.includes('docs/agent-quality-standard.md')) {
      pass(`${file} references docs/agent-quality-standard.md`);
    } else {
      fail(`${file} must reference docs/agent-quality-standard.md`);
    }
  }
}

async function validateCommands() {
  const files = await listMarkdownFiles('.claude/commands');
  const requiredTerms = ['docs/agent-quality-standard.md', 'contract', 'proof', 'fail closed'];

  for (const file of files) {
    const content = await readText(file);
    const frontmatter = parseFrontmatter(content);
    const descriptionField = frontmatter?.find((field) => field.name === 'description');
    if (frontmatter && descriptionField && descriptionField.value.trim().length > 0) {
      pass(`${file} has a non-empty description`);
    } else {
      fail(`${file} must have YAML frontmatter with a non-empty description`);
    }

    for (const term of requiredTerms) {
      if (includesAll(content, [term])) {
        pass(`${file} includes ${term}`);
      } else {
        fail(`${file} must include ${term}`);
      }
    }
  }
}

async function validateDocs() {
  const requiredDocs = [
    'CLAUDE.md',
    'README.md',
    'QA_CHECKLIST.md',
    'DESIGN_SYSTEM.md',
    'docs/agent-quality-standard.md',
    'docs/gutenberg-authoring-standard.md',
    'docs/pattern-qa-template.md',
    'docs/workflows/theme-pattern-certification.md'
  ];

  for (const file of requiredDocs) {
    const content = await readText(file);
    if (includesAll(content, ['proof'])) {
      pass(`${file} includes proof language`);
    } else {
      fail(`${file} must include proof language`);
    }
  }

  const standard = await readText('docs/agent-quality-standard.md');
  if (includesAll(standard, ['## New Skill Creation', '## Skill Methodology Template'])) {
    pass('docs/agent-quality-standard.md defines the new skill methodology');
  } else {
    fail('docs/agent-quality-standard.md must define the new skill methodology');
  }

  const templateBlockMatch = standard.match(/##\s+Skill Methodology Template[\s\S]*?```markdown\r?\n([\s\S]*?)\r?\n```/);
  if (!templateBlockMatch) {
    fail('docs/agent-quality-standard.md is missing the Skill Methodology Template code block');
  } else {
    const templateBlock = templateBlockMatch[1];
    const templateHeadings = [...templateBlock.matchAll(/^##\s+(.+)$/gm)].map((m) => `## ${m[1].trim()}`);
    const templateSet = new Set(templateHeadings);
    const enforcedSet = new Set(requiredSections);
    const missing = requiredSections.filter((s) => !templateSet.has(s));
    const extra = templateHeadings.filter((s) => !enforcedSet.has(s));
    if (missing.length === 0 && extra.length === 0) {
      pass('docs/agent-quality-standard.md skill template matches enforced sections');
    } else {
      fail(`docs/agent-quality-standard.md skill template sections drifted from enforced set: missing [${missing.join(', ')}], extra [${extra.join(', ')}]`);
    }
  }

  for (const file of [
    'docs/agent-quality-standard.md',
    'docs/pattern-qa-template.md',
    'docs/workflows/theme-pattern-certification.md'
  ]) {
    const content = await readText(file);
    if (hasProofSummary(content)) {
      pass(`${file} defines a Proof Summary`);
    } else {
      fail(`${file} must define a Proof Summary`);
    }
  }
}

async function validatePackageScripts() {
  const packageJson = JSON.parse(await readText('package.json'));
  for (const script of ['agents:check', 'pattern:proof']) {
    if (packageJson.scripts?.[script]) {
      pass(`package.json defines npm run ${script}`);
    } else {
      fail(`package.json missing npm run ${script}`);
    }
  }
}

async function validateWorkflows() {
  const visualQaWorkflow = await readText('.claude/workflows/visual-qa.js');
  if (includesAll(visualQaWorkflow, ['pattern:proof', 'Proof Summary'])) {
    pass('.claude/workflows/visual-qa.js routes visual QA through pattern:proof and Proof Summary');
  } else {
    fail('.claude/workflows/visual-qa.js must route visual QA through pattern:proof and Proof Summary');
  }
}

function runRegressionFixtures() {
  const reportWithoutProof = '# Report\n\n## Result\n\nApproved.';
  const reportWithProof = '# Report\n\n## Proof Summary\n\n- Static proof: passed.';
  const unscopedHeaderCss = `
@media (min-width: 600px) and (max-width: 1023px) {
  .supersonic-site-header .wp-block-navigation__responsive-container-open {
    display: flex !important;
  }
}
`;
  const scopedHeaderCss = `
@media (min-width: 600px) and (max-width: 1023px) {
  .supersonic-site-header--mega .wp-block-navigation__responsive-container-open {
    display: flex !important;
  }
}
`;

  if (!hasProofSummary(reportWithoutProof) && hasProofSummary(reportWithProof)) {
    pass('regression fixture: approved QA report without Proof Summary fails');
  } else {
    fail('regression fixture failed: Proof Summary detector is not strict');
  }

  if (hasUnscopedHeaderCss(unscopedHeaderCss) && !hasUnscopedHeaderCss(scopedHeaderCss)) {
    pass('regression fixture: unscoped header CSS affecting all headers fails');
  } else {
    fail('regression fixture failed: header CSS scope detector is not strict');
  }
}

await validateSkills();
await validateCommands();
await validateDocs();
await validatePackageScripts();
await validateWorkflows();
runRegressionFixtures();

for (const result of results) {
  console.log(`${result.status === 'pass' ? 'PASS' : 'FAIL'}: ${result.message}`);
}

if (results.some((result) => result.status === 'fail')) {
  process.exit(1);
}
