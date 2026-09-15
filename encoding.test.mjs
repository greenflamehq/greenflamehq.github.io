import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';

for (const file of readdirSync(new URL('.', import.meta.url)).filter(file => file.endsWith('.html'))) {
    const html = readFileSync(new URL(file, import.meta.url), 'utf8');
    assert.doesNotMatch(html, /\u0393[\u00c7\u00e5]|\u00e2[\u20ac\u2020]|\ufffd/, `${file}: corrupted UTF-8 text`);
}
console.log('HTML encoding checks passed.');
