import { copyFile, mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import crypto from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, '..');

const sourcePosts = path.join(repoRoot, 'obsidian', 'posts');
const sourceAssets = path.join(repoRoot, 'obsidian', 'assets');
const targetPosts = path.join(repoRoot, 'src', 'content', 'blog-zh');
const targetAssets = path.join(targetPosts, 'assets');

function assertWithinRepo(targetPath) {
  const fullPath = path.resolve(targetPath);
  const fullRoot = path.resolve(repoRoot);
  if (!fullPath.toLowerCase().startsWith(fullRoot.toLowerCase())) {
    throw new Error(`Refusing to operate outside repository: ${fullPath}`);
  }
}

function convertObsidianEmbeds(markdown) {
  return markdown.replace(/!\[\[([^\]|]+)(?:\|[^\]]+)?\]\]/g, (_match, fileName) => {
    const cleanName = String(fileName).trim();
    return `![${cleanName}](assets/${encodeURI(cleanName)})`;
  });
}

function normalizeMarkdown(markdown) {
  const withoutBom = markdown.replace(/^\uFEFF/, '');
  const lines = withoutBom.split(/\r?\n/);
  const nonEmptyLines = lines.filter((line) => line.trim().length > 0);
  const minIndent = nonEmptyLines.reduce((currentMin, line) => {
    const indent = line.match(/^[ \t]*/)?.[0].length ?? 0;
    return Math.min(currentMin, indent);
  }, Number.POSITIVE_INFINITY);

  if (!Number.isFinite(minIndent) || minIndent === 0) {
    return withoutBom;
  }

  return lines.map((line) => line.slice(minIndent)).join('\n');
}

function splitFrontmatter(markdown) {
  const match = markdown.match(/^---\s*\n([\s\S]*?)\n---\s*(?:\n|$)([\s\S]*)$/);
  if (!match) {
    return { data: {}, body: markdown };
  }

  return {
    data: parseSimpleYaml(match[1]),
    body: match[2] ?? '',
  };
}

function parseSimpleYaml(yaml) {
  const data = {};
  const lines = yaml.split(/\r?\n/);
  let index = 0;

  while (index < lines.length) {
    const line = lines[index];
    const match = line.match(/^([A-Za-z0-9_-]+):\s*(.*)$/);
    if (!match) {
      index += 1;
      continue;
    }

    const [, key, rawValue] = match;
    const trimmed = rawValue.trim();

    if (trimmed === '') {
      const values = [];
      index += 1;
      while (index < lines.length) {
        const item = lines[index].match(/^\s*-\s*(.*)$/);
        if (!item) break;
        values.push(unquote(item[1].trim()));
        index += 1;
      }
      data[key] = values;
      continue;
    }

    if (trimmed === 'true') {
      data[key] = true;
    } else if (trimmed === 'false') {
      data[key] = false;
    } else if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
      data[key] = trimmed
        .slice(1, -1)
        .split(',')
        .map((value) => unquote(value.trim()))
        .filter(Boolean);
    } else {
      data[key] = unquote(trimmed);
    }

    index += 1;
  }

  return data;
}

function unquote(value) {
  return value.replace(/^['"]|['"]$/g, '');
}

function cleanInlineMarkdown(text) {
  return text
    .replace(/!\[[^\]]*]\([^)]+\)/g, '')
    .replace(/\[([^\]]+)]\([^)]+\)/g, '$1')
    .replace(/[`*_~>#-]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function extractTitle(body, fallbackTitle) {
  const heading = body.match(/^#\s+(.+)$/m);
  return cleanInlineMarkdown(heading?.[1] ?? fallbackTitle).trim() || fallbackTitle;
}

function extractDescription(body) {
  const paragraph = body
    .split(/\n\s*\n/)
    .map((block) => block.trim())
    .find((block) => block && !block.startsWith('#') && !block.startsWith('```') && !block.startsWith('|'));

  return cleanInlineMarkdown(paragraph ?? '').slice(0, 140);
}

function createStableSlug(relativePath) {
  const hash = crypto
    .createHash('sha1')
    .update(relativePath.replaceAll(path.sep, '/'))
    .digest('hex')
    .slice(0, 8);

  return `note-${hash}`;
}

function yamlString(value) {
  return JSON.stringify(String(value));
}

async function emptyDirectory(directory) {
  if (!existsSync(directory)) {
    await mkdir(directory, { recursive: true });
    return;
  }

  const entries = await readdir(directory, { withFileTypes: true });
  await Promise.all(
    entries
      .filter((entry) => entry.name !== '.gitkeep')
      .map((entry) => rm(path.join(directory, entry.name), { recursive: true, force: true })),
  );
}

async function buildPublishedPost(entry, index) {
  const sourcePath = path.join(sourcePosts, entry.name);
  const relativePath = path.relative(sourcePosts, sourcePath);
  const markdown = normalizeMarkdown(await readFile(sourcePath, 'utf8'));
  const converted = convertObsidianEmbeds(markdown);
  const { data, body } = splitFrontmatter(converted);

  if (data.draft === true) {
    return null;
  }

  const fileTitle = path.basename(entry.name, path.extname(entry.name));
  const title = data.title ? String(data.title) : extractTitle(body, fileTitle);
  const description = data.description ? String(data.description) : extractDescription(body);
  const slug = data.slug ? String(data.slug) : createStableSlug(relativePath);

  return {
    fileName: `${slug}.md`,
    content: [
      '---',
      `title: ${yamlString(title)}`,
      `description: ${yamlString(description)}`,
      `slug: ${yamlString(slug)}`,
      `order: ${index}`,
      '---',
      '',
      body.trimStart(),
    ].join('\n'),
  };
}

assertWithinRepo(targetPosts);
assertWithinRepo(targetAssets);

await mkdir(sourcePosts, { recursive: true });
await mkdir(sourceAssets, { recursive: true });
await mkdir(targetPosts, { recursive: true });
await mkdir(targetAssets, { recursive: true });

const targetEntries = await readdir(targetPosts, { withFileTypes: true });
await Promise.all(
  targetEntries
    .filter((entry) => entry.isFile() && entry.name.endsWith('.md'))
    .map((entry) => rm(path.join(targetPosts, entry.name), { force: true })),
);

await emptyDirectory(targetAssets);

const posts = await readdir(sourcePosts, { withFileTypes: true });
const publishedPosts = await Promise.all(
  posts
    .filter((entry) => entry.isFile() && entry.name.endsWith('.md'))
    .sort((a, b) => a.name.localeCompare(b.name, 'zh-CN'))
    .map((entry, index) => buildPublishedPost(entry, index)),
);

await Promise.all(
  publishedPosts.filter(Boolean).map((post) => {
    const targetPath = path.join(targetPosts, post.fileName);
    return writeFile(targetPath, post.content, 'utf8');
  }),
);

const assets = await readdir(sourceAssets, { withFileTypes: true });
await Promise.all(
  assets
    .filter((entry) => entry.isFile() && entry.name !== '.gitkeep')
    .map((entry) => copyFile(path.join(sourceAssets, entry.name), path.join(targetAssets, entry.name))),
);

console.log('Published Obsidian posts to src/content/blog-zh.');
