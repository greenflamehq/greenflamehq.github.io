// Browser-only workshop. Rebuild editor.js with: node icon-study/workshop/build.mjs
export type Point = { x: number; y: number };
export type Curve = [Point, Point, Point];
export type Flame = { start: Point; curves: Curve[] };
export type BendLocks = { collinear: boolean; equalLength: boolean };
export const scale = 0.9 * 0.2041467305;
export const offset = 12.8;
export const handles = [
    { id: 'left-1', label: 'Left curve · upper handle', segment: 1, point: 0, kind: 'control' },
    { id: 'left-2', label: 'Left curve · bend incoming', segment: 1, point: 1, kind: 'control' },
    { id: 'left-3', label: 'Left curve · bend outgoing', segment: 2, point: 0, kind: 'control' },
    { id: 'left-4', label: 'Left curve · notch incoming', segment: 2, point: 1, kind: 'control' },
    { id: 'right-1', label: 'Right curve · notch outgoing', segment: 3, point: 0, kind: 'control' },
    { id: 'right-2', label: 'Right curve · upper handle', segment: 3, point: 1, kind: 'control' },
    { id: 'bend', label: 'Inner bend', segment: 1, point: 2, kind: 'anchor' },
    { id: 'notch', label: 'Inward notch', segment: 2, point: 2, kind: 'notch' },
] as const;
export type HandleId = typeof handles[number]['id'];

export function parseFlame(d: string): Flame {
    const tokens = d.match(/[MCZ]|-?\d+(?:\.\d+)?/g) ?? [];
    if (tokens.join('') !== d.replace(/[\s,]/g, '') || tokens[0] !== 'M' || tokens.at(-1) !== 'Z') throw new Error('Unsupported flame path');
    const start = { x: Number(tokens[1]), y: Number(tokens[2]) };
    const curves: Curve[] = [];
    for (let i = 3; i < tokens.length - 1; i += 7) {
        if (tokens[i] !== 'C') throw new Error('Expected cubic Bézier curves');
        const n = tokens.slice(i + 1, i + 7).map(Number);
        if (n.length !== 6 || n.some(v => !Number.isFinite(v))) throw new Error('Invalid curve');
        curves.push([{ x: n[0], y: n[1] }, { x: n[2], y: n[3] }, { x: n[4], y: n[5] }]);
    }
    if (curves.length !== 9 || !Number.isFinite(start.x + start.y)) throw new Error('Unexpected #7B geometry');
    return { start, curves };
}

export function pointFor(flame: Flame, id: HandleId): Point {
    const h = handles.find(h => h.id === id);
    if (!h) throw new Error('Unknown handle');
    return flame.curves[h.segment][h.point];
}

export function clampPoint(p: Point): Point {
    if (!Number.isFinite(p.x) || !Number.isFinite(p.y)) throw new Error('Coordinates must be finite');
    // A cubic stays within the convex hull of its anchors and handles.
    // Constraining them to the inner rectangle preserves the fixed bracket clearance.
    return { x: Math.max((32 - offset) / scale, Math.min((224 - offset) / scale, p.x)),
        y: Math.max((31 - offset) / scale, Math.min((225 - offset) / scale, p.y)) };
}

export function linkBend(flame: Flame, driver: 'left-2' | 'left-3', locks: BendLocks): Flame {
    if (!locks.collinear && !locks.equalLength) return flame;
    const result = structuredClone(flame);
    const anchor = pointFor(result, 'bend');
    const other = driver === 'left-2' ? 'left-3' : 'left-2';
    const a = pointFor(result, driver), b = pointFor(result, other);
    const ax = a.x - anchor.x, ay = a.y - anchor.y;
    const bx = b.x - anchor.x, by = b.y - anchor.y;
    const lengthA = Math.hypot(ax, ay), lengthB = Math.hypot(bx, by);
    // A collapsed handle has no direction: retain the partner's direction,
    // or use the opposite driver direction when the partner is collapsed.
    const direction = locks.collinear && lengthA > 0
        ? { x: -ax / lengthA, y: -ay / lengthA }
        : lengthB > 0 ? { x: bx / lengthB, y: by / lengthB }
        : lengthA > 0 ? { x: -ax / lengthA, y: -ay / lengthA } : { x: 1, y: 0 };
    let available = Infinity;
    for (const [axis, min, max] of [['x', (32 - offset) / scale, (224 - offset) / scale], ['y', (31 - offset) / scale, (225 - offset) / scale]] as const) {
        const v = direction[axis];
        if (v > 0) available = Math.min(available, (max - anchor[axis]) / v);
        if (v < 0) available = Math.min(available, (min - anchor[axis]) / v);
    }
    const length = Math.max(0, Math.min(locks.equalLength ? lengthA : lengthB, available));
    const h = handles.find(h => h.id === other)!;
    result.curves[h.segment][h.point] = clampPoint({ x: anchor.x + direction.x * length, y: anchor.y + direction.y * length });
    if (locks.equalLength && lengthA > 0) {
        const active = handles.find(h => h.id === driver)!;
        result.curves[active.segment][active.point] = clampPoint({ x: anchor.x + ax / lengthA * length, y: anchor.y + ay / lengthA * length });
    }
    return result;
}

export function movePoint(flame: Flame, id: HandleId, next: Point, locks: BendLocks = { collinear: false, equalLength: false }): Flame {
    const result = structuredClone(flame);
    const h = handles.find(h => h.id === id);
    if (!h) throw new Error('Unknown handle');
    const old = pointFor(flame, id);
    let p = clampPoint(next);
    if (id === 'bend' && (locks.collinear || locks.equalLength)) {
        // Move the linked trio together; stop at the boundary rather than
        // clamping each handle separately and breaking the relationship.
        let dx = p.x - old.x, dy = p.y - old.y;
        for (const point of [old, pointFor(flame, 'left-2'), pointFor(flame, 'left-3')]) {
            const limited = clampPoint({ x: point.x + dx, y: point.y + dy });
            dx = dx >= 0 ? Math.min(dx, limited.x - point.x) : Math.max(dx, limited.x - point.x);
            dy = dy >= 0 ? Math.min(dy, limited.y - point.y) : Math.max(dy, limited.y - point.y);
        }
        p = { x: old.x + dx, y: old.y + dy };
    }
    result.curves[h.segment][h.point] = p;
    if (h.point === 2) {
        for (const [segment, control] of [[h.segment, 1], [h.segment + 1, 0]]) {
            const adjacent = result.curves[segment][control];
            result.curves[segment][control] = clampPoint({ x: adjacent.x + p.x - old.x, y: adjacent.y + p.y - old.y });
        }
    }
    return id === 'left-2' || id === 'left-3' ? linkBend(result, id, locks) : result;
}

export function pathData(flame: Flame): string {
    const pair = (p: Point) => `${p.x} ${p.y}`;
    return `M${pair(flame.start)}${flame.curves.map(c => `C${c.map(pair).join(' ')}`).join('')}Z`;
}

export function exportSvg(base: string, flame: Flame, ivory: boolean): string {
    const pattern = /(<path\b[^>]*\bid="flame"[^>]*\bd=")[^"]*(")/;
    if (!pattern.test(base)) throw new Error('Missing flame in source SVG');
    let svg = base.replace(pattern, (_match, before, after) => before + pathData(flame) + after)
        .replace(/<title[^>]*>[^<]*<\/title>/, '<title id="title">greenflame — custom flame</title>');
    if (ivory) svg = svg.replace(/(<svg\b[^>]*>)/, '$1\n    <rect id="background" width="256" height="256" fill="#eeecdf"/>');
    return svg;
}

async function startWorkshop(): Promise<void> {
    const get = <T extends Element>(id: string) => {
        const element = document.getElementById(id);
        if (!element) throw new Error(`Missing ${id}`);
        return element as unknown as T;
    };
    const status = get<HTMLElement>('status');
    try {
        const response = await fetch('../greenflame-7b-transparent.svg');
        if (!response.ok) throw new Error('The #7B source could not be loaded. Please reload.');
        const base = await response.text();
        const parsed = new DOMParser().parseFromString(base, 'image/svg+xml');
        const sourceFlame = parsed.querySelector('#flame');
        if (parsed.querySelector('parsererror') || !sourceFlame) throw new Error('Invalid #7B source');
        const original = parseFlame(sourceFlame.getAttribute('d') ?? '');
        let flame = structuredClone(original);
        let selected: HandleId = 'notch';
        const editor = get<SVGSVGElement>('editor');
        const clean = get<SVGSVGElement>('clean');
        const zoom = get<HTMLInputElement>('zoom');
        const select = get<HTMLSelectElement>('point');
        const xInput = get<HTMLInputElement>('x');
        const yInput = get<HTMLInputElement>('y');
        const collinear = get<HTMLInputElement>('collinear');
        const equalLength = get<HTMLInputElement>('equal-length');
        const bendLocks = (): BendLocks => ({ collinear: collinear.checked, equalLength: equalLength.checked });
        const ns = 'http://www.w3.org/2000/svg';
        const make = (tag: string, attrs: Record<string, string> = {}) => {
            const element = document.createElementNS(ns, tag);
            for (const [key, value] of Object.entries(attrs)) element.setAttribute(key, value);
            return element;
        };
        const mountArt = (target: SVGElement) => {
            target.innerHTML = parsed.documentElement.innerHTML;
            const path = target.querySelector<SVGPathElement>('#flame')!;
            target.querySelectorAll('title, desc').forEach(e => e.remove());
            target.querySelectorAll('[id]').forEach(e => e.removeAttribute('id'));
            return path;
        };
        const editorFlame = mountArt(editor);
        const previewPaths = [mountArt(clean)];
        for (const size of [128, 64, 48, 32, 24, 16]) {
            const sample = document.createElement('div');
            sample.className = 'sample';
            const svg = make('svg', { viewBox: '0 0 256 256', width: String(size), height: String(size), role: 'img', 'aria-label': `Clean preview at ${size} pixels` });
            previewPaths.push(mountArt(svg));
            const label = document.createElement('span');
            label.textContent = String(size);
            sample.append(svg, label);
            get<HTMLElement>('small-previews').append(sample);
        }
        const guides = make('g', { transform: editorFlame.getAttribute('transform')! });
        editorFlame.parentElement!.append(guides);
        const lines = [1, 2, 3].map(() => {
            const line = make('path', { class: 'guide' });
            guides.append(line);
            return line;
        });
        const nodes = handles.map(h => {
            const node = make('g', { class: 'handle', 'data-kind': h.kind, tabindex: '0', role: 'button', 'aria-label': `${h.label}. Drag or use arrow keys.` });
            node.append(make('circle', { class: 'hit' }), make('circle', { class: 'dot' }));
            guides.append(node);
            const option = document.createElement('option');
            option.value = h.id; option.textContent = h.label;
            select.append(option);
            node.addEventListener('focus', () => { selected = h.id; render(); });
            node.addEventListener('keydown', (event: Event) => {
                const e = event as KeyboardEvent;
                const direction: Record<string, Point> = { ArrowLeft: { x: -1, y: 0 }, ArrowRight: { x: 1, y: 0 }, ArrowUp: { x: 0, y: -1 }, ArrowDown: { x: 0, y: 1 } };
                const d = direction[e.key];
                if (!d) return;
                e.preventDefault();
                const p = pointFor(flame, h.id);
                const step = (e.shiftKey ? 0.1 : 1) / scale;
                selected = h.id;
                flame = movePoint(flame, selected, { x: p.x + d.x * step, y: p.y + d.y * step }, bendLocks());
                render();
            });
            node.addEventListener('pointerdown', (event: Event) => {
                const e = event as PointerEvent;
                if (!e.isPrimary || e.button !== 0) return;
                e.preventDefault();
                selected = h.id;
                (node as SVGElement).focus();
                const cursor = localPoint(e);
                const p = pointFor(flame, selected);
                drag = { id: e.pointerId, dx: cursor.x - p.x, dy: cursor.y - p.y };
                editor.setPointerCapture(e.pointerId);
                render();
            });
            return node;
        });
        function render(): void {
            const d = pathData(flame);
            editorFlame.setAttribute('d', d);
            for (const path of previewPaths) path.setAttribute('d', d);
            editor.setAttribute('viewBox', zoom.checked ? '130 80 55 80' : '0 0 256 256');
            lines.forEach((line, i) => {
                const segment = i + 1;
                const start = flame.curves[segment - 1][2];
                const [a, b, end] = flame.curves[segment];
                line.setAttribute('d', `M${start.x} ${start.y}L${a.x} ${a.y}M${b.x} ${b.y}L${end.x} ${end.y}`);
            });
            nodes.forEach((node, i) => {
                const h = handles[i]; const p = pointFor(flame, h.id);
                node.setAttribute('transform', `translate(${p.x} ${p.y})`);
                node.classList.toggle('selected', h.id === selected);
                node.querySelector('.dot')!.setAttribute('r', zoom.checked ? '4.5' : '13');
                node.querySelector('.hit')!.setAttribute('r', zoom.checked ? '8' : '23');
            });
            select.value = selected;
            const p = pointFor(flame, selected);
            xInput.value = (p.x * scale + offset).toFixed(2);
            yInput.value = (p.y * scale + offset).toFixed(2);
        }
        function localPoint(e: PointerEvent): DOMPoint {
            const matrix = (guides as SVGGraphicsElement).getScreenCTM();
            if (!matrix) throw new Error('Editor is not visible');
            return new DOMPoint(e.clientX, e.clientY).matrixTransform(matrix.inverse());
        }
        let drag: { id: number; dx: number; dy: number } | null = null;
        editor.addEventListener('pointermove', e => {
            if (!drag || e.pointerId !== drag.id) return;
            const p = localPoint(e);
            flame = movePoint(flame, selected, { x: p.x - drag.dx, y: p.y - drag.dy }, bendLocks());
            render();
        });
        const finishDrag = (e: PointerEvent) => {
            if (!drag || e.pointerId !== drag.id) return;
            drag = null;
            if (editor.hasPointerCapture(e.pointerId)) editor.releasePointerCapture(e.pointerId);
        };
        editor.addEventListener('pointerup', finishDrag);
        editor.addEventListener('pointercancel', finishDrag);
        editor.addEventListener('lostpointercapture', () => { drag = null; });
        zoom.addEventListener('change', render);
        for (const toggle of [collinear, equalLength]) toggle.addEventListener('change', () => {
            const driver = selected === 'left-3' ? 'left-3' : 'left-2';
            flame = linkBend(flame, driver, bendLocks());
            render();
        });
        select.addEventListener('change', () => { selected = select.value as HandleId; render(); });
        for (const input of [xInput, yInput]) input.addEventListener('change', () => {
            const x = xInput.valueAsNumber; const y = yInput.valueAsNumber;
            if (Number.isFinite(x) && Number.isFinite(y)) flame = movePoint(flame, selected, { x: (x - offset) / scale, y: (y - offset) / scale }, bendLocks());
            render();
        });
        for (const format of ['ivory', 'transparent']) get<HTMLButtonElement>(format).addEventListener('click', () => {
            const data = exportSvg(base, flame, format === 'ivory');
            const url = URL.createObjectURL(new Blob([data], { type: 'image/svg+xml;charset=utf-8' }));
            const link = document.createElement('a');
            link.href = url; link.download = `greenflame-custom-${format}.svg`;
            document.body.append(link); link.click(); link.remove();
            setTimeout(() => URL.revokeObjectURL(url), 10000);
            status.textContent = `${format === 'ivory' ? 'Ivory' : 'Transparent'} SVG prepared for download.`;
        });
        get<HTMLButtonElement>('reset').addEventListener('click', () => {
            collinear.checked = false; equalLength.checked = false;
            flame = structuredClone(original); selected = 'notch'; render();
            status.textContent = 'Reset to the original #7B.';
        });
        render();
        for (const id of ['zoom', 'coordinates', 'bend-options', 'ivory', 'transparent', 'reset']) get<HTMLInputElement>(id).disabled = false;
        status.textContent = 'Ready. Your edits stay in this tab.';
    } catch (error) {
        status.textContent = error instanceof Error ? error.message : 'The editor could not start. Please reload.';
        status.style.color = '#a22034';
    }
}

if (typeof document !== 'undefined') void startWorkshop();
