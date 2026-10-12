#!/usr/bin/env node
// Assignment 7: how and why the AI borrows.
//
//   node scripts/research/ai-loans.js [--players 3] [--seeds 50] [--levels normal] [--loan a6] [--overbuild a6] [--sell a8] [--legacy a9] [--examples 3]
//
// Plays mirror games (every seat the same level, seeds 200000 + 1000 *
// players + i as in ai-baseline.js) with the AI's diagnostics on, and for
// every Loan it records the situation (era, rounds left, cash, income, loans
// so far), why the heuristic chose it (the loan score's parts and the best
// alternative), and what followed: what the player did with its next two
// actions, whether the money was spent on Build / Network / Develop, and
// whether the player owed an income shortfall later in the same era.
//
// Each loan is classed as:
//   enabling     no Build or Network was affordable, the loan made one
//                affordable, and the player's next action was a Build or
//                Network it could not have afforded without the loan
//   investment   the next two actions spent at least £15 on Build, Network or
//                Develop (but the loan was not strictly needed for them)
//   idle         neither: the money was not put to work within two actions
// Separately, a loan is "followed by a shortfall" when the player owed an
// income shortfall later in the same era.
// --loan selects a loan-scoring variant (see js/aiPlayer.js, options.loan);
// --overbuild a6 --sell a8 runs on the AI of Assignments 6-7, which Assignment 7
// studied (--sell a8 alone: the AI of Assignment 8).

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
const LOAN = arg('loan', null);
const OVERBUILD = arg('overbuild', null);
const SELL = arg('sell', null);
const EXAMPLES = Number(arg('examples', 3));
const E = loadEngine();
// --legacy a9: the AI before Assignment 10 (AIPlayer.LEGACY_A9: single links,
// Develop until the end), which the earlier reports measured
const LEGACY_PINS = arg('legacy', null) === 'a9' ? E.AIPlayer.LEGACY_A9 : {};
const A = E.ACTIONS;

const pct = (a, b) => `${a} of ${b} (${b ? (100 * a / b).toFixed(0) : 0}%)`;
const avg = (xs) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : NaN);

// Income payments still to come in the whole game for a player deciding now:
// one at the end of every remaining round except the game's last.
function incomePaymentsLeft(state) {
    const r = state.getRoundsRemaining();
    return state.era === 'canal' ? r + E.ROUNDS_PER_ERA[state.numPlayers] - 1 : r - 1;
}

// Build / Network targets affordable with `extra` money
function affordable(state, id, extra) {
    const obs = state.getObservation(id);
    obs.players[id].money += extra;
    const lg = new E.GameLogic(obs);
    return { builds: lg.getValidBuildTargets(id), networks: lg.getValidNetworkTargets(id) };
}

for (const level of LEVELS) {
    const loans = [];
    let decisions = 0;
    for (let i = 1; i <= SEEDS; i++) {
        const seed = 200000 + 1000 * PLAYERS + i;
        const names = ['A', 'B', 'C', 'D'].slice(0, PLAYERS);
        const state = new E.GameState(PLAYERS, names, names.map(() => ({ isAI: true, difficulty: level })), { seed });
        const logic = new E.GameLogic(state);
        const aiRng = new E.SeededRandom(aiSeedFor(seed));
        const opts = { explain: true, ...LEGACY_PINS, ...(LOAN ? { loan: LOAN } : {}), ...(OVERBUILD ? { overbuild: OVERBUILD } : {}), ...(SELL ? { sell: SELL } : {}) };
        const open = [];            // loans still waiting for their follow-up actions
        const history = [];         // per move: { id, era, type, spent }
        for (let d = logic.getCurrentDecision(); d.type !== 'gameOver'; d = logic.getCurrentDecision()) {
            const id = d.playerId;
            if (d.type === 'shortfall') {
                for (const l of loans) if (l.seed === seed && l.player === id && l.era === state.era) l.shortfallAfter = true;
                logic.play(id, logic.defaultShortfallMove(id));
                continue;
            }
            decisions++;
            const decision = E.AIPlayer.chooseAction(state, logic, id, level, aiRng, opts);
            const move = logic.moveFromDecision(decision);
            const plan = logic.planMove(id, move).plan;
            const spent = plan && typeof plan.cost === 'number' ? plan.cost : 0;

            // Follow-ups of earlier loans by this player
            for (const l of open.filter(x => x.player === id)) {
                l.next.push({ type: move.type, spent, enabledByLoan: l.enabledKeys.has(targetKey(move)) });
                if (l.next.length >= 2) open.splice(open.indexOf(l), 1);
            }

            if (move.type === A.LOAN) {
                const p = state.players[id];
                const now = affordable(state, id, 0);
                const after = affordable(state, id, E.LOAN_AMOUNT);
                const nowKeys = new Set([...now.builds.map(b => `b:${b.cityId}:${b.slotIndex}:${b.industryType}`), ...now.networks.map(n => `n:${n.connectionId}`)]);
                const enabledKeys = new Set([...after.builds.map(b => `b:${b.cityId}:${b.slotIndex}:${b.industryType}`), ...after.networks.map(n => `n:${n.connectionId}`)]
                    .filter(k => !nowKeys.has(k)));
                const cands = decision.explain.candidates;
                const loanCand = cands.find(c => c.action === A.LOAN);
                const others = cands.filter(c => c.action !== A.LOAN).sort((a, b) => b.score - a.score);
                const l = {
                    seed, player: id, era: state.era, round: state.round, roundsLeft: state.getRoundsRemaining(),
                    paymentsLeft: incomePaymentsLeft(state), money: p.money, income: state.getIncomeLevel(id),
                    loanNo: loans.filter(x => x.seed === seed && x.player === id).length + 1,
                    nothingAffordable: nowKeys.size === 0, enablesSomething: enabledKeys.size > 0, enabledKeys,
                    parts: loanCand.parts, score: loanCand.score,
                    runnerUp: others[0] ? { action: others[0].action, score: others[0].score } : null,
                    alternatives: others.map(c => c.action), forced: decision.explain.forced,
                    next: [], shortfallAfter: false,
                };
                loans.push(l);
                open.push(l);
            }
            history.push({ id, type: move.type });
            const r = logic.play(id, move);
            if (!r.success) throw new Error(`rejected (seed ${seed}): ${r.message}`);
        }
    }

    // Classify
    const productive = (n) => n && (n.type === A.BUILD || n.type === A.NETWORK || n.type === A.DEVELOP);
    for (const l of loans) {
        const first = l.next[0];
        const spentTwo = l.next.slice(0, 2).filter(productive).reduce((s, n) => s + n.spent, 0);
        if (l.nothingAffordable && l.enablesSomething && first && first.enabledByLoan) l.kind = 'enabling';
        else if (spentTwo >= 15) l.kind = 'investment';
        else l.kind = 'idle';
    }

    const n = loans.length;
    const by = (f) => loans.filter(f).length;
    const crunch = by(l => l.parts.cashCrunchBonus > 0);
    console.log(`## ${level}${LOAN ? ` (loan: ${LOAN})` : ''}: ${PLAYERS} players, ${SEEDS} games, ${decisions} turn decisions, ${n} loans (${(n / SEEDS / PLAYERS).toFixed(2)} per player per game)\n`);
    console.log('**Situation**');
    console.log(`- Era: Canal ${by(l => l.era === 'canal')}, Rail ${by(l => l.era === 'rail')}; ` +
        `in the first third of an era (rounds left ≥ 2/3 of the era) ${pct(by(l => l.roundsLeft >= 2 / 3 * E.ROUNDS_PER_ERA[PLAYERS]), n)}, last two rounds ${pct(by(l => l.roundsLeft <= 2), n)}`);
    console.log(`- Mean cash before £${avg(loans.map(l => l.money)).toFixed(1)}; mean income level before ${avg(loans.map(l => l.income)).toFixed(1)}; ` +
        `1st / 2nd / 3rd / 4th+ loan of the player: ${[1, 2, 3].map(k => by(l => l.loanNo === k)).join(' / ')} / ${by(l => l.loanNo >= 4)}`);
    console.log(`- Income payments still to come: mean ${avg(loans.map(l => l.paymentsLeft)).toFixed(1)}, so each loan's −3 income levels cost on average £${(3 * avg(loans.map(l => l.paymentsLeft))).toFixed(0)} for the £30 raised; ` +
        `loans costing more than they raise (more than 10 payments left): ${pct(by(l => l.paymentsLeft > 10), n)}`);
    console.log(`- No Build or Network affordable: ${pct(by(l => l.nothingAffordable), n)}; the loan made one affordable: ${pct(by(l => l.enablesSomething), n)}; ` +
        `nothing affordable AND the loan enabled nothing: ${pct(by(l => l.nothingAffordable && !l.enablesSomething), n)}`);
    console.log('\n**Why it was chosen**');
    console.log(`- Cash-crunch bonus (+4) applied: ${pct(crunch, n)}; mean loan score ${avg(loans.map(l => l.score)).toFixed(2)} (base ${avg(loans.map(l => l.parts.base)).toFixed(2)})`);
    const alt = {};
    for (const l of loans) for (const a of l.alternatives) alt[a] = (alt[a] || 0) + 1;
    console.log(`- Other actions available at the loan: ${Object.entries(alt).sort((a, b) => b[1] - a[1]).map(([a, k]) => `${a} ${pct(k, n)}`).join(', ')}`);
    const ru = {};
    for (const l of loans) if (l.runnerUp) ru[l.runnerUp.action] = (ru[l.runnerUp.action] || 0) + 1;
    console.log(`- Best alternative: ${Object.entries(ru).sort((a, b) => b[1] - a[1]).map(([a, k]) => `${a} ${k}`).join(', ')}; ` +
        `the loan would have lost without the crunch bonus in ${pct(by(l => l.parts.cashCrunchBonus > 0 && l.runnerUp && l.score - l.parts.cashCrunchBonus < l.runnerUp.score), crunch)} of crunch loans; ` +
        `chosen only through Easy's random pick: ${by(l => l.forced)}`);
    console.log('\n**What followed**');
    console.log(`- Enabling (needed for the next Build / Network): ${pct(by(l => l.kind === 'enabling'), n)}; ` +
        `investment (≥ £15 on Build / Network / Develop within two actions): ${pct(by(l => l.kind === 'investment'), n)}; ` +
        `idle: ${pct(by(l => l.kind === 'idle'), n)}`);
    const nextType = {};
    for (const l of loans) if (l.next[0]) nextType[l.next[0].type] = (nextType[l.next[0].type] || 0) + 1;
    console.log(`- The player's next action: ${Object.entries(nextType).sort((a, b) => b[1] - a[1]).map(([a, k]) => `${a} ${k}`).join(', ')}`);
    console.log(`- Followed by an income shortfall in the same era: ${pct(by(l => l.shortfallAfter), n)} ` +
        `(enabling ${pct(by(l => l.kind === 'enabling' && l.shortfallAfter), by(l => l.kind === 'enabling'))}, ` +
        `idle ${pct(by(l => l.kind === 'idle' && l.shortfallAfter), by(l => l.kind === 'idle'))})`);
    console.log('\n**Examples**');
    for (const kind of ['enabling', 'investment', 'idle']) {
        for (const l of loans.filter(x => x.kind === kind).slice(0, EXAMPLES)) {
            console.log(`- ${kind}: seed ${l.seed}, player ${l.player}, ${l.era} round ${l.round} (${l.roundsLeft} left), £${l.money}, income ${l.income}, loan #${l.loanNo}; ` +
                `score ${l.score.toFixed(2)} (crunch ${l.parts.cashCrunchBonus}), runner-up ${l.runnerUp ? `${l.runnerUp.action} ${l.runnerUp.score.toFixed(2)}` : '–'}; ` +
                `then ${l.next.map(x => `${x.type}${x.spent ? ` £${x.spent}` : ''}`).join(', ') || '–'}${l.shortfallAfter ? '; shortfall later in the era' : ''}`);
        }
    }
    console.log();
}

function targetKey(move) {
    if (move.type === A.BUILD) return `b:${move.location}:${move.slot}:${move.industry}`;
    if (move.type === A.NETWORK) return `n:${move.links[0]}`;
    return '';
}
