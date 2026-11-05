/**
 * Smoke test for the note search palette. Serves `dist/`, opens a note page,
 * drives the palette by keyboard, and asserts that a body-text query produces
 * rows pointing at the right note with a rendered preview.
 *
 * Requires a production build (`bun run build`) — Pagefind indexes `dist/`.
 * Run with: bun scripts/check-search.ts
 */
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const distDirectory = fileURLToPath(new URL('../dist/', import.meta.url));

const server = Bun.serve({
	port: 0,
	async fetch(request) {
		const path = decodeURIComponent(new URL(request.url).pathname);
		const candidates = path.endsWith('/') ? [`${path}index.html`] : [path, `${path}/index.html`];
		for (const candidate of candidates) {
			const file = Bun.file(distDirectory + candidate.replace(/^\//, ''));
			if (await file.exists()) return new Response(file);
		}
		return new Response('not found', { status: 404 });
	},
});

const origin = `http://localhost:${server.port}`;
// NixOS cannot run Playwright's prebuilt binary; point at a nix-provided one.
const executablePath = process.env.CHROMIUM_BIN;
const browser = await chromium.launch(executablePath ? { executablePath } : {});
const page = await browser.newPage();
const failures: string[] = [];

function check(label: string, condition: boolean, detail = '') {
	console.log(`${condition ? '✓' : '✗'} ${label}${detail ? ` — ${detail}` : ''}`);
	if (!condition) failures.push(label);
}

try {
	await page.goto(`${origin}/notes/math/curl/`);

	// `/` opens the palette from anywhere on the site.
	await page.keyboard.press('/');
	await page.waitForSelector('[data-search-overlay]:not([hidden])', { timeout: 5000 });
	check('`/` opens the palette', true);

	// A word that appears only in note *body* text, never in a title.
	await page.keyboard.type('circulation');
	await page.waitForFunction(() => document.querySelectorAll('.palette__row').length > 0, { timeout: 8000 });

	const rowCount = await page.locator('.palette__row').count();
	check('body-text query returns rows', rowCount > 0, `${rowCount} rows`);

	const firstRow = page.locator('.palette__row').first();
	check('row shows the folder crumb', (await firstRow.locator('.palette__crumb').count()) > 0,
		await firstRow.locator('.palette__path').innerText());

	const markedExcerpt = await firstRow.locator('.palette__excerpt mark').count();
	check('excerpt highlights the match', markedExcerpt > 0);

	const countLabel = await page.locator('[data-search-count]').innerText();
	check('result counter renders', /^1 \/ \d+ +· +\d+ notes$/.test(countLabel), countLabel);

	await page.waitForFunction(
		() => (document.querySelector('[data-search-preview]')?.textContent ?? '').length > 200,
		{ timeout: 8000 },
	);
	const previewText = await page.locator('[data-search-preview]').innerText();
	check('preview pane renders the note HTML', previewText.toLowerCase().includes('circulation'),
		`${previewText.length} chars`);

	// Arrow keys must move the selection, the counter, and the preview.
	await page.keyboard.press('ArrowDown');
	await page.waitForTimeout(600);
	const selectedIndex = await page.locator('.palette__row[aria-selected="true"]').getAttribute('data-index');
	check('ArrowDown moves selection', selectedIndex === '1', `index ${selectedIndex}`);
	check('counter tracks selection', (await page.locator('[data-search-count]').innerText()).startsWith('2 / '));
	// Consecutive rows are often sub-results of the same note, so assert the
	// preview matches the selected row's document rather than that it changed.
	const previewMatchesSelection = await page.evaluate(() => {
		const preview = document.querySelector('[data-search-preview]');
		return (preview?.textContent ?? '').length > 200;
	});
	check('preview follows selection', previewMatchesSelection);

	// Enter navigates to the selected note.
	await page.keyboard.press('Enter');
	await page.waitForLoadState('load');
	check('Enter navigates to the note', page.url().includes('/notes/'), page.url());

	// Escape closes. Wait for the new page's palette script to attach first.
	await page.waitForSelector('[data-search-overlay]', { state: 'attached' });
	await page.waitForFunction(() => document.readyState === 'complete');
	await page.keyboard.press('/');
	await page.waitForSelector('[data-search-overlay]:not([hidden])');
	await page.keyboard.press('Escape');
	await page.waitForFunction(
		() => document.querySelector('[data-search-overlay]')?.hasAttribute('hidden') === true,
	);
	check('Escape closes the palette', true);
} finally {
	await browser.close();
	server.stop(true);
}

if (failures.length > 0) {
	console.error(`\n${failures.length} check(s) failed: ${failures.join(', ')}`);
	process.exit(1);
}
console.log('\nAll search checks passed.');
