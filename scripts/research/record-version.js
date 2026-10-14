#!/usr/bin/env node
// Stamp exact engine and policy source identities into the browser format.
// Run --write only when intentionally supporting a new source revision.
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const { createHash } = require('node:crypto');
const ROOT = path.resolve(__dirname, '../..');
const engineFiles = ['gameData.js', 'random.js', 'gameState.js', 'gameLogic.js', 'moves.js', 'progression.js'];
const identity = files => 'sha256:' + createHash('sha256').update(files.map(f => f + '\n' + fs.readFileSync(path.join(ROOT, 'js', f), 'utf8')).join('\n')).digest('hex');
function check(write = false) {
    const file = path.join(ROOT, 'js/gameRecorder.js');
    let text = fs.readFileSync(file, 'utf8');
    for (const [name, files] of [['ENGINE', engineFiles], ['POLICY', ['aiPlayer.js', 'aiPlanner.js']]]) {
        const value = identity(files), pattern = new RegExp(`const ${name} = '[^']+';`);
        if (!text.includes(`const ${name} = '${value}';`) && !write) throw new Error(`${name} identity is stale; use the matching revision or deliberately run node scripts/research/record-version.js --write`);
        text = text.replace(pattern, `const ${name} = '${value}';`);
    }
    if (write) fs.writeFileSync(file, text);
}
if (require.main === module) { try { check(process.argv.includes('--write')); console.log('Recording source identities match.'); }
catch (error) { console.error(error.message); process.exitCode = 1; } }
module.exports = { check };
