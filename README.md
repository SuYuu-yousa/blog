# Zero Cost Blog

Astro 5 blog project with an embedded Obsidian writing vault.

## Structure

```text
D:\blog
  obsidian\              # Open this folder as the Obsidian vault
    .obsidian\
    _templates\
    posts\               # Blog source drafts and posts
    notes\               # Personal notes, synced by Git but not published
    assets\              # Source images for posts
  src\content\
    blog-zh\             # Generated Chinese blog content
  scripts\
    publish-to-blog.ps1
    publish-to-blog.mjs
    deploy.ps1
```

There is one Git repository at `D:\blog\.git`. Obsidian Git operates on the parent repository from inside the `obsidian` vault.

## Commands

```bash
npm install
npm run dev
npm run build
```

Publish Obsidian posts into Astro content:

```powershell
.\scripts\publish-to-blog.ps1
```

`npm run build` runs the publish step automatically before Astro builds.

Posts in `obsidian\posts` can be plain Markdown without frontmatter. The publish script infers a title and generates a stable `note-xxxxxxxx` route unless a post defines its own `slug`.

Build, commit, and push local source changes:

```powershell
.\scripts\deploy.ps1
```

## GitHub Pages

- Deployment is handled by `.github/workflows/deploy.yml`.
- Push to `main` triggers `npm ci`, `npm run build`, and publishes `dist`.
- In GitHub repository settings, set Pages source to `GitHub Actions`.

GitHub Actions runs `npm run build`, which generates `src/content/blog-zh` from `obsidian/posts` before Astro builds. It does not need the Obsidian app.

English posts and public notes can be added later by creating new generated content folders and registering matching Astro content collections.
