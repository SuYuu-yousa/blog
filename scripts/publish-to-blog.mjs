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
const postSections = [
  { sourceDir: 'agent', routeDir: 'agent' },
  { sourceDir: '\u524d\u7aef', routeDir: 'frontend' },
];

function assertWithinRepo(targetPath) {
  const fullPath = path.resolve(targetPath);
  const fullRoot = path.resolve(repoRoot);
  if (!fullPath.toLowerCase().startsWith(fullRoot.toLowerCase())) {
    throw new Error(`Refusing to operate outside repository: ${fullPath}`);
  }
}

function isExternalAssetUrl(url) {
  return /^(?:[a-z][a-z0-9+.-]*:|\/\/|#)/i.test(url);
}

function encodeAssetFileName(fileName) {
  return encodeURI(fileName).replace(/[?#]/g, (char) => encodeURIComponent(char));
}

function normalizeLocalImageUrl(rawUrl, assetBasePath) {
  const trimmed = String(rawUrl).trim();
  const quoted = trimmed.match(/^(['"])(.*)\1(?:\s+.*)?$/);
  const url = quoted ? quoted[2].trim() : trimmed.split(/\s+["'].*["']\s*$/)[0].trim();

  if (!url || isExternalAssetUrl(url) || url.startsWith('/')) {
    return null;
  }

  const [pathPart, suffix = ''] = url.split(/([?#].*)/, 2);
  let decodedPath;

  try {
    decodedPath = decodeURI(pathPart);
  } catch {
    decodedPath = pathPart;
  }

  const fileName = path.basename(decodedPath.replaceAll('\\', '/'));
  if (!fileName) {
    return null;
  }

  return `${assetBasePath}/${encodeAssetFileName(fileName)}${suffix}`;
}

function rewriteImageLinks(markdown, assetBasePath) {
  const rewriteSegment = (segment) => segment
    .replace(/!\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g, (_match, fileName, altText) => {
      const cleanName = String(fileName).trim();
      const cleanAlt = String(altText ?? cleanName).trim();
      return `![${cleanAlt}](${assetBasePath}/${encodeAssetFileName(path.basename(cleanName.replaceAll('\\', '/')))})`;
    })
    .replace(/!\[([^\]]*)\]\(([^)\n]+)\)/g, (match, altText, rawUrl) => {
      const normalized = normalizeLocalImageUrl(rawUrl, assetBasePath);
      return normalized ? `![${altText}](${normalized})` : match;
    });

  const lines = markdown.split(/(\r?\n)/);
  let inFence = false;
  let current = '';
  let output = '';

  for (const token of lines) {
    if (token === '\n' || token === '\r\n') {
      current += token;
      continue;
    }

    const fence = token.match(/^\s*(```|~~~)/);
    if (fence) {
      output += inFence ? current : rewriteSegment(current);
      current = token;
      inFence = !inFence;
      continue;
    }

    current += token;
  }

  output += inFence ? current : rewriteSegment(current);
  return output;
}

function convertObsidianEmbeds(markdown, assetBasePath) {
  return rewriteImageLinks(markdown, assetBasePath);
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

function extractDescription(body) {
  const paragraph = body
    .split(/\n\s*\n/)
    .map((block) => block.trim())
    .find((block) => block && !block.startsWith('#') && !block.startsWith('```') && !block.startsWith('|'));

  return cleanInlineMarkdown(paragraph ?? '').slice(0, 140);
}

function yamlString(value) {
  return JSON.stringify(String(value));
}

function createRouteId(routeDir, fileName) {
  return crypto
    .createHash('sha1')
    .update(`${routeDir}/${String(fileName).normalize('NFKC').trim().toLowerCase()}`)
    .digest('hex')
    .slice(0, 8);
}

async function getSourcePosts() {
  const sectionEntries = await Promise.all(
    postSections.map(async (section) => {
      const directory = path.join(sourcePosts, section.sourceDir);

      if (!existsSync(directory)) {
        await mkdir(directory, { recursive: true });
        return [];
      }

      const entries = await readdir(directory, { withFileTypes: true });
      return entries
        .filter((entry) => entry.isFile() && entry.name.endsWith('.md'))
        .map((entry) => ({
          name: entry.name,
          sourcePath: path.join(directory, entry.name),
          routeDir: section.routeDir,
        }));
    }),
  );

  return sectionEntries
    .flat()
    .sort((a, b) => `${a.routeDir}/${a.name}`.localeCompare(`${b.routeDir}/${b.name}`, 'zh-CN'));
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
  const id = createRouteId(entry.routeDir, entry.name);
  const markdown = normalizeMarkdown(await readFile(entry.sourcePath, 'utf8'));
  const assetBasePath = '../assets';
  const converted = convertObsidianEmbeds(markdown, assetBasePath);
  const { data, body } = splitFrontmatter(converted);

  if (data.draft === true) {
    return null;
  }

  const fileTitle = path.basename(entry.name, path.extname(entry.name));
  const title = data.title ? String(data.title) : fileTitle;
  const description = data.description ? String(data.description) : extractDescription(body);

  return {
    fileName: path.join(entry.routeDir, `${id}.md`),
    content: [
      '---',
      `title: ${yamlString(title)}`,
      `description: ${yamlString(description)}`,
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
    .filter((entry) => entry.name !== '.gitkeep' && entry.name !== 'assets')
    .map((entry) => rm(path.join(targetPosts, entry.name), { recursive: true, force: true })),
);

await emptyDirectory(targetAssets);

const posts = await getSourcePosts();
const publishedPosts = await Promise.all(
  posts
    .map((entry, index) => buildPublishedPost(entry, index)),
);

await Promise.all(
  publishedPosts.filter(Boolean).map((post) => {
    const targetPath = path.join(targetPosts, post.fileName);
    return mkdir(path.dirname(targetPath), { recursive: true }).then(() => writeFile(targetPath, post.content, 'utf8'));
  }),
);

const assets = await readdir(sourceAssets, { withFileTypes: true });
await Promise.all(
  assets
    .filter((entry) => entry.isFile() && entry.name !== '.gitkeep')
    .map((entry) => copyFile(path.join(sourceAssets, entry.name), path.join(targetAssets, entry.name))),
);

console.log('Published Obsidian posts to src/content/blog-zh.');
