# Add a project

Projects live in [`site/src/data/portfolio.ts`](site/src/data/portfolio.ts). Add one object to the `projects` array:

```ts
{
	name: 'Project name',
	year: 2026,
	category: 'Analog / mixed-signal',
	description: 'One short sentence: what it does and why it matters.',
	tech: ['SystemVerilog', 'SPICE', 'Sky130'],
	url: 'https://github.com/you/project',
	featured: true,
	image: {
		src: '/assets/projects/project-name.webp',
		alt: 'What the project image shows',
		width: 1600,
		height: 900,
	},
},
```

## Photo

1. Put it in `site/public/assets/projects/`.
2. Prefer WebP or AVIF, 16:9, around 1600 × 900, under 250 KB.
3. Set the real `width` and `height` to prevent layout shift.
4. Write useful `alt` text.

No photo? Omit `image` entirely. The card stays clean and typographic—no placeholder.

Ordering in the array is left → right. Keep the description brief.

## Check it

```sh
nix develop path:.
bun run check
bun run dev
```

