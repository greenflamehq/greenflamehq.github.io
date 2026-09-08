import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
const html = await readFile(new URL('index.html', import.meta.url), 'utf8');
for (const name of ['01-simplified-flame.png', '02-constructed-flame.png', '03-framed-flame.png', '04-solid-capture.png', '05-green-window.png', '06-unified-flame.png']) {
    const png = await readFile(new URL(name, import.meta.url));
    assert.equal(png.subarray(1, 4).toString(), 'PNG');
    assert.equal(png.readUInt32BE(16), png.readUInt32BE(20), 'Each source must be square');
    assert.equal(html.split(`src="${name}"`).length - 1, 7, 'Each concept needs seven size previews');
    for (const size of [128, 64, 48, 32, 24, 16]) assert.ok(html.includes(`src="${name}" width="${size}" height="${size}"`));
}
assert.ok(html.includes('width: 256px; height: 256px;'));
assert.ok(html.includes('<details id="round-2" open>'), 'Round two is visible by default');
assert.ok(html.includes('<details id="round-1">'), 'Round one remains available');
assert.equal((html.match(/<summary>/g) || []).length, 2);
assert.equal((html.match(/<\/details>/g) || []).length, 2);
assert.ok(!html.includes('ROUND_TWO'));
console.log('Both rounds, native round controls, six icon assets, and all seven sizes checked.');
