// Loads the browser game engine into an isolated Node `vm` context so it can
// be tested without a browser. The game files stay plain <script> files (no
// module syntax, no build step); here they are evaluated in order exactly as
// index.html does, sharing one global scope.
//
//   const E = loadEngine({ seed: 42 });
//   const { GameState, GameLogic, INDUSTRY_TYPES } = E;
//
// All gameplay randomness goes through the engine's SeededRandom (pass
// { seed } to GameState). To prove nothing bypasses it, Math.random THROWS
// inside the context unless `allowMathRandom` is set. `crypto` is provided so
// a GameState created without a seed can still pick a random one.
// (The legacy `seed` option seeds Math.random instead; it exists only to
// replay Assignment 1 harness games and implies allowMathRandom.)

'use strict';

const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const JS_DIR = path.join(__dirname, '..', '..', 'js');

const ENGINE_FILES = ['gameData.js', 'random.js', 'gameState.js', 'gameLogic.js', 'moves.js', 'aiPlayer.js'];

// Small, fast, well-distributed 32-bit PRNG
function mulberry32(seed) {
    let a = seed >>> 0;
    return function () {
        a = (a + 0x6D2B79F5) >>> 0;
        let t = a;
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

function loadEngine({ seed = null, allowMathRandom = false, extraFiles = [], globals = {} } = {}) {
    const context = vm.createContext({ console, crypto: globalThis.crypto, ...globals });
    if (seed !== null) {
        context.__rng = mulberry32(seed);
        vm.runInContext('Math.random = __rng;', context);
    } else if (!allowMathRandom) {
        vm.runInContext(
            "Math.random = () => { throw new Error('Math.random used: gameplay randomness must use SeededRandom'); };",
            context);
    }
    for (const file of [...ENGINE_FILES, ...extraFiles]) {
        const filename = path.join(JS_DIR, file);
        vm.runInContext(fs.readFileSync(filename, 'utf8'), context, { filename });
    }

    // Top-level const/class declarations live in the context's global
    // lexical scope, not on the global object, so read them by evaluation.
    const IDENT = /^[A-Za-z_$][\w$]*$/;
    return new Proxy({}, {
        get(_, name) {
            if (name === '__context') return context;
            if (typeof name !== 'string' || !IDENT.test(name)) return undefined;
            return vm.runInContext(`typeof ${name} === 'undefined' ? undefined : ${name}`, context);
        },
    });
}

module.exports = { loadEngine, mulberry32 };
