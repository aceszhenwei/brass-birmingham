#!/usr/bin/env node
// Print a readable trace of one reproducible game, for the examples in
// docs/research/ai-baseline-audit.md.
//
//   node scripts/research/ai-trace.js --players 3 --seed 203001 --seats easy,normal,hard [--player 2] [--era canal|rail]
//
// One line per move: era and round, seat, money and income level before the
// move, and the fully specified move. --player / --era limit the output.

'use strict';

const { loadEngine } = require('../../test/helpers/engine');
const { playMatch } = require('./harness');

function arg(name, fallback) {
    const i = process.argv.indexOf(`--${name}`);
    return i >= 0 ? process.argv[i + 1] : fallback;
}
const players = Number(arg('players', 3));
const seed = Number(arg('seed', 203001));
const seats = String(arg('seats', Array(players).fill('normal').join(','))).split(',');
const only = arg('player', null);
const onlyEra = arg('era', null);

const E = loadEngine();
function describe(move) {
    const m = { ...move };
    delete m.type;
    return `${move.type.padEnd(8)} ${JSON.stringify(m)}`;
}

const r = playMatch(E, {
    players, seed, seats, detailed: false,
    trace: ({ state, decision, move, seat }) => {
        const id = decision.playerId;
        if (only !== null && String(id) !== only) return;
        if (onlyEra && state.era !== onlyEra) return;
        const p = state.players[id];
        console.log(`${state.era.padEnd(5)} r${String(state.round).padStart(2)}  P${id} ${seat.padEnd(6)} ` +
            `£${String(p.money).padStart(3)} inc ${String(state.getIncomeLevel(id)).padStart(3)} vp ${String(p.vp).padStart(3)}  ${describe(move)}`);
    },
});
console.log('\nFinal:');
r.final.forEach((f, i) => console.log(`  P${i} ${seats[i].padEnd(10)} VP ${f.vp}  income ${f.income}  money £${f.money}  rank ${f.rank}` +
    `  (loans ${r.stats[i].actions.loan}, sold ${r.stats[i].tilesSold}, developed ${r.stats[i].developTiles})`));
