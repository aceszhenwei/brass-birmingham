// Observational browser recorder and replay format. No engine/AI hooks or RNG draws.
const GameRecord = (() => {
    const FORMAT = 'brass-birmingham/diagnostic-game';
    const VERSION = 1;
    // Exact source identities, refreshed by scripts/research/record-version.js.
    const POLICY = 'sha256:bda2361cdcae2e292ee9c49d7db0aea85ac87b0d3108d80929a220ec07ec6065';
    const ENGINE = 'sha256:86c0e4b913ec29531c59496580c5b4bf26595a1c977893473d9016bfba20f400';
    const copy = value => JSON.parse(JSON.stringify(value));
    const canonical = value => value === null || typeof value !== 'object' ? JSON.stringify(value)
        : Array.isArray(value) ? '[' + value.map(canonical).join(',') + ']'
            : '{' + Object.keys(value).sort().map(k => JSON.stringify(k) + ':' + canonical(value[k])).join(',') + '}';
    // Lightweight accidental-corruption check; replay is the authoritative validation.
    function digest(value) {
        const text = canonical(value); let hash = 2166136261;
        for (let i = 0; i < text.length; i++) hash = Math.imul(hash ^ text.charCodeAt(i), 16777619);
        return (hash >>> 0).toString(16).padStart(8, '0');
    }
    const context = state => ({ era: state.era, round: state.round, playerId: state.currentPlayerId,
        actionsThisTurn: state.actionsThisTurn });
    function assert(ok, message) { if (!ok) throw new Error(message); }
    function equal(a, b, message) { assert(canonical(a) === canonical(b), message); }
    class Recorder {
        constructor(state, { id = crypto.randomUUID(), source = 'browser', createdAt = new Date().toISOString() } = {}) {
            this.data = { format: FORMAT, version: VERSION, id, createdAt, source,
                diagnostic: 'Complete diagnostic record; contains hidden hands and future cards.',
                engine: ENGINE, policy: POLICY, seed: state.rng.seed, numPlayers: state.numPlayers,
                players: state.players.map(p => ({ id: p.id, name: p.name, isAI: p.isAI, difficulty: p.aiDifficulty,
                    policy: p.isAI ? POLICY : null })),
                initialState: state.serialize(), actions: [], complete: false, error: null, final: null };
            assert(state.era === ERA.CANAL && state.round === 1 && state.actionsThisTurn === 0 &&
                state.players.every(p => p.vp === 0) && !state.gameOver, 'Recording must start at game setup');
            // Also disallow partial round-one starts and modified developer positions.
            equal(new GameState(state.numPlayers, state.playerNames,
                state.players.map(p => ({ isAI: p.isAI, difficulty: p.aiDifficulty })), { seed: state.rng.seed }).serialize(),
            this.data.initialState, 'Recording must start from unmodified seeded setup');
            this.expected = digest(this.data.initialState);
        }
        get length() { return this.data.actions.length; }
        fail(error) { this.data.error = String(error.message || error); this.data.complete = false; }
        append(before, result, state) {
            if (!result.success || this.data.error) return;
            try {
                assert(digest(before.serialize()) === this.expected, 'State changed outside recorded action flow');
                const entry = { index: this.length + 1, playerId: result.events[0].playerId,
                    before: context(before), move: copy(result.move), events: copy(result.events),
                    after: context(state), stateDigest: digest(state.serialize()) };
                this.data.actions.push(entry); this.expected = entry.stateDigest;
                if (state.gameOver) {
                    this.data.complete = true;
                    this.data.final = { state: state.serialize(), ranking: copy(state.getFinalRanking()) };
                }
            } catch (error) { this.fail(error); }
        }
        rewind(length, state) {
            try {
                assert(Number.isInteger(length) && length >= 0 && length <= this.length, 'Invalid undo recording index');
                const expected = length ? this.data.actions[length - 1].stateDigest : digest(this.data.initialState);
                assert(digest(state.serialize()) === expected, 'Undo state does not match recorded history');
                this.data.actions.length = length; this.expected = expected;
                this.data.complete = false; this.data.final = null;
            } catch (error) { this.fail(error); }
        }
        // Pair this envelope with an existing developer save; never put it in a player view.
        checkpoint(state, aiRng = null) {
            return { record: copy(this.data), state: state.serialize(), aiRng: aiRng ? aiRng.getState() : null };
        }
        static restore(saved) {
            const replayed = replay(saved.record, { allowIncomplete: true });
            equal(replayed.state.serialize(), saved.state, 'Save/record state mismatch');
            const recorder = Object.create(Recorder.prototype);
            recorder.data = copy(saved.record); recorder.expected = digest(saved.state);
            return { recorder, state: replayed.state, aiRng: saved.aiRng ? SeededRandom.fromState(saved.aiRng) : null };
        }
        export(state) {
            assert(state.gameOver, 'Complete diagnostic logs can only be exported after game over');
            assert(!this.data.error, `Recording failed: ${this.data.error}`);
            assert(this.data.complete && this.data.final, 'Recording is incomplete');
            equal(state.serialize(), this.data.final.state, 'Final state differs from recording');
            return copy(this.data);
        }
    }
    function replay(data, { allowIncomplete = false, onAction = null, beforeAction = null } = {}) {
        assert(data && data.format === FORMAT && data.version === VERSION, 'Unsupported game log format/version');
        assert(typeof data.id === 'string' && /^[\w-]{1,100}$/.test(data.id), 'Invalid game identifier');
        assert(['browser', 'synthetic'].includes(data.source), 'Unknown game source');
        assert(data.engine === ENGINE && data.policy === POLICY, 'Incompatible engine/policy version; use its matching repository revision');
        assert(!data.error, `Recording failed: ${data.error}`);
        assert(data.complete === true || (allowIncomplete && data.complete === false), 'Incomplete recording');
        assert(Array.isArray(data.actions) && data.actions.length <= 10000, 'Invalid action history');
        const state = GameState.deserialize(data.initialState);
        assert(data.numPlayers === state.numPlayers && data.seed === state.rng.seed, 'Setup metadata mismatch');
        equal(data.players, state.players.map(p => ({ id: p.id, name: p.name, isAI: p.isAI,
            difficulty: p.aiDifficulty, policy: p.isAI ? POLICY : null })), 'Player/policy metadata mismatch');
        const setup = new GameState(state.numPlayers, state.playerNames,
            state.players.map(p => ({ isAI: p.isAI, difficulty: p.aiDifficulty })), { seed: data.seed });
        equal(setup.serialize(), state.serialize(), 'Initial state is not seeded setup');
        const logic = new GameLogic(state);
        for (let i = 0; i < data.actions.length; i++) {
            const entry = data.actions[i], label = `Action ${i + 1}`;
            assert(entry && entry.index === i + 1, `${label}: invalid index`);
            equal(entry.before, context(state), `${label}: wrong turn/era/round`);
            const decision = logic.getCurrentDecision();
            assert(entry.playerId === decision.playerId, `${label}: wrong player`);
            const before = onAction ? state.clone() : null;
            if (beforeAction) beforeAction(state, logic, entry);
            const result = logic.play(entry.playerId, entry.move);
            assert(result.success, `${label}: ${result.message}`);
            equal(result.move, entry.move, `${label}: unresolved/mismatched move`);
            equal(result.events, entry.events, `${label}: event/scoring mismatch`);
            equal(context(state), entry.after, `${label}: transition mismatch`);
            assert(digest(state.serialize()) === entry.stateDigest, `${label}: state mismatch`);
            if (onAction) onAction(before, state, result, entry);
        }
        assert(state.gameOver === data.complete, 'Completion does not match replay');
        if (state.gameOver) {
            assert(data.final, 'Missing final results');
            equal(state.serialize(), data.final.state, 'Final state mismatch');
            equal(state.getFinalRanking(), data.final.ranking, 'Final ranking mismatch');
        } else assert(data.final === null, 'Incomplete log has final results');
        return { state, logic };
    }
    return { FORMAT, VERSION, POLICY, ENGINE, Recorder, replay, digest, canonical, copy };
})();
