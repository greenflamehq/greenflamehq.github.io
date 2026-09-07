import assert from 'node:assert/strict';
import { frameRect, cropPixels } from './afterimage.mjs';

// Reverse drags, off-canvas release, empty frames, and fractional-DPI crops.
assert.deepEqual(frameRect({ x: 90, y: 80 }, { x: 10, y: 20 }, 100, 100), { x: 10, y: 20, width: 80, height: 60 });
assert.deepEqual(frameRect({ x: -20, y: 90 }, { x: 120, y: -10 }, 100, 80), { x: 0, y: 0, width: 100, height: 80 });
assert.deepEqual(frameRect({ x: 120, y: 90 }, { x: 150, y: 110 }, 100, 80), { x: 100, y: 80, width: 0, height: 0 });
assert.equal(frameRect({ x: NaN, y: 0 }, { x: 1, y: 1 }, 100, 100), null);
assert.equal(frameRect({ x: 0, y: 0 }, { x: 1, y: 1 }, 0, 100), null);
assert.deepEqual(cropPixels({ x: 1, y: 1, width: 3, height: 3 }, 100, 80, 150, 120), { x: 1, y: 1, width: 5, height: 5 });
assert.deepEqual(cropPixels({ x: -1, y: -1, width: 102, height: 82 }, 100, 80, 200, 160), { x: 0, y: 0, width: 200, height: 160 });
assert.deepEqual(cropPixels({ x: 99.5, y: 79.5, width: 10, height: 10 }, 100, 80, 150, 120), { x: 149, y: 119, width: 1, height: 1 });
assert.equal(cropPixels({ x: 0, y: 0, width: 0, height: 10 }, 100, 80, 200, 160), null);
assert.equal(cropPixels({ x: 0, y: 0, width: 10, height: 10 }, 100, 80, 0, 160), null);
console.log('Afterimage geometry checks passed.');
