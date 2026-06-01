import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

/*
 * Bump release metadata without pretending every release ships every asset.
 *
 * Usage:
 *   node tools/bump-version.mjs 0.1.15           (theme release: theme + package files)
 *   node tools/bump-version.mjs 0.1.15 --plugin  (plugin release: plugin header + constant)
 *   node tools/bump-version.mjs --check          (verify metadata coherence)
 */

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

const THEME_STYLE = 'wp-content/themes/supersonic-site-theme/style.css';
const PLUGIN_PHP = 'wp-content/plugins/supersonic-site-core/plugin.php';
const PACKAGE_JSON = 'package.json';
const PACKAGE_LOCK_JSON = 'package-lock.json';

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
  const parsed = JSON.parse(content);
  parsed.version = version;
  if (parsed.packages?.['']) {
    parsed.packages[''].version = version;
  }
  return `${JSON.stringify(parsed, null, 2)}\n`;
}

function readPluginConstant(content) {
  return content.match(/define\(\s*['"]SUPERSONIC_SITE_CORE_VERSION['"]\s*,\s*['"]([^'"]+)['"]\s*\)/)?.[1] ?? null;
}

function bumpPluginConstant(content, version) {
  return content.replace(
    /(define\(\s*['"]SUPERSONIC_SITE_CORE_VERSION['"]\s*,\s*['"])[^'"]+(['"]\s*\);)/,
    (_match, prefix, suffix) => `${prefix}${version}${suffix}`
  );
}

async function currentVersions() {
  const [theme, plugin, pkg, lock] = await Promise.all([
    readText(THEME_STYLE),
    readText(PLUGIN_PHP),
    readText(PACKAGE_JSON),
    readText(PACKAGE_LOCK_JSON)
  ]);
  const parsedLock = JSON.parse(lock);

  return {
    theme: readHeaderVersion(theme),
    plugin: readHeaderVersion(plugin),
    pluginConstant: readPluginConstant(plugin),
    package: readPackageVersion(pkg),
    packageLock: parsedLock.version ?? null,
    packageLockRoot: parsedLock.packages?.['']?.version ?? null
  };
}

async function check() {
  const versions = await currentVersions();

  console.log(`theme:          ${versions.theme}`);
  console.log(`plugin header:  ${versions.plugin}`);
  console.log(`plugin const:   ${versions.pluginConstant}`);
  console.log(`package:        ${versions.package}`);
  console.log(`package-lock:   ${versions.packageLock}`);
  console.log(`lock root:      ${versions.packageLockRoot}`);

  const allVersions = Object.values(versions);
  const invalid = allVersions.find((version) => !SEMVER.test(version ?? ''));
  if (invalid) {
    console.error(`Version "${invalid}" is not semver (X.Y.Z).`);
    process.exit(1);
  }

  if (versions.theme !== versions.package) {
    console.error('Version mismatch: theme style.css must match package.json.');
    process.exit(1);
  }

  if (versions.packageLock !== versions.package || versions.packageLockRoot !== versions.package) {
    console.error('Version mismatch: package-lock.json root versions must match package.json.');
    process.exit(1);
  }

  if (versions.plugin !== versions.pluginConstant) {
    console.error('Version mismatch: plugin header must match SUPERSONIC_SITE_CORE_VERSION.');
    process.exit(1);
  }

  console.log('OK: release metadata is coherent');
}

async function bumpTheme(version) {
  if (!SEMVER.test(version)) {
    console.error(`Provide a semver version (X.Y.Z). Got: "${version}"`);
    process.exit(1);
  }

  const [theme, pkg, lock] = await Promise.all([
    readText(THEME_STYLE),
    readText(PACKAGE_JSON),
    readText(PACKAGE_LOCK_JSON)
  ]);

  await Promise.all([
    writeText(THEME_STYLE, bumpHeaderVersion(theme, version)),
    writeText(PACKAGE_JSON, bumpPackageVersion(pkg, version)),
    writeText(PACKAGE_LOCK_JSON, bumpPackageVersion(lock, version))
  ]);

  console.log(`Bumped theme, package.json, and package-lock.json to ${version}`);
}

async function bumpPlugin(version) {
  if (!SEMVER.test(version)) {
    console.error(`Provide a semver version (X.Y.Z). Got: "${version}"`);
    process.exit(1);
  }

  const plugin = await readText(PLUGIN_PHP);
  await writeText(PLUGIN_PHP, bumpPluginConstant(bumpHeaderVersion(plugin, version), version));
  console.log(`Bumped plugin header and SUPERSONIC_SITE_CORE_VERSION to ${version}`);
}

const arg = process.argv[2];
const flags = process.argv.slice(3);

if (!arg) {
  console.error('Usage: node tools/bump-version.mjs <X.Y.Z> [--plugin] | --check');
  process.exit(1);
}

if (arg === '--check') {
  await check();
} else if (flags.includes('--plugin')) {
  await bumpPlugin(arg);
} else {
  await bumpTheme(arg);
}
