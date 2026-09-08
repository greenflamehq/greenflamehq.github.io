import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
const html = await readFile(new URL('index.html', import.meta.url), 'utf8');
for (const name of ['01-simplified-flame.png', '02-constructed-flame.png', '03-framed-flame.png', '04-solid-capture.png', '05-green-window.png', '06-unified-flame.png', '07-combined-flame.png', '08-airy-frame.png', '09-bold-frame.png', '10-contained-flame.png']) {
    const png = await readFile(new URL(name, import.meta.url));
    assert.equal(png.subarray(1, 4).toString(), 'PNG');
    assert.equal(png.readUInt32BE(16), png.readUInt32BE(20), 'Each source must be square');
    assert.equal(html.split(`src="${name}"`).length - 1, name === '07-combined-flame.png' ? 14 : 7, 'Seven previews per concept; original #7 also appears beside its revision');
    for (const size of [128, 64, 48, 32, 24, 16]) assert.ok(html.includes(`src="${name}" width="${size}" height="${size}"`));
}
assert.ok(html.includes('width: 256px; height: 256px;'));
assert.ok(html.includes('<details id="revision-7" open>'), 'The refinement is visible by default');
assert.ok(html.includes('<details id="round-3">'), 'Round three remains available');
assert.ok(html.includes('<details id="round-2">'), 'Round two remains available');
assert.ok(html.includes('<details id="round-1">'), 'Round one remains available');
assert.equal((html.match(/<summary>/g) || []).length, 4);
assert.equal((html.match(/<\/details>/g) || []).length, 4);
assert.ok(!html.includes('ROUND_TWO'));
const opaque = await readFile(new URL('greenflame-7a.svg', import.meta.url), 'utf8');
const transparent = await readFile(new URL('greenflame-7a-transparent.svg', import.meta.url), 'utf8');
assert.equal(transparent.replace(/\r/g, ''), opaque.replace(/\r/g, '').replace(/^.*<rect id="background"[^\n]*\n/m, ''), 'Transparent SVG must differ only by removal of its background');
assert.ok(!transparent.includes('<rect'));
for (const name of ['greenflame-7a.svg', 'greenflame-7a-transparent.svg']) {
    assert.ok(html.includes(`href="${name}" download`), 'Both SVGs need download links');
}
console.log('All rounds, seven preview sizes, both SVG downloads, and transparent variant checked.');
