const GREEN = '#78d600';
const INK = '#0b0e0b';
const PAPER = '#eeecdf';
const MAX_FRAGMENTS = 6;
const clamp = (value, low, high) => Math.max(low, Math.min(high, value));

export function frameRect(start, end, width, height) {
    if (![start.x, start.y, end.x, end.y, width, height].every(Number.isFinite) || width <= 0 || height <= 0) return null;
    const x = clamp(Math.min(start.x, end.x), 0, width);
    const y = clamp(Math.min(start.y, end.y), 0, height);
    return { x, y, width: clamp(Math.max(start.x, end.x), 0, width) - x, height: clamp(Math.max(start.y, end.y), 0, height) - y };
}

export function cropPixels(rect, width, height, pixelsWide, pixelsHigh) {
    if (!rect || ![pixelsWide, pixelsHigh].every(Number.isInteger) || pixelsWide <= 0 || pixelsHigh <= 0) return null;
    const bounded = frameRect(rect, { x: rect.x + rect.width, y: rect.y + rect.height }, width, height);
    if (!bounded || bounded.width <= 0 || bounded.height <= 0) return null;
    const x = Math.floor(bounded.x * pixelsWide / width);
    const y = Math.floor(bounded.y * pixelsHigh / height);
    return { x, y, width: Math.min(pixelsWide, Math.ceil((bounded.x + bounded.width) * pixelsWide / width)) - x, height: Math.min(pixelsHigh, Math.ceil((bounded.y + bounded.height) * pixelsHigh / height)) - y };
}

async function start() {
    const ui = Object.fromEntries(['field', 'stage', 'fragments', 'selection', 'canvas-hint', 'coordinates', 'capture', 'pause', 'rotate', 'annotate', 'save', 'remove', 'reset', 'count', 'status'].map(id => [id, document.getElementById(id)]));
    const ctx = ui.field.getContext('2d');
    if (!ctx) throw new Error('Canvas unavailable');
    await document.fonts.ready;
    const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
    let paused = reducedMotion.matches;
    let visible = true;
    let width = 0, height = 0, time = 0, frame = 0, previous = 0, lastPaint = 0;
    let selection = null, selected = null, serial = 0, topLayer = 0;
    const fragments = [];
    const pointer = { x: .5, y: .5 };
    const say = message => { ui.status.textContent = message; };

    function draw() {
        if (!width || !height) return;
        ctx.setTransform(ui.field.width / width, 0, 0, ui.field.height / height, 0, 0);
        ctx.fillStyle = INK;
        ctx.fillRect(0, 0, width, height);
        ctx.strokeStyle = '#202b1c';
        ctx.lineWidth = 1;
        for (let x = 0; x < width; x += 70) {
            ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, height); ctx.stroke();
        }
        for (let y = 0; y < height; y += 70) {
            ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(width, y); ctx.stroke();
        }
        const centerX = width * (.63 + Math.sin(time * .17) * .035 + (pointer.x - .5) * .06);
        const centerY = height * (.47 + (pointer.y - .5) * .06);
        const radiusX = Math.max(width * .39, height * .47);
        const radiusY = height * .62;
        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.rotate(-.24 + Math.sin(time * .12) * .08);
        ctx.strokeStyle = GREEN;
        for (let ring = 1; ring <= 78; ring++) {
            const fraction = ring / 78;
            ctx.globalAlpha = .3 + fraction * .7;
            ctx.lineWidth = ring % 7 === 0 ? 2 : 1;
            ctx.beginPath();
            for (let step = 0; step <= 140; step++) {
                const angle = step / 140 * Math.PI * 2;
                const warp = 1 + .19 * Math.sin(angle * 3 + fraction * 5 + time * .28) + .075 * Math.cos(angle * 5 - time * .17);
                const x = Math.cos(angle) * radiusX * fraction * warp;
                const y = Math.sin(angle) * radiusY * fraction * warp;
                if (step === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
            }
            ctx.closePath(); ctx.stroke();
        }
        ctx.restore();

        // Typography is part of the canvas, so a fragment really freezes what it frames.
        ctx.save();
        ctx.translate(width * .045, height * .12);
        ctx.rotate(-.075);
        const size = Math.min(width * .21, height * .37);
        ctx.font = `700 ${size}px Jost, sans-serif`;
        ctx.textBaseline = 'top';
        ctx.fillStyle = PAPER;
        ctx.fillText('catch', 0, 0);
        ctx.fillText('the now.', 0, size * .83);
        ctx.restore();

        const crossX = width * .77, crossY = height * .71, arm = Math.min(width, height) * .11;
        ctx.lineWidth = 1;
        ctx.strokeStyle = PAPER;
        ctx.beginPath();
        ctx.moveTo(crossX - arm, crossY); ctx.lineTo(crossX + arm, crossY);
        ctx.moveTo(crossX, crossY - arm); ctx.lineTo(crossX, crossY + arm);
        ctx.stroke();
        ctx.fillStyle = GREEN;
        ctx.font = `${clamp(width * .009, 9, 12)}px "Courier New", monospace`;
        ctx.fillText('EVERY FRAME IS A DIFFERENT NOW', width * .045, height * .76);
    }

    function animate(now) {
        frame = 0;
        if (paused || !visible || document.hidden) return;
        time += previous ? Math.min((now - previous) / 1000, .06) : 0;
        previous = now;
        if (now - lastPaint >= 1000 / 30) { draw(); lastPaint = now; }
        frame = requestAnimationFrame(animate);
    }

    function schedule() {
        cancelAnimationFrame(frame);
        frame = 0; previous = 0;
        if (!paused && visible && !document.hidden) frame = requestAnimationFrame(animate);
    }

    function pause(value) {
        paused = value;
        ui.pause.setAttribute('aria-pressed', String(paused));
        ui.pause.innerHTML = paused ? 'resume time <span aria-hidden="true">▷</span>' : 'pause time <span aria-hidden="true">Ⅱ</span>';
        document.getElementById('experiment').classList.toggle('is-paused', paused);
        schedule();
    }

    function place(item) {
        item.x = clamp(item.x, 12, Math.max(12, width - item.width - 12));
        item.y = clamp(item.y, 12, Math.max(12, height - item.height - 12));
        Object.assign(item.element.style, { left: `${item.x}px`, top: `${item.y}px`, width: `${item.width}px`, height: `${item.height}px` });
        item.element.style.setProperty('--angle', `${item.angle}deg`);
    }

    function sizeFragment(item) {
        const scale = Math.min(1, (Math.min(290, width * .64) - 16) / item.originalWidth, Math.min(250, height * .58) / item.originalHeight);
        item.width = Math.max(64, Math.round(item.originalWidth * scale) + 16);
        item.height = Math.max(64, Math.round(item.originalHeight * scale) + 36);
        item.element.classList.toggle('is-small', item.width < 120);
        place(item);
    }

    function updateTools() {
        for (const name of ['rotate', 'annotate', 'save', 'remove']) ui[name].disabled = !selected;
        ui.annotate.setAttribute('aria-pressed', String(Boolean(selected?.annotated)));
        ui.reset.disabled = !fragments.length;
        ui.capture.disabled = fragments.length >= MAX_FRAGMENTS;
        ui.count.textContent = String(fragments.length).padStart(2, '0');
        ui['canvas-hint'].hidden = fragments.length > 0;
    }

    function select(item) {
        selected = item;
        for (const fragment of fragments) fragment.element.setAttribute('aria-pressed', String(fragment === item));
        if (item) item.element.style.zIndex = String(++topLayer);
        updateTools();
    }

    function paintFragment(item) {
        const context = item.display.getContext('2d');
        const w = item.source.width, h = item.source.height;
        context.clearRect(0, 0, w, h);
        context.drawImage(item.source, 0, 0);
        if (!item.annotated) return;
        context.lineCap = 'round'; context.lineJoin = 'round';
        context.beginPath();
        context.moveTo(w * .19, h * .76); context.lineTo(w * .8, h * .23);
        context.moveTo(w * .56, h * .23); context.lineTo(w * .8, h * .23); context.lineTo(w * .8, h * .47);
        context.lineWidth = Math.min(w, h) * .055; context.strokeStyle = INK; context.stroke();
        context.lineWidth = Math.min(w, h) * .025; context.strokeStyle = GREEN; context.stroke();
    }

    function turn(delta) {
        if (!selected) return;
        selected.angle = ((selected.angle + delta + 180) % 360 + 360) % 360 - 180;
        place(selected);
        say(`Moment ${selected.id} turned to ${selected.angle} degrees.`);
    }

    function removeSelected() {
        if (!selected) return;
        const id = selected.id;
        const hadFocus = document.activeElement === selected.element;
        selected.element.remove();
        fragments.splice(fragments.indexOf(selected), 1);
        select(fragments.at(-1) ?? null);
        if (hadFocus) (selected?.element ?? ui.capture).focus({ preventScroll: true });
        say(`Moment ${id} let go. ${fragments.length} remaining.`);
    }

    function capture(rect) {
        if (fragments.length >= MAX_FRAGMENTS) { say('Six moments is a full collection. Let one go, or start over, to capture another.'); return; }
        if (!rect || rect.width < 40 || rect.height < 40) { say('Make a frame at least 40 pixels wide and tall, or use “capture a moment”.'); return; }
        const pixels = cropPixels(rect, width, height, ui.field.width, ui.field.height);
        if (!pixels) return;
        const source = document.createElement('canvas');
        source.width = pixels.width; source.height = pixels.height;
        source.getContext('2d').drawImage(ui.field, pixels.x, pixels.y, pixels.width, pixels.height, 0, 0, pixels.width, pixels.height);
        const display = document.createElement('canvas');
        display.width = source.width; display.height = source.height;
        display.setAttribute('aria-hidden', 'true');
        const element = document.createElement('button');
        element.type = 'button'; element.className = 'fragment';
        const id = ++serial;
        element.setAttribute('aria-label', `Moment ${id}. Arrow keys move; brackets turn; Delete removes.`);
        element.innerHTML = `<span class="fragment-label"><span>no. ${String(id).padStart(2, '0')}</span><span>time, held.</span></span>`;
        element.prepend(display);
        const item = { id, source, display, element, originalWidth: rect.width, originalHeight: rect.height, x: rect.x, y: rect.y, width: 0, height: 0, angle: id % 2 ? -5 : 5, annotated: false };
        paintFragment(item);
        fragments.push(item); ui.fragments.append(element);
        sizeFragment(item); select(item);
        element.focus({ preventScroll: true });
        let drag = null;
        element.addEventListener('focus', () => select(item));
        element.addEventListener('click', () => select(item));
        element.addEventListener('pointerdown', event => {
            if (!event.isPrimary || event.button !== 0) return;
            select(item); element.focus({ preventScroll: true });
            drag = { id: event.pointerId, x: event.clientX, y: event.clientY, left: item.x, top: item.y };
            element.setPointerCapture(event.pointerId);
        });
        element.addEventListener('pointermove', event => {
            if (!drag || event.pointerId !== drag.id) return;
            item.x = drag.left + event.clientX - drag.x;
            item.y = drag.top + event.clientY - drag.y;
            place(item);
        });
        for (const name of ['pointerup', 'pointercancel', 'lostpointercapture']) element.addEventListener(name, () => { drag = null; });
        element.addEventListener('keydown', event => {
            const directions = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] };
            if (directions[event.key]) {
                event.preventDefault();
                const step = event.shiftKey ? 30 : 10;
                item.x += directions[event.key][0] * step; item.y += directions[event.key][1] * step;
                place(item);
            } else if (event.key === '[' || event.key === ']') { event.preventDefault(); turn(event.key === '[' ? -12 : 12); }
            else if (event.key === 'Delete' || event.key === 'Backspace') { event.preventDefault(); removeSelected(); }
        });
        say(`Moment ${id} caught. Drag it somewhere new. Turn it. Make a point. Keep it.`);
    }

    function centerCapture() {
        capture({ x: width * (.2 + fragments.length * .035), y: height * (.18 + fragments.length * .045), width: width * .42, height: height * .42 });
    }

    function position(event) {
        const bounds = ui.field.getBoundingClientRect();
        return { x: clamp(event.clientX - bounds.left, 0, width), y: clamp(event.clientY - bounds.top, 0, height) };
    }

    ui.field.addEventListener('pointerdown', event => {
        if (!event.isPrimary || event.button !== 0) return;
        if (fragments.length >= MAX_FRAGMENTS) { say('Your collection is full. Let a moment go to make room.'); return; }
        ui.field.focus({ preventScroll: true });
        select(null);
        selection = { start: position(event), id: event.pointerId };
        ui.field.setPointerCapture(event.pointerId);
    });
    ui.field.addEventListener('pointermove', event => {
        const point = position(event);
        if (!paused) { pointer.x = point.x / width; pointer.y = point.y / height; }
        ui.coordinates.textContent = `x ${String(Math.round(point.x)).padStart(3, '0')} / y ${String(Math.round(point.y)).padStart(3, '0')}`;
        if (!selection || event.pointerId !== selection.id) return;
        const rect = frameRect(selection.start, point, width, height);
        ui.selection.hidden = false;
        Object.assign(ui.selection.style, { left: `${rect.x}px`, top: `${rect.y}px`, width: `${rect.width}px`, height: `${rect.height}px` });
        ui.selection.firstElementChild.textContent = `${Math.round(rect.width)} × ${Math.round(rect.height)}`;
    });
    ui.field.addEventListener('pointerup', event => {
        if (!selection || event.pointerId !== selection.id) return;
        const rect = frameRect(selection.start, position(event), width, height);
        selection = null; ui.selection.hidden = true;
        capture(rect);
    });
    for (const name of ['pointercancel', 'lostpointercapture']) ui.field.addEventListener(name, () => { selection = null; ui.selection.hidden = true; });
    ui.field.addEventListener('keydown', event => {
        if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); centerCapture(); }
        if (event.key === 'Escape') { selection = null; ui.selection.hidden = true; }
    });
    ui.capture.addEventListener('click', centerCapture);
    ui.pause.addEventListener('click', () => { pause(!paused); say(paused ? 'Time paused. Take as long as you need.' : 'Time is moving again. Your fragments stay still.'); });
    ui.rotate.addEventListener('click', () => turn(12));
    ui.annotate.addEventListener('click', () => {
        if (!selected) return;
        selected.annotated = !selected.annotated; paintFragment(selected); updateTools();
        say(selected.annotated ? `Moment ${selected.id}: point made.` : `Moment ${selected.id}: mark removed.`);
    });
    ui.remove.addEventListener('click', removeSelected);
    ui.reset.addEventListener('click', () => {
        for (const item of fragments) item.element.remove();
        fragments.length = 0; select(null); ui.capture.focus({ preventScroll: true });
        say('A clean slate. The next moment is yours.');
    });
    ui.save.addEventListener('click', () => {
        if (!selected) return;
        const item = selected, angle = item.angle * Math.PI / 180;
        const output = document.createElement('canvas');
        const w = item.display.width, h = item.display.height;
        output.width = Math.ceil(Math.abs(w * Math.cos(angle)) + Math.abs(h * Math.sin(angle)));
        output.height = Math.ceil(Math.abs(w * Math.sin(angle)) + Math.abs(h * Math.cos(angle)));
        const context = output.getContext('2d');
        context.translate(output.width / 2, output.height / 2); context.rotate(angle); context.drawImage(item.display, -w / 2, -h / 2);
        output.toBlob(blob => {
            if (!blob) { say('This browser could not create the image. Your fragment is still here.'); return; }
            const url = URL.createObjectURL(blob), link = document.createElement('a');
            link.href = url; link.download = `greenflame-afterimage-${String(item.id).padStart(2, '0')}.png`;
            document.body.append(link); link.click(); link.remove();
            setTimeout(() => URL.revokeObjectURL(url), 60000);
            say(`Moment ${item.id} sent to your downloads as a PNG. Yours to keep.`);
        }, 'image/png');
    });
    new ResizeObserver(() => {
        width = ui.field.clientWidth; height = ui.field.clientHeight;
        if (!width || !height) return;
        const ratio = Math.min(devicePixelRatio || 1, 2);
        ui.field.width = Math.round(width * ratio); ui.field.height = Math.round(height * ratio);
        selection = null; ui.selection.hidden = true;
        for (const item of fragments) sizeFragment(item);
        draw();
    }).observe(ui.field);
    new IntersectionObserver(entries => { visible = entries[0].isIntersecting; schedule(); }).observe(ui.stage);
    document.addEventListener('visibilitychange', schedule);
    reducedMotion.addEventListener('change', event => { if (event.matches) { pause(true); say('Motion paused to match your system preference.'); } });
    ui.capture.disabled = false; ui.pause.disabled = false;
    pause(paused);
    say(paused ? 'Motion is paused to match your system preference. Capture a moment, or choose “resume time”.' : 'Nothing here stays. Until you say so. Draw a frame to begin.');
}

if (typeof document !== 'undefined') start().catch(error => {
    console.error('Afterimage could not start:', error);
    document.getElementById('status').textContent = 'This browser could not start the canvas. The greenflame website and downloads are still available below.';
});
