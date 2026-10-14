// Shared file-based replay/analysis support for Assignment 17. No strategy changes.
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const { createHash } = require('node:crypto');
const { loadEngine } = require('../../test/helpers/engine');
const { check } = require('./record-version');
const ROOT = path.resolve(__dirname, '../..');
const DEFAULT_DIR = path.join(ROOT, 'research/human-games/games');
function engine() { check(); return loadEngine({ extraFiles: ['gameRecorder.js'] }); }
const plain = value => JSON.parse(JSON.stringify(value));
const tiles = state => Object.entries(state.boardIndustries).concat(Object.entries(state.breweryFarmTiles)).filter(([, t]) => t);
const mean = values => values.length ? (values.reduce((a, b) => a + b, 0) / values.length).toFixed(1) : '—';
const cell = value => String(value).replace(/[|\r\n]/g, ' ').replace(/[<>]/g, '');
function analyzeGame(E, data) {
    const players = data.players.map(p => ({ ...plain(p), actions: { canal: {}, rail: {} },
        built: [], developed: [], otherVP: { canal: 0, rail: 0 }, eras: {}, links: [], finalCash: 0, finalIncome: 0, vp: 0 }));
    const flags = [];
    const flag = (id, entry, reason) => flags.push({ game: data.id, playerId: id, action: entry.index,
        era: entry.before.era, round: entry.before.round, move: plain(entry.move), reason });
    const last = new Map();
    const { state } = E.GameRecord.replay(data, { onAction(before, after, result, entry) {
        const id = entry.playerId, p = players[id], move = entry.move;
        for (const owner of players) {
            const scoringVP = result.events.filter(e => ['eraEnd', 'gameEnd'].includes(e.type))
                .flatMap(e => e.scores).filter(s => s.playerId === owner.id)
                .reduce((sum, s) => sum + s.industryVP + s.linkVP, 0);
            owner.otherVP[before.era] += after.players[owner.id].vp - before.players[owner.id].vp - scoringVP;
        }
        last.set(id, entry);
        const counts = p.actions[before.era]; counts[move.type] = (counts[move.type] || 0) + 1;
        if (move.type === 'build') {
            const tile = before.getNextTile(id, move.industry);
            p.built.push({ action: entry.index, era: before.era, industry: move.industry, level: tile.level,
                location: move.location, slot: move.slot, cost: new E.GameLogic(before).resolveMove(id, move).plan.cost });
        }
        if (move.type === 'develop') p.developed.push({ action: entry.index, era: before.era, types: plain(move.industries), entry: plain(entry) });
        if (move.type === 'loan' && before.era === 'rail' && before.getRoundsRemaining() <= 2 && before.players[id].money >= 30)
            flag(id, entry, `Late Rail loan with £${before.players[id].money} already held and ${before.getRoundsRemaining()} rounds remaining. Check the planned spending; this is not proof the loan was unnecessary.`);
        for (const event of result.events) {
            if (!['eraEnd', 'gameEnd'].includes(event.type)) continue;
            // Recreate the board just after this move, before automatic era cleanup.
            // Scoring totals come from actual progression events, never an extra score call.
            const board = before.clone();
            const applied = new E.GameLogic(board).applyMove(id, move);
            if (!applied.success) throw new Error(`Cannot inspect scoring board at action ${entry.index}`);
            for (const score of event.scores) {
                const owner = players[score.playerId];
                const industries = tiles(board).filter(([, t]) => t.playerId === score.playerId);
                const links = Object.entries(board.boardLinks).filter(([, l]) => l.playerId === score.playerId)
                    .map(([key]) => ({ key, vp: board.linkValue(key) }));
                const industryVP = industries.filter(([, t]) => t.flipped).reduce((s, [, t]) => s + t.tileData.vp, 0);
                if (links.reduce((s, l) => s + l.vp, 0) !== score.linkVP || industryVP !== score.industryVP)
                    throw new Error(`Scoring board disagrees with event at action ${entry.index}`);
                owner.eras[before.era] = { industryVP: score.industryVP, linkVP: score.linkVP,
                    flipped: industries.filter(([, t]) => t.flipped).length,
                    unflipped: industries.filter(([, t]) => !t.flipped).map(([key, t]) => ({ key, type: t.type, level: t.tileData.level, printedVP: t.tileData.vp })), links };
                for (const link of links) {
                    owner.links.push({ era: before.era, ...link });
                    if (owner.isAI && link.vp <= 1) flag(owner.id, entry,
                        `${before.era} link ${link.key} scored ${link.vp} VP. It may still have provided useful access.`);
                }
                if (owner.isAI) for (const tile of owner.eras[before.era].unflipped.filter(t => t.printedVP >= 5))
                    flag(owner.id, entry, `${before.era} ended with unflipped ${tile.type} Lv${tile.level} at ${tile.key} (printed ${tile.printedVP} VP; actual industry score 0). Check selling/resource access.`);
            }
        }
    } });
    for (const p of players) {
        const actual = state.players[p.id];
        p.finalCash = actual.money; p.finalIncome = state.getIncomeLevel(p.id); p.vp = actual.vp;
        if (!p.isAI) continue;
        if (p.finalCash >= 30) flag(p.id, last.get(p.id), `Finished with £${p.finalCash} unused cash. Check whether worthwhile spending was possible.`);
        for (const d of p.developed) {
            const unused = [...new Set(d.types)].filter(type => !p.built.some(b => b.action > d.action && b.industry === type));
            if (unused.length) flag(p.id, d.entry, `Developed ${unused.join(', ')} but built no later industry of those types. Check whether the development enabled another benefit.`);
        }
    }
    return { id: data.id, source: data.source, numPlayers: data.numPlayers, engine: data.engine, policy: data.policy,
        players, flags, ranking: plain(data.final.ranking), actions: data.actions.length };
}
function loadDataset(dir = DEFAULT_DIR, E = engine()) {
    const games = [], errors = [], ids = new Map(), fingerprints = new Map();
    if (!fs.existsSync(dir) || !fs.statSync(dir).isDirectory()) return { games, errors: [{ file: dir, reason: 'Dataset directory does not exist' }] };
    for (const name of fs.readdirSync(dir).filter(n => n.endsWith('.json')).sort()) {
        try {
            const data = JSON.parse(fs.readFileSync(path.join(dir, name), 'utf8'));
            const game = analyzeGame(E, data);
            if (ids.has(data.id)) throw new Error(`Duplicate game identifier; also in ${ids.get(data.id)}`);
            const fingerprint = createHash('sha256').update(E.GameRecord.canonical({ initialState: data.initialState,
                actions: data.actions, final: data.final })).digest('hex');
            if (fingerprints.has(fingerprint)) throw new Error(`Identical game record; also in ${fingerprints.get(fingerprint)}`);
            ids.set(data.id, name); fingerprints.set(fingerprint, name); games.push({ ...game, file: name, datasetDir: path.resolve(dir) });
        } catch (error) { errors.push({ file: name, reason: error.message }); }
    }
    return { games, errors };
}
function report(dataset) {
    const { games, errors } = dataset;
    const human = games.filter(g => g.source === 'browser' && g.players.some(p => !p.isAI) && g.players.some(p => p.isAI));
    const synthetic = games.filter(g => g.source === 'synthetic');
    const aiOnly = games.filter(g => g.source === 'browser' && g.players.every(p => p.isAI));
    const other = games.length - human.length - synthetic.length - aiOnly.length;
    const lines = ['# Human Playtesting Report', '', '## Games analysed', '',
        `${human.length} valid human-versus-AI games; ${synthetic.length} synthetic samples, ${aiOnly.length} AI-only games and ${other} human-only games excluded from human aggregates.`,
        `${errors.length} invalid/duplicate files. ${errors.length ? 'Results below cover valid files only; resolve these errors before interpreting the collection.' : 'All discovered JSON files validated.'}`, '',
        'Small samples describe these games only; they do not establish reliable win rates or superior strategies.', '',
        '## Overall findings', ''];
    const rows = human.flatMap(g => g.players);
    const winners = human.flatMap(g => g.ranking.filter(r => r.rank === 1).map(r => ({ game: g.id, human: !g.players[r.playerId].isAI })));
    const humanWins = human.filter(g => winners.some(w => w.game === g.id && w.human)).length;
    const aiWins = human.filter(g => winners.some(w => w.game === g.id && !w.human)).length;
    lines.push(`Human wins: ${humanWins}; AI wins: ${aiWins} (shared wins count for both).`,
        `Mean final VP per seat: human ${mean(rows.filter(p => !p.isAI).map(p => p.vp))}; AI ${mean(rows.filter(p => p.isAI).map(p => p.vp))}.`, '');
    if (!human.length) lines.push('No genuine human playtests yet. Synthetic results below demonstrate the tooling, not AI strength.', '');
    if (human.length) {
        lines.push('Observed review flags across genuine games (not validated mistakes):', '', '| Flag | Cases | Games |', '|---|---:|---:|');
        for (const [name, match] of [['Late loan', 'Late Rail loan'], ['Unflipped industry', 'ended with unflipped'],
            ['Low-scoring link', 'scored '], ['Unused development', 'Developed '], ['Unused cash', 'Finished with']]) {
            const cases = human.flatMap(g => g.flags.filter(f => f.reason.includes(match)));
            lines.push(`| ${name} | ${cases.length} | ${new Set(cases.map(f => f.game)).size} |`);
        }
        lines.push('');
    }

    lines.push('| Game | Source | Players | Policy | Results (VP) | Human mean − AI mean |', '|---|---|---:|---|---|---:|');
    for (const g of games) {
        const h = g.players.filter(p => !p.isAI), a = g.players.filter(p => p.isAI);
        const gap = h.length && a.length ? (h.reduce((s, p) => s + p.vp, 0) / h.length - a.reduce((s, p) => s + p.vp, 0) / a.length).toFixed(1) : '—';
        lines.push(`| ${cell(g.id)} | ${g.source} | ${g.numPlayers} | ${g.policy} | ${g.players.map(p => `${cell(p.name)} (${p.isAI ? 'AI ' + p.difficulty : 'human'}): ${p.vp}`).join('; ')} | ${gap} |`);
    }
    lines.push('', '### Human results by player count and AI policy/difficulty', '', '| Players / policy / difficulty | Games | AI seats | Mean AI VP | Mean human VP in those games |', '|---|---:|---:|---:|---:|');
    const groups = new Map();
    for (const g of human) for (const difficulty of [...new Set(g.players.filter(p => p.isAI).map(p => p.difficulty))]) {
        const key = `${g.numPlayers} / ${g.policy} / ${difficulty}`;
        if (!groups.has(key)) groups.set(key, []); groups.get(key).push({ g, difficulty });
    }
    for (const [key, entries] of groups) {
        const ai = entries.flatMap(({ g, difficulty }) => g.players.filter(p => p.isAI && p.difficulty === difficulty));
        lines.push(`| ${key} | ${entries.length} | ${ai.length} | ${mean(ai.map(p => p.vp))} | ${mean(entries.flatMap(({ g }) => g.players.filter(p => !p.isAI).map(p => p.vp)))} |`);
    }
    lines.push('', '## Human versus AI differences', '', '| Group (genuine games only) | Canal industry / links | Rail industry / links | Builds | Develop / Sell / Loan actions | Final income / cash |', '|---|---|---|---:|---|---|');
    for (const isAI of [false, true]) {
        const seats = rows.filter(p => p.isAI === isAI);
        const count = type => mean(seats.map(p => (p.actions.canal[type] || 0) + (p.actions.rail[type] || 0)));
        lines.push(`| ${isAI ? 'AI' : 'Human'} | ${mean(seats.map(p => p.eras.canal.industryVP))} / ${mean(seats.map(p => p.eras.canal.linkVP))} | ${mean(seats.map(p => p.eras.rail.industryVP))} / ${mean(seats.map(p => p.eras.rail.linkVP))} | ${count('build')} | ${count('develop')} / ${count('sell')} / ${count('loan')} | ${mean(seats.map(p => p.finalIncome))} / ${mean(seats.map(p => p.finalCash))} |`);
    }
    lines.push('', 'Other VP is the exact non-era-score change (merchant bonuses or shortfall penalties). Industry/link totals alone can therefore differ from final VP.', '', '### Per-game behaviour (samples explicitly labelled)', '');
    for (const g of games) {
        lines.push(`### ${g.id} (${g.source})`, '', '| Player | Canal industry / links / other / total | Rail industry / links / other / total | Final VP / income / cash |', '|---|---|---|---|');
        for (const p of g.players) {
            const score = era => { const s = p.eras[era]; return `${s.industryVP} / ${s.linkVP} / ${p.otherVP[era]} / ${s.industryVP + s.linkVP + p.otherVP[era]}`; };
            lines.push(`| ${cell(p.name)} | ${score('canal')} | ${score('rail')} | ${p.vp} / ${p.finalIncome} / £${p.finalCash} |`);
        }
        lines.push('', '| Player | Industry builds (type: levels) | Era | Actions | Flipped / unflipped tiles | Links / VP |', '|---|---|---|---|---|---|');
        for (const p of g.players) for (const era of ['canal', 'rail']) {
            const built = p.built.filter(b => b.era === era);
            const types = [...new Set(built.map(b => b.industry))];
            const s = p.eras[era];
            lines.push(`| ${cell(p.name)} (${p.isAI ? p.difficulty : 'human'}) | ${types.map(t => `${t}: ${built.filter(b => b.industry === t).map(b => b.level).join(',')}`).join('; ') || 'none'} | ${era} | ${Object.entries(p.actions[era]).map(([t, n]) => `${t}: ${n}`).join('; ')} | ${s.flipped} / ${s.unflipped.length} | ${s.links.length} / ${s.linkVP} |`);
        }
    }
    lines.push('', '## Suspicious AI decisions', '', 'Review hypotheses, not move grades. Thresholds: Rail loans in the last two rounds while holding ≥£30; era-end links ≤1 VP; unflipped industries with printed VP ≥5; developed types never built later; final cash ≥£30. Low-scoring links can provide access, and unused money may be unavoidable.', '');
    for (const g of games) {
        lines.push(`### ${g.id} (${g.source})`, '');
        const relativeDir = path.relative(ROOT, g.datasetDir || DEFAULT_DIR) || '.';
        const dirArg = relativeDir === 'research/human-games/games' ? '' : ` --dir '${relativeDir.replace(/'/g, "'\\''")}'`;
        if (!g.flags.length) lines.push('No threshold flags. This does not establish good play.', '');
        for (const f of g.flags.slice(0, 12)) lines.push(`- Player ${f.playerId}, ${f.era} round ${f.round}, action ${f.action} (${f.move.type}): ${f.reason} Inspect: \`node scripts/research/inspect-human-game.js --game ${g.id} --action ${f.action}${dirArg}\`.`);
        if (g.flags.length > 12) lines.push(`- ${g.flags.length - 12} more flags available in the analysis module; showing the first 12 for readability.`);
        lines.push('');
    }
    lines.push('## Potential weaknesses', '', human.length ? 'Compare the observed scoring categories and repeated flags above. A flag alone does not validate a strategic weakness.' : 'No human-game evidence yet; no strategic conclusions drawn.', '',
        '## Recommended next experiments', '', 'Inspect recurring flags, check the legal alternatives and network context, and collect another batch against the same policy. Test any proposed AI correction separately; this tool makes no strategy changes.', '',
        '## Files needing attention', '');
    if (!errors.length) lines.push('None.');
    for (const error of errors) lines.push(`- ${cell(error.file)}: ${cell(error.reason)}`);
    return lines.join('\n') + '\n';
}
function inspect(E, data, action) {
    let output;
    E.GameRecord.replay(data, { onAction(before, after, result, entry) {
        if (entry.index !== action) return;
        const player = before.players[entry.playerId];
        const logic = new E.GameLogic(before);
        const legal = logic.getCurrentLegalMoves();
        output = { game: data.id, source: data.source, policy: data.policy, action, playerId: player.id,
            name: player.name, isAI: player.isAI, difficulty: player.aiDifficulty, era: before.era, round: before.round,
            money: player.money, income: before.getIncomeLevel(player.id), hand: plain(player.hand),
            board: { industries: before.serialize().boardIndustries, farms: before.serialize().breweryFarmTiles,
                links: before.serialize().boardLinks, merchants: before.serialize().merchantTiles, coalMarket: before.coalMarket, ironMarket: before.ironMarket },
            recordedMove: plain(entry.move), legalAlternatives: plain(legal.slice(0, 30)), legalMoveCount: legal.length,
            alternativesNote: 'First 30 legal default-choice moves, not ranked or optimal. Complete diagnostic view; includes hidden information.',
            outcome: { message: result.message, events: plain(result.events), board: { industries: after.serialize().boardIndustries, farms: after.serialize().breweryFarmTiles, links: after.serialize().boardLinks }, money: after.players[player.id].money,
                income: after.getIncomeLevel(player.id), vp: after.players[player.id].vp, stateDigest: entry.stateDigest } };
    } });
    if (!output) throw new Error(`Action ${action} not found`);
    return output;
}
module.exports = { ROOT, DEFAULT_DIR, engine, analyzeGame, loadDataset, report, inspect };
