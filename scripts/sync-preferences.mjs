import { readFile, writeFile } from 'node:fs/promises';
const root = new URL('../', import.meta.url);
const index = new URL('index.html', root);
const preferences = await readFile(new URL('assets/preferences.js', root), 'utf8');
const html = await readFile(index, 'utf8');
const pattern = /(<script id="portfolio-preferences">)[\s\S]*?(<\/script>)/;
if (!pattern.test(html)) throw new Error('Missing early preferences script');
await writeFile(index, html.replace(pattern, (_, opening, closing) => opening + preferences + closing));
console.log('Updated the first-paint preferences in index.html.');
