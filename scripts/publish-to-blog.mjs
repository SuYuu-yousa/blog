import { copyFile, mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
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
await Promise.all(
  posts
    .filter((entry) => entry.isFile() && entry.name.endsWith('.md'))
    .map(async (entry) => {
      const sourcePath = path.join(sourcePosts, entry.name);
      const targetPath = path.join(targetPosts, entry.name);
      const markdown = await readFile(sourcePath, 'utf8');
      await writeFile(targetPath, convertObsidianEmbeds(markdown), 'utf8');
    }),
);

const assets = await readdir(sourceAssets, { withFileTypes: true });
await Promise.all(
  assets
    .filter((entry) => entry.isFile() && entry.name !== '.gitkeep')
    .map((entry) => copyFile(path.join(sourceAssets, entry.name), path.join(targetAssets, entry.name))),
);

console.log('Published Obsidian posts to src/content/blog-zh.');
