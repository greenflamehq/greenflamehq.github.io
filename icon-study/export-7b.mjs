import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const cwd = dirname(fileURLToPath(import.meta.url));
// Rasterize the exact inner 224px square, then restore its empty margin.
// Box sampling and explicit padding prevent resampling halos in the clear border.
for (const size of [256, 16]) {
    const margin = size / 16;
    const inner = size - 2 * margin;
    const file = `greenflame-7b-${size}.png`;
    execFileSync('magick', ['-density', '384', '-background', 'none', 'greenflame-7b-transparent.svg',
        '-resize', '1024x1024!', '-crop', '896x896+64+64', '+repage', '-filter', 'Box',
        '-resize', `${inner}x${inner}`, '-bordercolor', 'none', '-border', String(margin), '-strip', file], { cwd });
    const rgba = execFileSync('magick', [file, '-depth', '8', 'rgba:-'], { cwd });
    assert.equal(rgba.length, size * size * 4);
    let minX = size, minY = size, maxX = -1, maxY = -1;
    for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
            const i = (y * size + x) * 4;
            const alpha = rgba[i + 3];
            if (x < margin || y < margin || x >= size - margin || y >= size - margin) {
                assert.equal(alpha, 0, `${file}: padding must be completely transparent at ${x},${y}`);
            }
            if (alpha) {
                minX = Math.min(minX, x); minY = Math.min(minY, y);
                maxX = Math.max(maxX, x); maxY = Math.max(maxY, y);
                if (size === 256 && rgba[i + 1] > rgba[i] * 1.25 && rgba[i + 2] < 100) {
                    assert.ok(x > 31 && x < 225 && y > 30 && y < 226, 'Flame must be inside bracket inner rectangle');
                }
            }
        }
    }
    assert.deepEqual([minX, minY, maxX, maxY], [margin, margin, size - margin - 1, size - margin - 1]);
    console.log(`${file}: exact ${margin}px clear border on all four sides; occupied bounds verified.`);
}
