// Keep the version and both assets together, including published release candidates.
(async () => {
    try {
        const response = await fetch('https://api.github.com/repos/greenflamehq/greenflame/releases?per_page=100');
        if (!response.ok) throw new Error(`Release lookup failed: ${response.status}`);
        const releases = await response.json();
        const release = releases.filter(item => !item.draft)
            .sort((a, b) => Date.parse(b.published_at) - Date.parse(a.published_at))[0];
        const version = release.tag_name.replace(/^v/, '');
        const installer = release.assets.find(asset => asset.name === `greenflame-${version}-win-x64.exe`);
        const portable = release.assets.find(asset => asset.name === 'greenflame.exe');
        const prefix = `https://github.com/greenflamehq/greenflame/releases/download/${release.tag_name}/`;
        if (!installer?.browser_download_url.startsWith(prefix) || !portable?.browser_download_url.startsWith(prefix)) {
            throw new Error('Release download assets are unavailable');
        }
        document.getElementById('installer-download').href = installer.browser_download_url;
        document.getElementById('portable-download').href = portable.browser_download_url;
        for (const id of ['release-version', 'bottom-release-version']) {
            document.getElementById(id).textContent = `${release.tag_name}${release.prerelease ? ' · pre-release' : ''}`;
        }
    } catch (error) {
        // The verified HTML downloads remain usable offline or when GitHub rate-limits requests.
        console.warn('Using the bundled greenflame release links.', error);
    }
})();
