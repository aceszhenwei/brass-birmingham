// Helpers for building hand-crafted game positions in tests.

'use strict';

const { loadEngine } = require('./engine');

// A fresh game. Options: players (2-4), seed, ai (all seats AI).
function newGame({ players = 3, seed = 1, ai = false, E = null } = {}) {
    E = E || loadEngine({ seed });
    const names = ['Alice', 'Bob', 'Carol', 'Dave'].slice(0, players);
    const aiConfig = names.map(() => ({ isAI: ai, difficulty: 'normal' }));
    const state = new E.GameState(players, names, aiConfig);
    const logic = new E.GameLogic(state);
    return { E, state, logic };
}

// Card factories
const loc = (location) => ({ type: 'location', location, name: location });
const ind = (...industryTypes) => ({ type: 'industry', industryTypes, name: industryTypes.join('/') });
const wildLoc = () => ({ type: 'wildLocation', name: 'Wild Location' });
const wildInd = () => ({ type: 'wildIndustry', name: 'Wild Industry' });

function setHand(state, playerId, cards) {
    state.players[playerId].hand = cards.map(c => ({ ...c }));
}

// Place an industry tile on the board as if it had been built: takes the
// player's matching tile from their mat (marking it used) so tile accounting
// stays consistent. `key` is 'city_slot' or a farm id ('northern'/'southern').
// opts: { flipped, cubes } — cubes defaults to the printed count (breweries:
// 1 in the Canal Era, 2 in the Rail Era); flipped tiles hold no cubes.
function placeIndustry(E, state, key, playerId, type, level, opts = {}) {
    const player = state.players[playerId];
    const tileData = player.industryTiles[type].find(t => !t.used && t.level === level);
    if (!tileData) throw new Error(`player ${playerId} has no unused ${type} level ${level}`);
    tileData.used = true;

    let cubes = tileData.resourceCubes || 0;
    if (type === E.INDUSTRY_TYPES.BREWERY) cubes = state.era === E.ERA.RAIL ? 2 : 1;
    if (opts.cubes !== undefined) cubes = opts.cubes;
    const flipped = !!opts.flipped;
    if (flipped) cubes = 0;

    const tile = { playerId, type, tileData, flipped, resourceCubes: cubes };
    if (key === 'northern' || key === 'southern') state.breweryFarmTiles[key] = tile;
    else state.boardIndustries[key] = tile;
    return tile;
}

function placeLink(state, connectionId, playerId, type = null) {
    type = type || (state.era === 'rail' ? 'rail' : 'canal');
    state.boardLinks[connectionId] = { playerId, type };
    state.players[playerId].linksRemaining[type]--;
}

// Remove the random initial deal so tests control everything
function emptyHands(state) {
    for (const p of state.players) p.hand = [];
}

// Engine objects come from the vm context (a different realm), so convert
// them to plain main-realm values before deep-equality assertions.
const plain = (value) => JSON.parse(JSON.stringify(value));

module.exports = { plain, newGame, loc, ind, wildLoc, wildInd, setHand, placeIndustry, placeLink, emptyHands };
