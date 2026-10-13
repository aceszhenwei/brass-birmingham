#!/usr/bin/env node
'use strict';
// Optional documentation tool; Playwright is not a game dependency.
// Start the static server, then run with Playwright available on NODE_PATH.
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright');
const root = path.resolve(__dirname, '..');
const output = path.join(root, 'screenshots');
const frames = process.env.BRASS_PREVIEW_FRAMES || path.join(require('node:os').tmpdir(), 'brass-preview-frames');
const url = process.env.BRASS_CAPTURE_URL || 'http://127.0.0.1:8080';
(async () => {
    fs.mkdirSync(frames, { recursive: true });
    for (const name of fs.readdirSync(frames)) if (/^\d{2}\.png$/.test(name)) fs.unlinkSync(path.join(frames, name));
    const browser = await chromium.launch({ headless: true,
        ...(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {}),
        args: ['--no-sandbox'] });
    try {
    const page = await browser.newPage({ viewport: { width: 1600, height: 1100 }, deviceScaleFactor: 1 });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(url, { waitUntil: 'networkidle' });
    let frame = 0;
    const capture = async (name) => {
        await page.evaluate(async () => {
            await document.fonts.ready;
            await Promise.all([...document.images].map(img => img.decode().catch(() => {})));
        });
        await page.waitForFunction(() => !document.querySelector('#toast-container')?.children.length);
        await page.waitForTimeout(350);
        await page.screenshot({ path: path.join(output, name + '.jpg'), type: 'jpeg', quality: 88 });
        await page.screenshot({ path: path.join(frames, `${String(frame++).padStart(2, '0')}.png`) });
        console.log(`Captured ${name}`);
    };
    await capture('title');
    await page.click('#start-game-btn');
    await page.waitForFunction(() => BoardAssets.tilesReady() && BoardAssets.cardsReady() && boardRenderer.assetURL);
    // A deterministic deal for reproducible documentation; all illustrated
    // later positions are reached by legal moves through the production UI.
    await page.evaluate(() => {
        const seeded = new GameState(3, ['Alice', 'Bob', 'Carol'], [], { seed: 91 });
        Object.assign(gameState, seeded);
        uiManager.aiRng = new SeededRandom(91 ^ 0x9E3779B9);
        uiManager.gameLog = [];
        uiManager.addLogEntry(null, 'Canal Era', 'era');
        uiManager.turnPlayerId = gameState.currentPlayerId;
        uiManager.refresh();
    });
    await capture('board_start');
    await page.evaluate(() => uiManager.onCardClicked(0));
    await capture('hand_actions');
    await page.evaluate(() => uiManager.cancelAction());
    // Advance using a fixed heuristic sample policy (not live Normal/Hard),
    // with human seats so overlays wait
    // for explicit Continue. This does not patch or bypass engine rules.
    const advance = async (stage) => page.evaluate(stage => {
        let steps = 0;
        while (steps++ < 400) {
            if (stage === 'canal' && gameState.era === ERA.CANAL && gameState.round >= 4 && gameLogic.getCurrentDecision().type === 'action') break;
            if (stage === 'rail' && gameState.era === ERA.RAIL && gameState.round >= 4 && gameLogic.getCurrentDecision().type === 'action') break;
            const decision = gameLogic.getCurrentDecision();
            if (decision.type === 'gameOver') break;
            const move = decision.type === 'shortfall' ? gameLogic.defaultShortfallMove(decision.playerId)
                : gameLogic.moveFromDecision(AIPlayer.chooseAction(gameState, gameLogic, decision.playerId, 'normal', uiManager.aiRng));
            uiManager.closeModal();
            uiManager.playMove(decision.playerId, move);
            if (!document.getElementById('scoring-overlay').classList.contains('hidden')) break;
        }
        return { era: gameState.era, round: gameState.round, scoring: !document.getElementById('scoring-overlay').classList.contains('hidden') };
    }, stage);
    await advance('canal');
    await page.waitForTimeout(2200);
    await capture('canal_era');
    await page.evaluate(() => {
        for (const id of ['turn-order-panel', 'markets-panel']) document.getElementById(id).open = true;
    });
    await capture('player_markets');
    await page.evaluate(() => {
        for (const id of ['turn-order-panel', 'markets-panel']) document.getElementById(id).open = false;
        uiManager.showIndustries();
    });
    await capture('industries');
    await page.click('#industries-close');
    const showMove = async type => page.evaluate(type => {
        uiManager.cancelAction();
        const moves = gameLogic.getLegalMoves(gameState.currentPlayerId);
        const move = moves.find(m => m.type === type);
        if (!move) return false;
        uiManager.onActionSelected(type);
        if (type === 'build') {
            uiManager.selectedCard = move.card;
            uiManager.proceedWithMove(move);
        }
        return true;
    }, type);
    if (!await showMove('build')) throw new Error('Capture position has no legal Build');
    await capture('build_review');
    await page.evaluate(() => uiManager.confirmPendingMove());
    await page.waitForTimeout(2200);
    await capture('undo_turn');
    await page.evaluate(() => uiManager.restoreTurn(false));
    if (!await showMove('network')) throw new Error('Capture position has no legal Network');
    await capture('network');
    await page.evaluate(() => uiManager.cancelAction());
    if (!await showMove('develop')) throw new Error('Capture position has no legal Develop');
    await capture('develop_modal');
    await page.evaluate(() => uiManager.cancelAction());
    // Find a naturally occurring Sell decision rather than staging industries.
    let foundSell = false;
    for (let i = 0; i < 80; i++) {
        if (await showMove('sell')) { foundSell = true; break; }
        const stage = await page.evaluate(() => {
            const d = gameLogic.getCurrentDecision();
            const move = d.type === 'shortfall' ? gameLogic.defaultShortfallMove(d.playerId)
                : gameLogic.moveFromDecision(AIPlayer.chooseAction(gameState, gameLogic, d.playerId, 'normal', uiManager.aiRng));
            uiManager.closeModal();
            uiManager.playMove(d.playerId, move);
            return !document.getElementById('scoring-overlay').classList.contains('hidden');
        });
        if (stage) throw new Error('Reached scoring before a Sell capture');
    }
    if (!foundSell) throw new Error('No legal Sell position found');
    await capture('sell_modal');
    await page.evaluate(() => uiManager.cancelAction());
    let status = await advance('rail');
    if (!status.scoring) throw new Error('Expected Canal scoring');
    await page.evaluate(() => document.querySelector('#scoring-details details').open = true);
    await capture('scoring');
    await page.click('#scoring-continue-btn');
    status = await advance('rail');
    if (status.era !== 'rail') throw new Error('Expected Rail Era');
    await page.waitForTimeout(2200);
    await capture('rail_era');
    if (errors.length) throw new Error(`Browser errors: ${errors.join('; ')}`);
    console.log(`Captured ${frame} frames. Convert them to preview.gif as documented in docs/testing.md.`);
    } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
