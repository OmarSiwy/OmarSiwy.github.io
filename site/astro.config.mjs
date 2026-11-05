import { fileURLToPath } from 'node:url';

import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';
import rehypeAutolinkHeadings from 'rehype-autolink-headings';
import rehypeKatex from 'rehype-katex';
import rehypeSlug from 'rehype-slug';
import remarkMath from 'remark-math';
import { defineConfig } from 'astro/config';

import remarkCallouts from './src/lib/remark-callouts.mjs';
import remarkWikiLinks, { remarkLatexDiagrams, remarkMissingImages } from './src/lib/remark-wiki-links.mjs';

const notesDirectory = fileURLToPath(new URL('../Notes/', import.meta.url));
const diagramOutputDirectory = fileURLToPath(new URL('./public/assets/diagrams/', import.meta.url));

export default defineConfig({
	site: 'https://omarelsawy.com',
	output: 'static',
	trailingSlash: 'always',
	compressHTML: true,
	integrations: [react(), sitemap()],
	// The audited Three/R3F island is lazy and 295 KB gzip including hydration.
	// Keep a raw-size warning guard just above its measured 888 KB scene chunk.
	vite: {
		build: {
			chunkSizeWarningLimit: 900,
		},
	},
	redirects: {
		'/experience': '/#experience',
		'/projects': '/#projects',
	},
	markdown: {
		gfm: true,
		smartypants: true,
		remarkPlugins: [
			remarkMath,
			remarkCallouts,
			remarkMissingImages,
			[remarkLatexDiagrams, { outputDirectory: diagramOutputDirectory }],
			[remarkWikiLinks, { notesDirectory }],
		],
		rehypePlugins: [
			rehypeKatex,
			rehypeSlug,
			[
				rehypeAutolinkHeadings,
				{
					behavior: 'append',
					properties: {
						className: ['heading-anchor'],
						ariaLabel: 'Link to this section',
					},
				},
			],
		],
		syntaxHighlight: {
			type: 'shiki',
			excludeLangs: ['math', 'mermaid', 'tikz', 'circuitikz'],
		},
		shikiConfig: {
			themes: {
				light: 'github-light',
				dark: 'github-dark',
			},
			defaultColor: false,
			wrap: false,
			// ponytail: tokens only (comments, dot-cards, devices, {expr}, numbers); no netlist semantics.
			langs: [
				{
					name: 'spice',
					scopeName: 'source.spice',
					aliases: ['netlist', 'cir'],
					patterns: [
						{ match: '^\\s*\\*.*$', name: 'comment.line.spice' },
						{ match: ';.*$', name: 'comment.line.spice' },
						{ match: '^\\s*\\.[A-Za-z]+', name: 'keyword.control.spice' },
						{ match: '^\\s*[A-Za-z][\\w]*', name: 'entity.name.function.spice' },
						{ begin: '\\{', end: '\\}', name: 'string.other.spice' },
						{ match: '\\b[A-Za-z_]\\w*(?==)', name: 'variable.parameter.spice' },
						{ match: '-?\\b\\d+(?:\\.\\d+)?(?:e[-+]?\\d+)?(?:meg|[fpnumkgt])?', name: 'constant.numeric.spice' },
					],
				},
			],
		},
	},
});
