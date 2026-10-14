'use strict';

// Assignment 16: the planner's long-term valuation terms (futureLinks,
// eraValue, developValue; docs/research/ai-strategic-valuation-a16.md).
// They must use only what the player may know, never change the real game,
// and value what they claim to value.

const test = require('node:test');
const assert = require('node:assert/strict');
const { loadEngine } = require('./helpers/engine');
const { createGame } = require('./helpers/headless');

const E = loadEngine();
const { strategicContext, strategicValue } = E.AIPlanner.research;
const PROD = { ...E.AIPlanner.PRODUCTION, maxMs: Infinity };
const OPTIONS = { futureLinks: { futureLinks: true }, eraValue: { eraValue: true }, developValue: { developValue: true } };
const isWild = (c) => c.type === E.CARD_TYPES.WILD_LOCATION || c.type === E.CARD_TYPES.WILD_INDUSTRY;
const ser = (s) => JSON.stringify(s.serialize());

function alternateWorld(state, viewerId, rng) {
    const alt = state.clone();
    const slots = [];
    alt.drawDeck.forEach((c, i) => slots.push([alt.drawDeck, i]));
    for (const p of alt.players) {
        if (p.id !== viewerId) p.hand.forEach((c, i) => { if (!isWild(c)) slots.push([p.hand, i]); });
        p.discardPile.forEach((c, i) => { if (c.faceDown) slots.push([p.discardPile, i]); });
    }
    const cards = rng.shuffle(slots.map(([arr, i]) => { const { faceDown, ...card } = arr[i]; return card; }));
    slots.forEach(([arr, i], k) => { arr[i] = arr[i].faceDown ? { ...cards[k], faceDown: true } : cards[k]; });
    alt.rng = new E.SeededRandom(rng.int(1e9));
    return alt;
}

// Turn-start positions in both eras, reached with the fast heuristic
function positions(players, seed, every) {
    const { state, logic } = createGame(E, { players, seed });
    const rng = new E.SeededRandom(seed);
    const out = [];
    let k = 0;
    for (let d = logic.getCurrentDecision(); d.type !== 'gameOver' && out.length < 4; d = logic.getCurrentDecision()) {
        if (d.type === 'shortfall') { logic.play(d.playerId, logic.defaultShortfallMove(d.playerId)); continue; }
        if (state.actionsThisTurn === 0 && state.actionsPerTurn === 2 && state.getRoundsRemaining() > 1 && k++ % every === every - 1) out.push(state.clone());
        logic.play(d.playerId, logic.moveFromDecision(E.AIPlayer.chooseAction(state, logic, d.playerId, 'easy', rng)));
    }
    return out;
}
const POSITIONS = [...positions(3, 161, 9), ...positions(4, 162, 13)];
const value = (state, id, opts) => {
    const obs = state.getObservation(id);
    const cfg = { ...PROD, ...opts };
    return strategicValue(obs, new E.GameLogic(obs), id, cfg, strategicContext(obs, id, cfg));
};

test('the test positions cover both eras', () => {
    assert.ok(POSITIONS.some(s => s.era === E.ERA.CANAL));
    assert.ok(POSITIONS.some(s => s.era === E.ERA.RAIL));
});

test('each option plans identically when hidden cards change, and never changes the real game', () => {
    const rng = new E.SeededRandom(163);
    for (const state of POSITIONS) {
        const id = state.currentPlayerId;
        const alt = alternateWorld(state, id, rng);
        for (const [name, opts] of Object.entries(OPTIONS)) {
            const before = ser(state);
            const plan = E.AIPlanner.plan(state, id, { ...PROD, ...opts }).plan;
            assert.equal(ser(state), before, `${name} changed the real game`);
            assert.equal(JSON.stringify(E.AIPlanner.plan(alt, id, { ...PROD, ...opts }).plan), JSON.stringify(plan),
                `${name}: plan differs with hidden cards changed (${state.era} round ${state.round})`);
        }
    }
});

test('futureLinks: the link icons of unflipped tiles next to the player\'s links, weighted by their chance of flipping', () => {
    let checked = 0;
    for (const state of POSITIONS) {
        for (const p of state.players) {
            const v = value(state, p.id, OPTIONS.futureLinks);
            assert.ok(v >= 0);
            const ownLinks = Object.values(state.boardLinks).filter(l => l.playerId === p.id);
            if (!ownLinks.length) { assert.equal(v, 0); continue; }
            // Flipping every tile on the board moves all icons into the era score: nothing future is left
            const flipped = state.clone();
            for (const t of Object.values(flipped.boardIndustries)) t.flipped = true;
            for (const t of Object.values(flipped.breweryFarmTiles)) if (t) t.flipped = true;
            assert.equal(value(flipped, p.id, OPTIONS.futureLinks), 0);
            if (v > 0) checked++;
        }
    }
    assert.ok(checked > 0);
});

test('eraValue: only Level II+ tiles, only in the Canal Era', () => {
    let canal = 0;
    for (const state of POSITIONS) {
        for (const p of state.players) {
            const v = value(state, p.id, OPTIONS.eraValue);
            const own = Object.values(state.boardIndustries).filter(t => t.playerId === p.id && t.tileData.level >= 2);
            if (state.era === E.ERA.RAIL || own.length === 0) { assert.equal(v, 0); continue; }
            // Flipped tiles count 0.85 x VP; unflipped ones less
            const flippedPart = own.filter(t => t.flipped).reduce((a, t) => a + 0.85 * t.tileData.vp, 0);
            const max = own.reduce((a, t) => a + 0.85 * t.tileData.vp, 0);
            assert.ok(v >= flippedPart - 1e-9 && v <= max + 1e-9);
            canal++;
        }
    }
    assert.ok(canal > 0);
});

test('developValue: credits a changed top tile only with a usable card and rounds left', () => {
    const cfg = { ...PROD, ...OPTIONS.developValue };
    let credited = 0;
    for (const state of POSITIONS) {
        const id = state.currentPlayerId;
        const obs = state.getObservation(id);
        const logic = new E.GameLogic(obs);
        const ctx = strategicContext(obs, id, cfg);
        // Unchanged position: no credit
        assert.equal(strategicValue(obs, logic, id, cfg, ctx), 0);
        for (const type of Object.keys(ctx.card)) {
            const s = obs.clone();
            const top = s.getNextTile(id, type);
            if (!top || !top.canDevelop) continue;
            s.useNextTile(id, type);
            const v = strategicValue(s, new E.GameLogic(s), id, cfg, ctx);
            if (!ctx.card[type] || !ctx.roundsOk) assert.equal(v, 0, type);
            else if (v !== 0) credited++;
        }
    }
    assert.ok(credited > 0);
});

test('options off: the production planner is unchanged', () => {
    for (const state of POSITIONS.slice(0, 3)) {
        const id = state.currentPlayerId;
        const off = { ...PROD, futureLinks: false, eraValue: false, developValue: false };
        assert.equal(JSON.stringify(E.AIPlanner.plan(state, id, off).plan), JSON.stringify(E.AIPlanner.plan(state, id, PROD).plan));
    }
});
