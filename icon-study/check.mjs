import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
const html = await readFile(new URL('index.html', import.meta.url), 'utf8');
for (const name of ['01-simplified-flame.png', '02-constructed-flame.png', '03-framed-flame.png']) {
    const png = await readFile(new URL(name, import.meta.url));
    assert.equal(png.subarray(1, 4).toString(), 'PNG');
    assert.equal(png.readUInt32BE(16), png.readUInt32BE(20), 'Each source must be square');
    assert.equal(html.split(`src="${name}"`).length - 1, 7, 'Each concept needs seven size previews');
    for (const size of [128, 64, 48, 32, 24, 16]) assert.ok(html.includes(`src="${name}" width="${size}" height="${size}"`));
}
assert.ok(html.includes('width: 256px; height: 256px;'));
console.log('Three icon concepts, all seven preview sizes, and image assets checked.');
