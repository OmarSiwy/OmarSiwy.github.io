import { spawnSync } from 'node:child_process';
import {
	existsSync,
	mkdirSync,
	readdirSync,
	readFileSync,
	renameSync,
	rmSync,
	writeFileSync,
} from 'node:fs';
import { extname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
	latexDiagramDocument,
	latexDiagramHash,
} from '../../site/src/lib/remark-wiki-links.mjs';

const repositoryRoot = resolve(fileURLToPath(new URL('../..', import.meta.url)));
const contentRoots = [join(repositoryRoot, 'Notes'), join(repositoryRoot, 'Blogs')];
const outputDirectory = join(repositoryRoot, 'site/public/assets/diagrams');
const cacheDirectory = join(repositoryRoot, '.cache/latex-diagrams');
// The prefix group matches Obsidian callout/blockquote markers ("> > ") so diagrams
// nested inside callouts are compiled too. Everything the remark plugin later hashes
// comes from mdast, which strips those markers and the newline before the closing
// fence — normaliseSource() reproduces exactly that, or the hashes never match.
const diagramPattern = /^([ \t]*(?:>[ \t]*)*)```(tikz|circuitikz)(?:[^\n]*)\n([\s\S]*?)^\1?[ \t]*```[ \t]*$/gm;

function normaliseSource(body: string, prefix: string): string {
	const withoutPrefix = prefix.trim().length
		? body
				.split('\n')
				.map((line) => {
					if (line.startsWith(prefix)) return line.slice(prefix.length);
					// Blank lines inside a callout are often "> >" with the trailing space trimmed.
					return line.replace(/^[ \t]*(?:>[ \t]*)*/, '');
				})
				.join('\n')
		: body;
	// mdast code nodes carry no trailing newline.
	return withoutPrefix.replace(/\n$/, '');
}

interface Diagram {
	language: 'tikz' | 'circuitikz';
	source: string;
	origin: string;
}

function markdownFiles(directory: string): string[] {
	if (!existsSync(directory)) return [];
	return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
		const entryPath = join(directory, entry.name);
		if (entry.isDirectory()) return markdownFiles(entryPath);
		return entry.isFile() && ['.md', '.mdx'].includes(extname(entry.name)) ? [entryPath] : [];
	});
}

function diagramsIn(filename: string): Diagram[] {
	const source = readFileSync(filename, 'utf8');
	return [...source.matchAll(diagramPattern)].flatMap((match) => {
		const prefix = match[1] ?? '';
		const language = match[2];
		const body = match[3];
		if ((language !== 'tikz' && language !== 'circuitikz') || body === undefined) return [];
		const line = source.slice(0, match.index).split('\n').length;
		return [{ language, source: normaliseSource(body, prefix), origin: `${filename}:${line}` }];
	});
}

function run(command: string, args: string[], workingDirectory: string) {
	const result = spawnSync(command, args, {
		cwd: workingDirectory,
		encoding: 'utf8',
		stdio: ['ignore', 'pipe', 'pipe'],
	});
	if (result.error) {
		throw new Error(`${command} is required to compile LaTeX diagrams. Enter the project with \`nix develop path:.\`.`);
	}
	if (result.status !== 0) {
		const output = `${result.stdout}\n${result.stderr}`.trim();
		throw new Error(`${command} failed:\n${output.slice(-6000)}`);
	}
}

function compileDiagram(diagram: Diagram) {
	const hash = latexDiagramHash(diagram.language, diagram.source);
	const outputPath = join(outputDirectory, `${hash}.svg`);
	if (existsSync(outputPath)) return false;

	// Several generator runs can be in flight at once (agents, `check`, a dev server).
	// Two runs compiling the same diagram must not share a working directory, or one
	// reads the other's half-written diagram.dvi ("premature end of DVI stream"), and
	// the SVG is written to a temp path and renamed so readers never see a torn file.
	const workingDirectory = join(cacheDirectory, `${hash}-${process.pid}`);
	const pendingPath = `${outputPath}.${process.pid}.tmp`;
	mkdirSync(workingDirectory, { recursive: true });
	mkdirSync(outputDirectory, { recursive: true });
	writeFileSync(
		join(workingDirectory, 'diagram.tex'),
		latexDiagramDocument(diagram.language, diagram.source),
	);

	run(
		'latex',
		['-no-shell-escape', '-interaction=nonstopmode', '-halt-on-error', 'diagram.tex'],
		workingDirectory,
	);
	run(
		'dvisvgm',
		['--no-fonts', '--exact', `--output=${pendingPath}`, 'diagram.dvi'],
		workingDirectory,
	);
	renameSync(pendingPath, outputPath); // atomic within the same filesystem
	rmSync(workingDirectory, { recursive: true, force: true });
	return true;
}

const diagrams = new Map<string, Diagram>();
for (const filename of contentRoots.flatMap(markdownFiles)) {
	for (const diagram of diagramsIn(filename)) {
		diagrams.set(latexDiagramHash(diagram.language, diagram.source), diagram);
	}
}

// One malformed diagram used to abort the whole run, leaving every later
// diagram uncompiled. Compile them all, then report every failure at once.
let compiled = 0;
const failures: { origin: string; message: string }[] = [];
for (const diagram of diagrams.values()) {
	try {
		if (compileDiagram(diagram)) compiled += 1;
	} catch (error) {
		failures.push({ origin: diagram.origin, message: (error as Error).message });
	}
}

console.log(`Prepared ${diagrams.size} LaTeX diagram${diagrams.size === 1 ? '' : 's'} (${compiled} compiled).`);

if (failures.length > 0) {
	for (const { origin, message } of failures) {
		console.error(`\n✗ ${origin}\n${message.split('\n').slice(-12).join('\n')}`);
	}
	console.error(`\n${failures.length} diagram${failures.length === 1 ? '' : 's'} failed to compile.`);
	process.exit(1);
}
