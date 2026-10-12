#!/usr/bin/env node
// Assignment 10: the open findings of the Assignment 5 audit, measured on
// the current AI.
//
//   node scripts/research/ai-close.js [--players 3] [--seeds 50] [--levels normal] [--options '{"cards":"useful"}'] [--legacy a9] [--examples 2]
//
// Plays all-AI mirror games (seeds 200000 + 1000 * players + i, the
// exploration seeds of Assignments 7-9) and records, for every AI decision:
//
// CARDS (W4): for Network, Develop, Sell, Loan and Pass, the card discarded.
//   wasteful   it could build now (a non-wild card valid for some legal Build
//              target) while the hand held a card that could not
//   usefulness its cardUsefulness score against the lowest in the hand
// DOUBLE RAIL (W5): at every Rail-Era decision where Network is legal,
//   whether a two-link Network was legal (and affordable), and how often the
//   AI took one.
// DEVELOP (W2 follow-up): Develop actions removing one tile or two, and
//   whether two tiles of the same industry were legal when only one was
//   developed.
// CHOICES (W5): every free choice point of the moves played (coal, iron,
//   beer, merchant, Gloucester develop) where more than one option was legal,
//   who owned the option taken, and whether one of the player's own sources
//   was available instead.
// TIME: mean chooseAction time per turn decision.
// SHORTFALLS: every tile sold to cover an income shortfall: flipped or not,
//   its VP, its level, and whether a Canal-Era Level I tile (removed at the
//   era's end anyway) was available instead.
//
// --options passes AI options (js/aiPlayer.js) as JSON; --legacy a9 starts from
// the AI of Assignment 9 (AIPlayer.LEGACY_A9), the baseline this assignment measured.

'use strict';

const { loadEngine } = require('../../test/helpers/engine');
const { aiSeedFor } = require('./harness');

function arg(name, fallback) {
    const i = process.argv.indexOf(`--${name}`);
    return i >= 0 ? process.argv[i + 1] : fallback;
}
const PLAYERS = Number(arg('players', 3));
const SEEDS = Number(arg('seeds', 50));
const LEVELS = String(arg('levels', 'normal')).split(',');
const EXAMPLES = Number(arg('examples', 2));
const E = loadEngine();
const OPTIONS = { ...(arg('legacy', null) === 'a9' ? E.AIPlayer.LEGACY_A9 : {}), ...JSON.parse(arg('options', '{}')) };
const A = E.ACTIONS;
const WILD = [E.CARD_TYPES.WILD_LOCATION, E.CARD_TYPES.WILD_INDUSTRY];

const pct = (a, b) => `${a} of ${b} (${b ? (100 * a / b).toFixed(0) : 0}%)`;
const per = (n, games) => (n / (games * PLAYERS)).toFixed(2);

// Indices of non-wild hand cards usable for some legal Build now
function buildableCards(logic, id) {
    const hand = logic.state.players[id].hand;
    const set = new Set();
    for (const t of logic.getValidBuildTargets(id)) {
        for (const i of logic.getValidCardsForAction(id, A.BUILD, t)) if (!WILD.includes(hand[i].type)) set.add(i);
    }
    return set;
}

// Is some two-link Rail Network legal (and affordable) now?
function doubleRailLegal(logic, state, id) {
    if (state.era !== 'rail' || state.players[id].linksRemaining.rail < 2) return false;
    const card = state.players[id].hand.findIndex(() => true);
    for (const a of logic.getValidNetworkTargets(id)) {
        state.boardLinks[a.connectionId] = { playerId: id, type: 'rail' };
        let seconds;
        try { seconds = logic.getValidNetworkTargets(id); } finally { delete state.boardLinks[a.connectionId]; }
        for (const b of seconds) {
            if (b.connectionId === a.connectionId) continue;
            if (logic.resolveMove(id, { type: A.NETWORK, card, links: [a.connectionId, b.connectionId] }).ok) return true;
        }
    }
    return false;
}

// Owner of a resource source string, relative to the player
function owner(state, id, value) {
    if (typeof value !== 'string' || !value.includes(':')) return value === 'market' ? 'market' : 'other';
    const key = value.split(/:(.*)/)[1];
    const tile = key.startsWith('farm_') ? state.breweryFarmTiles[key.slice(5)] : state.boardIndustries[key];
    if (!tile) return 'other';
    return tile.playerId === id ? 'own' : 'opponent';
}

for (const level of LEVELS) {
    const c = {
        discards: 0, wasteful: 0, notLowest: 0, usefulGap: 0,
        railNetworkTurns: 0, doubleLegal: 0, doubleTaken: 0, singleTaken: 0,
        develop: 0, developOne: 0, developTwo: 0, developSame: 0, sameLegalWhenOne: 0,
        shortfalls: 0, shortfallFlipped: 0, shortfallVP: 0, shortfallLevel1Avail: 0, shortfallLevel1Taken: 0,
        decisions: 0, ms: 0,
    };
    const choices = {};   // kind -> { points, own, opponent, market, other, ownAvailableNotTaken }
    const ex = { wasteful: [], double: [], ownSkipped: [] };
    for (let i = 1; i <= SEEDS; i++) {
        const seed = 200000 + 1000 * PLAYERS + i;
        const names = ['A', 'B', 'C', 'D'].slice(0, PLAYERS);
        const state = new E.GameState(PLAYERS, names, names.map(() => ({ isAI: true, difficulty: level })), { seed });
        const logic = new E.GameLogic(state);
        const aiRng = new E.SeededRandom(aiSeedFor(seed));
        for (let d = logic.getCurrentDecision(); d.type !== 'gameOver'; d = logic.getCurrentDecision()) {
            const id = d.playerId;
            if (d.type === 'shortfall') {
                const move = E.AIPlayer.chooseShortfall(state, logic, id, OPTIONS);
                const tile = state.boardIndustries[move.tile] || state.breweryFarmTiles[move.tile];
                c.shortfalls++;
                if (tile.flipped) { c.shortfallFlipped++; c.shortfallVP += tile.tileData.vp; }
                if (state.era === 'canal') {
                    const level1 = state.ownedTileKeys(id).some(k => state.boardIndustries[k] && state.boardIndustries[k].tileData.level === 1);
                    if (level1) c.shortfallLevel1Avail++;
                    if (tile.tileData.level === 1) c.shortfallLevel1Taken++;
                }
                logic.play(id, move);
                continue;
            }
            c.decisions++;
            const canNetwork = logic.canPerformAction(A.NETWORK, id);
            const doubleOk = canNetwork && doubleRailLegal(logic, state, id);
            const handBefore = state.players[id].hand.slice();
            const buildable = buildableCards(logic, id);
            const t0 = process.hrtime.bigint();
            const decision = E.AIPlayer.chooseAction(state, logic, id, level, aiRng, OPTIONS);
            c.ms += Number(process.hrtime.bigint() - t0) / 1e6;
            const move = logic.moveFromDecision(decision);

            // Cards
            if ([A.NETWORK, A.DEVELOP, A.SELL, A.LOAN, A.PASS].includes(move.type)) {
                c.discards++;
                const card = handBefore[move.card];
                const dead = handBefore.some((h, k) => !WILD.includes(h.type) && !buildable.has(k));
                if (!WILD.includes(card.type) && buildable.has(move.card) && dead) {
                    c.wasteful++;
                    if (ex.wasteful.length < EXAMPLES) ex.wasteful.push(`seed ${seed}, player ${id}, ${state.era} round ${state.round}: ${move.type} discarding ${E.cardLabel ? E.cardLabel(card) : JSON.stringify(card.location || card.industryTypes)} (usable for a build) while holding an unusable card`);
                }
            }
            // Double rail
            if (state.era === 'rail' && canNetwork) {
                c.railNetworkTurns++;
                if (doubleOk) c.doubleLegal++;
            }
            if (move.type === A.NETWORK && state.era === 'rail') {
                if (move.links.length === 2) {
                    c.doubleTaken++;
                    if (ex.double.length < EXAMPLES) ex.double.push(`seed ${seed}, player ${id}, rail round ${state.round}: ${move.links.join(' + ')}`);
                } else c.singleTaken++;
            }
            // Develop
            if (move.type === A.DEVELOP) {
                c.develop++;
                if (move.industries.length === 1) {
                    c.developOne++;
                    if (logic.canDevelopTypes(id, move.industries[0], move.industries[0]).ok) c.sameLegalWhenOne++;
                } else {
                    c.developTwo++;
                    if (move.industries[0] === move.industries[1]) c.developSame++;
                }
            }
            // Choices
            const r = logic.resolveMove(id, move);
            if (!r.ok) throw new Error(`rejected (seed ${seed}): ${r.message}`);
            for (const p of r.points) {
                if (p.options.length < 2) continue;
                const k = choices[p.kind] || (choices[p.kind] = { points: 0, own: 0, opponent: 0, market: 0, other: 0, fixed: 0, ownAvailableNotTaken: 0 });
                k.points++;
                if (p.fixed) k.fixed++;
                const taken = p.options[p.index];
                k[owner(state, id, taken)]++;
                if (['coal', 'iron', 'beer'].includes(p.kind) && owner(state, id, taken) !== 'own' &&
                    p.options.some(o => owner(state, id, o) === 'own')) {
                    k.ownAvailableNotTaken++;
                    if (ex.ownSkipped.length < EXAMPLES) ex.ownSkipped.push(`seed ${seed}, player ${id}, ${state.era} round ${state.round}: ${move.type} took ${p.kind} from ${taken} (${owner(state, id, taken)}); own option available`);
                }
            }
            const res = logic.play(id, move);
            if (!res.success) throw new Error(`rejected (seed ${seed}): ${res.message}`);
        }
    }

    const g = SEEDS;
    const opt = Object.keys(OPTIONS).length ? ` (${JSON.stringify(OPTIONS)})` : '';
    console.log(`## ${level}${opt}: ${PLAYERS} players, ${g} games, ${c.decisions} turn decisions\n`);
    console.log(`**Decision time:** ${(c.ms / c.decisions).toFixed(2)} ms per turn decision (chooseAction)\n`);
    console.log(`**Cards (W4):** ${c.discards} discarding actions (Network, Develop, Sell, Loan, Pass)`);
    console.log(`- Discarded a card usable for a build now while holding an unusable card: ${pct(c.wasteful, c.discards)} (${per(c.wasteful, g)} per player per game)`);
    console.log(`\n**Double rail (W5):** Rail-Era decisions with Network legal: ${c.railNetworkTurns}; a two-link Network legal and affordable: ${pct(c.doubleLegal, c.railNetworkTurns)}`);
    console.log(`- Rail Networks taken: single ${c.singleTaken}, double ${c.doubleTaken}`);
    console.log(`\n**Develop:** ${c.develop} actions: one tile ${pct(c.developOne, c.develop)}, two tiles ${pct(c.developTwo, c.develop)} (same industry twice ${c.developSame})`);
    console.log(`- One tile developed while two of the same industry were legal: ${pct(c.sameLegalWhenOne, c.developOne)}`);
    console.log(`\n**Choices left to the engine (W5)** (choice points with 2+ legal options in the moves played):\n`);
    console.log('| Choice | Points | Per player per game | Specified by the AI | Taken: own | opponent | market | other | Own source available but not taken |');
    console.log('|---|---|---|---|---|---|---|---|---|');
    for (const [kind, k] of Object.entries(choices)) {
        console.log(`| ${kind} | ${k.points} | ${per(k.points, g)} | ${k.fixed} | ${k.own} | ${k.opponent} | ${k.market} | ${k.other} | ${['coal', 'iron', 'beer'].includes(kind) ? pct(k.ownAvailableNotTaken, k.points) : '–'} |`);
    }
    console.log(`\n**Shortfalls:** ${c.shortfalls} tiles sold (${per(c.shortfalls, g)} per player per game); flipped ${pct(c.shortfallFlipped, c.shortfalls)}, losing ${c.shortfallVP} VP (${per(c.shortfallVP, g)} per player per game)`);
    console.log(`- In the Canal Era with a Level I tile (removed at the era's end anyway) available: ${c.shortfallLevel1Avail}; a Level I tile taken: ${c.shortfallLevel1Taken}`);
    if (EXAMPLES > 0) {
        console.log('\n**Examples**');
        for (const [k, list] of Object.entries(ex)) for (const s of list) console.log(`- ${k}: ${s}`);
    }
    console.log('');
}
