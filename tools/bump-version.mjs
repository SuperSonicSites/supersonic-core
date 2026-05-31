import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

/*
 * Bump the framework version in lockstep across the theme, the plugin, and
 * package.json. The GitHub Actions release workflow calls this so a release tag
 * always matches the version baked into the shipped theme/plugin headers.
 *
 * Usage:
 *   node tools/bump-version.mjs 0.1.7
 *   node tools/bump-version.mjs --check        (verify all three already match)
 */

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

const THEME_STYLE = 'wp-content/themes/supersonic-site-theme/style.css';
const PLUGIN_PHP = 'wp-content/plugins/supersonic-site-core/plugin.php';
const PACKAGE_JSON = 'package.json';

const SEMVER = /^\d+\.\d+\.\d+$/;

async function readText(rel) {
  return readFile(path.join(root, rel), 'utf8');
}

async function writeText(rel, content) {
  await writeFile(path.join(root, rel), content);
}

function readHeaderVersion(content) {
  // Matches "Version: 0.1.6" in a theme style.css or plugin header block.
  return content.match(/^\s*(?:\*\s*)?Version:\s*(.+?)\s*$/m)?.[1] ?? null;
}

function bumpHeaderVersion(content, version) {
  return content.replace(
    /^(\s*(?:\*\s*)?Version:\s*).+?(\s*)$/m,
    (_match, prefix, suffix) => `${prefix}${version}${suffix}`
  );
}

function readPackageVersion(content) {
  return JSON.parse(content).version ?? null;
}

function bumpPackageVersion(content, version) {
  // Preserve formatting/indentation by editing only the version line.
  return content.replace(
    /("version":\s*")[^"]+(")/,
    (_match, prefix, suffix) => `${prefix}${version}${suffix}`
  );
}

async function currentVersions() {
  const [theme, plugin, pkg] = await Promise.all([
    readText(THEME_STYLE),
    readText(PLUGIN_PHP),
    readText(PACKAGE_JSON)
  ]);

  return {
    theme: readHeaderVersion(theme),
    plugin: readHeaderVersion(plugin),
    package: readPackageVersion(pkg)
  };
}

async function check() {
  const versions = await currentVersions();
  const unique = new Set(Object.values(versions));

  console.log(`theme:   ${versions.theme}`);
  console.log(`plugin:  ${versions.plugin}`);
  console.log(`package: ${versions.package}`);

  if (unique.size !== 1) {
    console.error('Version mismatch: theme, plugin, and package.json must match.');
    process.exit(1);
  }

  if (!SEMVER.test([...unique][0])) {
    console.error(`Version "${[...unique][0]}" is not semver (X.Y.Z).`);
    process.exit(1);
  }

  console.log(`OK: all sources at ${[...unique][0]}`);
}

async function bump(version) {
  if (!SEMVER.test(version)) {
    console.error(`Provide a semver version (X.Y.Z). Got: "${version}"`);
    process.exit(1);
  }

  const [theme, plugin, pkg] = await Promise.all([
    readText(THEME_STYLE),
    readText(PLUGIN_PHP),
    readText(PACKAGE_JSON)
  ]);

  await Promise.all([
    writeText(THEME_STYLE, bumpHeaderVersion(theme, version)),
    writeText(PLUGIN_PHP, bumpHeaderVersion(plugin, version)),
    writeText(PACKAGE_JSON, bumpPackageVersion(pkg, version))
  ]);

  console.log(`Bumped theme, plugin, and package.json to ${version}`);
}

const arg = process.argv[2];

if (!arg) {
  console.error('Usage: node tools/bump-version.mjs <X.Y.Z> | --check');
  process.exit(1);
}

if (arg === '--check') {
  await check();
} else {
  await bump(arg);
}
