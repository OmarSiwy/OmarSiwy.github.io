import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';

import { blogUrl, visibleBlogs } from '../lib/content';

export async function GET(context: { site?: URL }) {
	const posts = visibleBlogs(await getCollection('blog'));

	return rss({
		title: 'Omar El-Sawy | Blog',
		description: 'Writing about analog and digital hardware, EDA, and engineering systems.',
		site: context.site ?? new URL('https://omarelsawy.com'),
		items: posts.map((post) => ({
			title: post.data.title,
			description: post.data.description,
			pubDate: post.data.publishedAt,
			link: blogUrl(post),
			categories: post.data.tags,
		})),
	});
}
