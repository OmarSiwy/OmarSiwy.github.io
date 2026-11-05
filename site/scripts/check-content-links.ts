import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { dirname, extname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const contentRoots = [join(repositoryRoot, 'Blogs'), join(repositoryRoot, 'Notes')];
const notesRoot = join(repositoryRoot, 'Notes');
const wikiPattern = /\[\[([^\]|#]+)(?:#[^\]|]+)?(?:\|[^\]]+)?\]\]/g;
const markdownLinkPattern = /(!?)\[[^\]]*\]\(([^)\s]+)(?:\s+["'][^"']*["'])?\)/g;
// A fence, optionally nested in blockquotes; the closing fence carries the same prefix.
const fencedBlockPattern = /^((?:[ \t]*>)*[ \t]*)```[^\n]*\n[\s\S]*?^\1```[ \t]*$/gm;
const inlineCodePattern = /`[^`\n]*`/g;
const mathPattern = /\$\$[\s\S]*?\$\$|\$[^$\n]+\$/g;

// Code is not prose: TikZ node names like \node (s6) at (0,0) read as markdown
// links, and a [[wikilink]] in a snippet is an example, not a reference.
function withoutCode(source: string) {
	return source.replace(fencedBlockPattern, '').replace(inlineCodePattern, '').replace(mathPattern, '');
}

interface NoteRecord {
	filename: string;
	keys: string[];
}

function markdownFiles(directory: string): string[] {
	if (!existsSync(directory)) return [];
	return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
		// Dotfiles are agent briefs and vault config; the content loader skips them too.
		if (entry.name.startsWith('.') || entry.name === 'node_modules') return [];
		const entryPath = join(directory, entry.name);
		if (entry.isDirectory()) return markdownFiles(entryPath);
		return entry.isFile() && ['.md', '.mdx'].includes(extname(entry.name)) ? [entryPath] : [];
	});
}

function field(source: string, key: string) {
	return source.match(new RegExp(`^${key}:\\s*["']?([^\\n"']+)["']?\\s*$`, 'm'))?.[1]?.trim();
}

function aliases(source: string) {
	const block = source.match(/^aliases:\s*\n((?:\s+-\s+[^\n]+\n?)*)/m)?.[1] ?? '';
	return [...block.matchAll(/^\s+-\s+["']?([^\n"']+)["']?\s*$/gm)].flatMap((match) =>
		match[1] ? [match[1].trim()] : [],
	);
}

function noteRecord(filename: string): NoteRecord {
	const source = readFileSync(filename, 'utf8');
	const relativeName = relative(notesRoot, filename).replace(/\\/g, '/').replace(/\.mdx?$/, '');
	const directoryName = relativeName.replace(/\/README$/i, '').split('/').at(-1) ?? relativeName;
	return {
		filename,
		keys: [field(source, 'title'), field(source, 'slug'), relativeName, directoryName, ...aliases(source)]
			.filter((value): value is string => Boolean(value))
			.map((value) => value.toLowerCase()),
	};
}

function resolvesRelativeLink(sourceFile: string, target: string) {
	const withoutHash = decodeURIComponent(target.split('#')[0] ?? '');
	if (!withoutHash) return true;
	const candidate = resolve(dirname(sourceFile), withoutHash);
	if (existsSync(candidate)) return true;
	if (!extname(candidate) && existsSync(`${candidate}.md`)) return true;
	if (!extname(candidate) && existsSync(join(candidate, 'README.md'))) return true;
	return false;
}

const noteRecords = markdownFiles(notesRoot).map(noteRecord);
const noteIndex = new Map<string, NoteRecord[]>();

for (const note of noteRecords) {
	for (const key of note.keys) noteIndex.set(key, [...(noteIndex.get(key) ?? []), note]);
}

const errors: string[] = [];
const warnings: string[] = [];
const allContentFiles = contentRoots.flatMap(markdownFiles);

for (const [key, records] of noteIndex) {
	const uniqueFiles = [...new Set(records.map((record) => record.filename))];
	if (uniqueFiles.length > 1) {
		errors.push(`Ambiguous note key "${key}": ${uniqueFiles.map((file) => relative(repositoryRoot, file)).join(', ')}`);
	}
}

for (const filename of allContentFiles) {
	const source = withoutCode(readFileSync(filename, 'utf8'));
	const displayName = relative(repositoryRoot, filename);

	for (const match of source.matchAll(wikiPattern)) {
		const target = match[1]?.trim().toLowerCase();
		if (target && !noteIndex.has(target)) warnings.push(`${displayName}: unresolved wiki link [[${match[1]}]]`);
	}

	for (const match of source.matchAll(markdownLinkPattern)) {
		const isImage = match[1] === '!';
		const target = match[2];
		if (!target || /^(?:https?:|mailto:|tel:|#|\/)/.test(target)) continue;
		if (!resolvesRelativeLink(filename, target)) {
			const message = `${displayName}: ${isImage ? 'missing image' : 'broken relative link'} ${target}`;
			(isImage ? warnings : errors).push(message);
		}
	}
}

for (const warning of warnings) console.warn(`warning: ${warning}`);
for (const error of errors) console.error(`error: ${error}`);

console.log(
	`Checked ${allContentFiles.length} Markdown files and ${noteRecords.length} note targets (${warnings.length} planned links, ${errors.length} errors).`,
);

if (errors.length > 0) process.exit(1);
