import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';

const script = readFileSync(new URL('downloads.js', import.meta.url), 'utf8');
const html = readFileSync(new URL('index.html', import.meta.url), 'utf8');
const release = (version, published_at, prerelease = false) => ({
    tag_name: `v${version}`, published_at, prerelease,
    assets: [`greenflame-${version}-win-x64.exe`, 'greenflame.exe'].map(name => ({
        name, browser_download_url: `https://github.com/greenflamehq/greenflame/releases/download/v${version}/${name}`,
    })),
});
async function check(releases, ok = true) {
    const nodes = Object.fromEntries(['installer-download', 'portable-download', 'release-version', 'bottom-release-version']
        .map(id => [id, { href: 'fallback', textContent: 'fallback' }]));
    await runInNewContext(script, {
        fetch: async () => ({ ok, status: 403, json: async () => releases }),
        document: { getElementById: id => nodes[id] }, console: { warn() {} },
    });
    return nodes;
}
const older = release('1.0.0', '2026-09-01');
const latest = release('1.1.0-rc1', '2026-09-12', true);
const draft = { ...release('2.0.0', '2026-09-13'), draft: true };
const updated = await check([older, draft, latest]);
assert.equal(updated['release-version'].textContent, 'v1.1.0-rc1 · pre-release');
assert.equal(updated['bottom-release-version'].textContent, updated['release-version'].textContent);
assert.equal(updated['installer-download'].href, latest.assets[0].browser_download_url);
assert.equal(updated['portable-download'].href, latest.assets[1].browser_download_url);
assert.equal((await check([older]))['release-version'].textContent, 'v1.0.0');
for (const nodes of [await check([], false), await check([]), await check([{ ...latest, assets: [] }])]) {
    assert.ok(Object.values(nodes).every(node => node.href === 'fallback' && node.textContent === 'fallback'));
}
assert.match(html, /id="installer-download" href="https:\/\/github.com\/greenflamehq\/greenflame\/releases\/download\/v1.0.0-rc9\/greenflame-1.0.0-rc9-win-x64.exe"/);
assert.match(html, /id="portable-download" href="https:\/\/github.com\/greenflamehq\/greenflame\/releases\/download\/v1.0.0-rc9\/greenflame.exe"/);
assert.match(html, /class="wordmark"[^>]*><svg class="wordmark-flame"/);
assert.doesNotMatch(html, /identity-mark/);
assert.equal((html.match(/aria-hidden="true">↘<\/span>/g) ?? []).length, 3);
assert.match(html, /id="bottom-release-version">v1.0.0-rc9 · pre-release/);
assert.match(html, /download for windows<\/a><span class="bottom-download-arrow" aria-hidden="true">↘<\/span>/);
assert.doesNotMatch(html, /your next idea starts here|releases\/latest/);
const arrowLinks = [...html.matchAll(/<a\b[^>]*>[\s\S]*?<\/a>/g)]
    .map(match => match[0]).filter(link => /[↗↘↑↓]/.test(link));
assert.equal(arrowLinks.length, 1);
assert.match(arrowLinks[0], /id="installer-download"/);
console.log('Homepage download checks passed.');
