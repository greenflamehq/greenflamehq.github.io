import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { stripTypeScriptTypes } from 'node:module';
import { parseFlame, pointFor, movePoint, pathData, exportSvg, handles, offset, scale } from './editor.js';

const base = await readFile(new URL('../greenflame-7b-transparent.svg', import.meta.url), 'utf8');
const d = base.match(/id="flame"[^>]*\bd="([^"]*)"/)[1];
const original = parseFlame(d);
assert.deepEqual(parseFlame(pathData(original)), original, 'Unedited export preserves every original curve');
assert.deepEqual(pointFor(original, 'notch'), { x: 758, y: 721 });
const moved = movePoint(original, 'notch', { x: 778, y: 711 });
assert.deepEqual(pointFor(moved, 'notch'), { x: 778, y: 711 });
assert.deepEqual(moved.curves[2][1], { x: 757, y: 681 }, 'Incoming control travels with notch');
assert.deepEqual(moved.curves[3][0], { x: 820, y: 675 }, 'Outgoing control travels with notch');
assert.deepEqual(original, parseFlame(d), 'Original remains pristine for reset');
for (const i of [0, 4, 5, 6, 7, 8]) assert.deepEqual(moved.curves[i], original.curves[i], 'Outer curves stay fixed');
for (const h of handles) {
    const edited = movePoint(original, h.id, { x: 800, y: 600 });
    assert.notEqual(pathData(edited), pathData(original));
    const clamped = movePoint(original, h.id, { x: -1e6, y: 1e6 });
    const p = pointFor(clamped, h.id);
    assert.ok(Math.abs(p.x * scale + offset - 32) < 1e-9);
    assert.ok(Math.abs(p.y * scale + offset - 225) < 1e-9);
}
assert.throws(() => movePoint(original, 'notch', { x: NaN, y: 0 }));
assert.throws(() => parseFlame('M0 0L2 2Z'));
const transparent = exportSvg(base, moved, false);
const ivory = exportSvg(base, moved, true);
assert.equal(ivory.replace('\n    <rect id="background" width="256" height="256" fill="#eeecdf"/>', ''), transparent);
assert.ok(transparent.includes(pathData(moved)), 'Export contains the current edited curve');
assert.ok(!/<rect|<script|<image|class="handle"/.test(transparent));
for (const id of ['top-left', 'bottom-right']) {
    const pattern = new RegExp(`<path id="${id}"[^>]*>`);
    assert.equal(transparent.match(pattern)[0], base.match(pattern)[0], 'Brackets unchanged');
}
const html = await readFile(new URL('index.html', import.meta.url), 'utf8');
for (const id of ['editor', 'clean', 'small-previews', 'ivory', 'transparent', 'reset', 'point', 'x', 'y']) assert.ok(html.includes(`id="${id}"`));
const ts = await readFile(new URL('editor.ts', import.meta.url), 'utf8');
assert.equal(await readFile(new URL('editor.js', import.meta.url), 'utf8'), '// Generated from editor.ts by build.mjs.\n' + stripTypeScriptTypes(ts, { mode: 'strip' }));
console.log('All eight manipulators, anchor coupling, containment, reset data, clean SVG exports, and matching TypeScript/JavaScript checked.');
