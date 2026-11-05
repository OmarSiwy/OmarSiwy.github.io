# Add multi-file notes

Each course, book, or subject gets one folder under `Notes/`. Use `README.md` as its landing page and place individual notes beside it.

```text
Notes/
└── Analog_Design/
    ├── README.md
    ├── 1) Intro to Analog Design.md
    ├── 2) Basic MOS Device Physics.md
    ├── 3) Single-Stage Amplifiers.md
    └── assets/
        ├── mos-regions.webp
        └── common-source.svg
```

## Collection landing page

Give `README.md` full frontmatter:

```md
---
title: Analog Design
description: Device, circuit, and mixed-signal design notes.
slug: analog-design
kind: topic
status: growing
aliases:
  - Analog IC Design
order: 10
updatedAt: 2026-07-18
---

- [[1) Intro to Analog Design]]
- [[2) Basic MOS Device Physics]]
- [[3) Single-Stage Amplifiers]]
```

Valid `kind` values are `course`, `book`, and `topic`. Valid `status` values are `seedling`, `growing`, and `evergreen`.

## Child note

Child files can contain plain Markdown with no frontmatter. The site derives their title and URL from the filename:

```md
# Why analog?

Analog math can trade precision for power and area.
```

For a polished title, description, grouping, or explicit order, add frontmatter:

```md
---
title: Basic MOS Device Physics
description: Operating regions, body effect, and small-signal models.
kind: topic
status: growing
order: 102
aliases:
  - MOS Physics
---
```

Numeric filenames are naturally sorted. Explicit `order` wins when present.

## Links between notes

Wiki links work across all folders:

```md
[[Basic MOS Device Physics]]
[[Basic MOS Device Physics#Body Effect]]
[[Basic MOS Device Physics|MOS refresher]]
[[Basic MOS Device Physics#Body Effect|Review body effect]]
```

Resolved links become site routes automatically. Notes that link to a page appear in its **Referenced by** section. `aliases` also resolve as valid wiki-link targets.

Use normal Markdown for web links:

```md
[TinyTapeout](https://tinytapeout.com/)
```

## Images and files

Keep note-specific figures beside the collection in `assets/`:

```md
![MOS operating regions](assets/mos-regions.webp)
```

Paths are relative to the Markdown file. For a nested note, adjust the path as needed:

```md
![MOS operating regions](../assets/mos-regions.webp)
```

Alternatively, put shared files in `site/public/assets/notes/` and use an absolute URL:

```md
![Sky130 stack](/assets/notes/sky130-stack.webp)
```

Prefer SVG for diagrams and WebP/AVIF for screenshots. Include descriptive alt text and keep raster images reasonably compressed.

Use Markdown image syntax—not Obsidian `![[image.png]]` embeds. If a referenced image is absent, the build warns and renders a short “Figure unavailable” message instead of failing the whole site.

## Supported writing features

- GitHub-flavoured Markdown: tables, task lists, footnotes, and fenced code.
- Syntax-highlighted code blocks through Shiki.
- Inline math with `$...$` and display math with `$$...$$`, rendered by KaTeX.
- Build-time TikZ and Circuitikz diagrams rendered as cached SVG files.
- Automatic heading anchors.
- Automatic table of contents when a page has multiple `##` or `###` headings.
- Wiki links, aliases, and backlinks.
- Frontmatter-free child notes with derived titles and routes.
- Top-to-bottom index grouped into Courses, Books, and Topics.
- Missing-image warnings without blocking production builds.

## Code and math

````md
```systemverilog
assign ready = valid && !stall;
```

$$
A_v = -g_m R_D
$$

```circuitikz title="Common-source amplifier"
\draw (0,0) node[nmos] (M1) {};
\draw (M1.S) -- ++(0,-1) node[ground] {};
\draw (M1.D) -- ++(0,1) to[R,l=$R_D$] ++(0,1) node[vcc] {$V_{DD}$};
\draw (M1.G) -- ++(-1,0) node[left] {$V_{in}$};
```
````

Use `tikz` for block diagrams and general drawings, or `circuitikz` for schematics. The fence body is placed inside the corresponding LaTeX environment. You can also provide a complete `tikzpicture` or `circuitikz` environment yourself. `title="..."` becomes the image alt text.

Diagram compilation uses `latex` and `dvisvgm` with shell escape disabled. Both are included through `texliveFull` in `flake.nix`. Generated SVG files are cached under `site/public/assets/diagrams/` and are created automatically by `dev`, `check`, and `build`.

To have the same block render live in Obsidian through the TikZJax plugin, wrap it in `\begin{document}` / `\end{document}` and declare any `\usepackage{}` inside the block — the build strips the document environment and hoists the packages into its own preamble, so one block works in both. Stick to base PGF: TikZJax runs a cut-down TeX with no `positioning`, `calc`, `arrows.meta` or pgfplots, so place nodes with explicit `at (x,y)` coordinates.

To eyeball a single figure before committing it:

```sh
nix develop path:. --command bun build/markdown/preview-diagram.mjs block.tikz preview.png
```

where `block.tikz` holds exactly what goes inside the fence.

## Check locally

From the repository root:

```sh
nix develop path:.
bun run check
bun run dev
```

Open `/notes/` for the index. Every Markdown file becomes its own static page.
