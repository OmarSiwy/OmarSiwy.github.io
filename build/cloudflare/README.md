# Cloudflare build infrastructure

This directory is the tracked home for Cloudflare deployment configuration.
The new site uses Workers Static Assets directly, so there is deliberately no
Worker entrypoint and no KV binding.

Target contents:

```text
build/cloudflare/
├── README.md
└── wrangler.jsonc
```

Generated output does not belong in this tracked directory:

- Astro output: `site/dist/`
- Wrangler state: `.wrangler/`

## Commands

Enter the pinned development environment and install the lockfile once:

```sh
nix develop
bun install --frozen-lockfile
```

Then use:

```sh
bun run cloudflare:dev   # build and serve through the local asset worker
bun run deploy:preview  # deploy omarsiwy-portfolio-preview.workers.dev
bun run deploy          # deploy the custom-domain production Worker
```

`bun run deploy` is the production cutover. Cloudflare deployment versions are
the recovery path after cutover; record the currently deployed version before
running it.

The asset Worker serves `site/dist/`, enforces trailing slashes, and returns the
generated `404.html` for unknown paths. Response security and cache headers are
authored in `site/public/_headers`; compatibility redirects are authored in
`site/public/_redirects`. Astro copies both files into the static build, where
Cloudflare parses them as asset rules.
