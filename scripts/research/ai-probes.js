#!/usr/bin/env node
// Assignment 5: decision-level probes behind the weaknesses in
// docs/research/ai-baseline-audit.md, section 4.
//
//   node scripts/research/ai-probes.js [--players 3] [--seeds 50] [--levels easy,normal,hard]
//
// Plays mirror games (every seat the same difficulty; the seeds of
// ai-baseline.js) and, before each AI move, records the situation:
//   loans      was any Build or Network affordable? how far into the era?
//              did the player later owe an income shortfall?
//   selling    was a Sell legal when the AI chose something else?
//   develop    of the tiles developed, how many industries were never
//              built afterwards?
//   overbuild  overbuilding an own unflipped tile: what did it destroy?
//   spending   money spent on Build, Network and Develop, and raised by loans

'use strict';

const { loadEngine } = require('../../test/helpers/engine');
const { playMatch } = require('./harness');

function arg(name, fallback) {
    const i = process.argv.indexOf(`--${name}`);
    return i >= 0 ? process.argv[i + 1] : fallback;
}
const PLAYERS = Number(arg('players', 3));
const SEEDS = Number(arg('seeds', 50));
const LEVELS = String(arg('levels', 'easy,normal,hard')).split(',');
const E = loadEngine();
const A = E.ACTIONS;

const pct = (a, b) => `${a} of ${b} (${b ? (100 * a / b).toFixed(0) : 0}%)`;

console.log(`${PLAYERS} players, ${SEEDS} mirror games per difficulty (seeds ${200000 + 1000 * PLAYERS + 1}…)\n`);
for (const level of LEVELS) {
    const p = {
        loans: 0, loansNothingAffordable: 0, loansLastTwoRounds: 0, loansThenShortfall: 0,
        turnActions: 0, sellLegal: 0, sellLegalNotChosen: 0, sellLegalChosePassOrLoan: 0,
        developed: 0, developedNeverBuilt: 0,
        overbuildUnflipped: 0, overbuildUnflippedCubesLost: 0, overbuildUnflippedSame: 0,
        spend: { build: 0, network: 0, develop: 0 }, overbuildSpend: 0,
    };
    for (let i = 1; i <= SEEDS; i++) {
        const seed = 200000 + 1000 * PLAYERS + i;
        const loanEras = [];                 // [playerId, era] of each loan
        const developed = [];                // { playerId, type, at }
        const builtAfter = [];               // { playerId, type, at }
        const shortfalls = new Set();        // `${playerId}:${era}`
        let t = 0;
        playMatch(E, {
            players: PLAYERS, seed, seats: Array(PLAYERS).fill(level), detailed: false,
            trace: ({ state, logic, decision, move }) => {
                t++;
                const id = decision.playerId;
                if (move.type === 'shortfall') { shortfalls.add(`${id}:${state.era}`); return; }
                p.turnActions++;
                const cardsLeft = state.drawDeck.length + state.players.reduce((s, pl) => s + pl.hand.length, 0);
                const lastTwoRounds = cardsLeft <= 4 * PLAYERS;          // two actions per player per round
                if (move.type === A.LOAN) {
                    p.loans++;
                    const affordable = logic.getValidBuildTargets(id).length > 0 || logic.getValidNetworkTargets(id).length > 0;
                    if (!affordable) p.loansNothingAffordable++;
                    if (lastTwoRounds && state.era === 'rail') p.loansLastTwoRounds++;
                    loanEras.push([id, state.era]);
                }
                if (logic.canPerformAction(A.SELL, id)) {
                    p.sellLegal++;
                    if (move.type !== A.SELL) {
                        p.sellLegalNotChosen++;
                        if (move.type === A.PASS || move.type === A.LOAN) p.sellLegalChosePassOrLoan++;
                    }
                }
                if (p.spend[move.type] !== undefined) p.spend[move.type] += logic.planMove(id, move).plan.cost;
                if (move.type === A.DEVELOP) for (const type of move.industries) developed.push({ id, type, at: t });
                if (move.type === A.BUILD) {
                    builtAfter.push({ id, type: move.industry, at: t });
                    const existing = state.boardIndustries[`${move.location}_${move.slot}`];
                    if (existing && existing.playerId === id && !existing.flipped) {
                        p.overbuildUnflipped++;
                        p.overbuildSpend += logic.planMove(id, move).plan.cost;
                        p.overbuildUnflippedCubesLost += existing.resourceCubes || 0;
                    }
                }
            },
        });
        for (const [id, era] of loanEras) if (shortfalls.has(`${id}:${era}`)) p.loansThenShortfall++;
        for (const d of developed) {
            p.developed++;
            if (!builtAfter.some(b => b.id === d.id && b.type === d.type && b.at > d.at)) p.developedNeverBuilt++;
        }
    }
    console.log(`## ${level}`);
    console.log(`- Loans: ${p.loans}; with no Build or Network affordable: ${pct(p.loansNothingAffordable, p.loans)}; ` +
        `in the last two Rail rounds: ${pct(p.loansLastTwoRounds, p.loans)}; ` +
        `followed by an income shortfall in the same era: ${pct(p.loansThenShortfall, p.loans)}`);
    console.log(`- Sell legal at ${pct(p.sellLegal, p.turnActions)} of turn actions; not chosen: ${pct(p.sellLegalNotChosen, p.sellLegal)}; ` +
        `chose Pass or Loan instead: ${pct(p.sellLegalChosePassOrLoan, p.sellLegal)}`);
    console.log(`- Tiles developed: ${p.developed}; industry never built afterwards: ${pct(p.developedNeverBuilt, p.developed)}`);
    const spent = p.spend.build + p.spend.network + p.spend.develop;
    console.log(`- Money spent per player per game: £${(spent / SEEDS / PLAYERS).toFixed(0)}: Build ${(100 * p.spend.build / spent).toFixed(0)}%, ` +
        `Network ${(100 * p.spend.network / spent).toFixed(0)}%, Develop ${(100 * p.spend.develop / spent).toFixed(0)}%; ` +
        `loans raised £${(30 * p.loans / SEEDS / PLAYERS).toFixed(0)}`);
    console.log(`- Overbuilt own unflipped tiles: ${p.overbuildUnflipped} (£${p.overbuildSpend} spent on them), destroying ${p.overbuildUnflippedCubesLost} resource cubes\n`);
}
