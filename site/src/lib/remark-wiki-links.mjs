import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';

import { visit } from 'unist-util-visit';

const wikiLinkPattern = /\[\[([^\]|#]+?)(?:#([^\]|]+))?(?:\|([^\]]+))?\]\]/g;

function slugify(value) {
	return value
		.normalize('NFKD')
		.toLowerCase()
		.replace(/[.'’]/g, '')
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-+|-+$/g, '');
}

function slugifyPath(value) {
	return value.split('/').map(slugify).filter(Boolean).join('/');
}

function lookupKey(value) {
	return value
		.normalize('NFKD')
		.toLowerCase()
		.replace(/([0-9])\.(?=[0-9])/g, '$1')
		.replace(/['’]/g, '')
		.replace(/[^a-z0-9]+/g, ' ')
		.trim();
}

function frontmatterValue(source, key) {
	const match = source.match(new RegExp(`^${key}:\\s*["']?([^\\n"']+)["']?\\s*$`, 'm'));
	return match?.[1]?.trim();
}

function frontmatterAliases(source) {
	const block = source.match(/^aliases:\s*\n((?:\s+-\s+[^\n]+\n?)*)/m)?.[1] ?? '';
	return [...block.matchAll(/^\s+-\s+["']?([^\n"']+)["']?\s*$/gm)].map((match) => match[1].trim());
}

function collectMarkdownFiles(directory) {
	if (!fs.existsSync(directory)) return [];
	return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
		const entryPath = path.join(directory, entry.name);
		if (entry.isDirectory()) return collectMarkdownFiles(entryPath);
		return entry.isFile() && entry.name.endsWith('.md') ? [entryPath] : [];
	});
}

function createNoteIndex(notesDirectory) {
	const byKey = new Map();
	const byFilename = new Map();
	const basenames = [];

	for (const filename of collectMarkdownFiles(notesDirectory)) {
		const source = fs.readFileSync(filename, 'utf8');
		const title = frontmatterValue(source, 'title') ?? path.basename(filename, '.md');
		const relativePath = path.relative(notesDirectory, filename).replace(/\\/g, '/');
		const directoryName = path.basename(path.dirname(filename));
		const slug = frontmatterValue(source, 'slug') ?? slugifyPath(relativePath.replace(/\.md$/i, '').replace(/\/README$/i, ''));
		const keys = [title, slug, relativePath.replace(/\.md$/i, ''), directoryName, ...frontmatterAliases(source)];

		for (const key of keys) {
			byKey.set(key.toLowerCase(), slug);
			byKey.set(lookupKey(key), slug);
		}
		// The bare filename is how Obsidian resolves [[2.1) Adders]]. Index it too so a
		// link that works in the vault works on the site, but only in a second pass: a
		// filename must never displace another note's title, slug or alias, and duplicate
		// filenames across folders (Overview.md, README.md) must stay unresolved rather
		// than silently picking whichever file was walked last.
		basenames.push([path.basename(filename, '.md'), slug]);
		byFilename.set(path.resolve(filename), slug);
	}

	const claimed = new Set();
	for (const [basename, slug] of basenames) {
		for (const key of [basename.toLowerCase(), lookupKey(basename)]) {
			if (byKey.has(key)) continue;
			if (claimed.has(key)) {
				byKey.delete(key); // ambiguous filename: leave it for the link checker to report
				continue;
			}
			claimed.add(key);
			byKey.set(key, slug);
		}
	}

	return { byKey, byFilename };
}

const latexDiagramVersion = 'latex-diagram-v1';

export function latexDiagramHash(language, source) {
	return createHash('sha256')
		.update(`${latexDiagramVersion}\0${language}\0${source}`)
		.digest('hex')
		.slice(0, 20);
}

export function latexDiagramDocument(language, source) {
	// Obsidian's TikZJax plugin requires each block to carry its own \documentclass,
	// \usepackage and \begin{document}. We supply our own preamble, so hoist any
	// \usepackage lines out and drop the parts that would nest a second document.
	const packages = [...source.matchAll(/^[ \t]*\\usepackage(\[[^\]]*\])?\{[^}]*\}[ \t]*$/gm)]
		.map((match) => match[0].trim());
	const body = source
		.replace(/^[ \t]*\\documentclass(\[[^\]]*\])?\{[^}]*\}[ \t]*$/gm, '')
		.replace(/^[ \t]*\\usepackage(\[[^\]]*\])?\{[^}]*\}[ \t]*$/gm, '')
		.replace(/\\(begin|end)\{document\}/g, '')
		.trim();

	const hasEnvironment = /\\begin\{(?:tikzpicture|circuitikz)\}/.test(body);
	const environment = language === 'circuitikz' ? 'circuitikz' : 'tikzpicture';
	const diagram = hasEnvironment
		? body
		: `\\begin{${environment}}\n${body}\n\\end{${environment}}`;

	// Obsidian's TikZJax bundles these libraries by default, so diagrams authored
	// against it omit \usetikzlibrary. Preload the common ones to match.
	return String.raw`\documentclass[tikz,border=5pt]{standalone}
\usepackage{amsmath,amssymb}
\usepackage{circuitikz}
\usetikzlibrary{arrows.meta,positioning,calc,fit,matrix,backgrounds,intersections,through,angles,quotes,patterns,shapes.geometric,shapes.misc,shapes.arrows,shapes.multipart,decorations.pathmorphing,decorations.pathreplacing,decorations.markings,decorations.text}
${packages.join('\n')}
\begin{document}
${diagram}
\end{document}
`;
}

function diagramAlt(meta) {
	const quoted = meta?.match(/(?:title|alt)=(?:"([^"]+)"|'([^']+)')/);
	return quoted?.[1] ?? quoted?.[2] ?? 'LaTeX circuit diagram';
}

export function remarkLatexDiagrams({ outputDirectory, publicPath = '/assets/diagrams' }) {
	return (tree) => {
		visit(tree, 'code', (node) => {
			const language = node.lang?.toLowerCase();
			if (language !== 'tikz' && language !== 'circuitikz') return;

			const hash = latexDiagramHash(language, node.value);
			const filename = path.join(outputDirectory, `${hash}.svg`);
			if (!fs.existsSync(filename)) {
				throw new Error(`Missing compiled LaTeX diagram ${hash}. Run the diagram generator before Astro.`);
			}

			node.type = 'image';
			node.url = `${publicPath}/${hash}.svg`;
			node.alt = diagramAlt(node.meta);
			node.title = null;
			node.data = { hProperties: { className: ['latex-diagram'], loading: 'lazy' } };
			delete node.lang;
			delete node.meta;
			delete node.value;
		});
	};
}

export function remarkMissingImages() {
	return (tree, file) => {
		if (!file.path) return;
		visit(tree, 'image', (node) => {
			if (/^(?:[a-z]+:|\/|#)/i.test(node.url)) return;
			const imagePath = decodeURIComponent(node.url.split(/[?#]/, 1)[0] ?? '');
			if (!imagePath || fs.existsSync(path.resolve(path.dirname(file.path), imagePath))) return;
			node.type = 'text';
			node.value = node.alt ? `[Figure unavailable: ${node.alt}]` : '[Figure unavailable]';
			delete node.url;
			delete node.alt;
			delete node.title;
		});
	};
}

export default function remarkWikiLinks({ notesDirectory }) {
	const noteIndex = createNoteIndex(notesDirectory);

	return (tree, file) => {
		visit(tree, 'link', (node) => {
			if (!file.path || /^(?:[a-z]+:|\/|#)/i.test(node.url)) return;

			const match = node.url.match(/^([^?#]*)(.*)$/);
			const relativeTarget = match?.[1];
			if (!relativeTarget) return;

			const absoluteTarget = path.resolve(path.dirname(file.path), decodeURIComponent(relativeTarget));
			const candidates = path.extname(absoluteTarget)
				? [absoluteTarget]
				: [absoluteTarget, `${absoluteTarget}.md`, `${absoluteTarget}.mdx`, path.join(absoluteTarget, 'README.md')];
			const slug = candidates.map((candidate) => noteIndex.byFilename.get(candidate)).find(Boolean);
			if (slug) node.url = `/notes/${slug}/${match?.[2] ?? ''}`;
		});

		visit(tree, 'text', (node, index, parent) => {
			if (index === undefined || !parent || parent.type === 'link') return;

			const source = node.value;
			const replacements = [];
			let cursor = 0;
			let match;

			wikiLinkPattern.lastIndex = 0;
			while ((match = wikiLinkPattern.exec(source)) !== null) {
				if (match.index > cursor) replacements.push({ type: 'text', value: source.slice(cursor, match.index) });

				const target = match[1].trim();
				const heading = match[2]?.trim();
				const label = match[3]?.trim() || (heading ? `${target} — ${heading}` : target);
				const resolvedSlug = noteIndex.byKey.get(target.toLowerCase()) ?? noteIndex.byKey.get(lookupKey(target));
				const slug = resolvedSlug ?? slugify(target);
				const hash = heading ? `#${slugify(heading)}` : '';

				replacements.push({
					type: 'link',
					url: `/notes/${slug}/${hash}`,
					children: [{ type: 'text', value: label }],
					data: resolvedSlug ? {} : { hProperties: { className: ['unresolved-wiki-link'] } },
				});

				cursor = match.index + match[0].length;
			}

			if (replacements.length === 0) return;
			if (cursor < source.length) replacements.push({ type: 'text', value: source.slice(cursor) });
			parent.children.splice(index, 1, ...replacements);
			return index + replacements.length;
		});
	};
}
