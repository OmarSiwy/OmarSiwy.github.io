import { visit } from 'unist-util-visit';

// Obsidian callouts: a blockquote whose first line is `> [!type]`, optionally
// followed by `+`/`-` (fold state) and a custom title.
//   > [!warning] Watch the sign
//   > body text
const calloutPattern = /^\[!([a-zA-Z-]+)\]([+-]?)\s*(.*)$/;

// Types the vault actually uses, mapped to the icon and accent shown in prose.css.
// Anything unrecognised falls back to `note` styling but keeps its own label.
const knownTypes = new Set([
	'note',
	'abstract',
	'info',
	'tip',
	'success',
	'question',
	'warning',
	'important',
	'example',
	'definition',
	'derivation',
	'annotation',
]);

function titleCase(value) {
	return value.charAt(0).toUpperCase() + value.slice(1);
}

/**
 * Rewrites Obsidian callouts into `<aside class="callout callout--warning">` with a
 * title row and body, so they render as callouts instead of plain blockquotes.
 * Foldable callouts (`[!type]-`) become `<details>`.
 */
export default function remarkCallouts() {
	return (tree) => {
		visit(tree, 'blockquote', (node) => {
			const [firstChild] = node.children;
			if (firstChild?.type !== 'paragraph') return;

			const [firstText] = firstChild.children;
			if (firstText?.type !== 'text') return;

			const [line, ...restOfParagraph] = firstText.value.split('\n');
			const match = calloutPattern.exec(line ?? '');
			if (!match) return;

			const [, rawType, fold, inlineTitle] = match;
			const type = rawType.toLowerCase();
			const variant = knownTypes.has(type) ? type : 'note';
			const title = inlineTitle?.trim() || titleCase(type.replace(/-/g, ' '));

			// Whatever followed the marker on the first paragraph stays as body text.
			const remainder = restOfParagraph.join('\n');
			const bodyChildren = [...node.children];
			if (remainder.trim().length > 0) {
				bodyChildren[0] = {
					...firstChild,
					children: [{ ...firstText, value: remainder }, ...firstChild.children.slice(1)],
				};
			} else if (firstChild.children.length > 1) {
				bodyChildren[0] = { ...firstChild, children: firstChild.children.slice(1) };
			} else {
				bodyChildren.shift();
			}

			const body = {
				type: 'paragraph',
				data: { hName: 'div', hProperties: { className: ['callout__body'] } },
				children: bodyChildren,
			};

			const foldable = fold === '+' || fold === '-';
			node.data = {
				hName: foldable ? 'details' : 'aside',
				hProperties: {
					className: ['callout', `callout--${variant}`],
					'data-callout': type,
					...(fold === '+' ? { open: true } : {}),
				},
			};
			node.children = [
				{
					type: 'paragraph',
					data: {
						hName: foldable ? 'summary' : 'div',
						hProperties: { className: ['callout__title'] },
					},
					children: [{ type: 'text', value: title }],
				},
				body,
			];
		});
	};
}
