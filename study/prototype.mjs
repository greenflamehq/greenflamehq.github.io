export const variants = ['A', 'B', 'C', 'D', 'E'];
export const normalizeVariant = key => variants.includes(key) ? key : 'A';
export const nextVariant = (key, direction) => variants[(variants.indexOf(normalizeVariant(key)) + direction + variants.length) % variants.length];
export const studyControlsEnabled = (hostname, pathname, protocol) => ['localhost', '127.0.0.1', '[::1]'].includes(hostname) || protocol === 'file:' || pathname === '/study' || pathname.startsWith('/study/');
if (typeof document !== 'undefined') {
    const picker = document.getElementById('variant');
    const show = key => {
        const selected = normalizeVariant(key);
        for (const section of document.querySelectorAll('.variant')) section.hidden = section.dataset.key !== selected;
        document.body.dataset.variant = selected;
        picker.value = selected;
        document.title = `greenflame — ${picker.selectedOptions[0].textContent}`;
        const url = new URL(location.href);
        url.searchParams.set('variant', selected);
        history.replaceState(null, '', url);
    };
    const cycle = direction => { show(nextVariant(picker.value, direction)); window.scrollTo(0, 0); };
    show(new URL(location.href).searchParams.get('variant'));
    // The public study has comparison controls; the production homepage does not.
    if (studyControlsEnabled(location.hostname, location.pathname, location.protocol)) {
        document.getElementById('switcher').hidden = false;
        picker.addEventListener('change', () => { show(picker.value); window.scrollTo(0, 0); });
        document.getElementById('previous').addEventListener('click', () => cycle(-1));
        document.getElementById('next').addEventListener('click', () => cycle(1));
        document.addEventListener('keydown', event => {
            if (event.altKey || event.ctrlKey || event.metaKey || event.target.closest('input,textarea,select,[contenteditable]')) return;
            if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') { event.preventDefault(); cycle(event.key === 'ArrowLeft' ? -1 : 1); }
        });
        window.addEventListener('popstate', () => show(new URL(location.href).searchParams.get('variant')));
    }
}
