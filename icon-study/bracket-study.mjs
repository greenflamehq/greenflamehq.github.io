// Regenerate the comparison from the unchanged #7B SVG: node icon-study/bracket-study.mjs
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
const cwd = fileURLToPath(new URL('.', import.meta.url));
const base = readFileSync(new URL('greenflame-7b.svg', import.meta.url), 'utf8');
const colors = ['30312e', '50514b', '68695f', '808173', '98998a', 'b0b19f', '808173'];
const names = ['Original charcoal', 'Soft charcoal', 'Mid gray', 'Quiet gray', 'Light gray', 'Pale gray', 'D + darker flame'];
const linear = c => c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
const luminance = hex => hex.match(/../g).map(c => linear(parseInt(c, 16) / 255)).reduce((s, c, i) => s + c * [0.2126, 0.7152, 0.0722][i], 0);
const contrast = hex => (luminance('eeecdf') + 0.05) / (luminance(hex) + 0.05);
const gray = hex => {
    const l = luminance(hex);
    const value = Math.round(255 * (l <= 0.0031308 ? l * 12.92 : 1.055 * l ** (1 / 2.4) - 0.055));
    return value.toString(16).padStart(2, '0').repeat(3);
};
assert.ok(Math.abs(contrast('78d600') - 1.5502127449635443) < 1e-10);
assert.ok(Math.abs(contrast('000000') / contrast('ffffff') - 21) < 1e-10);
mkdirSync(new URL('brackets/', import.meta.url), { recursive: true });
const magick = args => execFileSync('magick', args, { cwd, maxBuffer: 8 * 1024 * 1024 });
let previous = Infinity;
const cards = colors.map((color, index) => {
    const prefix = `brackets/${index + 1}`;
    const flame = index === 6 ? '559800' : '78d600';
    const svg = base.replace('fill="#30312e"', `fill="#${color}"`).replace('fill="#78d600"', `fill="#${flame}"`);
    assert.equal(svg.replace(`fill="#${color}"`, 'fill="#30312e"').replace(`fill="#${flame}"`, 'fill="#78d600"'), base, 'Only the requested colors may change');
    if (index < 6) { assert.ok(contrast(color) < previous); previous = contrast(color); }
    else { assert.ok(contrast(flame) >= 3 && contrast(color) >= 3); }
    writeFileSync(new URL(prefix + '.svg', import.meta.url), svg);
    const monochrome = svg.replace(/#[0-9a-f]{6}/g, hex => '#' + gray(hex.slice(1)));
    writeFileSync(new URL(prefix + '-gray.svg', import.meta.url), monochrome);
    for (const [suffix, background] of [['', 'eeecdf'], ['-gray', gray('eeecdf')]]) {
        const sourceFile = prefix + suffix + '.svg';
        for (const size of [16, 24, 32, 48, 64, 128, 256]) {
            const file = prefix + suffix + '-' + size + '.png';
            magick(['-density', '384', '-background', '#' + background, sourceFile,
                '-resize', '1024x1024!', '-crop', '896x896+64+64', '+repage',
                '-bordercolor', '#' + background, '-border', '64', '-filter', 'Box',
                '-resize', `${size}x${size}!`, '-alpha', 'off', '-depth', '8', '-strip', file]);
            if (size === 16) {
                const rgba = magick([file, '-depth', '8', 'rgba:-']);
                const bg = background.match(/../g).map(c => parseInt(c, 16));
                for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
                    const pixel = [...rgba.subarray((y * size + x) * 4, (y * size + x + 1) * 4)];
                    assert.equal(pixel[3], 255);
                    if (x === 0 || y === 0 || x === size - 1 || y === size - 1) assert.deepEqual(pixel.slice(0, 3), bg);
                }
            }
        }
    }
    const picture = (size, zoom = false) => `<span class="bracket-sample"><span class="bracket-image${zoom ? ' pixel-zoom' : ''}"><img class="color-view" src="${prefix}-${size}.png" width="${zoom ? 96 : size}" height="${zoom ? 96 : size}" alt="${names[index]} at ${size}px${zoom ? ', enlarged six times' : ''}"><img class="gray-view" src="${prefix}-gray-${size}.png" width="${zoom ? 96 : size}" height="${zoom ? 96 : size}" alt="${names[index]} brightness-only at ${size}px${zoom ? ', enlarged six times' : ''}"></span><span>${zoom ? '16px × 6 (pixels)' : size + 'px'}</span></span>`;
    return `<article class="bracket-card"${index === 6 ? ' id="selected-palette"' : ''}><h3>${String.fromCharCode(65 + index)} · ${names[index]}</h3><p><code>#${color}</code> · brackets ${contrast(color).toFixed(2)}:1${index === 0 ? ' · RC8 baseline' : ''}</p>${index === 6 ? `<p>Selected combination · flame <code>#${flame}</code> <strong>${contrast(flame).toFixed(2)}:1</strong> · beige <code>#eeecdf</code>. Both flat colors meet 3:1 against the background.</p>` : ''}<div class="bracket-strip">${[16, 24, 32, 48, 64].map(size => picture(size)).join('')}</div><div class="bracket-large">${picture(16, true)}${picture(128)}</div><p><a href="${prefix}.svg" download>Beige SVG</a> · <a href="${prefix}-256.png" download>256px PNG</a></p></article>`;
});
const pageFile = new URL('index.html', import.meta.url);
const page = readFileSync(pageFile, 'utf8');
assert.ok(page.includes('<!-- BRACKET_CARDS -->') && page.includes('<!-- /BRACKET_CARDS -->'));
writeFileSync(pageFile, page.replace(/<!-- BRACKET_CARDS -->[\s\S]*?<!-- \/BRACKET_CARDS -->/, '<!-- BRACKET_CARDS -->\n' + cards.join('\n') + '\n<!-- /BRACKET_CARDS -->'));
console.log('Six bracket shades plus the selected darker-flame combination generated. Contrast, paired grayscale, seven sizes and exact 16px borders checked.');
