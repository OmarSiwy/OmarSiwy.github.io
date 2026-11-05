# Omar El-Sawy portfolio

Source for [omarelsawy.com](https://omarelsawy.com): a static Astro site built
from an Obsidian vault. It has a portfolio, a blog, and engineering notes with
KaTeX math and TikZ/Circuitikz diagrams compiled to SVG at build time.

| Route     | Source                                 |
| --------- | -------------------------------------- |
| `/`       | `site/src/data/portfolio.ts`           |
| `/blog/`  | `Blogs/**/*.md`                        |
| `/notes/` | `Notes/**/*.md` (dotfiles are skipped) |

## Quick start

Diagrams need a full TeX Live, so work inside the Nix shell:

```sh
nix develop path:.
bun install --frozen-lockfile
bun run dev        # http://localhost:4321
```

The first run compiles every `tikz`/`circuitikz` block, which takes a while.
SVGs are cached in `site/public/assets/diagrams/`, so later runs are fast.

## Commands

Run from the repo root inside `nix develop`:

```sh
bun run dev             # dev server (generates GDS + diagrams first)
bun run check           # astro check, wiki/relative link check, callout check
bun run build           # production site in site/dist + Pagefind search index
bun run preview         # serve site/dist
bun run cloudflare:dev  # build, then serve through the local asset Worker
bun run deploy:preview  # deploy to omarsiwy-portfolio-preview.workers.dev
bun run deploy          # deploy to omarelsawy.com
```

`bun --cwd site run check:search` drives Chromium (`$CHROMIUM_BIN`, set by the
Nix shell) to test note search against a built site.

Deploying needs a Cloudflare login once: `bunx wrangler login`.

## Writing content

- [ADD_NOTES.md](ADD_NOTES.md): note collections, frontmatter, wiki links,
  images, math, and TikZ/Circuitikz fences
- [ADD_BLOG.md](ADD_BLOG.md): blog post frontmatter and cover images
- [ADD_PROJECT.md](ADD_PROJECT.md): portfolio project cards

Frontmatter is validated by `site/src/content.config.ts`. Unresolved
`[[wiki links]]` render as planned links and only warn. A broken relative
link fails `check`.

To render one diagram to PNG before committing it:

```sh
bun build/markdown/preview-diagram.mjs block.tikz preview.png
```

## Proprietary material

The vault keeps textbooks, papers, and course slides next to the notes, for
reading. None of it is published. Notes written about it are.

- `.gitignore` excludes `*.pdf`, `*.zip`, `Notes/**/ref/`, pasted textbook
  screenshots (`Pasted image *`), and LMS `Table of Contents.html` exports.
- `bun run build` fails if any `.pdf` or `.zip` ends up in `site/dist`.

Keep figures in notes original: draw them in TikZ, don't screenshot the book.

## Layout

```text
Notes/ Blogs/             published Markdown (Obsidian vault)
Research/                 vault-only, not published
site/                     Astro app: pages, layouts, remark plugins, checks
build/markdown/           TikZ/Circuitikz → SVG compiler
build/gds/                synthetic SAR ADC GDS for the hero scene
build/cloudflare/         wrangler.jsonc (Workers Static Assets, no Worker code)
flake.nix                 dev shell: Bun, Node, TeX Live, Python + gdstk, Chromium
```

See [build/cloudflare/README.md](build/cloudflare/README.md) for how
deployment works.
