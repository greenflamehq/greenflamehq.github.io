import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
const guide = readFileSync(new URL('guide.html', import.meta.url), 'utf8');
const home = readFileSync(new URL('index.html', import.meta.url), 'utf8');
const ids = [...guide.matchAll(/\bid="([^"]+)"/g)].map(match => match[1]);
assert.equal(new Set(ids).size, ids.length, 'IDs must be unique');
for (const [, href] of guide.matchAll(/\bhref="([^"]+)"/g)) {
    if (href.startsWith('#') && href !== '#') assert.ok(ids.includes(href.slice(1)), `Missing anchor: ${href}`);
    else if (!href.startsWith('/') && !href.startsWith('https:')) {
        assert.ok(existsSync(new URL(href.split('?')[0], import.meta.url)), `Missing local resource: ${href}`);
    }
}
assert.doesNotMatch(guide, /docs-placeholder|placeholder-label|placeholder-size|cannot be re-edited|No installer|github.com\/joce\//);
assert.match(guide, /double-click it to resume editing/);
assert.match(guide, /"opacity_percent": 40/);
assert.match(home, /href="guide.html">the guide/);
assert.match(home, /<span aria-current="page">home<\/span>/);
assert.match(guide, /<span aria-current="page">the guide<\/span>/);
assert.match(guide, /<a href="\/">home<\/a>/);
assert.doesNotMatch(guide, /<a[^>]*>the guide<\/a>|>get greenflame<|>the tools</);
assert.doesNotMatch(home, />the tools</);
assert.match(home, /href="guide.html">explore the user guide/);
for (const [, link] of guide.matchAll(/(<a\b[^>]*>[\s\S]*?<\/a>)/g)) assert.doesNotMatch(link, /[↗↘↑↓]/);
const stack = [];
const voids = new Set(['meta', 'link', 'br', 'hr', 'img', 'input', 'wbr']);
for (const match of guide.matchAll(/<(\/?)([a-z][a-z0-9]*)\b[^>]*>/gi)) {
    const [, closing, name] = match;
    if (voids.has(name) || match[0].endsWith('/>')) continue;
    if (closing) assert.equal(stack.pop(), name, `Unbalanced tag at ${match.index}`);
    else stack.push(name);
}
assert.deepEqual(stack, []);
console.log('Guide links, structure, and content checks passed.');
