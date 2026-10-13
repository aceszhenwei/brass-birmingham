#!/usr/bin/env node
// Assignment 12: the planner in a real browser (Chromium via Playwright).
//
//   PW=$(npm root -g)/playwright node scripts/research/ai-browser.js [--players 3] [--games 1]
//       [--depth 3] [--widths 6,3] [--throttle 1] [--mobile] [--chromium /path/to/chrome]
//
// Plays complete all-AI games through the real UI (index.html), with every
// seat at Normal, so every decision goes through AIPlanner.chooseAction exactly
// as in play. The AI turn delay is shortened to 50 ms so games run quickly;
// everything else (rendering, animations, logs) runs as usual.
//   --depth/--widths  plan configuration (default: the production planner);
//                     e.g. --depth 4 --widths 6,3,3 for full four-action planning
//   --throttle N      CPU slowed N times (Chrome DevTools emulation); 4 stands
//                     in for a mid-range phone
//   --mobile          a phone-sized viewport with touch
// Reports, per game and overall: planner decision times (mean, 95th
// percentile, worst), the longest two-action turn, how many decisions hit
// the time budget, the longest gap between animation frames (how long the
// page was unresponsive), the JS heap after garbage collection at the start
// and end of each game, and any page errors.

'use strict';

const path = require('path');

function arg(name, fallback) {
    const i = process.argv.indexOf(`--${name}`);
    return i >= 0 ? process.argv[i + 1] : fallback;
}
const PLAYERS = Number(arg('players', 3));
const GAMES = Number(arg('games', 1));
const DEPTH = arg('depth', null);
const WIDTHS = arg('widths', null);
const THROTTLE = Number(arg('throttle', 1));
const MOBILE = process.argv.includes('--mobile');
const CHROMIUM = arg('chromium', '/opt/pw-browsers/chromium-1194/chrome-linux/chrome');
const { chromium } = require(process.env.PW || 'playwright');

const quantile = (xs, q) => { const s = [...xs].sort((a, b) => a - b); return s.length ? s[Math.min(s.length - 1, Math.floor(q * s.length))] : NaN; };
const mean = (xs) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : NaN);
const f0 = (x) => (Number.isFinite(x) ? x.toFixed(0) : '–');

(async () => {
    const browser = await chromium.launch({ executablePath: CHROMIUM, args: ['--js-flags=--expose-gc', '--enable-precise-memory-info'] });
    const context = await browser.newContext(MOBILE
        ? { viewport: { width: 412, height: 915 }, deviceScaleFactor: 2.6, isMobile: true, hasTouch: true }
        : { viewport: { width: 1500, height: 950 } });
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', e => errors.push(`pageerror: ${e.message}`));
    page.on('console', m => { if (m.type() === 'error') errors.push(`console: ${m.text()}`); });
    if (THROTTLE > 1) {
        const cdp = await context.newCDPSession(page);
        await cdp.send('Emulation.setCPUThrottlingRate', { rate: THROTTLE });
    }
    const all = { times: [], turns: [], timedOut: 0, rafGap: 0 };
    for (let g = 0; g < GAMES; g++) {
        await page.goto(`file://${path.join(__dirname, '..', '..', 'index.html')}`);
        await page.click(`.count-btn[data-count="${PLAYERS}"]`);
        for (const b of await page.$$('.ai-toggle-checkbox')) await b.check();
        for (const sel of await page.$$('.ai-difficulty-select')) await sel.selectOption('normal');
        await page.evaluate(({ depth, widths }) => {
            window.__bench = { times: [], turns: [], timedOut: 0, rafGap: 0, heap: [] };
            const original = AIPlanner.chooseAction;
            const planner = depth ? { ...AIPlanner.PRODUCTION, depth: Number(depth), widths: widths ? widths.split(',').map(Number) : AIPlanner.PRODUCTION.widths } : undefined;
            let turnKey = null, turnMs = 0;
            AIPlanner.chooseAction = (state, logic, id, level, rng, opts) => {
                const t = performance.now();
                const d = original(state, logic, id, level, rng, planner ? { ...(opts || {}), planner } : opts);
                const ms = performance.now() - t;
                window.__bench.times.push(ms);
                if (d.planStats && d.planStats.timedOut) window.__bench.timedOut++;
                const key = `${state.era}-${state.round}-${id}`;
                if (key !== turnKey) { if (turnKey) window.__bench.turns.push(turnMs); turnKey = key; turnMs = 0; }
                turnMs += ms;
                window.__bench.lastTurn = turnMs;
                return d;
            };
            // Shorter AI pacing (the UI default is 1.6 s between AI actions)
            const loop = UIManager.prototype.runAITurnLoop;
            UIManager.prototype.runAITurnLoop = function () { return loop.call(this, 50); };
            // Longest gap between animation frames
            let last = performance.now();
            const frame = (t) => { window.__bench.rafGap = Math.max(window.__bench.rafGap, t - last); last = t; requestAnimationFrame(frame); };
            requestAnimationFrame(frame);
        }, { depth: DEPTH, widths: WIDTHS });
        const heap = async () => page.evaluate(() => { if (window.gc) window.gc(); return performance.memory ? performance.memory.usedJSHeapSize / 1048576 : null; });
        const heapStart = await heap();
        await page.click('#start-game-btn');
        const started = Date.now();
        let over = false;
        while (!over && Date.now() - started < 30 * 60 * 1000) {
            await page.waitForTimeout(500);
            over = await page.evaluate(() => gameState.gameOver);
        }
        const r = await page.evaluate(() => ({ ...window.__bench, turns: [...window.__bench.turns, window.__bench.lastTurn],
            ranking: gameState.getFinalRanking().map(x => x.vp),
            aiFailures: uiManager.gameLog.filter(e => /AI action failed/.test(e.message)).length }));
        const heapEnd = await heap();
        all.times.push(...r.times);
        all.turns.push(...r.turns);
        all.timedOut += r.timedOut;
        all.rafGap = Math.max(all.rafGap, r.rafGap);
        console.log(`game ${g + 1}: ${over ? 'completed' : 'DID NOT FINISH'} in ${((Date.now() - started) / 1000).toFixed(0)} s; VP ${r.ranking.join(', ')}; ` +
            `${r.times.length} AI decisions: mean ${f0(r.times.reduce((a, b) => a + b, 0) / r.times.length)} ms, p95 ${f0(quantile(r.times, 0.95))}, ` +
            `max ${f0(Math.max(...r.times))}; longest turn ${f0(Math.max(...r.turns))} ms; budget hit ${r.timedOut}; ` +
            `first / last third of decisions: mean ${f0(mean(r.times.slice(0, Math.floor(r.times.length / 3))))} / ${f0(mean(r.times.slice(-Math.floor(r.times.length / 3))))} ms; ` +
            `longest frame gap ${f0(r.rafGap)} ms; heap ${heapStart ? heapStart.toFixed(1) : '?'} → ${heapEnd ? heapEnd.toFixed(1) : '?'} MB; AI failures ${r.aiFailures}`);
    }
    const t = all.times;
    console.log(`\nSUMMARY ${PLAYERS} players, ${GAMES} games, ${DEPTH ? `depth ${DEPTH} widths ${WIDTHS}` : 'production planner'}, ` +
        `CPU ${THROTTLE}x${MOBILE ? ', mobile viewport' : ''}: ${t.length} decisions, mean ${f0(t.reduce((a, b) => a + b, 0) / t.length)} ms, ` +
        `median ${f0(quantile(t, 0.5))}, p95 ${f0(quantile(t, 0.95))}, max ${f0(Math.max(...t))}; turns: median ${f0(quantile(all.turns, 0.5))}, ` +
        `p95 ${f0(quantile(all.turns, 0.95))}, max ${f0(Math.max(...all.turns))} ms; budget hit ${all.timedOut}; longest frame gap ${f0(all.rafGap)} ms; errors ${errors.length}`);
    for (const e of errors.slice(0, 5)) console.log(`  ${e}`);
    await browser.close();
})();
