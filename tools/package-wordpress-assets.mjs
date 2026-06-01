import { deflateRawSync } from 'node:zlib';
import { mkdir, readdir, readFile, rm, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const outputDir = path.join(root, 'packages');
const themeSlug = 'supersonic-site-theme';
const pluginSlug = 'supersonic-site-core';
const stableMtime = new Date(Date.UTC(2024, 0, 1, 0, 0, 0));
const excludedNames = new Set([
  '.git',
  '.github',
  '.gitkeep',
  '.DS_Store',
  'Thumbs.db',
  'AGENTS.md',
  'CLAUDE.md'
]);

const packages = [
  {
    slug: themeSlug,
    source: path.join(root, 'wp-content', 'themes', themeSlug),
    output: path.join(outputDir, `${themeSlug}.zip`)
  },
  {
    slug: pluginSlug,
    source: path.join(root, 'wp-content', 'plugins', pluginSlug),
    output: path.join(outputDir, `${pluginSlug}.zip`)
  }
];

const crcTable = new Uint32Array(256);
for (let i = 0; i < 256; i += 1) {
  let c = i;
  for (let k = 0; k < 8; k += 1) {
    c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  }
  crcTable[i] = c >>> 0;
}

function crc32(buffer) {
  let crc = 0xffffffff;
  for (const byte of buffer) {
    crc = crcTable[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function dosDateTime(date) {
  const year = Math.max(date.getUTCFullYear(), 1980);
  const dosTime =
    (date.getUTCHours() << 11) |
    (date.getUTCMinutes() << 5) |
    Math.floor(date.getUTCSeconds() / 2);
  const dosDate =
    ((year - 1980) << 9) |
    ((date.getUTCMonth() + 1) << 5) |
    date.getUTCDate();

  return { dosDate, dosTime };
}

function writeUInt16(value) {
  const buffer = Buffer.alloc(2);
  buffer.writeUInt16LE(value);
  return buffer;
}

function writeUInt32(value) {
  const buffer = Buffer.alloc(4);
  buffer.writeUInt32LE(value >>> 0);
  return buffer;
}

function shouldExclude(name) {
  return excludedNames.has(name);
}

async function collectEntries(sourceDir, rootName) {
  const entries = [{ name: `${rootName}/`, type: 'dir', mtime: stableMtime }];

  async function walk(currentDir, relativeDir = '') {
    const children = (await readdir(currentDir, { withFileTypes: true }))
      .sort((a, b) => a.name.localeCompare(b.name));

    for (const child of children) {
      if (shouldExclude(child.name)) {
        continue;
      }

      const absolutePath = path.join(currentDir, child.name);
      const relativePath = path.posix.join(rootName, relativeDir.split(path.sep).join('/'), child.name);

      if (child.isDirectory()) {
        entries.push({ name: `${relativePath}/`, type: 'dir', mtime: stableMtime });
        await walk(absolutePath, path.join(relativeDir, child.name));
      } else if (child.isFile()) {
        entries.push({
          name: relativePath,
          type: 'file',
          mtime: stableMtime,
          content: await readFile(absolutePath)
        });
      }
    }
  }

  await walk(sourceDir);
  return entries;
}

function buildZip(entries) {
  const localParts = [];
  const centralParts = [];
  let offset = 0;

  for (const entry of entries) {
    const nameBuffer = Buffer.from(entry.name, 'utf8');
    const isDirectory = entry.type === 'dir';
    const content = isDirectory ? Buffer.alloc(0) : entry.content;
    const compressed = isDirectory ? Buffer.alloc(0) : deflateRawSync(content);
    const crc = isDirectory ? 0 : crc32(content);
    const method = isDirectory ? 0 : 8;
    const { dosDate, dosTime } = dosDateTime(entry.mtime);

    const localHeader = Buffer.concat([
      writeUInt32(0x04034b50),
      writeUInt16(20),
      writeUInt16(0x0800),
      writeUInt16(method),
      writeUInt16(dosTime),
      writeUInt16(dosDate),
      writeUInt32(crc),
      writeUInt32(compressed.length),
      writeUInt32(content.length),
      writeUInt16(nameBuffer.length),
      writeUInt16(0),
      nameBuffer
    ]);

    localParts.push(localHeader, compressed);

    const externalAttributes = isDirectory ? 0x10 : 0;
    const centralHeader = Buffer.concat([
      writeUInt32(0x02014b50),
      writeUInt16(20),
      writeUInt16(20),
      writeUInt16(0x0800),
      writeUInt16(method),
      writeUInt16(dosTime),
      writeUInt16(dosDate),
      writeUInt32(crc),
      writeUInt32(compressed.length),
      writeUInt32(content.length),
      writeUInt16(nameBuffer.length),
      writeUInt16(0),
      writeUInt16(0),
      writeUInt16(0),
      writeUInt16(0),
      writeUInt32(externalAttributes),
      writeUInt32(offset),
      nameBuffer
    ]);

    centralParts.push(centralHeader);
    offset += localHeader.length + compressed.length;
  }

  const centralDirectory = Buffer.concat(centralParts);
  const endRecord = Buffer.concat([
    writeUInt32(0x06054b50),
    writeUInt16(0),
    writeUInt16(0),
    writeUInt16(entries.length),
    writeUInt16(entries.length),
    writeUInt32(centralDirectory.length),
    writeUInt32(offset),
    writeUInt16(0)
  ]);

  return Buffer.concat([...localParts, centralDirectory, endRecord]);
}

async function packageAsset({ slug, source, output }) {
  await stat(source);
  const entries = await collectEntries(source, slug);
  const archive = buildZip(entries);
  await writeFile(output, archive);
  console.log(`Created ${path.relative(root, output)}`);
}

await mkdir(outputDir, { recursive: true });
await rm(path.join(outputDir, '.tmp'), { recursive: true, force: true });

for (const packageConfig of packages) {
  await packageAsset(packageConfig);
}
