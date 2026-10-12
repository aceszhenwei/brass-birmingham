// ============================================================================
// Brass: Birmingham - Deterministic Random Numbers
// ============================================================================
// All gameplay randomness (deck shuffles, merchant tiles, initial turn order)
// draws from a SeededRandom owned by the GameState, so the same seed plus the
// same actions always reproduces the same game. The generator's whole state
// is two 32-bit integers, which makes it trivial to copy and serialize.
//
// Algorithm: mulberry32 — small, fast and well distributed for shuffling.
// (Not cryptographic; it only needs to be reproducible.)

class SeededRandom {
    constructor(seed) {
        this.seed = seed >>> 0;   // the seed this stream started from
        this.state = seed >>> 0;  // advances on every draw
    }

    // Uniform float in [0, 1)
    next() {
        this.state = (this.state + 0x6D2B79F5) >>> 0;
        let t = this.state;
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    }

    // Uniform integer in [0, n)
    int(n) {
        return Math.floor(this.next() * n);
    }

    // In-place Fisher-Yates shuffle
    shuffle(arr) {
        for (let i = arr.length - 1; i > 0; i--) {
            const j = this.int(i + 1);
            [arr[i], arr[j]] = [arr[j], arr[i]];
        }
        return arr;
    }

    getState() {
        return { seed: this.seed, state: this.state };
    }

    static fromState(saved) {
        if (!saved || !SeededRandom.isUint32(saved.seed) || !SeededRandom.isUint32(saved.state)) {
            throw new Error('Invalid random generator state');
        }
        const rng = new SeededRandom(saved.seed);
        rng.state = saved.state;
        return rng;
    }

    clone() {
        return SeededRandom.fromState(this.getState());
    }

    static isUint32(n) {
        return Number.isInteger(n) && n >= 0 && n <= 0xFFFFFFFF;
    }

    // A fresh unpredictable seed, used when a game is started without one
    static randomSeed() {
        if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
            return crypto.getRandomValues(new Uint32Array(1))[0];
        }
        return Math.floor(Math.random() * 4294967296) >>> 0;
    }
}
