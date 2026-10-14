#!/usr/bin/env node
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const { DEFAULT_DIR, engine, inspect } = require('./human-games');
function main(args) {
    const get = key => { const i = args.indexOf(key); return i < 0 ? undefined : args[i + 1]; };
    const id = get('--game'), action = Number(get('--action')), dir = path.resolve(get('--dir') || DEFAULT_DIR);
    if (!id || !/^[\w-]{1,100}$/.test(id) || !Number.isInteger(action) || action < 1)
        throw new Error('Usage: node scripts/research/inspect-human-game.js --game ID --action N [--dir DIR]');
    const matches = fs.readdirSync(dir).filter(n => n.endsWith('.json')).map(file => {
        let data; try { data = JSON.parse(fs.readFileSync(path.join(dir, file), 'utf8')); }
        catch (e) { throw new Error(`${file}: ${e.message}`); } return { file, data };
    }).filter(x => x.data.id === id);
    if (matches.length !== 1) throw new Error(`Expected one game with ID ${id}, found ${matches.length}`);
    console.log(JSON.stringify(inspect(engine(), matches[0].data, action), null, 2));
}
if (require.main === module) { try { main(process.argv.slice(2)); } catch (e) { console.error(e.message); process.exitCode = 1; } }
module.exports = { main };
