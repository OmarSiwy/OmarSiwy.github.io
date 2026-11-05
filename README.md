# Omar El-Sawy portfolio

[omarelsawy.com](https://omarelsawy.com)

- `/` — projects, experience, background, and contact information.
- `/blog/` — articles sourced from `Blogs/**/*.md`.
- `/notes/` — course, book, and topic notes sourced from `Notes/**/*.md`.

## Development

```sh
bun run check           # Astro strict checks and Markdown link checks
bun run generate:gds    # synthetic SAR ADC GDS, scene buffers, and poster
bun run build           # GDS, résumé PDF, and production site
bun run preview         # preview site/dist locally
bun run cloudflare:dev  # preview through Workers Static Assets
bun run deploy:preview  # deploy to a preview workers.dev Worker
```

## Content

Blog and note metadata is validated by `site/src/content.config.ts`. Notes can
keep using Obsidian-style `[[wiki links]]`; unresolved targets are rendered as
planned links and reported by the content checker.

Static Cloudflare infrastructure is tracked in `build/cloudflare/`. Generated
Astro, Wrangler, résumé, Cargo, and WASM output is ignored.
