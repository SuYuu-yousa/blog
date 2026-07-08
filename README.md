# Zero Cost Blog

An Astro 5 blog scaffold inspired by https://jilei.blog/zh/blog/zero-cost-blog-setup/.

## Commands

```bash
npm install
npm run dev
npm run build
```

## Obsidian workflow

Open this repository folder (`D:\blog`) as an Obsidian vault. Blog posts live directly in:

```text
src/content/blog
```

Create a post from the Obsidian template at `.obsidian/templates/blog-post.md`, then change `draft` to `false` when it is ready to publish.

Images and pasted attachments should go in:

```text
src/content/blog/assets
```

Use Markdown image links, for example:

```md
![Screenshot](assets/screenshot.png)
```

This keeps images portable across devices and lets Astro process them during the build.

## Git and deploy

This folder is both the Obsidian vault and the Astro blog repository.

- Obsidian Git commits and pushes writing changes from this same repository.
- GitHub receives those commits.
- Cloudflare Pages builds this repository with `npm run build`.
- Build output is `dist`.

There is no second sync step and no dependency on the old vault path.

Ignored local/generated paths include `node_modules`, `dist`, `.astro`, volatile Obsidian workspace files, and local plugin runtime files.

## Routes

The current route shape is:

- `/`
- `/zh/blog/`
- `/zh/blog/:slug/`
- `/about/`

## Cloudflare Pages

- Build command: `npm run build`
- Output directory: `dist`
