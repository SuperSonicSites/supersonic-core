import { readFile, readdir, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const targetWordPress = '7.0';
const checks = [];

function pass(message) {
  checks.push({ status: 'pass', message });
}

function fail(message) {
  checks.push({ status: 'fail', message });
}

async function readText(relativePath) {
  return readFile(path.join(root, relativePath), 'utf8');
}

async function exists(relativePath) {
  try {
    await stat(path.join(root, relativePath));
    return true;
  } catch {
    return false;
  }
}

async function collectFiles(relativePath, extensions) {
  const absolutePath = path.join(root, relativePath);
  const entries = await readdir(absolutePath, { withFileTypes: true }).catch(() => []);
  const files = [];

  for (const entry of entries) {
    const childRelativePath = path.join(relativePath, entry.name);
    if (entry.isDirectory()) {
      files.push(...await collectFiles(childRelativePath, extensions));
    } else if (extensions.some((extension) => entry.name.endsWith(extension))) {
      files.push(childRelativePath.replace(/\\/g, '/'));
    }
  }

  return files;
}

function listZipEntries(buffer) {
  const entries = [];
  let offset = 0;

  while (offset < buffer.length - 46) {
    if (buffer.readUInt32LE(offset) === 0x02014b50) {
      const nameLength = buffer.readUInt16LE(offset + 28);
      const extraLength = buffer.readUInt16LE(offset + 30);
      const commentLength = buffer.readUInt16LE(offset + 32);
      const name = buffer.slice(offset + 46, offset + 46 + nameLength).toString('utf8');
      entries.push(name);
      offset += 46 + nameLength + extraLength + commentLength;
    } else {
      offset += 1;
    }
  }

  return entries;
}

async function validateThemeJson() {
  try {
    const themeJson = await readText('wp-content/themes/supersonic-site-theme/theme.json');
    const parsed = JSON.parse(themeJson);
    if (parsed.$schema === `https://schemas.wp.org/wp/${targetWordPress}/theme.json`) {
      pass('theme.json schema targets WordPress 7.0');
    } else {
      fail(`theme.json schema should target WordPress ${targetWordPress}`);
    }
  } catch (error) {
    fail(`theme.json is invalid: ${error.message}`);
  }
}

async function validateDesignTokens() {
  try {
    const themeJson = await readText('wp-content/themes/supersonic-site-theme/theme.json');
    const parsed = JSON.parse(themeJson);
    const spacingSlugs = new Set(parsed.settings?.spacing?.spacingSizes?.map((size) => size.slug) ?? []);
    const fontSlugs = new Set(parsed.settings?.typography?.fontSizes?.map((size) => size.slug) ?? []);
    const colorSlugs = new Set(parsed.settings?.color?.palette?.map((color) => color.slug) ?? []);
    const shadowSlugs = new Set(parsed.settings?.shadow?.presets?.map((shadow) => shadow.slug) ?? []);
    const requiredSpacing = ['gutter', 'section-none', 'section-small', 'section-medium', 'section-large'];
    const requiredFonts = ['small', 'body', 'large', 'heading-3', 'heading-2', 'heading-1', 'display'];
    const requiredColors = ['base', 'contrast', 'contrast-subtle', 'surface', 'muted', 'border', 'accent', 'accent-contrast'];
    const requiredShadows = ['soft', 'medium'];

    if (parsed.settings?.layout?.contentSize === '1440px' && parsed.settings?.layout?.wideSize === '1440px') {
      pass('theme layout defaults to 1440px content and wide width');
    } else {
      fail('theme layout should default contentSize and wideSize to 1440px');
    }

    if (
      parsed.styles?.spacing?.padding?.left === '5%' &&
      parsed.styles?.spacing?.padding?.right === '5%'
    ) {
      pass('theme root padding uses 5% horizontal gutter');
    } else {
      fail('theme root padding should use 5% left/right gutter');
    }

    for (const slug of requiredSpacing) {
      if (spacingSlugs.has(slug)) {
        pass(`spacing token exists: ${slug}`);
      } else {
        fail(`missing spacing token: ${slug}`);
      }
    }

    for (const slug of requiredFonts) {
      if (fontSlugs.has(slug)) {
        pass(`typography token exists: ${slug}`);
      } else {
        fail(`missing typography token: ${slug}`);
      }
    }

    for (const slug of requiredColors) {
      if (colorSlugs.has(slug)) {
        pass(`color token exists: ${slug}`);
      } else {
        fail(`missing color token: ${slug}`);
      }
    }

    for (const slug of requiredShadows) {
      if (shadowSlugs.has(slug)) {
        pass(`shadow token exists: ${slug}`);
      } else {
        fail(`missing shadow token: ${slug}`);
      }
    }

    if (parsed.settings?.typography?.customFontSize === false) {
      pass('custom font sizes are disabled');
    } else {
      fail('custom font sizes should be disabled');
    }

    if (parsed.settings?.spacing?.customSpacingSize === false) {
      pass('custom spacing sizes are disabled');
    } else {
      fail('custom spacing sizes should be disabled');
    }

    if (parsed.settings?.color?.custom === false) {
      pass('custom colors are disabled');
    } else {
      fail('custom colors should be disabled');
    }

    if (parsed.settings?.shadow?.defaultPresets === false) {
      pass('default WordPress shadow presets are disabled');
    } else {
      fail('default WordPress shadow presets should be disabled');
    }
  } catch (error) {
    fail(`design token validation failed: ${error.message}`);
  }
}

async function validateCssGuardrails() {
  const cssFiles = await collectFiles('wp-content/themes/supersonic-site-theme/assets/css', ['.css']);
  const arbitraryShadow = /box-shadow\s*:\s*(?!\s*(?:var\(--wp--preset--shadow--|none\b))[^;]+;/;

  for (const file of cssFiles) {
    const content = await readText(file);
    if (arbitraryShadow.test(content)) {
      fail(`${file} uses an arbitrary box-shadow value instead of an approved shadow preset`);
    } else {
      pass(`${file} uses approved shadow values`);
    }
  }
}

async function validateJsonFile(relativePath) {
  try {
    JSON.parse(await readText(relativePath));
    pass(`${relativePath} parses`);
  } catch (error) {
    fail(`${relativePath} is invalid JSON: ${error.message}`);
  }
}

async function validatePackageScripts() {
  const packageJson = JSON.parse(await readText('package.json'));
  const requiredScripts = [
    'package',
    'validate',
    'rest:check',
    'rest:certify',
    'rest:qa-page:dry-run',
    'rest:qa-page:trash-dry-run',
    'rest:dry-run',
    'screenshot'
  ];

  for (const script of requiredScripts) {
    if (packageJson.scripts?.[script]) {
      pass(`package.json defines npm run ${script}`);
    } else {
      fail(`package.json missing npm run ${script}`);
    }
  }
}

async function validateHeaders() {
  const themeStyle = await readText('wp-content/themes/supersonic-site-theme/style.css');
  const pluginPhp = await readText('wp-content/plugins/supersonic-site-core/plugin.php');

  for (const [label, content] of [['theme', themeStyle], ['plugin', pluginPhp]]) {
    if (content.includes(`Requires at least: ${targetWordPress}`)) {
      pass(`${label} requires at least WordPress ${targetWordPress}`);
    } else {
      fail(`${label} missing Requires at least: ${targetWordPress}`);
    }

    if (content.includes(`Tested up to: ${targetWordPress}`)) {
      pass(`${label} tested up to WordPress ${targetWordPress}`);
    } else {
      fail(`${label} missing Tested up to: ${targetWordPress}`);
    }
  }
}

async function validateSourceGuardrails() {
  const forbiddenPatterns = [
    ['Custom HTML block', /wp:html|core\/html/],
    ['custom post type registration', /register_post_type\s*\(/],
    ['custom taxonomy registration', /register_taxonomy\s*\(/],
    ['REST route registration', /register_rest_route\s*\(/],
    ['custom block registration', /register_block_type\s*\(/],
    ['third-party dependency import', /require_once\s+.*vendor|include_once\s+.*vendor/]
  ];

  const files = [
    'wp-content/themes/supersonic-site-theme/functions.php',
    'wp-content/themes/supersonic-site-theme/templates/index.html',
    'wp-content/themes/supersonic-site-theme/templates/page.html',
    'wp-content/themes/supersonic-site-theme/templates/text-page.html',
    'wp-content/themes/supersonic-site-theme/parts/header.html',
    'wp-content/themes/supersonic-site-theme/parts/footer.html',
    'wp-content/plugins/supersonic-site-core/plugin.php',
    ...await collectFiles('wp-content/themes/supersonic-site-theme/patterns', ['.php', '.html'])
  ];

  const source = (await Promise.all(files.map(async (file) => `${file}\n${await readText(file)}`))).join('\n');

  for (const [label, pattern] of forbiddenPatterns) {
    if (pattern.test(source)) {
      fail(`Found unapproved ${label}`);
    } else {
      pass(`No unapproved ${label}`);
    }
  }
}

async function validateBlockAllowList() {
  const allowedExternalBlocks = new Set(['rank-math/faq-block']);
  const files = [
    'wp-content/themes/supersonic-site-theme/functions.php',
    'wp-content/themes/supersonic-site-theme/templates/index.html',
    'wp-content/themes/supersonic-site-theme/templates/page.html',
    'wp-content/themes/supersonic-site-theme/templates/text-page.html',
    'wp-content/themes/supersonic-site-theme/parts/header.html',
    'wp-content/themes/supersonic-site-theme/parts/footer.html',
    ...await collectFiles('wp-content/themes/supersonic-site-theme/patterns', ['.php', '.html'])
  ];
  const blockComment = /<!--\s*wp:([\w/-]+)/g;
  let foundViolation = false;

  for (const file of files) {
    const content = await readText(file);
    let match;

    while ((match = blockComment.exec(content)) !== null) {
      const blockName = match[1];
      const isCoreAlias = !blockName.includes('/') || blockName.startsWith('core/');
      const isApprovedExternal = allowedExternalBlocks.has(blockName);

      if (!isCoreAlias && !isApprovedExternal) {
        foundViolation = true;
        fail(`${file} uses unapproved external block: ${blockName}`);
      }
    }
  }

  if (!foundViolation) {
    pass('No unapproved external blocks are used');
  }
}

async function validatePatternLibraryPolicy() {
  const functionsPhp = await readText('wp-content/themes/supersonic-site-theme/functions.php');

  if (/remove_theme_support\s*\(\s*['"]core-block-patterns['"]\s*\)/.test(functionsPhp)) {
    pass('core WordPress patterns are disabled');
  } else {
    fail('theme should disable core WordPress patterns');
  }

  if (/should_load_remote_block_patterns/.test(functionsPhp) && /__return_false/.test(functionsPhp)) {
    pass('remote WordPress.org patterns are disabled');
  } else {
    fail('theme should disable remote WordPress.org patterns');
  }
}

async function validatePatternHorizontalSpacing() {
  // Patterns own vertical section rhythm only. Horizontal spacing is owned by the
  // theme: every section rides the 5% root gutter and the default content width.
  // A pattern must never add horizontal inset on top of that base, via either
  // hardcoded left/right padding or a section-level contentSize override.
  const patternFiles = await collectFiles('wp-content/themes/supersonic-site-theme/patterns', ['.php', '.html']);
  const blockComment = /<!--\s*wp:[\w/-]+\s+(\{[\s\S]*?\})\s*\/?-->/g;

  for (const file of patternFiles) {
    const content = await readText(file);
    const violations = [];
    let match;

    while ((match = blockComment.exec(content)) !== null) {
      let attrs;
      try {
        attrs = JSON.parse(match[1]);
      } catch {
        continue;
      }

      if (attrs.align === 'full' && attrs.layout?.contentSize) {
        violations.push('full-width group sets its own contentSize (narrows below the theme default width)');
      }

      const padding = attrs.style?.spacing?.padding;
      if (
        attrs.align === 'full' &&
        padding &&
        (padding.left !== undefined || padding.right !== undefined)
      ) {
        violations.push('full-width section sets explicit left/right padding instead of relying on the 5% gutter');
      }
    }

    if (violations.length) {
      for (const violation of violations) {
        fail(`${file}: ${violation}`);
      }
    } else {
      pass(`${file} adds no horizontal padding beyond the base 5% gutter`);
    }
  }
}

async function validatePackages() {
  const themePatternFiles = await collectFiles('wp-content/themes/supersonic-site-theme/patterns', ['.php', '.html']);
  const packagedThemePatterns = themePatternFiles.map((file) =>
    file.replace('wp-content/themes/supersonic-site-theme/', 'supersonic-site-theme/')
  );
  const packageSpecs = [
    {
      file: 'packages/supersonic-site-theme.zip',
      root: 'supersonic-site-theme/',
      required: [
        'supersonic-site-theme/style.css',
        'supersonic-site-theme/theme.json',
        'supersonic-site-theme/functions.php',
        'supersonic-site-theme/assets/css/navigation.css',
        'supersonic-site-theme/templates/index.html',
        'supersonic-site-theme/templates/page.html',
        'supersonic-site-theme/templates/text-page.html',
        'supersonic-site-theme/parts/header.html',
        'supersonic-site-theme/parts/footer.html',
        ...packagedThemePatterns
      ]
    },
    {
      file: 'packages/supersonic-site-core.zip',
      root: 'supersonic-site-core/',
      required: ['supersonic-site-core/plugin.php']
    }
  ];

  for (const spec of packageSpecs) {
    if (!(await exists(spec.file))) {
      fail(`${spec.file} has not been generated`);
      continue;
    }

    const entries = listZipEntries(await readFile(path.join(root, spec.file)));
    const hasBackslashes = entries.some((entry) => entry.includes('\\'));
    const hasRepoOnlyFiles = entries.some((entry) => entry.endsWith('CLAUDE.md') || entry.endsWith('.gitkeep') || entry.includes('/.'));

    if (entries.includes(spec.root)) {
      pass(`${spec.file} contains top-level ${spec.root}`);
    } else {
      fail(`${spec.file} missing top-level ${spec.root}`);
    }

    for (const required of spec.required) {
      if (entries.includes(required)) {
        pass(`${spec.file} contains ${required}`);
      } else {
        fail(`${spec.file} missing ${required}`);
      }
    }

    if (!hasBackslashes) {
      pass(`${spec.file} uses forward-slash archive paths`);
    } else {
      fail(`${spec.file} contains Windows backslash archive paths`);
    }

    if (!hasRepoOnlyFiles) {
      pass(`${spec.file} excludes repo-only files`);
    } else {
      fail(`${spec.file} contains repo-only files`);
    }
  }
}

await validateThemeJson();
await validateDesignTokens();
await validateJsonFile('data/site-intake.schema.json');
await validateJsonFile('data/site-intake.example.json');
await validateJsonFile('data/site-intake.json');
await validatePackageScripts();
await validateHeaders();
await validateSourceGuardrails();
await validateBlockAllowList();
await validateCssGuardrails();
await validatePatternLibraryPolicy();
await validatePatternHorizontalSpacing();
await validatePackages();

for (const check of checks) {
  const icon = check.status === 'pass' ? 'PASS' : 'FAIL';
  console.log(`${icon}: ${check.message}`);
}

if (checks.some((check) => check.status === 'fail')) {
  process.exit(1);
}
