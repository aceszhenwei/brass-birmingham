// A minimal fake DOM — just enough for UIManager to run headlessly so its
// turn-flow logic (AI recovery, hand rendering) can be tested. It records
// created elements and scheduled timers; it does not render anything.

'use strict';

function makeElement(tag = 'div') {
    const classes = new Set();
    let html = '';
    const el = {
        tagName: tag.toUpperCase(),
        children: [],
        dataset: {},
        style: { setProperty() {} },
        textContent: '',
        title: '',
        disabled: false,
        onclick: null,
        get className() { return [...classes].join(' '); },
        set className(v) { classes.clear(); String(v).split(/\s+/).filter(Boolean).forEach(c => classes.add(c)); },
        get innerHTML() { return html; },
        set innerHTML(v) { html = String(v); if (html === '') el.children = []; },
        classList: {
            add: (...c) => c.forEach(x => classes.add(x)),
            remove: (...c) => c.forEach(x => classes.delete(x)),
            toggle: (c, force) => {
                const on = force === undefined ? !classes.has(c) : !!force;
                if (on) classes.add(c); else classes.delete(c);
                return on;
            },
            contains: (c) => classes.has(c),
        },
        appendChild(child) { el.children.push(child); return child; },
        remove() {},
        setAttribute() {},
        addEventListener() {},
        querySelector() { return makeElement(); },
        querySelectorAll() { return []; },
    };
    return el;
}

function makeDom() {
    const byId = new Map();
    const timers = [];
    const document = {
        getElementById(id) {
            if (!byId.has(id)) byId.set(id, makeElement());
            return byId.get(id);
        },
        createElement: (tag) => makeElement(tag),
        createElementNS: (_, tag) => makeElement(tag),
        querySelector: () => makeElement(),
        querySelectorAll: () => [],
        addEventListener() {},
    };
    const window = { addEventListener() {} };
    const setTimeout = (fn, ms) => { timers.push({ fn, ms }); return timers.length; };
    return { document, window, setTimeout, timers };
}

module.exports = { makeDom };
