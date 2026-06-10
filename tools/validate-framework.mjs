import { readFile, readdir, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { validatePatternRegistry } from './validate-pattern-registry.mjs';

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

  for (const entry of entries.sort((a, b) => a.name.localeCompare(b.name))) {
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
    const gradientSlugs = new Set(parsed.settings?.color?.gradients?.map((gradient) => gradient.slug) ?? []);
    const requiredSpacing = ['gutter', 'section-none', 'section-small', 'section-medium', 'section-large'];
    const requiredFonts = ['small', 'body', 'large', 'heading-3', 'heading-2', 'heading-1', 'display'];
    const requiredColors = ['base', 'contrast', 'contrast-subtle', 'surface', 'muted', 'border', 'accent', 'accent-contrast'];
    const requiredShadows = ['soft', 'medium', 'strong'];
    const requiredGradients = ['surface-rise', 'accent-veil', 'muted-soft'];

    // Sites set their own container width (migrations must match the source
    // site), so validate internal consistency instead of one magic width: the
    // px-valued contentSize/wideSize must agree with the custom layout token.
    const contentSize = parsed.settings?.layout?.contentSize;
    const wideSize = parsed.settings?.layout?.wideSize;
    const maxWidthToken = parsed.settings?.custom?.layout?.maxWidth;
    if (
      /^\d+px$/.test(String(contentSize)) &&
      contentSize === wideSize &&
      maxWidthToken === contentSize
    ) {
      pass(`theme layout uses one consistent container width (${contentSize}) across contentSize, wideSize, and custom.layout.maxWidth`);
    } else {
      fail('theme layout contentSize, wideSize, and custom.layout.maxWidth must be one consistent px width');
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

    for (const slug of requiredGradients) {
      if (gradientSlugs.has(slug)) {
        pass(`gradient token exists: ${slug}`);
      } else {
        fail(`missing gradient token: ${slug}`);
      }
    }

    if (parsed.settings?.typography?.customFontSize === false) {
      pass('custom font sizes are disabled');
    } else {
      fail('custom font sizes should be disabled');
    }

    // Core's default presets share slugs with the theme scale (e.g. core
    // "Large" = 36px vs a theme "large"); leaving them enabled silently
    // overrides theme tokens at render time. Both default sets must be off.
    if (parsed.settings?.typography?.defaultFontSizes === false) {
      pass('core default font-size presets are disabled (no slug collisions)');
    } else {
      fail('settings.typography.defaultFontSizes must be false; core presets collide with theme token slugs');
    }
    if (parsed.settings?.spacing?.defaultSpacingSizes === false) {
      pass('core default spacing presets are disabled (no slug collisions)');
    } else {
      fail('settings.spacing.defaultSpacingSizes must be false; core presets collide with theme token slugs');
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

    if (parsed.settings?.color?.customGradient === false) {
      pass('custom gradients are disabled');
    } else {
      fail('custom gradients should be disabled');
    }

    if (parsed.settings?.color?.defaultGradients === false) {
      pass('default WordPress gradients are disabled');
    } else {
      fail('default WordPress gradients should be disabled');
    }

    if (parsed.settings?.shadow?.defaultPresets === false) {
      pass('default WordPress shadow presets are disabled');
    } else {
      fail('default WordPress shadow presets should be disabled');
    }

    if (! parsed.styles?.elements?.heading?.color?.text) {
      pass('headings inherit explicit ancestor text color');
    } else {
      fail('heading text color should not be globally fixed because it masks section text color');
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

  const patternCssPath = 'wp-content/themes/supersonic-site-theme/assets/css/patterns.css';
  const patternCss = await readText(patternCssPath);
  const functionsPhp = await readText('wp-content/themes/supersonic-site-theme/functions.php');
  if (/\.has-text-color\s+\.wp-block-button__link:not\(\.has-text-color\)\s*\{[\s\S]*?color:\s*inherit\s*;[\s\S]*?\}/.test(patternCss)) {
    pass('button labels without local text color inherit explicit ancestor text color');
  } else {
    fail(`${patternCssPath} must let button labels without local text color inherit explicit ancestor text color`);
  }

  if (
    functionsPhp.includes('assets/css/patterns.css') &&
    /wp_enqueue_style\s*\(\s*['"]supersonic-site-patterns['"]/.test(functionsPhp) &&
    /add_editor_style\s*\(\s*\$patterns_css\s*\)/.test(functionsPhp)
  ) {
    pass('pattern contract CSS is loaded on the front end and in the editor');
  } else {
    fail('pattern contract CSS must be enqueued on the front end and loaded in the editor');
  }

  const navigationCssPath = 'wp-content/themes/supersonic-site-theme/assets/css/navigation.css';
  const navigationCss = await readText(navigationCssPath);
  if (hasUnscopedHeaderBreakpointCss(navigationCss)) {
    fail(`${navigationCssPath} must not change every header in the 600px-1023px breakpoint; scope variant behavior to a header variant class`);
  } else {
    pass(`${navigationCssPath} keeps 600px-1023px header variant behavior scoped`);
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

function readHeaderVersion(content) {
  return content.match(/^\s*(?:\*\s*)?Version:\s*(.+?)\s*$/m)?.[1] ?? null;
}

function readPluginConstant(content) {
  return content.match(/define\(\s*['"]SUPERSONIC_SITE_CORE_VERSION['"]\s*,\s*['"]([^'"]+)['"]\s*\)/)?.[1] ?? null;
}

function parseBlockAttrs(attrsText) {
  if (!attrsText) {
    return {};
  }
  try {
    return JSON.parse(attrsText);
  } catch {
    return {};
  }
}

function normalizeBlockName(rawName) {
  return rawName.includes('/') ? rawName : `core/${rawName}`;
}

function collectBlockComments(content) {
  const blockPattern = /<!--\s*wp:([\w/-]+)(?:\s+(\{[\s\S]*?\}))?\s*\/?-->/g;
  const blocks = [];
  let match;

  while ((match = blockPattern.exec(content)) !== null) {
    blocks.push({
      name: normalizeBlockName(match[1]),
      attrs: parseBlockAttrs(match[2]),
      index: match.index
    });
  }

  return blocks;
}

function collectBlockTree(content) {
  const tokenPattern = /<!--\s*(\/)?wp:([\w/-]+)(?:\s+(\{[\s\S]*?\}))?\s*(\/)?-->/g;
  const rootBlock = { name: 'root', attrs: {}, index: -1, parent: null, children: [] };
  const stack = [rootBlock];
  const blocks = [];
  let match;

  while ((match = tokenPattern.exec(content)) !== null) {
    const isClosing = Boolean(match[1]);
    const name = normalizeBlockName(match[2]);

    if (isClosing) {
      while (stack.length > 1) {
        const current = stack.pop();
        if (current.name === name) {
          break;
        }
      }
      continue;
    }

    const block = {
      name,
      attrs: parseBlockAttrs(match[3]),
      index: match.index,
      parent: stack[stack.length - 1],
      children: []
    };

    stack[stack.length - 1].children.push(block);
    blocks.push(block);

    if (!match[4]) {
      stack.push(block);
    }
  }

  return { root: rootBlock, blocks };
}

function hasAncestor(block, predicate) {
  let current = block.parent;
  while (current && current.name !== 'root') {
    if (predicate(current)) {
      return true;
    }
    current = current.parent;
  }
  return false;
}

function hasDescendant(block, predicate) {
  for (const child of block.children ?? []) {
    if (predicate(child) || hasDescendant(child, predicate)) {
      return true;
    }
  }
  return false;
}

function countLevelOneBlocks(content) {
  const blockPattern = /<!--\s*wp:(heading|post-title)(?:\s+(\{[\s\S]*?\}))?\s*\/?-->/g;
  let count = 0;
  let match;

  while ((match = blockPattern.exec(content)) !== null) {
    const attrs = parseBlockAttrs(match[2]);
    if (attrs.level === 1) {
      count += 1;
    }
  }

  return count;
}

function countRawH1(content) {
  return (content.match(/<h1\b/ig) ?? []).length;
}

function countLogicalH1(content) {
  return Math.max(countLevelOneBlocks(content), countRawH1(content));
}

function parsePatternHeader(content) {
  const header = {};
  const match = content.match(/\/\*\*([\s\S]*?)\*\//);
  if (!match) {
    return header;
  }

  for (const line of match[1].split(/\r?\n/)) {
    const item = line.match(/^\s*\*\s*([^:]+):\s*(.+?)\s*$/);
    if (item) {
      header[item[1].trim()] = item[2].trim();
    }
  }

  return header;
}

async function validateVersionMetadata() {
  try {
    const packageJson = JSON.parse(await readText('package.json'));
    const packageLock = JSON.parse(await readText('package-lock.json'));
    const themeStyle = await readText('wp-content/themes/supersonic-site-theme/style.css');
    const pluginPhp = await readText('wp-content/plugins/supersonic-site-core/plugin.php');
    const themeVersion = readHeaderVersion(themeStyle);
    const pluginVersion = readHeaderVersion(pluginPhp);
    const pluginConstant = readPluginConstant(pluginPhp);
    const packageVersion = packageJson.version;
    const lockVersion = packageLock.version;
    const lockRootVersion = packageLock.packages?.['']?.version;

    if (themeVersion === packageVersion) {
      pass('theme version matches package.json');
    } else {
      fail(`theme version ${themeVersion} should match package.json ${packageVersion}`);
    }

    if (lockVersion === packageVersion && lockRootVersion === packageVersion) {
      pass('package-lock root versions match package.json');
    } else {
      fail(`package-lock versions should match package.json ${packageVersion}`);
    }

    if (pluginVersion === pluginConstant) {
      pass('plugin header version matches SUPERSONIC_SITE_CORE_VERSION');
    } else {
      fail(`plugin header version ${pluginVersion} should match SUPERSONIC_SITE_CORE_VERSION ${pluginConstant}`);
    }
  } catch (error) {
    fail(`version metadata validation failed: ${error.message}`);
  }
}

async function validatePackageScripts() {
  const packageJson = JSON.parse(await readText('package.json'));
  const requiredScripts = [
    'package',
    'validate',
    'agents:check',
    'pattern:proof',
    'package:determinism',
    'rest:check',
    'rest:certify',
    'rest:qa-pages',
    'rest:qa-page:dry-run',
    'rest:qa-page:trash-dry-run',
    'rest:dry-run',
    'screenshot',
    'certify:staging',
    'pattern:registry:check',
    'compose:check',
    'a11y:check',
    'test:updater-parser'
  ];

  for (const script of requiredScripts) {
    if (packageJson.scripts?.[script]) {
      pass(`package.json defines npm run ${script}`);
    } else {
      fail(`package.json missing npm run ${script}`);
    }
  }
}

function parseSemver(value) {
  return String(value ?? '')
    .split('.')
    .map((part) => Number.parseInt(part, 10))
    .map((part) => Number.isFinite(part) ? part : 0);
}

function semverGte(left, right) {
  const leftParts = parseSemver(left);
  const rightParts = parseSemver(right);
  for (let index = 0; index < Math.max(leftParts.length, rightParts.length); index += 1) {
    const leftValue = leftParts[index] ?? 0;
    const rightValue = rightParts[index] ?? 0;
    if (leftValue > rightValue) {
      return true;
    }
    if (leftValue < rightValue) {
      return false;
    }
  }
  return true;
}

function hasProofSummary(content) {
  return /(^|\n)##\s+Proof Summary\b/i.test(content);
}

function hasInteractionEvidence(content) {
  const lower = content.toLowerCase();
  return lower.includes('interaction proof') ||
    lower.includes('interaction-state') ||
    (lower.includes('closed state') && (lower.includes('open overlay') || lower.includes('hover')));
}

function hasUnscopedHeaderBreakpointCss(content) {
  const mediaBlocks = [...content.matchAll(/@media\s*\(min-width:\s*600px\)\s*and\s*\(max-width:\s*1023px\)\s*\{([\s\S]*?)\n\}/g)];
  return mediaBlocks.some((block) =>
    /\.supersonic-site-header\b/.test(block[1]) &&
    !/\.supersonic-site-header--[\w-]+\b/.test(block[1])
  );
}

async function validateCertificationProofReports() {
  const registry = JSON.parse(await readText('data/pattern-certifications.json'));
  for (const entry of registry.patterns ?? []) {
    if (entry.status !== 'approved' || !semverGte(entry.certifiedThemeVersion, '0.1.29')) {
      continue;
    }

    if (!entry.reportPath || !(await exists(entry.reportPath))) {
      fail(`${entry.slug} approved at ${entry.certifiedThemeVersion} must have an accessible certification report`);
      continue;
    }

    const report = await readText(entry.reportPath);
    if (hasProofSummary(report)) {
      pass(`${entry.reportPath} includes a Proof Summary for ${entry.slug}`);
    } else {
      fail(`${entry.reportPath} must include a Proof Summary before ${entry.slug} can stay approved`);
    }

    if (entry.category === 'supersonic-headers' || entry.category === 'supersonic-footers') {
      if (hasInteractionEvidence(report)) {
        pass(`${entry.reportPath} includes interaction-state evidence for ${entry.slug}`);
      } else {
        fail(`${entry.reportPath} must include interaction-state evidence for ${entry.slug}`);
      }
    }
  }
}

async function validatePatternRegistryChecks() {
  const results = await validatePatternRegistry({ rootDir: root });
  for (const result of results) {
    if (result.status === 'pass') {
      pass(result.message);
    } else {
      fail(result.message);
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
    // The plugin is the approved home for functionality (REST routes, etc.), so
    // these presentation guardrails scope to the theme only.
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

async function validateH1Policy() {
  const layoutNeutralTemplates = [
    'wp-content/themes/supersonic-site-theme/templates/index.html',
    'wp-content/themes/supersonic-site-theme/templates/page.html'
  ];

  for (const file of layoutNeutralTemplates) {
    const content = await readText(file);
    const h1Count = countLogicalH1(content);
    if (h1Count === 0) {
      pass(`${file} remains layout-neutral with no H1`);
    } else {
      fail(`${file} must not inject an H1; full page layouts own page headings`);
    }
  }

  const textPage = 'wp-content/themes/supersonic-site-theme/templates/text-page.html';
  const textPageContent = await readText(textPage);
  if (countLogicalH1(textPageContent) === 1) {
    pass(`${textPage} contains exactly one level-1 post title`);
  } else {
    fail(`${textPage} must contain exactly one level-1 post title`);
  }

  const patternFiles = await collectFiles('wp-content/themes/supersonic-site-theme/patterns', ['.php', '.html']);
  for (const file of patternFiles) {
    const content = await readText(file);
    const header = parsePatternHeader(content);
    const category = header.Categories ?? '';
    const slug = header.Slug ?? '';
    const h1Count = countLogicalH1(content);
    const requiresEditableH1 = category === 'supersonic-heroes' || slug.endsWith('/section-page-intro');

    if (requiresEditableH1 && h1Count === 1) {
      pass(`${file} has exactly one editable H1`);
    } else if (requiresEditableH1) {
      fail(`${file} must have exactly one editable H1`);
    } else if (h1Count === 0) {
      pass(`${file} has no H1`);
    } else {
      fail(`${file} must not include an H1`);
    }
  }
}

async function validatePostContentWrappers() {
  const layoutNeutralTemplates = [
    'wp-content/themes/supersonic-site-theme/templates/index.html',
    'wp-content/themes/supersonic-site-theme/templates/page.html'
  ];

  for (const file of layoutNeutralTemplates) {
    const content = await readText(file);
    const blocks = collectBlockComments(content);
    const mainGroup = blocks.find((block) =>
      block.name === 'core/group' &&
      block.attrs.tagName === 'main'
    );
    const postContent = blocks.find((block) => block.name === 'core/post-content');

    if (mainGroup?.attrs?.layout?.type === 'constrained') {
      fail(`${file} must not use a constrained main wrapper around section-pattern post content`);
    } else if (!String(mainGroup?.attrs?.className ?? '').split(/\s+/).includes('supersonic-section-page')) {
      fail(`${file} must mark the section-pattern wrapper with supersonic-section-page`);
    } else if (postContent?.attrs?.layout?.type !== 'default') {
      fail(`${file} must keep post-content default/unpadded so section patterns own the 5% gutter`);
    } else {
      pass(`${file} keeps page wrappers from double-applying or offsetting the 5% gutter`);
    }
  }
}

async function validatePluginSecurityPolicy() {
  const deployRole = await readText('wp-content/plugins/supersonic-site-core/includes/class-supersonic-deploy-role.php');
  const deployController = await readText('wp-content/plugins/supersonic-site-core/includes/class-supersonic-deploy-controller.php');
  const roleHasRead = /['"]read['"]\s*=>\s*true/.test(deployRole);
  const roleHasUpdateThemes = /['"]update_themes['"]\s*=>\s*true/.test(deployRole);
  const forbiddenCapabilities = ['manage_options', 'edit_posts', 'upload_files', 'install_plugins', 'update_plugins'];
  const expandedCapability = forbiddenCapabilities.find((capability) =>
    new RegExp(`['"]${capability}['"]\\s*=>\\s*true`).test(deployRole)
  );

  if (roleHasRead && roleHasUpdateThemes && !expandedCapability) {
    pass('deploy role remains limited to read and update_themes');
  } else {
    fail('deploy role should grant only read and update_themes');
  }

  if (/['"]methods['"]\s*=>\s*['"]POST['"]/.test(deployController)) {
    pass('deploy route is POST-only');
  } else {
    fail('deploy route must stay POST-only');
  }

  if (/['"]permission_callback['"]\s*=>\s*array\(\$this,\s*['"]check_permission['"]\)/.test(deployController)) {
    pass('deploy route uses explicit permission callback');
  } else {
    fail('deploy route must use check_permission as its permission callback');
  }

  if (/current_user_can\(\s*['"]update_themes['"]\s*\)/.test(deployController)) {
    pass('deploy route is gated by update_themes');
  } else {
    fail('deploy route must require update_themes');
  }

  if (/['"]args['"]\s*=>\s*array\(\)/.test(deployController) && !/get_(?:json_params|body|param|params)\s*\(/.test(deployController)) {
    pass('deploy route remains payload-free');
  } else {
    fail('deploy route must remain payload-free');
  }
}

function getSectionGroup(blocks) {
  return blocks.find((block) => block.name === 'core/group' && block.attrs.align === 'full') ??
    blocks.find((block) => block.name === 'core/group') ??
    null;
}

function hasHorizontalPadding(attrs) {
  const padding = attrs.style?.spacing?.padding;
  return Boolean(padding && (padding.left !== undefined || padding.right !== undefined));
}

function isLocalSurfaceGroup(block, sectionGroup) {
  if (block.name !== 'core/group' || block === sectionGroup) {
    return false;
  }

  const style = block.attrs.style ?? {};
  return Boolean(
    block.attrs.backgroundColor ||
    block.attrs.gradient ||
    style.color?.background ||
    style.color?.gradient ||
    style.border?.color ||
    style.border?.radius ||
    style.border?.width ||
    style.shadow
  );
}

async function validatePatternHorizontalSpacing() {
  // Patterns own vertical section rhythm only. Horizontal spacing is owned by the
  // theme: every section rides the 5% root gutter and the default content width,
  // unless a section-level content rail is part of an approved editor-control
  // contract.
  const patternFiles = await collectFiles('wp-content/themes/supersonic-site-theme/patterns', ['.php', '.html']);

  for (const file of patternFiles) {
    const content = await readText(file);
    const header = parsePatternHeader(content);
    const { blocks } = collectBlockTree(content);
    const sectionGroup = getSectionGroup(blocks);
    const violations = [];

    for (const block of blocks) {
      const attrs = block.attrs;

      if (
        attrs.align === 'full' &&
        attrs.layout?.contentSize &&
        !hasApprovedSectionContentRail(header, attrs)
      ) {
        violations.push('full-width group sets an unapproved section-level contentSize');
      }

      if (
        block.name === 'core/group' &&
        block !== sectionGroup &&
        attrs.layout?.type === 'constrained' &&
        !attrs.layout?.contentSize
      ) {
        violations.push('nested constrained group has no contentSize and should not imply hidden layout ownership');
      }

      if (
        block.name === 'core/group' &&
        block !== sectionGroup &&
        attrs.layout?.contentSize &&
        attrs.layout.contentSize !== '760px'
      ) {
        violations.push(`nested constrained group uses unapproved contentSize "${attrs.layout.contentSize}"`);
      }

      const padding = attrs.style?.spacing?.padding;
      if (
        attrs.align === 'full' &&
        padding &&
        (padding.left !== undefined || padding.right !== undefined)
      ) {
        violations.push('full-width section sets explicit left/right padding instead of relying on the 5% gutter');
      }

      if (
        block.name === 'core/group' &&
        block !== sectionGroup &&
        hasHorizontalPadding(attrs) &&
        !isLocalSurfaceGroup(block, sectionGroup)
      ) {
        violations.push('plain layout wrapper sets left/right padding instead of relying on the section gutter');
      }
    }

    if (violations.length) {
      for (const violation of violations) {
        fail(`${file}: ${violation}`);
      }
    } else {
      pass(`${file} uses approved horizontal spacing and section rails`);
    }
  }
}

const SECTION_SPACING_TOKEN_RE = /section-(?:none|small|medium|large)/;
// Headers and footers are chrome, not sections; they are exempt from the section rhythm rule.
const NON_SECTION_CATEGORIES = new Set(['supersonic-headers', 'supersonic-footers']);

function sectionSpacingToken(value) {
  if (typeof value !== 'string') {
    return null;
  }
  const match = value.match(SECTION_SPACING_TOKEN_RE);
  return match ? match[0] : null;
}

async function validateSectionSpacingTokens() {
  // SPACE-1: every section pattern must declare exactly one semantic section spacing token
  // (section-none|small|medium|large) on its top-level section block, so stacked sections
  // keep a predictable vertical rhythm instead of accumulating ad-hoc seams. Enforces the
  // DESIGN_SYSTEM.md / theme rule that was previously checked only by eye. The top block is
  // usually a full-width core/group but may be a core/cover (image hero), so the check reads
  // the outermost block's vertical padding rather than assuming a group.
  const patternFiles = await collectFiles('wp-content/themes/supersonic-site-theme/patterns', ['.php', '.html']);

  for (const file of patternFiles) {
    const content = await readText(file);
    const header = parsePatternHeader(content);
    if (NON_SECTION_CATEGORIES.has(header.Categories)) {
      continue;
    }

    const { root } = collectBlockTree(content);
    const top = root.children[0];
    if (!top) {
      fail(`SPACE-1 ${file}: no top-level block to carry a section spacing token`);
      continue;
    }

    const padding = top.attrs.style?.spacing?.padding ?? {};
    const tokens = [];
    let hasArbitraryVerticalPadding = false;
    for (const side of ['top', 'bottom']) {
      if (padding[side] === undefined) {
        continue;
      }
      const token = sectionSpacingToken(padding[side]);
      if (token) {
        tokens.push(token);
      } else {
        // A defined top/bottom value that is not a section-* token is arbitrary vertical
        // spacing (e.g. an l/xl preset or a raw px), which breaks the stacking rhythm.
        hasArbitraryVerticalPadding = true;
      }
    }

    if (tokens.length === 0) {
      fail(`SPACE-1 ${file}: top-level section block declares no section-none|small|medium|large spacing token`);
    } else if (hasArbitraryVerticalPadding) {
      fail(`SPACE-1 ${file}: top-level section block mixes a non-section value into vertical padding; use only section-none|small|medium|large`);
    } else {
      // Asymmetric pairs within the semantic scale (e.g. medium top, small bottom) are an
      // intentional rhythm choice and allowed; only the semantic scale is required.
      pass(`${file} uses semantic section spacing tokens (${[...new Set(tokens)].join(' / ')})`);
    }
  }
}

function isReadableTextBlock(block) {
  return [
    'core/heading',
    'core/list',
    'core/paragraph',
    'core/quote'
  ].includes(block.name);
}

function blockOwnsTextColor(block) {
  return Boolean(block.attrs.textColor || block.attrs.style?.color?.text);
}

function groupOwnsTypography(block) {
  return Boolean(block.attrs.fontSize || block.attrs.style?.typography);
}

function isInsideIgnoredTextContainer(block) {
  return hasAncestor(block, (ancestor) => [
    'core/buttons',
    'core/button',
    'core/navigation',
    'core/navigation-link',
    'core/navigation-submenu',
    'core/site-title',
    'core/site-logo',
    'core/shortcode'
  ].includes(ancestor.name));
}

// Accent-painted label text (eyebrows, kickers, footer column headings) is an
// intentional, token-bound highlight, not a mask over section text controls.
// Only the accent palette slug qualifies; arbitrary colors stay banned.
function isDecorativeAccentText(block) {
  return ['core/paragraph', 'core/heading'].includes(block.name) &&
    block.attrs.textColor === 'accent' &&
    ['small', 'large', 'heading-2', 'heading-3'].includes(block.attrs.fontSize ?? '');
}

// A readable block that paints its own token background (chip, badge, highlight
// strip) owns a self-contained local surface; its paired local text color is
// part of that surface contract and stays correct when the section recolors.
function isSelfOwnedTextSurface(block) {
  return isReadableTextBlock(block) &&
    Boolean(block.attrs.backgroundColor || block.attrs.style?.color?.background);
}

function shouldInheritSectionTextColor(block, sectionGroup) {
  return isReadableTextBlock(block) &&
    !isInsideIgnoredTextContainer(block) &&
    !isDecorativeAccentText(block) &&
    !isSelfOwnedTextSurface(block) &&
    !hasAncestor(block, (ancestor) => isLocalSurfaceGroup(ancestor, sectionGroup));
}

function sectionPromisesTextColor(block) {
  return Boolean(block?.attrs?.textColor || block?.attrs?.style?.color?.text);
}

function isNestedBackgroundPanel(block, sectionGroup) {
  if (block.name !== 'core/group' || block === sectionGroup) {
    return false;
  }

  return Boolean(
    block.attrs.backgroundColor ||
    block.attrs.gradient ||
    block.attrs.style?.color?.background ||
    block.attrs.style?.color?.gradient
  );
}

function hasBorderColorStyle(block) {
  return Boolean(block.attrs.style?.border?.color);
}

function isSupportedJustification(value) {
  return ['left', 'center', 'right'].includes(value);
}

function hasApprovedSectionContentRail(header, attrs) {
  return header.Categories === 'supersonic-heroes' &&
    attrs.layout?.type === 'constrained' &&
    attrs.layout?.contentSize === '760px' &&
    isSupportedJustification(attrs.layout?.justifyContent);
}

function hasSectionOwnedHeroContentRail(blocks) {
  const sectionGroup = blocks.find((block) => block.name === 'core/group' && block.attrs.align === 'full');
  return Boolean(sectionGroup && hasApprovedSectionContentRail({ Categories: 'supersonic-heroes' }, sectionGroup.attrs));
}

function hasInnerConstrainedContentGroup(blocks) {
  return blocks.some((block) =>
    block.name === 'core/group' &&
    block.attrs.align !== 'full' &&
    block.attrs.layout?.type === 'constrained' &&
    block.attrs.layout?.contentSize === '760px'
  );
}

// Split heroes (text column + media column, like a migrated text/image hero)
// position content through the column structure itself: the full-width section
// group stays constrained to the theme container and a top-level core/columns
// row carries the content. That column rail is the approved positioning
// contract for split heroes.
function hasApprovedSplitHeroLayout(blocks) {
  const sectionGroup = blocks.find((block) => block.name === 'core/group' && block.attrs.align === 'full');
  if (!sectionGroup || sectionGroup.attrs.layout?.type !== 'constrained') {
    return false;
  }
  return blocks.some((block) => block.name === 'core/columns');
}

async function validateEditorControlContracts() {
  const patternFiles = await collectFiles('wp-content/themes/supersonic-site-theme/patterns', ['.php', '.html']);
  let colorContractViolations = 0;

  for (const file of patternFiles) {
    const content = await readText(file);
    const header = parsePatternHeader(content);
    const { blocks } = collectBlockTree(content);

    if (header.Categories === 'supersonic-heroes') {
      const sectionOwnsRail = hasSectionOwnedHeroContentRail(blocks);
      const hasInnerRail = hasInnerConstrainedContentGroup(blocks);
      const isSimpleHero = header.Slug === 'supersonic-site-theme/hero-simple';

      if (isSimpleHero && sectionOwnsRail && !hasInnerRail) {
        pass(`${file} lets the selected hero section own its 760px justification rail`);
      } else if (isSimpleHero && !sectionOwnsRail) {
        fail(`${file} must let the selected section group own a 760px contentSize and left/center/right justifyContent`);
      } else if (isSimpleHero) {
        fail(`${file} must not add a nested 760px content group that masks section justification`);
      } else if (sectionOwnsRail || hasInnerRail) {
        pass(`${file} has an approved hero content rail for visible positioning`);
      } else if (hasApprovedSplitHeroLayout(blocks)) {
        pass(`${file} positions hero content through an approved split-hero column rail`);
      } else {
        fail(`${file} must include an approved hero content rail so positioning is visible`);
      }
    }

    const groupTypographyBlocks = blocks.filter((block) => block.name === 'core/group' && groupOwnsTypography(block));
    for (const block of groupTypographyBlocks) {
      fail(`${file} sets typography on a group; typography must be owned by heading, paragraph, quote, or list blocks`);
    }

    const sectionGroup = getSectionGroup(blocks);
    const nestedBackgroundPanels = blocks.filter((block) =>
      isNestedBackgroundPanel(block, sectionGroup) &&
      hasDescendant(block, isReadableTextBlock) &&
      !sectionPromisesTextColor(block)
    );
    for (const block of nestedBackgroundPanels) {
      fail(`${file} uses a nested background card/panel without explicit readable text color`);
    }

    const borderColorTextPanels = blocks.filter((block) =>
      isNestedBackgroundPanel(block, sectionGroup) &&
      hasBorderColorStyle(block) &&
      hasDescendant(block, isReadableTextBlock)
    );
    for (const block of borderColorTextPanels) {
      fail(`${file} combines border color and readable background-panel text on the same group; use an outer border wrapper and inner text panel`);
    }

    const readableSectionBlocks = blocks.filter((block) => shouldInheritSectionTextColor(block, sectionGroup));
    const locallyColoredReadableBlocks = readableSectionBlocks.filter(blockOwnsTextColor);

    if (locallyColoredReadableBlocks.length > 0) {
      colorContractViolations += locallyColoredReadableBlocks.length;
      fail(`${file} sets local text color on normal readable section copy, masking section text color controls`);
    }

    if (sectionPromisesTextColor(sectionGroup)) {
      const readableTextBlocks = readableSectionBlocks;
      const allReadableTextOverridesSectionColor = readableTextBlocks.length > 0 &&
        readableTextBlocks.every(blockOwnsTextColor);

      if (allReadableTextOverridesSectionColor) {
        colorContractViolations += 1;
        fail(`${file} sets section text color but every readable text block overrides it`);
      }
    }
  }

  if (colorContractViolations === 0) {
    pass('Readable section text can inherit section text color controls');
  }
}

async function validateCategoryContracts() {
  const patternFiles = await collectFiles('wp-content/themes/supersonic-site-theme/patterns', ['.php', '.html']);

  for (const file of patternFiles) {
    const content = await readText(file);
    const header = parsePatternHeader(content);
    const { blocks } = collectBlockTree(content);
    const sectionGroup = getSectionGroup(blocks);
    const slug = header.Slug ?? '';
    const category = header.Categories ?? '';
    const violations = [];

    const needsNativeMediaSlot = category === 'supersonic-media' || slug.endsWith('/contact-map-info');
    if (needsNativeMediaSlot) {
      const wrapperOwnedMedia = blocks.filter((block) =>
        block.name === 'core/group' &&
        block.attrs.style?.dimensions?.minHeight &&
        hasDescendant(block, (child) => child.name === 'core/image')
      );
      const imageBlocks = blocks.filter((block) => block.name === 'core/image');

      if (wrapperOwnedMedia.length > 0) {
        violations.push('media slot is owned by a styled wrapper group instead of the native image block');
      }

      if (imageBlocks.length === 0) {
        violations.push('media pattern must expose a native image block for replacement and alt text');
      } else if (!content.includes('assets/images/pattern-placeholder.svg') && !imageBlocks.some((block) => block.attrs.url)) {
        violations.push('media image block should render a theme-owned placeholder or define a real image URL');
      }
    }

    if (slug.endsWith('/header-simple')) {
      if (!blocks.some((block) => block.name === 'core/site-title')) {
        violations.push('header pattern must include a site-title fallback beside the site-logo');
      }
    }

    if (slug.endsWith('/section-faq-rankmath')) {
      const faqBlock = blocks.find((block) => block.name === 'rank-math/faq-block');
      if (content.includes('wp:spacer')) {
        violations.push('FAQ section must use section padding instead of a trailing spacer for rhythm');
      }
      if (!faqBlock) {
        violations.push('FAQ pattern must use the approved Rank Math FAQ block');
      } else if (!hasAncestor(faqBlock, (ancestor) => ancestor === sectionGroup)) {
        violations.push('Rank Math FAQ block must live inside the section group and its 760px content rail');
      }
    }

    if (slug.endsWith('/section-testimonial')) {
      if (blocks.filter((block) => block.name === 'core/quote').length < 1) {
        violations.push('testimonial section must preserve quote semantics with a core/quote block');
      }
      if (sectionGroup?.attrs.backgroundColor === 'contrast' && !sectionPromisesTextColor(sectionGroup)) {
        violations.push('dark testimonial section must set readable text color on the section group');
      }
    }

    if (slug.endsWith('/section-testimonial-grid') && blocks.filter((block) => block.name === 'core/quote').length < 3) {
      violations.push('testimonial grid must preserve quote semantics for each testimonial card');
    }

    if (slug.endsWith('/section-icon-list') && !blocks.some((block) => block.name === 'core/list')) {
      violations.push('icon/list pattern must use a native list block for benefit semantics');
    }

    if (slug.endsWith('/section-service-cards') && blocks.filter((block) => block.name === 'core/button').length < 3) {
      violations.push('service card CTAs must use button blocks for accessible tap targets');
    }

    if (slug.endsWith('/cta-band') && !sectionPromisesTextColor(sectionGroup)) {
      violations.push('CTA band must set readable text color on the colored section group instead of every text child');
    }

    if (slug.endsWith('/cta-split')) {
      const contrastPanels = blocks.filter((block) => block.name === 'core/group' && block.attrs.backgroundColor === 'contrast');
      if (!contrastPanels.some(sectionPromisesTextColor)) {
        violations.push('dark CTA panel must set readable text color on the panel group instead of every text child');
      }
    }

    if (violations.length) {
      for (const violation of violations) {
        fail(`${file}: ${violation}`);
      }
    } else {
      pass(`${file} satisfies static category contract checks`);
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
        'supersonic-site-theme/assets/css/patterns.css',
        'supersonic-site-theme/assets/css/navigation.css',
        'supersonic-site-theme/assets/images/pattern-placeholder.svg',
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
    const deniedNames = new Set(['.git', '.github', '.gitkeep', '.DS_Store', 'Thumbs.db', 'AGENTS.md', 'CLAUDE.md']);
    const hasRepoOnlyFiles = entries.some((entry) =>
      entry.split('/').some((part) => deniedNames.has(part))
    );

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
await validateJsonFile('data/pattern-certifications.json');
await validateJsonFile('data/review-finding.schema.json');
await validateVersionMetadata();
await validatePackageScripts();
await validateHeaders();
await validateSourceGuardrails();
await validateBlockAllowList();
await validateCssGuardrails();
await validatePatternLibraryPolicy();
await validateH1Policy();
await validatePostContentWrappers();
await validatePluginSecurityPolicy();
await validatePatternHorizontalSpacing();
await validateSectionSpacingTokens();
await validateEditorControlContracts();
await validateCategoryContracts();
await validatePatternRegistryChecks();
await validateCertificationProofReports();
await validatePackages();

for (const check of checks) {
  const icon = check.status === 'pass' ? 'PASS' : 'FAIL';
  console.log(`${icon}: ${check.message}`);
}

if (checks.some((check) => check.status === 'fail')) {
  process.exit(1);
}
