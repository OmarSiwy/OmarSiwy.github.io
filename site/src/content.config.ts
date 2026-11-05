import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const blog = defineCollection({
	loader: glob({ base: '../Blogs', pattern: '**/*.md' }),
	schema: z.object({
		title: z.string(),
		description: z.string(),
		publishedAt: z.coerce.date(),
		updatedAt: z.coerce.date().optional(),
		slug: z.string(),
		tags: z.array(z.string()).default([]),
		draft: z.boolean().default(false),
		cover: z.object({
			src: z.string(),
			alt: z.string(),
			width: z.number().int().positive(),
			height: z.number().int().positive(),
		}).optional(),
	}),
});

const notes = defineCollection({
	// Skip dotfiles (Obsidian config, `.zettel-*` planning docs) and vendored markdown.
	loader: glob({
		base: '../Notes',
		pattern: ['**/*.md', '!**/.*', '!**/.*/**', '!**/node_modules/**'],
	}),
	schema: z.object({
		title: z.string().optional(),
		description: z.string().optional(),
		slug: z.string().optional(),
		// `course`/`book`/`topic` are collection landing pages; the rest is the
		// zettelkasten vocabulary the vault itself uses.
		kind: z
			.enum([
				'course',
				'book',
				'topic',
				'hub',
				'concept',
				'circuit',
				'comparison',
				'structure',
				'exam',
				'literature',
				'reference',
			])
			.default('topic'),
		status: z.enum(['seedling', 'growing', 'evergreen', 'seed', 'needs-source']).default('seedling'),
		aliases: z.array(z.string()).default([]),
		order: z.number().int().default(100),
		updatedAt: z.coerce.date().optional(),
	}),
});

export const collections = { blog, notes };
