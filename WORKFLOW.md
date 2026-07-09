# Blog Workflow

This repository keeps writing and publishing separate:

```text
D:\blog                  # Git repository and Astro project
D:\blog\obsidian         # Obsidian vault
D:\blog\src\content      # Astro publishing target generated at build time
```

There is still only one Git repository: `D:\blog\.git`.

## First-time setup

1. Open Obsidian.
2. Choose "Open folder as vault".
3. Select:

```text
D:\blog\obsidian
```

4. Enable community plugins.
5. Enable `Obsidian Git`.

The Obsidian Git config uses `basePath: ".."` so it operates on the parent Git repository at `D:\blog`.

## Writing

Write blog posts in:

```text
obsidian\posts
```

Use the template:

```text
obsidian\_templates\blog-post.md
```

Personal notes go in:

```text
obsidian\notes
```

They are synced by Git, but they are not published because the publish script only reads `obsidian\posts`.

Private notes that should not sync at all can go in:

```text
obsidian\private
```

That folder is ignored by Git.

## Frontmatter

Frontmatter is optional. A plain Markdown note can be published:

```md
# Post title

Body content.
```

The publish script will infer the title from the first `#` heading, or from the file name if there is no heading.

Optional fields are only needed when you want control:

```md
---
title: Custom title
slug: custom-url
draft: true
---

Body content.
```

If `slug` is missing, the script creates a stable route like `note-440a23cd` from the source file path. Only `draft: true` prevents publishing.

## Images

Put source images in:

```text
obsidian\assets
```

Use Markdown image links:

```md
![Screenshot](../assets/screenshot.png)
```

The publish script copies source assets into:

```text
src\content\blog-zh\assets
```

It also converts simple Obsidian image embeds like this:

```md
![[screenshot.png]]
```

into:

```md
![screenshot.png](assets/screenshot.png)
```

## Publishing

Generate Astro content from Obsidian:

```powershell
.\scripts\publish-to-blog.ps1
```

`npm run build` also runs the publish step automatically:

```powershell
npm run build
```

One-command publish flow:

```powershell
.\scripts\deploy.ps1
```

`deploy.ps1` builds the site, commits source changes, and pushes. Generated files under `src\content\blog-zh` are ignored by Git because the source of truth is `obsidian\posts`.

## GitHub Pages

Create a GitHub repository, then run:

```powershell
git remote add origin <your-github-repo-url>
git push -u origin main
```

In GitHub:

- Open the repository.
- Go to Settings -> Pages.
- Set Build and deployment Source to `GitHub Actions`.
- Push to `main`, or open Actions and run `Deploy GitHub Pages` manually.

## Multi-device Obsidian sync

On a new device:

1. Install Git and Obsidian.
2. Clone the GitHub repository.
3. Open the cloned `obsidian` folder as the vault.
4. Install and enable `Obsidian Git`.
5. Run `npm install` only if you need local preview or build.

Obsidian syncs through the same parent repository. You do not open the Astro project root as the vault.

## Rules

- Open `D:\blog\obsidian` in Obsidian, not `D:\blog`.
- Do not edit generated files in `src\content\blog-zh` by hand.
- Edit source posts in `obsidian\posts`.
- Put non-public synced notes in `obsidian\notes`.
- Put non-synced private notes in `obsidian\private`.
- Avoid editing the same post on two devices at the same time.
- The old vault `D:\2026\FE-agent-` is only a reference library.
