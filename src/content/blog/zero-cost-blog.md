---
title: 零成本博客搭建笔记
description: 从 Markdown 内容开始，搭一个可以部署到 Cloudflare Pages 的 Astro 静态博客。
pubDate: 2026-07-09
lang: zh
tags:
  - Astro
  - Blog
  - Cloudflare
---

这是一篇示例文章。你可以在 `src/content/blog` 里继续添加 Markdown 文件，每个文件都会变成一篇博客文章。

## 写作流程

1. 在 `src/content/blog` 新建 Markdown。
2. 填写 frontmatter，例如标题、摘要、发布日期和标签。
3. 本地运行 `npm run dev` 预览。
4. 推送到 GitHub，再用 Cloudflare Pages 部署。

## 部署提示

Cloudflare Pages 通常只需要这些设置：

- 构建命令：`npm run build`
- 输出目录：`dist`
- Node 版本：建议设置为当前 LTS 或项目使用的版本

后续如果要加评论，可以参考 Giscus，把评论组件放进 `BlogPostLayout.astro` 的文章内容后面。
