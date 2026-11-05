# Add a blog post

Create `Blogs/<short-slug>.md`:

```md
---
title: A sharp, short title
description: One sentence shown on the blog index.
publishedAt: 2026-07-18
updatedAt: 2026-07-18
slug: sharp-short-title
tags:
  - analog
  - tooling
draft: false
cover:
  src: /assets/blog/sharp-short-title.webp
  alt: What the cover image shows
  width: 1600
  height: 900
---

Start writing here.
```

The page URL becomes `/blog/sharp-short-title/`.

## Cover image

Put covers in `site/public/assets/blog/`. Prefer WebP or AVIF, 16:9, under 300 KB. Use the image's real dimensions and useful alt text.

No cover? Remove the full `cover` block. The index and post render without a placeholder.

Use normal Markdown images inside the article:

```md
![Layout after routing](/assets/blog/sharp-short-title-layout.webp)
```

Set `draft: true` while working. Drafts appear locally but are excluded from production.

## Check it

```sh
nix develop path:.
bun run check
bun run dev
```
