import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const results = [];

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

async function validateSkills() {
  const files = await listMarkdownFiles('.claude/skills');
  const requiredSections = [
    '## Discovery',
    '## Contract',
    '## Proof Gates',
    '## Failure Policy',
    '## Report'
  ];

  for (const file of files) {
    const content = await readText(file);
    for (const section of requiredSections) {
      if (content.includes(section)) {
        pass(`${file} includes ${section}`);
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
