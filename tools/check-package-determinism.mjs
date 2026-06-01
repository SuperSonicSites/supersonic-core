import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { execFile } from 'node:child_process';
import path from 'node:path';
import { promisify } from 'node:util';
import { fileURLToPath } from 'node:url';

const execFileAsync = promisify(execFile);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const packageScript = path.join(root, 'tools', 'package-wordpress-assets.mjs');

const packages = [
  {
    file: 'packages/supersonic-site-theme.zip',
    required: [
      'supersonic-site-theme/',
      'supersonic-site-theme/style.css',
      'supersonic-site-theme/theme.json',
      'supersonic-site-theme/functions.php',
      'supersonic-site-theme/templates/index.html',
      'supersonic-site-theme/templates/page.html'
    ]
  },
  {
    file: 'packages/supersonic-site-core.zip',
    required: [
      'supersonic-site-core/',
      'supersonic-site-core/plugin.php'
    ]
  }
];

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

async function buildAndHash() {
  await execFileAsync(process.execPath, [packageScript], { cwd: root });
  const hashes = {};

  for (const spec of packages) {
    const buffer = await readFile(path.join(root, spec.file));
    hashes[spec.file] = createHash('sha256').update(buffer).digest('hex');
  }

  return hashes;
}

const first = await buildAndHash();
const second = await buildAndHash();

for (const spec of packages) {
  if (first[spec.file] !== second[spec.file]) {
    console.error(`FAIL: ${spec.file} is not deterministic across two builds`);
    console.error(`first:  ${first[spec.file]}`);
    console.error(`second: ${second[spec.file]}`);
    process.exit(1);
  }

  const entries = listZipEntries(await readFile(path.join(root, spec.file)));
  for (const required of spec.required) {
    if (!entries.includes(required)) {
      console.error(`FAIL: ${spec.file} missing ${required}`);
      process.exit(1);
    }
  }

  console.log(`PASS: ${spec.file} deterministic (${first[spec.file]})`);
}
