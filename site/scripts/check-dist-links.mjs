// Built-site check: no raw [[wiki]] text, every note page exists, every #anchor hits a real heading id.
// Run from the repo root after astro build.
import fs from 'node:fs'; import path from 'node:path';
const dist = 'site/dist'; process.chdir(new URL('../..', import.meta.url).pathname);
const pages = [];
(function walk(d){ for (const e of fs.readdirSync(d,{withFileTypes:true})) { const p=path.join(d,e.name); if (e.isDirectory()) walk(p); else if (e.name==='index.html') pages.push(p); } })(path.join(dist,'notes'));
const ids = new Map();
for (const p of pages) ids.set(p, new Set([...fs.readFileSync(p,'utf8').matchAll(/\sid="([^"]+)"/g)].map(m=>m[1])));
let raw=[], badSame=[], badCross=[], missingPage=new Set(), links=0;
for (const p of pages) {
  const html = fs.readFileSync(p,'utf8');
  const prose = html.replace(/<pre[\s\S]*?<\/pre>|<code[\s\S]*?<\/code>|<span class="katex[\s\S]*?<\/annotation>/g,'');
  for (const m of prose.matchAll(/\[\[[^\]]{0,80}/g)) raw.push(`${p}: ${m[0]}`);
  for (const m of html.matchAll(/<a [^>]*href="([^"]*)"([^>]*)>/g)) {
    const [href, rest] = [m[1].replace(/&amp;/g,'&'), m[2]];
    if (/unresolved-wiki-link/.test(m[0])) continue;   // planned links, reported by check:content
    if (href.startsWith('#')) { links++; const id=decodeURIComponent(href.slice(1)); if (id && !ids.get(p).has(id)) badSame.push(`${p}: ${href}`); }
    else if (href.startsWith('/notes/')) {
      links++; const [route, hash] = href.split('#'); const target = path.join(dist, route, 'index.html');
      if (!fs.existsSync(target)) missingPage.add(`${p} -> ${route}`);
      else if (hash && !ids.get(target)?.has(decodeURIComponent(hash))) badCross.push(`${p}: ${href}`);
    }
  }
}
// every published note source has a page
const src=[]; (function walk(d){ for (const e of fs.readdirSync(d,{withFileTypes:true})) { if (e.name.startsWith('.')||e.name==='node_modules') continue; const p=path.join(d,e.name); if (e.isDirectory()) walk(p); else if (p.endsWith('.md')) src.push(p);} })('Notes');
console.log(`note sources ${src.length}, note pages ${pages.length - 1 /* index */}, links checked ${links}`);
for (const [n,a] of [['raw [[ left',raw],['same-page anchor missing',badSame],['cross-note anchor missing',badCross],['link to missing page',[...missingPage]]]) { console.log(`${n}: ${a.length}`); a.slice(0,8).forEach(x=>console.log('  '+x.replace(dist+'/',''))); }
if (raw.length + badSame.length + badCross.length + missingPage.size) process.exit(1);
