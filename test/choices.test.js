'use strict';

// Player choices the rulebook grants (rulebook p.6, p.8, p.10, p.11), and
// that every choice is validated: legal choices are applied exactly, illegal
// ones are rejected with no change to the state.

const test = require('node:test');
const assert = require('node:assert/strict');
const { newGame, plain, loc, ind, setHand, placeIndustry, placeLink, emptyHands } = require('./helpers/scenario');

const ser = (state) => JSON.stringify(state.serialize());

function setup(players = 3, seed = 81) {
    const g = newGame({ players, seed });
    emptyHands(g.state);
    return g;
}
function options(logic, pid, move) {
    const c = logic.getNextChoice(pid, move);
    return c ? { kind: c.kind, values: plain(c.options.map(o => o.value)) } : null;
}
function rejectedUnchanged(state, logic, pid, move) {
    const before = ser(state);
    const r = logic.applyMove(pid, move);
    assert.equal(r.success, false, `expected rejection: ${JSON.stringify(move)}`);
    assert.equal(ser(state), before, 'a rejected move changed the state');
}

// ---------------------------------------------------------------- coal

test('Coal: equally close mines are the player’s choice; a farther mine or the market is not allowed', () => {
    const { E, state, logic } = setup();
    const T = E.INDUSTRY_TYPES;
    const wolves = placeIndustry(E, state, 'wolverhampton_1', 1, T.COAL_MINE, 2); // 1 link from Dudley
    const kidd = placeIndustry(E, state, 'kidderminster_0', 2, T.COAL_MINE, 2);   // 1 link from Dudley
    const far = placeIndustry(E, state, 'cannock_1', 2, T.COAL_MINE, 2);          // 2 links from Dudley
    placeLink(state, 'dudley-wolverhampton', 1);
    placeLink(state, 'dudley-kidderminster', 2);
    placeLink(state, 'cannock-wolverhampton', 2);
    placeLink(state, 'coalbrookdale-shrewsbury', 1); // a merchant somewhere, not connected
    setHand(state, 0, [loc('dudley')]);
    const move = { type: 'build', card: 0, location: 'dudley', slot: 1, industry: T.IRON_WORKS };

    const coal = options(logic, 0, move);
    assert.equal(coal.kind, 'coal');
    assert.deepEqual(coal.values.sort(), ['mine:kidderminster_0', 'mine:wolverhampton_1']);
    rejectedUnchanged(state, logic, 0, { ...move, coal: ['mine:cannock_1'] });
    rejectedUnchanged(state, logic, 0, { ...move, coal: ['market'] });

    const r = logic.applyMove(0, { ...move, coal: ['mine:kidderminster_0'] });
    assert.equal(r.success, true, r.message);
    assert.equal(kidd.resourceCubes, 2);
    assert.equal(wolves.resourceCubes, 3);
    assert.equal(far.resourceCubes, 3);
    assert.deepEqual(plain(r.move.coal), ['mine:kidderminster_0']);
});

test('Coal: when the closest mine runs out mid-build, the next closest supplies the rest', () => {
    const { E, state, logic } = setup();
    const T = E.INDUSTRY_TYPES;
    const at = placeIndustry(E, state, 'coventry_1', 1, T.COAL_MINE, 2, { cubes: 1 });     // at Coventry
    const next = placeIndustry(E, state, 'nuneaton_1', 2, T.COAL_MINE, 2);                // 1 link away
    placeLink(state, 'coventry-nuneaton', 2, 'rail');
    state.era = E.ERA.RAIL;
    // Pottery III needs 2 coal at Coventry
    for (const t of state.players[0].industryTiles[T.POTTERY]) if (t.level < 3) t.used = true;
    state.players[0].money = 40;
    setHand(state, 0, [loc('coventry')]);
    const r = logic.applyMove(0, { type: 'build', card: 0, location: 'coventry', slot: 0, industry: T.POTTERY });
    assert.equal(r.success, true, r.message);
    assert.deepEqual(plain(r.move.coal), ['mine:coventry_1', 'mine:nuneaton_1']);
    assert.equal(at.flipped, true);
    assert.equal(next.resourceCubes, 2);
});

// ---------------------------------------------------------------- iron

test('Iron: any Iron Works with iron, chosen by the player; the market only when none has iron', () => {
    const { E, state, logic } = setup();
    const T = E.INDUSTRY_TYPES;
    const a = placeIndustry(E, state, 'dudley_1', 1, T.IRON_WORKS, 2, { cubes: 2 });
    const b = placeIndustry(E, state, 'coalbrookdale_1', 2, T.IRON_WORKS, 2, { cubes: 1 });
    setHand(state, 0, [loc('leek')]);
    const move = { type: 'develop', card: 0, industries: [T.COTTON_MILL] };
    assert.deepEqual(options(logic, 0, move), { kind: 'iron', values: ['works:dudley_1', 'works:coalbrookdale_1'] });
    rejectedUnchanged(state, logic, 0, { ...move, iron: ['market'] });

    const r = logic.applyMove(0, { ...move, iron: ['works:coalbrookdale_1'] });
    assert.equal(r.success, true, r.message);
    assert.equal(b.flipped, true, 'the chosen works emptied and flipped');
    assert.equal(state.players[2].incomeSpace, 10 + 3, "and its owner's income rose");
    assert.equal(a.resourceCubes, 2);
});

test('Iron: two units may come from two different Iron Works', () => {
    const { E, state, logic } = setup();
    const T = E.INDUSTRY_TYPES;
    const a = placeIndustry(E, state, 'dudley_1', 1, T.IRON_WORKS, 2, { cubes: 2 });
    const b = placeIndustry(E, state, 'coalbrookdale_1', 2, T.IRON_WORKS, 2, { cubes: 2 });
    setHand(state, 0, [loc('leek')]);
    const variants = logic.resolveMove(0, { type: 'develop', card: 0, industries: [T.COTTON_MILL, T.COAL_MINE] }, { all: true });
    // {dudley,dudley}, {dudley,coalbrookdale}, {coalbrookdale,coalbrookdale}
    assert.equal(variants.results.length, 3);
    const r = logic.applyMove(0, { type: 'develop', card: 0, industries: [T.COTTON_MILL, T.COAL_MINE],
        iron: ['works:dudley_1', 'works:coalbrookdale_1'] });
    assert.equal(r.success, true, r.message);
    assert.equal(a.resourceCubes, 1);
    assert.equal(b.resourceCubes, 1);
});

// ---------------------------------------------------------------- beer and merchants

function saleSetup() {
    const g = setup();
    const { E, state } = g;
    const T = E.INDUSTRY_TYPES;
    state.merchantTiles = [
        { location: 'oxford', buys: 'any', hasBeer: true },
        { location: 'oxford', buys: 'blank', hasBeer: false },
        { location: 'gloucester', buys: 'any', hasBeer: true },
        { location: 'gloucester', buys: T.POTTERY, hasBeer: true },
    ];
    placeIndustry(E, state, 'birmingham_0', 0, T.COTTON_MILL, 1);
    placeLink(state, 'birmingham-oxford', 0);
    placeLink(state, 'redditch-oxford', 1);
    placeLink(state, 'gloucester-redditch', 1);
    setHand(state, 0, [loc('leek')]);
    return g;
}

test('Sell: the player chooses the merchant tile (and with it the bonus), or no merchant beer', () => {
    const { E, state, logic } = saleSetup();
    const move = { type: 'sell', card: 0, sales: [{ tile: 'birmingham_0' }] };
    // Oxford (any, beer) and Gloucester (any, beer); Gloucester's Pottery-only
    // tile does not buy cotton; 'none' needs brewery beer, which there is none of
    assert.deepEqual(options(logic, 0, move), { kind: 'merchant', values: [0, 2] });

    // Oxford: +2 income spaces
    const g1 = state.clone();
    const r1 = new E.GameLogic(g1).applyMove(0, { ...move, sales: [{ tile: 'birmingham_0', merchant: 0 }] });
    assert.equal(r1.success, true, r1.message);
    assert.equal(g1.players[0].incomeSpace, 10 + 5 + 2);
    assert.equal(g1.merchantTiles[0].hasBeer, false);
    assert.equal(g1.merchantTiles[2].hasBeer, true);

    // A merchant that doesn't buy the good, or has no beer, cannot be chosen
    rejectedUnchanged(state, logic, 0, { ...move, sales: [{ tile: 'birmingham_0', merchant: 3 }] });
    rejectedUnchanged(state, logic, 0, { ...move, sales: [{ tile: 'birmingham_0', merchant: 1 }] });
    rejectedUnchanged(state, logic, 0, { ...move, sales: [{ tile: 'birmingham_0', merchant: 'none' }] });
});

test('Sell: Gloucester’s bonus develops a tile of the player’s choice (never a lightbulb tile), or is skipped', () => {
    const { E, state, logic } = saleSetup();
    const T = E.INDUSTRY_TYPES;
    const sale = { tile: 'birmingham_0', merchant: 2 };
    const c = logic.getNextChoice(0, { type: 'sell', card: 0, sales: [sale] });
    assert.equal(c.kind, 'freeDevelop');
    const values = plain(c.options.map(o => o.value));
    assert.ok(values.includes('skip'));
    assert.ok(!values.includes(T.POTTERY), 'Pottery I has the lightbulb icon');
    assert.ok(values.includes(T.IRON_WORKS));

    const r = logic.applyMove(0, { type: 'sell', card: 0, sales: [{ ...sale, freeDevelop: T.IRON_WORKS }] });
    assert.equal(r.success, true, r.message);
    assert.equal(state.getCurrentLevel(0, T.IRON_WORKS), 2);
    assert.equal(state.merchantTiles[2].hasBeer, false);

    const g = saleSetup();
    rejectedUnchanged(g.state, g.logic, 0, { type: 'sell', card: 0, sales: [{ ...sale, freeDevelop: T.POTTERY }] });
    const skip = g.logic.applyMove(0, { type: 'sell', card: 0, sales: [{ ...sale, freeDevelop: 'skip' }] });
    assert.equal(skip.success, true, skip.message);
    assert.equal(g.state.players[0].industryTiles[T.IRON_WORKS].filter(t => t.used).length, 0);
});

test('Sell: beer from own breweries anywhere or connected opponents’ breweries — the player’s choice', () => {
    const { E, state, logic } = saleSetup();
    const T = E.INDUSTRY_TYPES;
    for (const mt of state.merchantTiles) mt.hasBeer = false;
    const own = placeIndustry(E, state, 'stone_0', 0, T.BREWERY, 1);           // own, unconnected: fine
    const opp = placeIndustry(E, state, 'nuneaton_0', 1, T.BREWERY, 1);        // opponent, connected
    placeIndustry(E, state, 'uttoxeter_0', 2, T.BREWERY, 1);                   // opponent, NOT connected
    placeLink(state, 'birmingham-tamworth', 2);
    placeLink(state, 'nuneaton-tamworth', 2);
    const move = { type: 'sell', card: 0, sales: [{ tile: 'birmingham_0' }] };
    assert.deepEqual(options(logic, 0, move), { kind: 'beer', values: ['brewery:stone_0', 'brewery:nuneaton_0'] });
    rejectedUnchanged(state, logic, 0, { ...move, sales: [{ tile: 'birmingham_0', beer: ['brewery:uttoxeter_0'] }] });

    const r = logic.applyMove(0, { ...move, sales: [{ tile: 'birmingham_0', beer: ['brewery:nuneaton_0'] }] });
    assert.equal(r.success, true, r.message);
    assert.equal(opp.flipped, true);
    assert.equal(own.resourceCubes, 1, 'own beer kept');
    assert.equal(state.players[1].incomeSpace, 10 + 4, "the brewery's owner gets its income");
});

test('Complex sale: search finds the only allocation that sells every tile', () => {
    // Cotton (needs 1) may use Oxford (any) or Walsall; Manufacturer II (needs 1)
    // may use only Walsall, because Oxford's only beer-carrying tile buys
    // cotton. Defaults give Oxford to... the cotton (best bonus) — fine —
    // but if the goods come first they take Walsall's barrel only if the cotton
    // can still use Oxford. Make the DEFAULT fail: cotton's default merchant is
    // a Gloucester tile whose bonus ranks higher but then the goods have
    // nothing, unless the cotton uses Walsall.
    const { E, state, logic } = setup();
    const T = E.INDUSTRY_TYPES;
    state.merchantTiles = [
        { location: 'oxford', buys: T.MANUFACTURER, hasBeer: true },  // goods' only beer
        { location: 'oxford', buys: 'any', hasBeer: false },
    ];
    placeIndustry(E, state, 'birmingham_0', 0, T.COTTON_MILL, 1);
    placeIndustry(E, state, 'birmingham_1', 0, T.MANUFACTURER, 2);
    placeIndustry(E, state, 'walsall_1', 1, T.BREWERY, 1);
    placeLink(state, 'birmingham-oxford', 0);
    placeLink(state, 'birmingham-walsall', 1);
    setHand(state, 0, [loc('leek')]);
    // Goods first: its default merchant is Oxford's goods tile (has beer) — then the
    // cotton takes Walsall. If the goods were forced to use Walsall the cotton
    // would starve (Oxford's cotton-buying tile has no beer).
    const r = logic.applyMove(0, { type: 'sell', card: 0, sales: [{ tile: 'birmingham_1' }, { tile: 'birmingham_0' }] });
    assert.equal(r.success, true, r.message);
    assert.equal(state.boardIndustries.birmingham_0.flipped, true);
    assert.equal(state.boardIndustries.birmingham_1.flipped, true);
    assert.deepEqual(plain(r.move.sales.map(s => s.merchant)), [0, 'none']);
});

test('Complex sale: defaults that would fail are completed by search (order-independent)', () => {
    // Same position, but the cotton is listed FIRST. The cotton cannot use
    // Oxford's goods-only tile, so its beer default is the Walsall barrel —
    // which the goods do not need because they drink Oxford's. Now make the
    // goods unable to use Oxford, and give the cotton the Oxford choice:
    const { E, state, logic } = setup();
    const T = E.INDUSTRY_TYPES;
    state.merchantTiles = [
        { location: 'oxford', buys: T.COTTON_MILL, hasBeer: true },   // cotton may drink here
        { location: 'oxford', buys: T.MANUFACTURER, hasBeer: false }, // goods: no merchant beer
    ];
    placeIndustry(E, state, 'birmingham_0', 0, T.COTTON_MILL, 1);
    placeIndustry(E, state, 'birmingham_1', 0, T.MANUFACTURER, 2);
    placeIndustry(E, state, 'walsall_1', 1, T.BREWERY, 1);
    placeLink(state, 'birmingham-oxford', 0);
    placeLink(state, 'birmingham-walsall', 1);
    setHand(state, 0, [loc('leek')]);
    // Forcing the cotton onto Walsall's barrel starves the goods:
    rejectedUnchanged(state, logic, 0, { type: 'sell', card: 0,
        sales: [{ tile: 'birmingham_0', merchant: 'none' }, { tile: 'birmingham_1' }] });
    // The legal-move list offers selling the pair...
    assert.ok(logic.getLegalMoves(0).some(m => m.type === 'sell' && m.sales.length === 2));
    // ...and left to the engine, it finds the allocation that sells both
    const r = logic.applyMove(0, { type: 'sell', card: 0, sales: [{ tile: 'birmingham_0' }, { tile: 'birmingham_1' }] });
    assert.equal(r.success, true, r.message);
    assert.deepEqual(plain(r.move.sales.map(s => s.merchant)), [0, 'none']);
    assert.deepEqual(plain(r.move.sales[1].beer), ['brewery:walsall_1']);
});

// ---------------------------------------------------------------- double rail

test('Double rail: beer from the player’s choice of eligible brewery (an opponent’s must be connected to the second link)', () => {
    const { E, state, logic } = setup();
    const T = E.INDUSTRY_TYPES;
    state.era = E.ERA.RAIL;
    state.players[0].money = 30;
    placeIndustry(E, state, 'birmingham_1', 0, T.MANUFACTURER, 2);
    const own = placeIndustry(E, state, 'stone_0', 0, T.BREWERY, 2);
    const opp = placeIndustry(E, state, 'walsall_1', 1, T.BREWERY, 2);   // reached only via link 2
    placeIndustry(E, state, 'uttoxeter_0', 2, T.BREWERY, 2);             // never connected
    setHand(state, 0, [loc('leek')]);
    const move = { type: 'network', card: 0, links: ['birmingham-oxford', 'birmingham-walsall'] };
    assert.deepEqual(options(logic, 0, move), { kind: 'beer', values: ['brewery:stone_0', 'brewery:walsall_1'] });
    rejectedUnchanged(state, logic, 0, { ...move, beer: 'brewery:uttoxeter_0' });

    const r = logic.applyMove(0, { ...move, beer: 'brewery:walsall_1' });
    assert.equal(r.success, true, r.message);
    assert.equal(opp.resourceCubes, 1);
    assert.equal(own.resourceCubes, 2);
    assert.deepEqual(plain(r.move.coal), ['market', 'market']);
});

// ---------------------------------------------------------------- shortfall

test('Shortfall: other moves are blocked until it is covered; the era cannot be scored before', () => {
    const { E, state, logic } = setup(2, 82);
    const T = E.INDUSTRY_TYPES;
    placeIndustry(E, state, 'birmingham_0', 0, T.COTTON_MILL, 1);   // £6
    setHand(state, 0, [loc('leek')]);
    setHand(state, 1, [loc('leek')]);
    state.players[0].money = 0;
    state.players[0].incomeSpace = 2; // level -8
    state.endRound();
    assert.equal(state.players[0].money, -8);
    assert.equal(logic.canPerformAction('pass', 1), false);
    assert.equal(logic.getDisabledReason('pass', 1), 'An income shortfall must be covered first');
    assert.throws(() => state.endCanalEra(), /shortfall/);

    rejectedUnchanged(state, logic, 1, { type: 'pass', card: 0 });
    rejectedUnchanged(state, logic, 1, { type: 'shortfall', tile: 'birmingham_0' }); // not theirs
    rejectedUnchanged(state, logic, 0, { type: 'shortfall', tile: 'coventry_0' });   // no such tile

    // Selling the only tile (£6) leaves £2 owed: lose 2 VP, money back to 0
    state.players[0].vp = 5;
    const r = logic.applyMove(0, { type: 'shortfall', tile: 'birmingham_0' });
    assert.equal(r.success, true, r.message);
    assert.match(r.message, /lost 2 VP/);
    assert.equal(state.players[0].money, 0);
    assert.equal(state.players[0].vp, 3);
    assert.deepEqual(plain(state.getPendingShortfalls()), []);
    assert.equal(logic.canPerformAction('pass', 1), true);
});

test('Shortfall: a farm brewery can be sold too', () => {
    const { E, state, logic } = setup(2, 83);
    placeIndustry(E, state, 'northern', 0, E.INDUSTRY_TYPES.BREWERY, 1); // £5 -> £2
    state.players[0].money = -1;
    assert.deepEqual(plain(logic.getLegalMoves(0)), [{ type: 'shortfall', tile: 'northern' }]);
    const r = logic.applyMove(0, { type: 'shortfall', tile: 'northern' });
    assert.equal(r.success, true, r.message);
    assert.equal(state.breweryFarmTiles.northern, undefined);
    assert.equal(state.players[0].money, 1);
});

// ---------------------------------------------------------------- consecutive actions

test('Consecutive actions see each other’s effects (resources, prices, links)', () => {
    const { E, state, logic } = setup();
    const T = E.INDUSTRY_TYPES;
    // A mine with one cube: the first build empties it, so the second must
    // use the other equally close mine
    const kidd = placeIndustry(E, state, 'kidderminster_0', 2, T.COAL_MINE, 2, { cubes: 1 });
    const wolves = placeIndustry(E, state, 'wolverhampton_1', 1, T.COAL_MINE, 2, { cubes: 1 });
    placeLink(state, 'dudley-kidderminster', 2);
    placeLink(state, 'dudley-wolverhampton', 0); // player 0's: puts Wolverhampton in their network
    setHand(state, 0, [loc('dudley'), ind(T.MANUFACTURER)]);
    let r = logic.applyMove(0, { type: 'build', card: 0, location: 'dudley', slot: 1, industry: T.IRON_WORKS,
        coal: ['mine:kidderminster_0'] });
    assert.equal(r.success, true, r.message);
    assert.equal(kidd.flipped, true);
    // Second action (now in the network via the iron works): manufacturer at Wolverhampton
    // needs coal; Kidderminster is empty, Wolverhampton's mine is the only option
    const next = { type: 'build', card: 0, location: 'wolverhampton', slot: 0, industry: T.MANUFACTURER };
    rejectedUnchanged(state, logic, 0, { ...next, coal: ['mine:kidderminster_0'] });
    r = logic.applyMove(0, next);
    assert.equal(r.success, true, r.message);
    assert.deepEqual(plain(r.move.coal), ['mine:wolverhampton_1']);
    assert.equal(wolves.flipped, true);

    // Market prices rise between actions
    state.players[1].money = 50;
    setHand(state, 1, [loc('leek'), loc('leek')]);
    const p1 = state.getIronPrice();
    assert.equal(logic.applyMove(1, { type: 'develop', card: 0, industries: [T.COTTON_MILL, T.COTTON_MILL] }).success, true);
    assert.ok(state.getIronPrice() >= p1);
});
