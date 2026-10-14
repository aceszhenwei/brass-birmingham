'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const { loadEngine } = require('./helpers/engine');
const { makeDom } = require('./helpers/dom');
const H = require('../scripts/research/human-games');
const E = H.engine();
const copy = value => JSON.parse(JSON.stringify(value));
const samples = fs.readdirSync(path.join(H.ROOT, 'research/human-games/samples')).filter(n => n.endsWith('.json'))
    .map(n => JSON.parse(fs.readFileSync(path.join(H.ROOT, 'research/human-games/samples', n), 'utf8')));
function setup() {
    const state = new E.GameState(2, ['Human', 'AI'], [{}, { isAI: true, difficulty: 'hard' }], { seed: 1717 });
    return { state, logic: new E.GameLogic(state), recorder: new E.GameRecord.Recorder(state, { id: 'test-game' }) };
}
function play(ctx, move) {
    const before = ctx.state.clone();
    const result = ctx.logic.play(ctx.logic.getCurrentDecision().playerId, move);
    ctx.recorder.append(before, result, ctx.state); return result;
}
test('recorder observes successful resolved actions, never attempted moves or gameplay RNG', () => {
    const ctx = setup(), original = ctx.state.clone(), control = new E.GameLogic(original);
    const before = JSON.stringify(ctx.state.serialize());
    assert.equal(play(ctx, { type: 'build', card: 999 }).success, false);
    assert.equal(ctx.recorder.length, 0); assert.equal(JSON.stringify(ctx.state.serialize()), before);
    for (let i = 0; i < 8; i++) {
        const id = control.getCurrentDecision().playerId, move = { type: 'pass', card: 0 };
        const expected = control.play(id, move); const actual = play(ctx, move);
        assert.equal(JSON.stringify(actual), JSON.stringify(expected));
        assert.equal(JSON.stringify(ctx.state.serialize()), JSON.stringify(original.serialize()));
    }
    const replayed = E.GameRecord.replay(copy(ctx.recorder.data), { allowIncomplete: true });
    assert.equal(JSON.stringify(replayed.state.serialize()), JSON.stringify(ctx.state.serialize()));
    assert.equal(ctx.recorder.data.players[1].difficulty, 'hard');
    assert.equal(ctx.recorder.data.players[1].policy, E.GameRecord.POLICY);
});
test('current-turn undo/reset truncates the action history and the replacement action replays', () => {
    const ctx = setup();
    play(ctx, { type: 'pass', card: 0 }); play(ctx, { type: 'pass', card: 0 });
    const before = ctx.state.clone(), length = ctx.recorder.length;
    play(ctx, { type: 'loan', card: 0 });
    ctx.state = before; ctx.logic = new E.GameLogic(before); ctx.recorder.rewind(length, before);
    play(ctx, { type: 'pass', card: 1 });
    assert.equal(ctx.recorder.data.actions.at(-1).move.type, 'pass');
    assert.equal(E.GameRecord.replay(ctx.recorder.data, { allowIncomplete: true }).state.rng.state, ctx.state.rng.state);
});
test('checkpoint/restore preserves partial history, state and the separate AI RNG', () => {
    const ctx = setup(); play(ctx, { type: 'pass', card: 0 });
    const rng = new E.SeededRandom(19); rng.next();
    const restored = E.GameRecord.Recorder.restore(copy(ctx.recorder.checkpoint(ctx.state, rng)));
    assert.equal(restored.aiRng.next(), rng.next());
    const next = { state: restored.state, logic: new E.GameLogic(restored.state), recorder: restored.recorder };
    play(ctx, { type: 'pass', card: 0 }); play(next, { type: 'pass', card: 0 });
    assert.equal(JSON.stringify(next.recorder.data), JSON.stringify(ctx.recorder.data));
    const bad = copy(ctx.recorder.checkpoint(ctx.state)); bad.state.players[0].money++;
    assert.throws(() => E.GameRecord.Recorder.restore(bad), /mismatch/);
});
test('state changes outside recorded flow fail clearly without changing execution', () => {
    const ctx = setup(); ctx.state.players[0].money++;
    assert.equal(play(ctx, { type: 'pass', card: 0 }).success, true);
    assert.match(ctx.recorder.data.error, /outside recorded/); assert.equal(ctx.recorder.data.complete, false);
    assert.throws(() => ctx.recorder.export(ctx.state), /after game over/);
});
test('complete synthetic logs reconstruct all transitions and exact engine scoring', () => {
    for (const data of samples) {
        const { state } = E.GameRecord.replay(data);
        assert.equal(JSON.stringify(state.serialize()), JSON.stringify(data.final.state));
        const game = H.analyzeGame(E, data);
        for (const p of game.players) assert.equal(p.vp, p.eras.canal.industryVP + p.eras.canal.linkVP + p.eras.rail.industryVP + p.eras.rail.linkVP + p.otherVP.canal + p.otherVP.rail);
        assert.equal(data.source, 'synthetic');
        assert.ok(data.actions.some(a => a.events.some(e => e.type === 'eraEnd')));
        assert.ok(data.actions.some(a => a.events.some(e => e.type === 'gameEnd')));
    }
});
test('all move types including shortfall can be recorded through the single observational path', () => {
    // Shortfall is a real engine decision. Find a deterministic prefix with
    // loans and aggressive spending; this produces income debt before era end.
    const ctx = setup(); let found = false;
    for (let i = 0; i < 150 && !found && !ctx.state.gameOver; i++) {
        const d = ctx.logic.getCurrentDecision();
        const legal = ctx.logic.getCurrentLegalMoves();
        const spending = legal.filter(m => ['build', 'network'].includes(m.type)).map(m => ({ m, cost: ctx.logic.resolveMove(d.playerId, m).plan.cost })).sort((a, b) => b.cost - a.cost);
        const move = d.type === 'shortfall' ? ctx.logic.defaultShortfallMove(d.playerId)
            : spending[0]?.m || legal.find(m => m.type === 'loan') || legal.find(m => m.type === 'pass');
        found = d.type === 'shortfall';
        assert.equal(play(ctx, move).success, true);
    }
    assert.ok(found);
    E.GameRecord.replay(ctx.recorder.data, { allowIncomplete: true });
    const types = new Set(samples.flatMap(g => g.actions.map(a => a.move.type)));
    for (const type of ['build', 'network', 'sell', 'develop', 'loan', 'scout', 'pass']) assert.ok(types.has(type), type);
});
test('corrupt, incomplete, incompatible and misidentified records are rejected', () => {
    const edits = [
        d => { d.version++; }, d => { d.engine = 'old'; }, d => { d.policy = 'old'; },
        d => { d.players[0].isAI = !d.players[0].isAI; }, d => { d.seed++; },
        d => { d.actions[0].playerId = 99; }, d => { d.actions[0].move.card = 999; },
        d => { d.actions[0].after.round++; }, d => { d.actions[0].stateDigest = 'bad'; },
        d => { d.actions.splice(3, 1); }, d => { d.final.ranking[0].vp++; },
        d => { d.final.state.players[0].money++; }, d => { d.complete = false; },
        d => { d.actions.at(-1).events.find(e => e.type === 'gameEnd').scores[0].linkVP++; },
    ];
    for (const edit of edits) { const data = copy(samples[0]); edit(data); assert.throws(() => E.GameRecord.replay(data)); }
});
test('export stays gated until completion and returns an independent diagnostic record', () => {
    const ctx = setup(); assert.throws(() => ctx.recorder.export(ctx.state), /after game over/);
    const data = samples[0], restored = E.GameRecord.Recorder.restore({ record: data, state: data.final.state });
    const exported = restored.recorder.export(restored.state);
    assert.match(exported.diagnostic, /hidden/); exported.actions.length = 0;
    assert.ok(restored.recorder.length > 0);
});
test('batch loading reports bad files and duplicates and discovers new games incrementally', t => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'brass-human-')); t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
    const write = (name, data) => fs.writeFileSync(path.join(dir, name), JSON.stringify(data));
    assert.equal(H.loadDataset(dir, E).games.length, 0);
    write('one.json', samples[0]); assert.equal(H.loadDataset(dir, E).games.length, 1);
    write('two.json', samples[1]); assert.equal(H.loadDataset(dir, E).games.length, 2);
    write('duplicate-id.json', samples[0]);
    const twin = copy(samples[1]); twin.id = 'different-id'; write('duplicate-record.json', twin);
    fs.writeFileSync(path.join(dir, 'bad.json'), '{');
    const data = H.loadDataset(dir, E); assert.equal(data.games.length, 2); assert.equal(data.errors.length, 3);
    assert.match(H.report(data), /3 invalid\/duplicate/);
    const out = path.join(dir, 'out.md');
    const cli = spawnSync(process.execPath, ['scripts/research/analyze-human-games.js', '--dir', dir, '--out', out], { cwd: H.ROOT, encoding: 'utf8' });
    assert.equal(cli.status, 1); assert.match(fs.readFileSync(out, 'utf8'), /bad.json/);
});
test('synthetic and AI-only games are excluded and genuine results group by difficulty', () => {
    const g = H.analyzeGame(E, samples[0]), other = H.analyzeGame(E, samples[1]);
    const report = H.report({ games: [g, other], errors: [] });
    assert.match(report, /0 valid human-versus-AI games; 2 synthetic/); assert.match(report, /Human wins: 0; AI wins: 0/);
    // The metadata source is a declared collection label, not inferred from moves.
    g.source = 'browser'; other.source = 'browser'; other.players.forEach(p => p.isAI = true);
    const real = H.report({ games: [g, other], errors: [] });
    assert.match(real, /1 valid human-versus-AI games; 0 synthetic samples, 1 AI-only/);
    assert.match(real, /Human wins: 1; AI wins: 0/); assert.match(real, /easy/);
});
test('decision inspection reproduces a flagged state and does not rerun any AI search', t => {
    const choose = E.AIPlanner.chooseAction; t.after(() => { E.AIPlanner.chooseAction = choose; });
    const data = samples[0], game = H.analyzeGame(E, data), flag = game.flags[0];
    assert.ok(flag && flag.action > 0);
    E.AIPlanner.chooseAction = () => { throw new Error('No searches during replay'); };
    const a = H.inspect(E, data, flag.action), b = H.inspect(E, data, flag.action);
    assert.equal(JSON.stringify(a), JSON.stringify(b));
    assert.equal(a.era, flag.era); assert.equal(a.round, flag.round);
    assert.deepEqual(a.recordedMove, data.actions[flag.action - 1].move);
    assert.equal(a.outcome.stateDigest, data.actions[flag.action - 1].stateDigest);
    assert.ok(a.legalMoveCount > 0); assert.ok(a.legalAlternatives.length <= 30);
    assert.throws(() => H.inspect(E, data, 99999), /not found/);
});
test('browser integration truncates recording on undo and does not expose a live export', () => {
    const dom = makeDom(), B = loadEngine({ extraFiles: ['gameRecorder.js', 'uiManager.js'], globals: dom });
    const state = new B.GameState(2, ['A', 'B'], [], { seed: 17 });
    const ui = new B.UIManager(); ui.state = state; ui.logic = new B.GameLogic(state);
    ui.recorder = new B.GameRecord.Recorder(state, { id: 'ui-test' });
    ui.completeAction = () => {}; ui.addLogEntry = () => {}; ui.cancelAction = () => {};
    ui.closeModal = () => {}; ui.renderLog = () => {}; ui.refresh = () => {};
    for (let i = 0; i < 3; i++) ui.playMove(state.currentPlayerId, { type: 'pass', card: 0 });
    assert.equal(ui.undoHistory.length, 1); assert.equal(ui.recorder.length, 3);
    ui.restoreTurn(true); assert.equal(ui.recorder.length, 2);
    let message; ui.showToast = text => message = text; ui.exportGameLog();
    assert.match(message, /after game over/);
    B.GameRecord.replay(ui.recorder.data, { allowIncomplete: true });
});
test('browser initialization starts recording and final results download the validated complete log', async () => {
    const dom = makeDom(); let downloaded, anchor, revoked;
    const create = dom.document.createElement;
    dom.document.createElement = tag => {
        const el = create(tag);
        if (tag === 'a') { anchor = el; el.click = () => { downloaded = el.href; }; }
        return el;
    };
    const urls = { createObjectURL: blob => { urls.blob = blob; return 'blob:diagnostic'; }, revokeObjectURL: url => { revoked = url; } };
    const B = loadEngine({ extraFiles: ['gameRecorder.js', 'uiManager.js'], globals: { ...dom, Blob, URL: urls } });
    const state = new B.GameState(2, ['A', 'B'], [], { seed: 77 }), ui = new B.UIManager();
    ui.bindEvents = () => {}; ui.addLogEntry = () => {}; ui.refresh = () => {}; ui.continueGame = () => {};
    ui.init(state, new B.GameLogic(state), {});
    assert.ok(ui.recorder); assert.equal(ui.recordingError, null);
    const restored = B.GameRecord.Recorder.restore({ record: samples[0], state: samples[0].final.state });
    ui.state = restored.state; ui.recorder = restored.recorder;
    ui.showGameOver(ui.state.getFinalRanking());
    assert.equal(dom.document.getElementById('export-game-log').disabled, false);
    dom.document.getElementById('export-game-log').onclick();
    assert.equal(downloaded, 'blob:diagnostic'); assert.equal(anchor.download, samples[0].id + '.json');
    const data = JSON.parse(await urls.blob.text()); B.GameRecord.replay(data);
    dom.timers.at(-1).fn(); assert.equal(revoked, downloaded);
    ui.recorder.data.error = 'Storage interrupted'; ui.showGameOver(ui.state.getFinalRanking());
    assert.equal(dom.document.getElementById('export-game-log').disabled, true);
    assert.match(dom.document.getElementById('recording-status').textContent, /Recording failed: Storage interrupted/);
});
