#!/usr/bin/env node
// Repository consistency check, run in CI.
//
//   node scripts/check-repo.js
//
// Checks that:
//   1. every local script and stylesheet index.html loads exists, and every
//      js/*.js file is loaded by index.html (the game has no build step, so
//      index.html is the only manifest);
//   2. every fixed asset path written as a string literal in js/ exists;
//   3. every relative link and image in the Markdown files resolves to a file,
//      and every #anchor into a Markdown file matches one of its headings.
// The exit code is non-zero if anything is missing.

'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const SKIP_DIRS = new Set(['.git', 'node_modules', 'assets', 'screenshots']);
const problems = [];
const rel = (p) => path.relative(ROOT, p);
const exists = (p) => fs.existsSync(p);

function walk(dir, ext, out = []) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            if (!SKIP_DIRS.has(entry.name)) walk(full, ext, out);
        } else if (entry.name.endsWith(ext)) {
            out.push(full);
        }
    }
    return out;
}

// 1. index.html
const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const loaded = new Set();
for (const [, ref] of html.matchAll(/(?:src|href)="([^"]+)"/g)) {
    if (/^[a-z]+:|^\/\/|^#/i.test(ref)) continue;
    const file = ref.split(/[?#]/)[0];
    loaded.add(file);
    if (!exists(path.join(ROOT, file))) problems.push(`index.html: missing ${file}`);
}
for (const file of fs.readdirSync(path.join(ROOT, 'js'))) {
    if (file.endsWith('.js') && !loaded.has(`js/${file}`)) problems.push(`index.html: js/${file} is not loaded`);
}

// 2. Fixed asset paths in the game code
for (const file of walk(path.join(ROOT, 'js'), '.js')) {
    const src = fs.readFileSync(file, 'utf8');
    for (const [, asset] of src.matchAll(/'(assets\/[^'$`]+\.(?:jpe?g|png|webp|svg))'/g)) {
        // board.jpg has optional alternative formats; only the .jpg is bundled
        if (/^assets\/board\.(?:jpeg|png|webp)$/.test(asset)) continue;
        if (!exists(path.join(ROOT, asset))) problems.push(`${rel(file)}: missing ${asset}`);
    }
}

// 3. Markdown links
const slug = (heading) => heading.trim().toLowerCase()
    .replace(/[`*_~]/g, '').replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/[^\p{L}\p{N} -]/gu, '').replace(/ /g, '-');
const anchorCache = new Map();
function anchorsOf(file) {
    if (!anchorCache.has(file)) {
        const text = fs.readFileSync(file, 'utf8').replace(/```[\s\S]*?```/g, '');
        anchorCache.set(file, new Set([...text.matchAll(/^#{1,6}\s+(.+)$/gm)].map(m => slug(m[1]))));
    }
    return anchorCache.get(file);
}

let links = 0;
for (const file of walk(ROOT, '.md')) {
    const text = fs.readFileSync(file, 'utf8').replace(/```[\s\S]*?```/g, '');
    const targets = [
        ...[...text.matchAll(/\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g)].map(m => m[1]),
        ...[...text.matchAll(/<img[^>]+src="([^"]+)"/g)].map(m => m[1]),
    ];
    for (const target of targets) {
        if (/^[a-z]+:/i.test(target)) continue;           // http:, https:, mailto:
        links++;
        const [target_path, anchor] = target.split('#');
        const resolved = target_path ? path.resolve(path.dirname(file), target_path) : file;
        if (!exists(resolved)) {
            problems.push(`${rel(file)}: broken link ${target}`);
        } else if (anchor && resolved.endsWith('.md') && !anchorsOf(resolved).has(anchor)) {
            problems.push(`${rel(file)}: no heading for ${target}`);
        }
    }
}

if (problems.length) {
    console.log(`Repository check failed (${problems.length} problem(s)):`);
    for (const p of problems) console.log(`  ${p}`);
    process.exit(1);
}
console.log(`Repository check passed: index.html loads ${loaded.size} local files, ${links} Markdown links resolve.`);
