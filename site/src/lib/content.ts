import type { CollectionEntry } from 'astro:content';

type BlogEntry = CollectionEntry<'blog'>;
type NoteEntry = CollectionEntry<'notes'>;
const noteCollator = new Intl.Collator('en', { numeric: true, sensitivity: 'base' });

export function blogUrl(entry: BlogEntry) {
	return `/blog/${entry.data.slug}/`;
}

export function noteUrl(entry: NoteEntry) {
	return `/notes/${noteSlug(entry)}/`;
}

export function noteSlug(entry: NoteEntry) {
	if (entry.data.slug) return entry.data.slug;
	return entry.id
		.replace(/\.(?:md|mdx)$/i, '')
		.replace(/\/README$/i, '')
		.split('/')
		.map((segment) => segment
			.normalize('NFKD')
			.replace(/[\u0300-\u036f]/g, '')
			.toLowerCase()
			.replace(/[^a-z0-9]+/g, '-')
			.replace(/^-|-$/g, ''))
		.filter(Boolean)
		.join('/');
}

export function noteTitle(entry: NoteEntry) {
	if (entry.data.title) return entry.data.title;
	const basename = entry.id.replace(/\.(?:md|mdx)$/i, '').split('/').at(-1) ?? 'Note';
	return basename
		.replace(/[-_]+/g, ' ')
		.replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export function noteDescription(entry: NoteEntry) {
	return entry.data.description ?? `${noteTitle(entry)} notes.`;
}

/**
 * Folder path a note lives under, e.g. `Circuit Design/Analog Design`. Empty for a top-level note.
 * Uses `filePath` rather than `id` so the crumb keeps the real folder casing and spacing.
 */
export function noteCrumb(entry: NoteEntry) {
	const path = entry.filePath ?? entry.id;
	return path
		.replace(/\.(?:md|mdx)$/i, '')
		.split('/')
		.slice(0, -1)
		.filter((segment) => segment !== '..' && segment !== 'Notes')
		.join('/');
}

/**
 * The folder a note sits in. Sidebar siblings are scoped to this, so a note in
 * `Circuit Design/Analog Design/DACs` lists its ~116 neighbours rather than all
 * 2295 notes under `Circuit Design`.
 */
export function noteSectionId(entry: NoteEntry) {
	const slug = noteSlug(entry);
	return slug.split('/').slice(0, -1).join('/') || slug;
}

export function isNoteLanding(entry: NoteEntry) {
	return !noteSlug(entry).includes('/');
}

/**
 * Nests notes by their folder path for the notes index, e.g.
 * `Circuit Design` → `Analog Design` → 40 notes directly in it.
 */
export function noteTree(entries: NoteEntry[]) {
	const areas = new Map<string, Map<string, NoteEntry[]>>();
	for (const entry of entries) {
		const segments = noteCrumb(entry).split('/').filter(Boolean);
		const area = segments[0] ?? 'Loose notes';
		const section = segments.slice(1).join('/') || '';
		const sections = areas.get(area) ?? new Map<string, NoteEntry[]>();
		sections.set(section, [...(sections.get(section) ?? []), entry]);
		areas.set(area, sections);
	}

	return [...areas]
		.map(([area, sections]) => ({
			area,
			total: [...sections.values()].reduce((sum, list) => sum + list.length, 0),
			sections: [...sections]
				.map(([section, list]) => ({ section, notes: orderedNotes(list) }))
				.sort((left, right) => left.section.localeCompare(right.section)),
		}))
		.sort((left, right) => right.total - left.total);
}

export function visibleBlogs(entries: BlogEntry[]) {
	return entries
		.filter((entry) => !entry.data.draft || import.meta.env.DEV)
		.sort((left, right) => right.data.publishedAt.valueOf() - left.data.publishedAt.valueOf());
}

export function orderedNotes(entries: NoteEntry[]) {
	return [...entries].sort(
		(left, right) => left.data.order - right.data.order || compareNoteTitles(noteTitle(left), noteTitle(right)),
	);
}

function compareNoteTitles(left: string, right: string) {
	const leftSequence = left.match(/^(\d+(?:\.\d+)?)([a-z]?)\)/i);
	const rightSequence = right.match(/^(\d+(?:\.\d+)?)([a-z]?)\)/i);
	if (leftSequence && rightSequence) {
		const numberDifference = Number(leftSequence[1]) - Number(rightSequence[1]);
		if (numberDifference !== 0) return numberDifference;
		const suffixDifference = noteCollator.compare(leftSequence[2] ?? '', rightSequence[2] ?? '');
		if (suffixDifference !== 0) return suffixDifference;
	}
	return noteCollator.compare(left, right);
}

export function formatDate(date: Date) {
	return new Intl.DateTimeFormat('en-CA', {
		year: 'numeric',
		month: 'short',
		day: 'numeric',
		timeZone: 'UTC',
	}).format(date);
}

export function readingTime(body?: string) {
	const words = (body ?? '')
		.replace(/```[\s\S]*?```/g, '')
		.replace(/<[^>]+>/g, '')
		.trim()
		.split(/\s+/)
		.filter(Boolean).length;
	return Math.max(1, Math.ceil(words / 220));
}

function normalizeTarget(value: string) {
	return value
		.normalize('NFKD')
		.toLocaleLowerCase()
		.replace(/([0-9])\.(?=[0-9])/g, '$1')
		.replace(/['’]/g, '')
		.replace(/[^a-z0-9/]+/g, ' ')
		.trim();
}

function linksFrom(body?: string) {
	return [...(body ?? '').matchAll(/\[\[([^\]|#]+)(?:#[^\]|]+)?(?:\|[^\]]+)?\]\]/g)]
		.map((match) => match[1])
		.filter((target): target is string => target !== undefined)
		.map(normalizeTarget);
}

export function backlinksFor(target: NoteEntry, notes: NoteEntry[]) {
	const slug = noteSlug(target);
	const targetNames = new Set(
		[noteTitle(target), slug, slug.split('/').at(-1) ?? slug, ...target.data.aliases].map(normalizeTarget),
	);

	return orderedNotes(
		notes.filter(
			(note) => note.id !== target.id && linksFrom(note.body).some((link) => targetNames.has(link)),
		),
	);
}
