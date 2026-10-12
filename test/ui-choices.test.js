'use strict';

// The browser UI drives the same move engine: human players are asked each
// rules-granted choice, and income shortfalls become prompts (AI seats use
// the automatic policy). Runs UIManager against a minimal fake DOM.

const test = require('node:test');
const assert = require('node:assert/strict');
const { loadEngine } = require('./helpers/engine');
const { makeDom } = require('./helpers/dom');
const { loc, setHand, placeIndustry, placeLink } = require('./helpers/scenario');

function uiSetup({ ai = false, seed = 91 } = {}) {
    const dom = makeDom();
    const E = loadEngine({ extraFiles: ['industryIcons.js', 'uiManager.js'], globals: dom });
    const names = ['A', 'B', 'C'];
    const state = new E.GameState(3, names, names.map(() => ({ isAI: ai, difficulty: 'normal' })), { seed });
    for (const p of state.players) p.hand = [];
    const logic = new E.GameLogic(state);
    const ui = new E.UIManager();
    ui.state = state;
    ui.logic = logic;
    ui.aiRng = new E.SeededRandom(1);
    ui.renderer = { fullUpdate() {}, clearHighlights() {}, highlightSlots() {}, highlightConnections() {} };
    // Capture the choice prompts instead of rendering them
    const prompts = [];
    ui.showChoiceModal = (choice, onPick) => prompts.push({ choice, onPick });
    return { E, dom, state, logic, ui, prompts };
}

test('a human is asked to choose between equally close coal mines, then plays the card', () => {
    const { E, state, ui, prompts } = uiSetup();
    const T = E.INDUSTRY_TYPES;
    const pid = state.currentPlayerId;
    const kidd = placeIndustry(E, state, 'kidderminster_0', (pid + 1) % 3, T.COAL_MINE, 2);
    const wolves = placeIndustry(E, state, 'wolverhampton_1', (pid + 2) % 3, T.COAL_MINE, 2);
    placeLink(state, 'dudley-kidderminster', (pid + 1) % 3);
    placeLink(state, 'dudley-wolverhampton', (pid + 2) % 3);
    setHand(state, pid, [loc('dudley')]);

    ui.selectedAction = 'build';
    ui.proceedWithMove({ type: 'build', location: 'dudley', slot: 1, industry: T.IRON_WORKS });
    assert.equal(prompts.length, 1);
    const { choice, onPick } = prompts[0];
    assert.equal(choice.kind, 'coal');
    assert.deepEqual([...choice.options.map(o => o.value)].sort(), ['mine:kidderminster_0', 'mine:wolverhampton_1']);
    assert.ok(choice.options.every(o => /Coal Mine in/.test(o.label)));

    onPick('mine:wolverhampton_1');
    assert.equal(ui.actionStep, 1, 'on to the card step');
    assert.deepEqual([...ui.pendingData.move.coal], ['mine:wolverhampton_1']);

    ui.selectedCard = 0;
    ui.processActionStep();
    assert.equal(state.boardIndustries.dudley_1.type, T.IRON_WORKS);
    assert.equal(wolves.resourceCubes, 2);
    assert.equal(kidd.resourceCubes, 3);
    assert.ok(ui.gameLog.some(e => /built Iron Works/.test(e.message)));
});

test('no prompt when the rules leave no choice', () => {
    const { E, state, ui, prompts } = uiSetup();
    const pid = state.currentPlayerId;
    setHand(state, pid, [loc('birmingham')]);
    ui.selectedAction = 'build';
    ui.proceedWithMove({ type: 'build', location: 'birmingham', slot: 0, industry: E.INDUSTRY_TYPES.COTTON_MILL });
    assert.equal(prompts.length, 0);
    assert.equal(ui.actionStep, 1);
});

test('a human with an income shortfall chooses which tile to sell', () => {
    const { E, state, ui, prompts } = uiSetup();
    const T = E.INDUSTRY_TYPES;
    placeIndustry(E, state, 'birmingham_0', 1, T.COTTON_MILL, 1);   // £6
    placeIndustry(E, state, 'coventry_0', 1, T.POTTERY, 1);         // £8
    state.players[1].money = -3;
    let done = false;
    ui.resolvePendingShortfalls(() => { done = true; });
    assert.equal(done, false, 'waits for the player');
    assert.equal(prompts[0].choice.kind, 'shortfall');
    assert.deepEqual([...prompts[0].choice.options.map(o => o.value)].sort(), ['birmingham_0', 'coventry_0']);
    prompts[0].onPick('coventry_0');
    assert.equal(done, true);
    assert.equal(state.players[1].money, 5);
    assert.ok(state.boardIndustries.birmingham_0);
});

test('an AI seat with an income shortfall is resolved automatically', () => {
    const { E, state, ui, prompts } = uiSetup({ ai: true });
    placeIndustry(E, state, 'birmingham_0', 2, E.INDUSTRY_TYPES.COTTON_MILL, 1);
    state.players[2].money = -2;
    let done = false;
    ui.resolvePendingShortfalls(() => { done = true; });
    assert.equal(prompts.length, 0);
    assert.equal(done, true);
    assert.equal(state.players[2].money, 4);
});
