# Blog Workflow

This folder is one thing with three roles:

```text
D:\blog = Obsidian vault = Astro blog project = Git repository
```

There is only one Git repository: `D:\blog\.git`.

Obsidian Git and blog deployment both use this same repository. There is no nested Git repository and no sync script.

## First-time setup on this computer

1. Open Obsidian.
2. Choose "Open folder as vault".
3. Select:

```text
D:\blog
```

4. Go to Obsidian settings and enable community plugins.
5. Enable the `Obsidian Git` plugin.

The plugin files are installed locally. The repository only stores its configuration.

## Connect GitHub

Create a new GitHub repository, then run these commands in `D:\blog`:

```powershell
git remote add origin <your-github-repo-url>
git push -u origin main
```

After this, Obsidian Git can push future changes automatically.

## Connect Cloudflare Pages

In Cloudflare Pages:

- Connect the same GitHub repository.
- Build command: `npm run build`
- Build output directory: `dist`
- Node version: `22`

Cloudflare does not need Obsidian. It only builds the GitHub repository.

## Writing posts

Create blog posts in:

```text
src/content/blog
```

Use the Obsidian template:

```text
.obsidian/templates/blog-post.md
```

Every public post needs frontmatter like this:

```md
---
title: "Post title"
description: "Short summary"
pubDate: 2026-07-09
lang: zh
tags: []
draft: false
---
```

Keep `draft: true` while writing. Change it to `draft: false` when ready to publish.

## Images

Put images in:

```text
src/content/blog/assets
```

Use Markdown links:

```md
![Screenshot](assets/screenshot.png)
```

Avoid Obsidian wiki-style embeds for blog images:

```md
![[screenshot.png]]
```

Astro expects normal Markdown image links.

## Daily flow

1. Open `D:\blog` in Obsidian.
2. Write or edit posts under `src/content/blog`.
3. Save changes.
4. Obsidian Git will commit and push on its interval.
5. GitHub receives the commit.
6. Cloudflare Pages builds and deploys the blog.

Before switching devices, make sure Obsidian Git has pushed the latest changes.

When opening another device, let Obsidian Git pull first before editing.

## New device setup

1. Install Git.
2. Install Obsidian.
3. Clone the GitHub repository:

```powershell
git clone <your-github-repo-url>
```

4. Open the cloned folder as an Obsidian vault.
5. Install and enable the `Obsidian Git` plugin.
6. Run:

```powershell
npm install
```

Use `npm run dev` only if you want local preview.

## Local preview

```powershell
npm run dev
```

Open:

```text
http://127.0.0.1:4321/
```

## Manual build check

```powershell
npm run build
```

Run this before major changes to check that Cloudflare will be able to build.

## Important rules

- Do not commit `node_modules`, `dist`, or `.astro`.
- Do not put private notes into `src/content/blog`.
- Do not edit the same post on two devices at the same time.
- If Git reports a conflict, resolve it before writing more.
- The old vault `D:\2026\FE-agent-` is only a reference library now.
