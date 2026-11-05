/**
 * Checks that Obsidian callouts survive the markdown pipeline.
 * Run with: bun scripts/check-callouts.ts
 */
import rehypeStringify from 'rehype-stringify';
import remarkParse from 'remark-parse';
import remarkRehype from 'remark-rehype';
import { unified } from 'unified';

import remarkCallouts from '../src/lib/remark-callouts.mjs';

const processor = unified()
	.use(remarkParse)
	.use(remarkCallouts)
	.use(remarkRehype, { allowDangerousHtml: true })
	.use(rehypeStringify, { allowDangerousHtml: true });

const render = (markdown: string) => String(processor.processSync(markdown));

const failures: string[] = [];
function check(label: string, condition: boolean, detail = '') {
	console.log(`${condition ? '✓' : '✗'} ${label}${detail ? ` — ${detail}` : ''}`);
	if (!condition) failures.push(label);
}

const basic = render('> [!warning]\n> Watch the sign here.');
check('renders an aside with the variant class', basic.includes('class="callout callout--warning"'), basic.trim());
check('derives a title from the type', basic.includes('>Warning<'));
check('keeps the body text', basic.includes('Watch the sign here.'));
check('is not a blockquote', !basic.includes('<blockquote'));

const titled = render('> [!question] Why does this hold?\n> Because of symmetry.');
check('uses the custom title', titled.includes('>Why does this hold?<'));
check('does not leak the marker into the body', !titled.includes('[!question]'));

const foldable = render('> [!tip]- Hidden by default\n> Fold me.');
check('foldable callout becomes <details>', foldable.includes('<details') && foldable.includes('<summary'));
check('collapsed callout is not open', !/<details[^>]*\bopen\b/.test(foldable));

const expanded = render('> [!tip]+ Open by default\n> Visible.');
check('`+` renders an open <details>', /<details[^>]*\bopen\b/.test(expanded));

const uppercase = render('> [!NOTE]\n> Case should not matter.');
check('type matching is case-insensitive', uppercase.includes('callout--note'));

const unknown = render('> [!bogus]\n> Unknown types still render.');
check('unknown type falls back to note styling', unknown.includes('callout--note'));
check('unknown type keeps its own label', unknown.includes('>Bogus<'));

const quote = render('> Just an ordinary quotation.');
check('plain blockquotes are untouched', quote.includes('<blockquote') && !quote.includes('callout'));

const multiline = render('> [!important]\n> First paragraph.\n>\n> Second paragraph.');
check('multi-paragraph body is preserved', (multiline.match(/<p>/g) ?? []).length >= 2, multiline.trim());

if (failures.length > 0) {
	console.error(`\n${failures.length} check(s) failed: ${failures.join(', ')}`);
	process.exit(1);
}
console.log('\nAll callout checks passed.');
