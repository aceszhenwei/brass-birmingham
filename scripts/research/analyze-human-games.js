#!/usr/bin/env node
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const { ROOT, DEFAULT_DIR, loadDataset, report } = require('./human-games');
function main(args) {
    const get = (key, fallback) => { const i = args.indexOf(key); if (i < 0) return fallback;
        if (!args[i + 1] || args[i + 1].startsWith('--')) throw new Error(`Missing ${key} value`); return path.resolve(args[i + 1]); };
    const dir = get('--dir', DEFAULT_DIR), out = get('--out', path.join(ROOT, 'research/human-games/report.md'));
    const dataset = loadDataset(dir);
    fs.mkdirSync(path.dirname(out), { recursive: true }); fs.writeFileSync(out, report(dataset));
    console.log(`${dataset.games.length} valid records, ${dataset.errors.length} invalid/duplicate files. Report: ${out}`);
    for (const e of dataset.errors) console.error(`${e.file}: ${e.reason}`);
    if (dataset.errors.length) process.exitCode = 1;
}
if (require.main === module) { try { main(process.argv.slice(2)); } catch (e) { console.error(e.message); process.exitCode = 1; } }
module.exports = { main };
