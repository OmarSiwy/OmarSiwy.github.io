// Render one tikz/circuitikz block to a PNG so you can eyeball it before committing.
//   nix develop path:. --command bun build/markdown/preview-diagram.mjs block.tikz [out.png]
// The block file holds exactly what goes inside the ```tikz fence, so what you
// preview is what the site build compiles.
import { spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, writeFileSync, copyFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

import { latexDiagramDocument } from '../../site/src/lib/remark-wiki-links.mjs';

const [blockPath, outPath = 'preview.png'] = process.argv.slice(2);
if (!blockPath) throw new Error('usage: preview-diagram.mjs <block-file> [out.png]');

const language = blockPath.includes('circuitikz') ? 'circuitikz' : 'tikz';
const workingDirectory = mkdtempSync(join(tmpdir(), 'tikz-preview-'));
writeFileSync(
	join(workingDirectory, 'diagram.tex'),
	latexDiagramDocument(language, readFileSync(blockPath, 'utf8')),
);

function run(command, args) {
	const result = spawnSync(command, args, { cwd: workingDirectory, encoding: 'utf8' });
	if (result.status !== 0) {
		console.error(`${result.stdout}\n${result.stderr}`.trim().slice(-4000));
		process.exit(1);
	}
}

run('pdflatex', ['-no-shell-escape', '-interaction=nonstopmode', '-halt-on-error', 'diagram.tex']);
run('pdftoppm', ['-r', '150', '-png', '-singlefile', 'diagram.pdf', 'preview']);
copyFileSync(join(workingDirectory, 'preview.png'), resolve(outPath));
console.log(resolve(outPath));
