import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { stripTypeScriptTypes } from 'node:module';
import { parseFlame, pointFor, movePoint, linkHandles, pathData, exportSvg, handles, offset, scale } from './editor.js';

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
const vector = (flame, id) => {
    const a = id === 'left-0' || id === 'left-1' ? flame.curves[0][2] : pointFor(flame, 'bend'), p = pointFor(flame, id);
    return { x: p.x - a.x, y: p.y - a.y };
};
const length = v => Math.hypot(v.x, v.y);
const near = (a, b) => assert.ok(Math.abs(a - b) < 1e-7, `${a} != ${b}`);
function checkLocks(flame, locks, upper = false) {
    const ids = upper ? ['left-0', 'left-1'] : ['left-2', 'left-3'];
    const a = vector(flame, ids[0]), b = vector(flame, ids[1]);
    if (locks.collinear) { near(a.x * b.y - a.y * b.x, 0); assert.ok(a.x * b.x + a.y * b.y <= 1e-7); }
    if (locks.equalLength) near(length(a), length(b));
    for (const id of ['bend', ...ids]) {
        const p = pointFor(flame, id), x = p.x * scale + offset, y = p.y * scale + offset;
        assert.ok(x >= 32 - 1e-7 && x <= 224 + 1e-7 && y >= 31 - 1e-7 && y <= 225 + 1e-7);
    }
}
for (const collinear of [false, true]) for (const equalLength of [false, true]) {
    const locks = { collinear, equalLength };
    for (const driver of ['left-2', 'left-3']) {
        const other = driver === 'left-2' ? 'left-3' : 'left-2';
        const linked = linkHandles(original, driver, locks);
        checkLocks(linked, locks);
        const edited = movePoint(linked, driver, { x: 790, y: 580 }, locks);
        checkLocks(edited, locks);
        if (!collinear && !equalLength) assert.deepEqual(pointFor(edited, other), pointFor(original, other));
        if (collinear && !equalLength) near(length(vector(edited, other)), length(vector(linked, other)));
        if (!collinear && equalLength) {
            const before = vector(linked, other), after = vector(edited, other);
            near(before.x * after.y - before.y * after.x, 0);
            assert.ok(before.x * after.x + before.y * after.y >= 0);
        }
        for (const extreme of [{ x: -1e6, y: 1e6 }, { x: 1e6, y: -1e6 }, pointFor(linked, 'bend')]) {
            const edge = movePoint(linked, driver, extreme, locks);
            checkLocks(edge, locks);
            checkLocks(movePoint(edge, 'bend', extreme, locks), locks);
        }
        const translated = movePoint(linked, 'bend', { x: 750, y: 630 }, locks);
        if (collinear || equalLength) {
            near(length(vector(translated, driver)), length(vector(linked, driver)));
            near(length(vector(translated, other)), length(vector(linked, other)));
        }
        assert.ok(exportSvg(base, edited, false).includes(pathData(edited)));
    }
}
assert.ok(!handles.some(h => h.segment === 0 && h.point === 2), 'Fixed upper anchor has no manipulator or coordinate option');
const off = { collinear: false, equalLength: false }, both = { collinear: true, equalLength: true };
for (const collinear of [false, true]) for (const equalLength of [false, true]) {
    const locks = { collinear, equalLength };
    for (const driver of ['left-0', 'left-1']) {
        const other = driver === 'left-0' ? 'left-1' : 'left-0';
        const linked = linkHandles(original, driver, locks);
        checkLocks(linked, locks, true);
        const edited = movePoint(linked, driver, { x: 820, y: 350 }, off, locks);
        checkLocks(edited, locks, true);
        if (!collinear && !equalLength) assert.deepEqual(pointFor(edited, other), pointFor(original, other));
        if (collinear && !equalLength) near(length(vector(edited, other)), length(vector(linked, other)));
        if (!collinear && equalLength) {
            const before = vector(linked, other), after = vector(edited, other);
            near(before.x * after.y - before.y * after.x, 0);
            assert.ok(before.x * after.x + before.y * after.y >= 0);
        }
        for (const target of [{ x: -1e6, y: 1e6 }, { x: 1e6, y: -1e6 }, original.curves[0][2]]) {
            const edge = movePoint(linked, driver, target, off, locks);
            checkLocks(edge, locks, true);
            assert.deepEqual(edge.curves[0][2], original.curves[0][2], 'Upper anchor never moves');
            assert.deepEqual(edge.curves[0][0], original.curves[0][0]);
            assert.deepEqual(edge.curves[1].slice(1), original.curves[1].slice(1));
            assert.deepEqual(edge.curves.slice(2), original.curves.slice(2), 'Upper controls do not alter other curves');
        }
        assert.ok(exportSvg(base, edited, false).includes(pathData(edited)));
    }
}
let independent = linkHandles(linkHandles(original, 'left-0', both), 'left-2', both);
for (const id of ['left-0', 'left-1', 'left-2', 'left-3', 'bend', 'notch']) {
    const before = structuredClone(independent);
    independent = movePoint(independent, id, { x: 810, y: 550 }, both, both);
    checkLocks(independent, both, true);
    checkLocks(independent, both);
    assert.deepEqual(independent.curves[0][2], original.curves[0][2]);
    const untouched = id === 'left-0' || id === 'left-1' ? ['left-2', 'left-3'] : ['left-0', 'left-1'];
    for (const handle of untouched) assert.deepEqual(pointFor(independent, handle), pointFor(before, handle), 'Pairs operate independently');
}
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
for (const id of ['editor', 'clean', 'small-previews', 'ivory', 'transparent', 'reset', 'point', 'x', 'y', 'collinear', 'equal-length', 'bend-options', 'upper-collinear', 'upper-equal-length', 'upper-options']) assert.ok(html.includes(`id="${id}"`));
const ts = await readFile(new URL('editor.ts', import.meta.url), 'utf8');
assert.equal(await readFile(new URL('editor.js', import.meta.url), 'utf8'), '// Generated from editor.ts by build.mjs.\n' + stripTypeScriptTypes(ts, { mode: 'strip' }).replace(/[ \t]+$/gm, ''));
console.log('Both handle pairs, all lock combinations and drivers, fixed upper anchor, independent constraints, boundary/zero-length cases, exports, and generated JavaScript checked.');
