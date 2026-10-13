#!/usr/bin/env node
// Assignment 13: capability-gap diagnostics for the production AI (the
// four-action planner, AIPlanner.chooseAction at Normal) in self-play.
// Research only: it observes the AI, it changes nothing.
//
//   node scripts/research/ai-gap.js [--players 3] [--seeds 6] [--examples 3]
//
// Seeds 900000 + 1000 * players + i (not used by earlier experiments). The
// planner runs without its wall-clock cut-off, so every trace reproduces.
//
// Reports, per player count:
//   CASH       money at the end (it only breaks ties: rulebook); money at
//              the start of the last round; last-round decisions where a link
//              that would score at least 1 VP at once was legal and
//              affordable but the AI took a non-scoring action instead
//   DEVELOP    Develop actions and tiles; whether each developed industry is
//              built later; level of the tiles built in each era; Level II+
//              tiles built in the Canal Era that are still on the board at the
//              end (they score in both eras)
//   LINKS      for each link built: the VP it would score if the era ended
//              then, against the VP it scores at the era's end, and how much
//              of the gain came from the AI's own and from opponents' flips
//   PLANS      the planned next action after the turn ends (plan step beyond
//              the current turn): still legal at the AI's next decision
//              (with any card: the hand has changed)? If not, why (the
//              resolver's message), and whether the action was then played
//   BEER/SELL  sales made with own, opponents' or merchant beer
//   LOANS      loans by era and in the game's last two rounds, and players
//              whose income ended at the -10 floor

'use strict';

const { loadEngine } = require('../../test/helpers/engine');
const { aiSeedFor } = require('./harness');

function arg(name, fallback) {
    const i = process.argv.indexOf(`--${name}`);
    return i >= 0 ? process.argv[i + 1] : fallback;
}
const PLAYERS = Number(arg('players', 3));
const SEEDS = Number(arg('seeds', 6));
const EXAMPLES = Number(arg('examples', 3));
const E = loadEngine();
const A = E.ACTIONS;
const CONFIG = { planner: { ...E.AIPlanner.PRODUCTION, maxMs: Infinity } };

const pct = (a, b) => `${a} of ${b} (${b ? (100 * a / b).toFixed(0) : 0}%)`;
const mean = (xs) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : NaN);
const f1 = (x) => (Number.isFinite(x) ? x.toFixed(1) : '–');

// VP a link would score if the era ended now (rulebook: link icons on the
// flipped tiles of both locations, 2 per merchant)
function linkValue(state, connId) {
    const conn = E.CONNECTIONS.find(c => c.id === connId);
    let v = 0;
    const tileVP = (t) => (t && t.flipped ? t.tileData.linkVP : 0);
    for (const cityId of conn.cities) {
        if (E.CITIES[cityId]) E.CITIES[cityId].slots.forEach((_, i) => { v += tileVP(state.boardIndustries[`${cityId}_${i}`]); });
        if (E.isMerchantLocation(cityId)) v += 2;
        if (E.isBreweryFarm(cityId)) v += tileVP(state.breweryFarmTiles[cityId]);
    }
    if (conn.viaBrewery) v += tileVP(state.breweryFarmTiles[conn.viaBrewery]);
    return v;
}
// Own and opponents' flipped link icons adjacent to a link (to attribute gains)
function linkIconsBy(state, connId, playerId) {
    const conn = E.CONNECTIONS.find(c => c.id === connId);
    let own = 0, opp = 0;
    const add = (t) => { if (t && t.flipped) { if (t.playerId === playerId) own += t.tileData.linkVP; else opp += t.tileData.linkVP; } };
    for (const cityId of conn.cities) {
        if (E.CITIES[cityId]) E.CITIES[cityId].slots.forEach((_, i) => add(state.boardIndustries[`${cityId}_${i}`]));
        if (E.isBreweryFarm(cityId)) add(state.breweryFarmTiles[cityId]);
    }
    if (conn.viaBrewery) add(state.breweryFarmTiles[conn.viaBrewery]);
    return { own, opp };
}
const reasonOf = (msg) => {
    const m = String(msg || '').toLowerCase();
    if (m.includes('cannot be sold')) return 'sale no longer possible';
    if (m.includes('cannot build that link')) return 'link taken or unreachable';
    if (m.includes('cannot build that there')) return 'build space taken or unreachable';
    if (m.includes('loan')) return 'loan limit';
    if (m.includes('beer')) return 'beer gone';
    if (m.includes('coal')) return 'coal';
    if (m.includes('iron')) return 'iron';
    if (m.includes('merchant')) return 'merchant';
    if (m.includes('afford') || m.includes('money')) return 'money';
    if (m.includes('already built') || m.includes('connection')) return 'link taken';
    if (m.includes('card')) return 'card';
    return m.slice(0, 40) || 'other';
};

const out = {
    games: 0, playerGames: 0,
    endMoney: [], lastRoundMoney: [], lastRoundDecisions: 0, lastRoundMissedLink: 0, lastRoundTurnMissed: 0, lastRoundActions: {}, lastRoundTrace: [],
    develops: { canal: 0, rail: 0 }, devTiles: [], buildsByEra: { canal: [], rail: [] }, canalHighSurvive: 0, canalHigh: 0,
    links: [], plans: { planned: 0, legal: 0, played: 0, reasons: {} },
    beer: { own: 0, opponent: 0, merchant: 0 }, loans: { canal: 0, rail: 0, last2: 0 }, floor: 0,
    finalVP: [],
};
const ex = { missedLink: [], plan: [], develop: [] };

for (let i = 1; i <= SEEDS; i++) {
    const seed = 900000 + 1000 * PLAYERS + i;
    const names = ['A', 'B', 'C', 'D'].slice(0, PLAYERS);
    const state = new E.GameState(PLAYERS, names, names.map(() => ({ isAI: true, difficulty: 'normal' })), { seed });
    const logic = new E.GameLogic(state);
    const aiRng = new E.SeededRandom(aiSeedFor(seed));
    const pendingPlan = {};   // playerId -> { move, desc }
    const devRecs = [];       // { id, type, t }
    const builds = [];        // { id, type, t }
    const builtEra = new Map();   // tile object -> era it was built in (the game state is never written to)
    const linkRecs = [];      // { id, connId, era, atBuild, ownAt, oppAt }
    let t = 0;
    // Snapshot link values just before each era is scored
    for (const method of ['endCanalEra', 'endGame']) {
        const original = state[method].bind(state);
        state[method] = () => {
            for (const r of linkRecs.filter(x => x.era === state.era && x.final === undefined)) {
                r.final = linkValue(state, r.connId);
                const by = linkIconsBy(state, r.connId, r.id);
                r.ownGain = by.own - r.ownAt;
                r.oppGain = by.opp - r.oppAt;
            }
            for (const tile of Object.values(state.boardIndustries)) {
                if (method === 'endGame' && builtEra.get(tile) === 'canal') out.canalHighSurvive++;
            }
            return original();
        };
    }
    let turnWatch = null;
    const endTurnCheck = (nextId) => {
        if (!turnWatch || nextId === turnWatch.id) return;
        const w = turnWatch;
        turnWatch = null;
        const p = state.players[w.id];
        const still = state.gameOver ? null : logic.getValidNetworkTargets(w.id).map(n => linkValue(state, n.connectionId)).sort((a, b) => b - a)[0];
        // At game end the targets cannot be listed; use the money left and the links seen at the decision
        if (state.gameOver || (still !== undefined && still >= 1)) {
            out.lastRoundTurnMissed++;
            if (ex.missedLink.length < EXAMPLES) ex.missedLink.push(`seed ${w.seed}, player ${w.id}, rail round ${w.round}: took ${w.taken} with £${w.money}; the turn ended with a link worth 1+ VP still legal and affordable (money left £${p.money})`);
        }
    };
    for (let d = logic.getCurrentDecision(); d.type !== 'gameOver'; d = logic.getCurrentDecision()) {
        const id = d.playerId;
        endTurnCheck(id);
        if (d.type === 'shortfall') { logic.play(id, logic.defaultShortfallMove(id)); continue; }
        t++;
        const gameRoundsLeft = state.getRoundsRemaining() + (state.era === 'canal' ? E.ROUNDS_PER_ERA[PLAYERS] : 0);
        const actionsLeft = state.actionsPerTurn - state.actionsThisTurn;
        // Planned follow-up from this player's previous turn
        if (pendingPlan[id]) {
            const p = pendingPlan[id];
            // Ignore which card: the plan used the hand of the previous turn
            const { card, ...withoutCard } = p.move;
            const r = logic.resolveMove(id, withoutCard, { requireCard: false });
            if (r.ok) out.plans.legal++;
            else {
                const why = reasonOf(r.message);
                out.plans.reasons[why] = (out.plans.reasons[why] || 0) + 1;
                if (ex.plan.length < EXAMPLES) ex.plan.push(`seed ${seed}, player ${id}, ${state.era} round ${state.round}: planned ${p.desc} no longer legal (${r.message})`);
            }
            pendingPlan[id].check = true;
        }
        const decision = E.AIPlanner.chooseAction(state, logic, id, 'normal', aiRng, CONFIG);
        const move = logic.moveFromDecision(decision);
        if (pendingPlan[id] && pendingPlan[id].check) {
            if (JSON.stringify({ ...move, card: 0 }) === JSON.stringify({ ...pendingPlan[id].move, card: 0 })) out.plans.played++;
            delete pendingPlan[id];
        }
        // The first planned action beyond the current turn
        if (decision.plan && decision.plan.length > actionsLeft) {
            const m = decision.plan[actionsLeft];
            out.plans.planned++;
            pendingPlan[id] = { move: m, desc: m.type === A.BUILD ? `build ${m.industry} at ${m.location}` : m.type === A.NETWORK ? `network ${m.links.join('+')}` : m.type };
        }
        // Last round of the game: money, and scoring links left unbuilt
        const player = state.players[id];
        if (state.era === 'rail' && state.getRoundsRemaining() <= 1) {
            out.lastRoundDecisions++;
            out.lastRoundActions[move.type] = (out.lastRoundActions[move.type] || 0) + 1;
            if (actionsLeft === state.actionsPerTurn) out.lastRoundMoney.push(player.money);
            if (move.type !== A.NETWORK && move.type !== A.BUILD && move.type !== A.SELL) {
                const best = logic.getValidNetworkTargets(id).map(n => ({ n, v: linkValue(state, n.connectionId) })).sort((a, b) => b.v - a.v)[0];
                if (best && best.v >= 1) {
                    out.lastRoundMissedLink++;
                    // How the position value compares the action taken with the link
                    const obs = state.getObservation(id);
                    const valueAfter = (m) => {
                        const c = obs.clone();
                        const l = new E.GameLogic(c);
                        return l.applyMove(id, m).success ? E.AIPlanner.positionValue(c, l, id) : NaN;
                    };
                    const v0 = E.AIPlanner.positionValue(obs, new E.GameLogic(obs), id);
                    const card = move.card !== undefined ? move.card : 0;
                    out.lastRoundTrace.push({ taken: valueAfter(move) - v0, link: valueAfter({ type: A.NETWORK, card, links: [best.n.connectionId] }) - v0, linkVP: best.v });
                    // Checked when the turn ends: was a scoring link still left unbuilt?
                    turnWatch = { id, seed, round: state.round, money: player.money, taken: move.type };
                }
            }
        }
        if (move.type === A.DEVELOP) {
            out.develops[state.era]++;
            move.industries.forEach(type => devRecs.push({ id, type, t, gameRoundsLeft }));
        }
        if (move.type === A.LOAN) {
            out.loans[state.era]++;
            if (gameRoundsLeft <= 2) out.loans.last2++;
        }
        let linkIds = null;
        if (move.type === A.NETWORK) linkIds = move.links;
        const before = {};
        if (linkIds) for (const c of linkIds) before[c] = null;
        const r = logic.play(id, move);
        if (!r.success) throw new Error(`rejected (seed ${seed}): ${r.message}`);
        if (r.move && r.move.type === A.SELL) {
            for (const s of r.move.sales || []) {
                if (s.merchant !== undefined && s.merchant !== 'none') out.beer.merchant++;
                for (const b of s.beer || []) {
                    const key = b.split(/:(.*)/)[1];
                    const tile = key.startsWith('farm_') ? state.breweryFarmTiles[key.slice(5)] : state.boardIndustries[key];
                    out.beer[tile && tile.playerId === id ? 'own' : 'opponent']++;
                }
            }
        }
        if (move.type === A.BUILD) {
            const tile = state.boardIndustries[`${move.location}_${move.slot}`] || state.breweryFarmTiles[move.location];
            if (tile) {
                builtEra.set(tile, state.era);
                out.buildsByEra[state.era].push(tile.tileData.level);
                if (state.era === 'canal' && tile.tileData.level >= 2) out.canalHigh++;
                builds.push({ id, type: move.industry, t });
            }
        }
        if (linkIds) {
            for (const c of linkIds) {
                const by = linkIconsBy(state, c, id);
                linkRecs.push({ id, connId: c, era: state.era, atBuild: linkValue(state, c), ownAt: by.own, oppAt: by.opp });
            }
        }
    }
    if (turnWatch) {
        // The game ended with the watched turn: check against the links legal before the last action
        turnWatch = null;
    }
    out.games++;
    out.playerGames += PLAYERS;
    for (const p of state.players) {
        out.endMoney.push(p.money);
        out.finalVP.push(p.vp);
        if (state.getIncomeLevel(p.id) <= -10) out.floor++;
    }
    for (const dv of devRecs) {
        const built = builds.some(b => b.id === dv.id && b.type === dv.type && b.t > dv.t);
        out.devTiles.push({ built, gameRoundsLeft: dv.gameRoundsLeft });
        if (!built && ex.develop.length < EXAMPLES) ex.develop.push(`seed ${seed}, player ${dv.id}: developed ${dv.type} with ${dv.gameRoundsLeft} game rounds left, never built afterwards`);
    }
    out.links.push(...linkRecs.filter(x => x.final !== undefined));
}

const g = out.playerGames;
console.log(`## Production AI self-play: ${PLAYERS} players, ${out.games} games (four-action planner at every seat)\n`);
console.log(`**Final VP per player:** mean ${f1(mean(out.finalVP))}, min ${Math.min(...out.finalVP)}, max ${Math.max(...out.finalVP)}\n`);
console.log(`**Cash** (money only breaks ties at the end)`);
console.log(`- Money at the end: mean £${f1(mean(out.endMoney))}, max £${Math.max(...out.endMoney)}; at the start of the last round: mean £${f1(mean(out.lastRoundMoney))}`);
console.log(`- Last-round decisions: ${out.lastRoundDecisions} (${Object.entries(out.lastRoundActions).map(([k, n]) => `${k} ${n}`).join(', ')})`);
console.log(`- Last-round decisions that built nothing, linked nothing and sold nothing while a link worth 1+ VP at once was legal and affordable: ${pct(out.lastRoundMissedLink, out.lastRoundDecisions)}`);
console.log(`- Of those, turns that ended with such a link still unbuilt (the game's final turn is not checked): ${out.lastRoundTurnMissed}`);
if (out.lastRoundTrace.length) {
    const tr = out.lastRoundTrace;
    console.log(`- At those decisions the position value rated the action taken at +${f1(mean(tr.map(x => x.taken)))} and the link at +${f1(mean(tr.map(x => x.link)))} (the link scores ${f1(mean(tr.map(x => x.linkVP)))} VP); the action taken was rated higher in ${pct(tr.filter(x => x.taken >= x.link).length, tr.length)}`);
}
console.log(`\n**Development**`);
console.log(`- Develop actions per player per game: Canal ${f1(out.develops.canal / g)}, Rail ${f1(out.develops.rail / g)}; tiles developed ${out.devTiles.length}, built later ${pct(out.devTiles.filter(x => x.built).length, out.devTiles.length)}`);
console.log(`- Mean level of tiles built: Canal ${f1(mean(out.buildsByEra.canal))} (${out.buildsByEra.canal.length} tiles), Rail ${f1(mean(out.buildsByEra.rail))} (${out.buildsByEra.rail.length} tiles)`);
console.log(`- Level II+ tiles built in the Canal Era: ${f1(out.canalHigh / g)} per player per game; Canal-built tiles still on the board at the game's end: ${f1(out.canalHighSurvive / g)} per player per game`);
const lk = (era) => out.links.filter(x => x.era === era);
for (const era of ['canal', 'rail']) {
    const L = lk(era);
    if (!L.length) continue;
    console.log(`\n**Links (${era})**: ${L.length} links (${f1(L.length / g)} per player per game)`);
    console.log(`- Value if the era ended when built: mean ${f1(mean(L.map(x => x.atBuild)))} VP; at the era's end: mean ${f1(mean(L.map(x => x.final)))} VP`);
    console.log(`- Gain after building: from the AI's own flips ${f1(mean(L.map(x => x.ownGain)))} VP, from opponents' flips ${f1(mean(L.map(x => x.oppGain)))} VP per link`);
    console.log(`- Links worth 0 VP when built: ${pct(L.filter(x => x.atBuild === 0).length, L.length)}; of those, worth 0 at the era's end: ${pct(L.filter(x => x.atBuild === 0 && x.final === 0).length, L.filter(x => x.atBuild === 0).length)}`);
}
console.log(`\n**Plans beyond the current turn:** ${out.plans.planned} planned; still legal at the next decision ${pct(out.plans.legal, out.plans.planned)}; played ${pct(out.plans.played, out.plans.planned)}`);
console.log(`- Why not legal: ${Object.entries(out.plans.reasons).sort((a, b) => b[1] - a[1]).map(([k, n]) => `${k} ${n}`).join(', ') || '–'}`);
console.log(`\n**Beer for sales:** own breweries ${out.beer.own}, opponents' breweries ${out.beer.opponent}, merchant barrels ${out.beer.merchant}`);
console.log(`\n**Loans** per player per game: Canal ${f1(out.loans.canal / g)}, Rail ${f1(out.loans.rail / g)}, in the game's last two rounds ${f1(out.loans.last2 / g)}; players ending at the -10 income floor: ${out.floor} of ${g}`);
if (EXAMPLES > 0) {
    console.log('\n**Examples**');
    for (const [k, list] of Object.entries(ex)) for (const s of list) console.log(`- ${k}: ${s}`);
}
console.log('');
