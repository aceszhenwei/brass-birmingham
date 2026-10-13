// ============================================================================
// Brass: Birmingham - UI Manager
// Enhanced with phase bar, game log, turn transitions, card selection mode
// ============================================================================

class UIManager {
    constructor() {
        this.state = null;
        this.logic = null;
        this.renderer = null;
        this.selectedAction = null;
        this.selectedCard = null;
        this.actionStep = 0; // Multi-step action tracking
        this.pendingData = {}; // Data accumulated during multi-step actions
        this.gameLog = []; // Game log entries
        this.undoHistory = [];
        this.turnPlayerId = null; // whose turn was last announced (turn transitions)
    }

    init(gameState, gameLogic, boardRenderer) {
        this.state = gameState;
        this.logic = gameLogic;
        this.renderer = boardRenderer;
        // The AI's own random stream (difficulty noise), derived from the
        // game seed so a seeded game is reproducible end to end, but kept
        // separate so AI thinking never changes the game's shuffles.
        this.aiRng = new SeededRandom((gameState.rng.seed ^ 0x9E3779B9) >>> 0);

        this.bindEvents();
        this.addLogEntry(null, `Game started with ${this.state.numPlayers} players`, 'system');
        this.addLogEntry(null, `Canal Era`, 'era');
        this.turnPlayerId = this.state.currentPlayerId;
        this.refresh();
        this.continueGame(); // in case the first seat is AI-controlled
    }

    // ========================================================================
    // Event Binding
    // ========================================================================

    bindEvents() {
        document.getElementById('expand-industries').addEventListener('click', () => this.showIndustries());
        document.getElementById('industries-close').addEventListener('click', () => document.getElementById('industries-dialog').close());
        document.getElementById('industries-player').addEventListener('change', () => this.renderIndustrySheet());
        document.getElementById('game-board').addEventListener('keydown', e => {
            if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); this.onBoardClick(e); }
        });
        document.getElementById('undo-action').onclick = () => this.restoreTurn(false);
        document.getElementById('reset-turn').onclick = () => this.restoreTurn(true);
        // Action buttons
        document.querySelectorAll('.action-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const action = btn.dataset.action;
                this.onActionSelected(action);
            });
        });

        // Modal close
        document.getElementById('modal-close').addEventListener('click', () => this.closeModal());

        // Board click events (delegated)
        document.getElementById('game-board').addEventListener('click', (e) => {
            this.onBoardClick(e);
        });

        // Phase bar cancel button
        if (typeof ActionIcons !== 'undefined') ActionIcons.mount();

        // Artwork is detected asynchronously; redraw the panels that use it.
        window.addEventListener('boardassets:ready', () => {
            if (!this.state) return;
            this.updateHand();
            this.updatePlayerMat();
            this.updateMarkets();
        });

        document.getElementById('phase-cancel-btn').addEventListener('click', () => {
            this.cancelAction();
        });

        // Escape key to cancel action
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                if (document.getElementById('industries-dialog').open) return; // native dialog handles Escape/focus
                if (this.selectedAction) {
                    this.cancelAction();
                }
            }
        });
    }

    // ========================================================================
    // Refresh UI
    // ========================================================================

    refresh() {
        this.updateUndoControls();
        this.updateTopBar();
        this.updatePlayerPanels();
        this.updateTurnOrder();
        this.updateHand();
        this.updateActionButtons();
        this.updatePlayerMat();
        this.updateMarkets();
        this.updatePhaseBar();
        this.updateActionDetails();
        this.renderer.fullUpdate(this.state);
    }

    updateTopBar() {
        const player = this.state.currentPlayer;
        document.getElementById('era-label').textContent =
            this.state.era === ERA.CANAL ? 'Canal Era' : 'Rail Era';
        document.getElementById('round-label').textContent =
            `Round ${this.state.round} | Deck: ${this.state.drawDeck.length}`;

        const playerLabel = document.getElementById('current-player-label');
        playerLabel.textContent = `${player.name}'s Turn`;
        playerLabel.style.backgroundColor = player.color;
        playerLabel.style.color = player.colorName === 'White' ? '#1a1510' : 'white';

        const actionsLeft = this.state.actionsPerTurn - this.state.actionsThisTurn;
        document.getElementById('actions-remaining-label').textContent =
            `${actionsLeft} action${actionsLeft !== 1 ? 's' : ''} left`;

        // Market prices
        const coalPrice = this.state.getCoalPrice();
        const ironPrice = this.state.getIronPrice();
        document.getElementById('coal-price').textContent =
            coalPrice === Infinity ? 'Empty' : `£${coalPrice}`;
        document.getElementById('iron-price').textContent =
            ironPrice === Infinity ? 'Empty' : `£${ironPrice}`;
    }

    updatePlayerPanels() {
        const container = document.getElementById('player-panels');
        const expanded = new Set([...container.children].filter(p => p.open).map(p => p.dataset.player));
        container.innerHTML = '';

        for (const player of this.state.players) {
            const isActive = player.id === this.state.currentPlayerId;
            const panel = document.createElement('details');
            panel.className = `player-panel${isActive ? ' active' : ''}`;
            panel.dataset.player = String(player.id); panel.open = expanded.has(String(player.id));
            // Set the left border color via the panel itself (CSS uses border-left)
            panel.style.borderLeftColor = player.color;

            panel.innerHTML = `
                <summary><div class="player-panel-header">
                    <span class="player-panel-name" style="color: ${player.color}">${player.name}${player.isAI ? ' <span class="ai-chip">AI</span>' : ''}</span>
                    <span class="player-panel-vp">${player.vp} <span style="font-size:10px;font-weight:400;color:var(--text-muted)">VP</span></span>
                </div><div class="player-glance">£${player.money} · Income ${this.state.getIncomeLevel(player.id)} · Spent £${this.state.moneySpentThisRound[player.id] || 0}</div></summary>
                <div class="player-panel-stats">
                    <span class="player-panel-stat" title="Money" style="color:#c9a84c">£${player.money}</span>
                    <span class="player-panel-stat" title="Income level">&#8679; ${this.state.getIncomeLevel(player.id)}</span>
                    <span class="player-panel-stat" title="Cards">${player.hand.length} cds</span>
                    <span class="player-panel-stat" title="Money spent on actions this round; determines next round's order">Spent £${this.state.moneySpentThisRound[player.id] || 0}</span>
                    <span class="player-panel-stat" title="Links">
                        ${this.state.era === ERA.CANAL ? player.linksRemaining.canal : player.linksRemaining.rail} lnk
                    </span>
                </div>
            `;
            container.appendChild(panel);
        }
    }

    updateTurnOrder() {
        const container = document.getElementById('turn-order-summary');
        container.innerHTML = '';
        const addOrder = (label, order, showCurrent = false) => {
            const heading = document.createElement('div');
            heading.className = 'turn-order-heading';
            heading.textContent = label;
            container.appendChild(heading);
            const list = document.createElement('ol');
            list.className = 'turn-order-list';
            order.forEach(id => {
                const player = this.state.players[id];
                const row = document.createElement('li');
                row.dataset.player = id;
                row.className = showCurrent && id === this.state.currentPlayerId && !this.state.gameOver ? 'current-turn' : '';
                row.style.borderLeftColor = player.color;
                row.textContent = `${player.name} · £${this.state.moneySpentThisRound[id] || 0} spent${row.className ? ' · NOW' : ''}`;
                list.appendChild(row);
            });
            container.appendChild(list);
        };
        addOrder('This round', this.state.turnOrder, true);
        const nextOrder = this.state.getNextRoundTurnOrder();
        document.getElementById('turn-order-glance').textContent = this.state.gameOver ? 'Turn order · game over'
            : `Now: ${this.state.currentPlayer.name} · Next first: ${this.state.players[nextOrder[0]].name} (so far)`;
        if (!this.state.gameOver) addOrder('Next round · provisional', this.state.getNextRoundTurnOrder());
        const note = document.createElement('p');
        note.className = 'turn-order-note';
        note.textContent = this.state.gameOver ? 'Game over.'
            : 'Least spent goes first. Ties keep current order. Preview changes as players spend.';
        container.appendChild(note);
    }

    updateHand() {
        const container = document.getElementById('player-hand');
        container.innerHTML = '';

        const player = this.state.currentPlayer;
        const playerId = this.state.currentPlayerId;
        const inCardSelectMode = this.actionStep > 0 && this.selectedAction;

        // Get valid card indices for current action
        let validCardIndices = null;
        if (inCardSelectMode) {
            const move = this.pendingData.move;
            const target = this.selectedAction === ACTIONS.BUILD && move
                ? { cityId: move.location, industryType: move.industry } : null;
            validCardIndices = this.logic.getValidCardsForAction(playerId, this.selectedAction, target);
        }

        const cardArt = typeof BoardAssets !== 'undefined' && BoardAssets.cardsReady();

        // An AI opponent's hand is private: show card backs only
        if (player.isAI) {
            const backUrl = cardArt ? BoardAssets.cardBackUrl() : null;
            player.hand.forEach(() => {
                const cardEl = document.createElement('div');
                cardEl.className = backUrl ? 'card card-art card-back' : 'card card-back';
                cardEl.innerHTML = backUrl
                    ? `<img src="${backUrl}" alt="Hidden card" draggable="false">`
                    : '<div class="card-type">Hidden</div><div class="card-icon">&#10070;</div>';
                container.appendChild(cardEl);
            });
            document.getElementById('bottom-panel').classList.remove('card-select-mode');
            return;
        }

        player.hand.forEach((card, idx) => {
            const cardEl = document.createElement('div');
            cardEl.className = 'card';
            cardEl.dataset.index = idx;
            cardEl.setAttribute('tabindex', '0'); cardEl.setAttribute('role', 'button');
            cardEl.setAttribute('aria-label', card.name || card.type);
            cardEl.addEventListener('keydown', e => {
                if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); this.onCardClicked(idx); }
            });

            // With the printed card faces supplied locally, the card IS the
            // artwork — no drawn type/icon/name layout on top of it.
            const art = cardArt ? BoardAssets.cardUrl(card) : null;
            if (art) {
                cardEl.classList.add('card-art');
                if (card.type === CARD_TYPES.LOCATION) cardEl.classList.add('location-card');
                else if (card.type === CARD_TYPES.INDUSTRY) cardEl.classList.add('industry-card');
                else cardEl.classList.add('wild-card');
                const artLabel = card.type === CARD_TYPES.LOCATION
                    ? ''
                    : `<span class="card-art-label">${card.name || (card.type === CARD_TYPES.WILD_LOCATION ? 'Wild Location' : 'Wild Industry')}</span>`;
                cardEl.innerHTML = `<img src="${art}" alt="${card.type === CARD_TYPES.LOCATION ? card.name || '' : ''}" draggable="false">${artLabel}`;
                if (this.selectedCard === idx) cardEl.classList.add('selected');
                if (this.selectedAction === ACTIONS.SCOUT &&
                        this.pendingData.scoutCards && this.pendingData.scoutCards.includes(idx)) {
                    cardEl.classList.add('scout-queued');
                }
                if (inCardSelectMode && validCardIndices) {
                    cardEl.classList.add(validCardIndices.includes(idx) ? 'valid-discard' : 'invalid-discard');
                }
                cardEl.addEventListener('click', () => this.onCardClicked(idx));
                container.appendChild(cardEl);
                return;
            }

            if (card.type === CARD_TYPES.LOCATION) {
                cardEl.classList.add('location-card');
                const city = CITIES[card.location];
                const regionColor = city ? REGION_COLORS[city.region]?.fill : '#4a4a4a';

                // Apply region color as background tint so cards are visually distinct by
                // region, matching the same region tint used on the board itself.
                if (regionColor) {
                    cardEl.style.borderColor = regionColor;
                    cardEl.style.boxShadow = `0 0 6px ${regionColor}55`;
                    cardEl.style.setProperty('--region-tint', `${regionColor}30`);
                }

                cardEl.innerHTML = `
                    <div class="card-type">Location</div>
                    <div style="font-size:20px;margin:4px 0;">📍</div>
                    <div class="card-name">${card.name}</div>
                `;
            } else if (card.type === CARD_TYPES.INDUSTRY) {
                cardEl.classList.add('industry-card');
                const isDual = card.industryTypes.length > 1;
                const display = INDUSTRY_DISPLAY[card.industryTypes[0]];
                cardEl.style.setProperty('--industry-ribbon-color', display.color);
                let iconHtml;
                if (isDual) {
                    // Dual "Cotton Mill or Manufacturer" card — show both icons
                    const icons = card.industryTypes
                        .map(t => IndustryIcons.renderMarkup(t, 20, 'full') || INDUSTRY_DISPLAY[t].icon)
                        .join('');
                    iconHtml = `<div style="display:flex;justify-content:center;gap:2px;">${icons}</div>`;
                } else {
                    const svgIcon = IndustryIcons.renderMarkup(card.industryTypes[0], 30, 'full');
                    iconHtml = svgIcon || `<div class="card-icon">${display.icon}</div>`;
                }
                cardEl.innerHTML = `
                    <div class="card-type">Industry</div>
                    ${iconHtml}
                    <div class="card-name">${card.name}</div>
                `;
            } else if (card.type === CARD_TYPES.WILD_LOCATION) {
                cardEl.classList.add('wild-card');
                cardEl.innerHTML = `
                    <div class="card-type">Wild</div>
                    <div class="card-icon">&#10038;</div>
                    <div class="card-name">Location</div>
                `;
            } else if (card.type === CARD_TYPES.WILD_INDUSTRY) {
                cardEl.classList.add('wild-card');
                cardEl.innerHTML = `
                    <div class="card-type">Wild</div>
                    <div class="card-icon">&#10040;</div>
                    <div class="card-name">Industry</div>
                `;
            }

            if (this.selectedCard === idx) {
                cardEl.classList.add('selected');
            }

            // Mark cards already queued for scout discard
            if (this.selectedAction === ACTIONS.SCOUT &&
                    this.pendingData.scoutCards && this.pendingData.scoutCards.includes(idx)) {
                cardEl.classList.add('scout-queued');
            }

            // Card selection mode visual states
            if (inCardSelectMode && validCardIndices) {
                if (validCardIndices.includes(idx)) {
                    cardEl.classList.add('valid-discard');
                } else {
                    cardEl.classList.add('invalid-discard');
                }
            }

            cardEl.addEventListener('click', () => this.onCardClicked(idx));
            container.appendChild(cardEl);
        });

        // Toggle card-select-mode class on bottom panel
        const bottomPanel = document.getElementById('bottom-panel');
        if (inCardSelectMode) {
            bottomPanel.classList.add('card-select-mode');
        } else {
            bottomPanel.classList.remove('card-select-mode');
        }
    }

    updateActionButtons() {
        const playerId = this.state.currentPlayerId;

        document.querySelectorAll('.action-btn').forEach(btn => {
            const action = btn.dataset.action;
            const canDo = this.logic.canPerformAction(action, playerId);
            btn.disabled = !canDo;
            btn.classList.toggle('active', this.selectedAction === action);

            // Disabled tooltips
            if (!canDo) {
                const reason = this.logic.getDisabledReason(action, playerId);
                btn.title = reason || 'Cannot perform this action';
            } else {
                // Restore default tooltips
                const defaultTitles = {
                    build: 'Build an industry tile',
                    network: 'Build a canal or rail link',
                    develop: 'Remove lower-level tiles',
                    sell: 'Sell cotton, goods, or pottery',
                    loan: 'Take a £30 loan',
                    scout: 'Trade 3 cards for 2 wild cards',
                    pass: 'Pass (discard a card)',
                };
                btn.title = defaultTitles[action] || '';
            }
        });
    }

    updatePlayerMat() {
        const container = document.getElementById('player-mat');
        container.innerHTML = '';

        const remaining = this.state.getRemainingTiles(this.state.currentPlayerId);

        for (const [type, data] of Object.entries(remaining)) {
            const display = INDUSTRY_DISPLAY[type];
            const div = document.createElement('div');
            div.className = 'mat-industry';

            let tilesHtml = '';
            const allTiles = this.state.currentPlayer.industryTiles[type];
            const chips = typeof BoardAssets !== 'undefined' && BoardAssets.tilesReady();
            const iconMarkup = chips ? null : IndustryIcons.renderMarkup(type, 12, 'full');
            allTiles.forEach(tile => {
                const cls = tile.used ? 'mat-tile used' : 'mat-tile available';
                // Cost details (money, coal, iron)
                const costParts = [`£${tile.cost}`];
                if (tile.costCoal > 0) costParts.push(`${tile.costCoal} coal`);
                if (tile.costIron > 0) costParts.push(`${tile.costIron} iron`);
                const costStr = costParts.join(' + ');

                // Era availability
                const eraStr = (tile.canalEra && tile.railEra) ? 'Canal & Rail'
                             : tile.canalEra ? 'Canal only' : 'Rail only';

                // Industry-specific traits
                let extra = '';
                if (tile.beersToSell !== null && tile.beersToSell !== undefined) {
                    extra = ` | Sell: ${tile.beersToSell} beer`;
                } else if (tile.resourceCubes > 0) {
                    extra = ` | Produces: ${tile.resourceCubes} cubes`;
                }
                if (!tile.canDevelop) {
                    extra += ' | Cannot develop';
                }

                const tooltip = `${display.name} Lv${tile.level} (${tile.used ? 'Used' : 'Available'})\n` +
                                `Cost: ${costStr}\n` +
                                `Flip: ${tile.vp} VP, +${tile.income} Income${extra}\n` +
                                `Era: ${eraStr}`;
                if (chips) {
                    // The chip face already carries its level and industry.
                    const art = BoardAssets.tileUrl(type, tile.level, false, this.state.currentPlayer.color);
                    tilesHtml += `<div class="${cls} mat-tile-art" data-type="${type}" title="${tooltip}">
                        <img src="${art}" alt="" draggable="false">
                    </div>`;
                } else {
                    tilesHtml += `<div class="${cls}" data-type="${type}" title="${tooltip}">
                        <div class="mat-tile-icon">${iconMarkup}</div>
                        <div class="mat-tile-level">${tile.level}</div>
                    </div>`;
                }
            });

            div.innerHTML = `
                <div class="mat-industry-label">${display.shortName} (${data.count})</div>
                <div class="mat-tiles">${tilesHtml}</div>
            `;
            container.appendChild(div);
        }
        if (document.getElementById('industries-dialog').open) this.renderIndustrySheet();
    }

    showIndustries() {
        const select = document.getElementById('industries-player');
        select.innerHTML = '';
        for (const player of this.state.players) {
            const option = document.createElement('option');
            option.value = player.id;
            option.textContent = player.name;
            select.appendChild(option);
        }
        select.value = this.state.currentPlayerId;
        this.renderIndustrySheet();
        const dialog = document.getElementById('industries-dialog');
        if (!dialog.open) dialog.showModal();
    }

    renderIndustrySheet() {
        const player = this.state.players[Number(document.getElementById('industries-player').value)];
        if (!player) return;
        const body = document.getElementById('industries-body');
        body.innerHTML = '';
        const note = document.createElement('p');
        note.className = 'industries-note';
        note.textContent = 'Public inventory. Build the lowest remaining level first. Costs are base costs; market resources may add to them. Income rewards advance spaces. Brewery production doubles in Rail.';
        body.appendChild(note);
        for (const [type, tiles] of Object.entries(player.industryTiles)) {
            const section = document.createElement('section');
            section.className = 'industry-detail';
            const title = document.createElement('h3');
            title.textContent = `${INDUSTRY_DISPLAY[type].name} · ${tiles.filter(t => !t.used).length} remaining`;
            section.appendChild(title);
            const next = this.state.getNextTile(player.id, type);
            // Group identical tile copies, keeping used and remaining counts explicit.
            const levels = [...new Set(tiles.map(t => t.level))];
            for (const level of levels) {
                const copies = tiles.filter(t => t.level === level), tile = copies[0];
                const remaining = copies.filter(t => !t.used).length;
                const eraAllowed = this.state.era === ERA.CANAL ? tile.canalEra : tile.railEra;
                const isNext = next && next.level === level && remaining > 0;
                const card = document.createElement('div');
                card.className = `industry-detail-card${!remaining ? ' exhausted' : ''}${isNext ? ' next-level' : ''}`;
                const art = typeof BoardAssets !== 'undefined' && BoardAssets.tilesReady()
                    ? BoardAssets.tileUrl(type, level, false, player.color) : null;
                const image = document.createElement(art ? 'img' : 'div');
                if (art) { image.src = art; image.alt = `${INDUSTRY_DISPLAY[type].name} level ${level}`; }
                else image.innerHTML = IndustryIcons.renderMarkup(type, 60, 'full');
                card.appendChild(image);
                const details = document.createElement('div');
                const costs = [`£${tile.cost}`];
                if (tile.costCoal) costs.push(`${tile.costCoal} coal`);
                if (tile.costIron) costs.push(`${tile.costIron} iron`);
                const production = type === INDUSTRY_TYPES.BREWERY
                    ? `${this.state.era === ERA.RAIL ? 2 : 1} beer produced`
                    : tile.resourceCubes ? `${tile.resourceCubes} ${type === INDUSTRY_TYPES.COAL_MINE ? 'coal' : 'iron'} produced`
                    : `${tile.beersToSell} beer to sell`;
                const era = tile.canalEra && tile.railEra ? 'Canal & Rail' : tile.canalEra ? 'Canal only' : 'Rail only';
                const status = !remaining ? 'Used / developed' : !eraAllowed ? 'Unavailable this era'
                    : isNext ? 'Next level to build' : 'Develop lower levels first';
                for (const text of [`Level ${level} · ${remaining}/${copies.length} remaining · ${status}`,
                    `Build: ${costs.join(' + ')}`, `Flip: ${tile.vp} VP · +${tile.income} income spaces · ${tile.linkVP} link icons`,
                    production, `${era} · ${tile.canDevelop ? 'Can develop' : 'Cannot develop'}`]) {
                    const line = document.createElement('p'); line.textContent = text; details.appendChild(line);
                }
                card.appendChild(details); section.appendChild(card);
            }
            body.appendChild(section);
        }
    }

    // A wooden cube in projection, matching the ones drawn on board tiles.
    cubeSvg(kind) {
        const tones = {
            coal: ['#4f4f4f', '#2e2e2e', '#1b1b1b'],
            iron: ['#f0983a', '#c06e1c', '#8d4e0e'],
            beer: ['#e8cf6a', '#b99a2c', '#866c16'],
        }[kind] || ['#8a8a8a', '#5f5f5f', '#444'];
        const [top, left, right] = tones;
        // 20x20 box: a squashed top diamond over two side faces.
        return `<svg class="cube-svg" viewBox="0 0 20 20" aria-hidden="true">
            <polygon points="10,2 18,6 10,10 2,6" fill="${top}"/>
            <polygon points="2,6 10,10 10,18 2,14" fill="${left}"/>
            <polygon points="18,6 10,10 10,18 18,14" fill="${right}"/>
        </svg>`;
    }

    updateMarkets() {
        // Coal market
        const coalTrack = document.getElementById('coal-track');
        coalTrack.innerHTML = '';
        const coalPrice = this.state.getCoalPrice();
        document.getElementById('coal-current-price').textContent =
            `Next: £${coalPrice}${this.state.coalMarket === 0 ? ' (supply)' : ''}`;

        for (let i = 0; i < COAL_MARKET_PRICES.length; i++) {
            const filled = i >= (COAL_MARKET_PRICES.length - this.state.coalMarket);
            const space = document.createElement('div');
            space.className = `market-space${filled ? ' filled coal' : ''}`;
            space.title = `£${COAL_MARKET_PRICES[i]}`;
            if (i === COAL_MARKET_PRICES.length - this.state.coalMarket) space.classList.add('next-purchase');
            space.innerHTML = `${filled ? this.cubeSvg('coal') : ''}<span class="market-price-label">£${COAL_MARKET_PRICES[i]}</span>`;
            coalTrack.appendChild(space);
        }

        // Iron market
        const ironTrack = document.getElementById('iron-track');
        ironTrack.innerHTML = '';
        const ironPrice = this.state.getIronPrice();
        document.getElementById('markets-glance').textContent = `Markets · Coal £${this.state.getCoalPrice()} · Iron £${ironPrice}`;
        document.getElementById('iron-current-price').textContent =
            `Next: £${ironPrice}${this.state.ironMarket === 0 ? ' (supply)' : ''}`;

        for (let i = 0; i < IRON_MARKET_PRICES.length; i++) {
            const filled = i >= (IRON_MARKET_PRICES.length - this.state.ironMarket);
            const space = document.createElement('div');
            space.className = `market-space${filled ? ' filled iron' : ''}`;
            space.title = `£${IRON_MARKET_PRICES[i]}`;
            if (i === IRON_MARKET_PRICES.length - this.state.ironMarket) space.classList.add('next-purchase');
            space.innerHTML = `${filled ? this.cubeSvg('iron') : ''}<span class="market-price-label">£${IRON_MARKET_PRICES[i]}</span>`;
            ironTrack.appendChild(space);
        }
    }

    // ========================================================================
    // Phase Bar
    // ========================================================================

    updatePhaseBar() {
        const bar = document.getElementById('action-phase-bar');
        const steps = bar.querySelectorAll('.phase-step');
        const instruction = document.getElementById('phase-instruction');

        if (!this.selectedAction) {
            bar.classList.add('hidden');
            return;
        }

        bar.classList.remove('hidden');

        // Determine which step we're on
        let currentStep = 1; // Choose Action
        let instructionText = 'Select an action';

        if (this.selectedAction && this.actionStep === 0) {
            currentStep = 2; // Select Target
            instructionText = this.getTargetInstruction();
        } else if (this.actionStep > 0) {
            currentStep = 3; // Discard Card
            if (this.selectedAction === ACTIONS.SCOUT) {
                const remaining = 3 - (this.pendingData.scoutCards?.length || 0);
                instructionText = `Select ${remaining} card${remaining !== 1 ? 's' : ''} to discard`;
            } else {
                instructionText = 'Click a card to discard';
            }
        }

        steps.forEach(step => {
            const stepNum = parseInt(step.dataset.step);
            step.classList.remove('active', 'completed');
            if (stepNum < currentStep) {
                step.classList.add('completed');
            } else if (stepNum === currentStep) {
                step.classList.add('active');
            }
        });

        if (this.selectedAction === ACTIONS.BUILD || this.selectedAction === ACTIONS.NETWORK) {
            const labels = ['Card or action', 'Choose on map', 'Review & confirm'];
            steps.forEach((step, i) => { const label = step.querySelector('.phase-step-label'); if (label) label.textContent = labels[i]; });
            instructionText = this.pendingData.review ? 'Review the action, then confirm'
                : this.pendingData.secondRail ? 'Click a second highlighted rail route, or keep one link'
                : this.actionStep > 0 ? 'Choose a card to discard; review before confirming'
                : this.selectedCard !== null ? 'Card selected. Choose a highlighted target on the map'
                : 'Choose a highlighted map target, or start with a card';
        } else {
            steps.forEach((step, i) => { const label = step.querySelector('.phase-step-label'); if (label) label.textContent = ['Choose Action', 'Select Target', 'Discard Card'][i]; });
        }
        instruction.textContent = instructionText;
    }

    getTargetInstruction() {
        switch (this.selectedAction) {
            case ACTIONS.BUILD: return 'Choose a highlighted industry slot on the map';
            case ACTIONS.NETWORK: return 'Select a connection to build';
            case ACTIONS.DEVELOP: return 'Select a tile to develop';
            case ACTIONS.SELL: return 'Select industries to sell';
            case ACTIONS.LOAN: return 'Select a card to discard for £30 loan';
            case ACTIONS.SCOUT: return 'Select 3 cards to discard';
            case ACTIONS.PASS: return 'Select a card to discard';
            default: return '';
        }
    }

    // ========================================================================
    // Game Log
    // ========================================================================

    addLogEntry(playerId, message, type = 'action') {
        const entry = {
            playerId,
            message,
            type,
            timestamp: Date.now(),
        };

        this.gameLog.unshift(entry); // Newest first
        if (this.gameLog.length > 100) this.gameLog.pop();
        this.renderLog();
    }

    renderLog() {
        const container = document.getElementById('game-log');
        if (!container) return;

        container.innerHTML = '';

        for (const entry of this.gameLog) {
            const div = document.createElement('div');
            div.className = 'log-entry';

            if (entry.type === 'system') {
                div.classList.add('log-system');
                div.textContent = entry.message;
            } else if (entry.type === 'era') {
                div.classList.add('log-era');
                div.textContent = entry.message;
            } else {
                const player = entry.playerId !== null ? this.state.players[entry.playerId] : null;
                if (player) {
                    div.innerHTML = `<span class="log-player" style="color:${player.color}">${player.name}</span> ${entry.message}`;
                } else {
                    div.textContent = entry.message;
                }
            }

            container.appendChild(div);
        }
    }

    // ========================================================================
    // Turn Transition
    // ========================================================================

    showTurnTransition(player) {
        const overlay = document.getElementById('turn-transition');
        const nameEl = document.getElementById('turn-transition-name');
        const subtitleEl = document.querySelector('.turn-transition-subtitle');

        nameEl.textContent = player.name;
        nameEl.style.color = player.color;
        if (subtitleEl) subtitleEl.textContent = player.isAI ? 'AI Turn' : 'Your Turn';

        overlay.classList.remove('hidden', 'fade-out');

        // Auto-dismiss after 1.5s
        setTimeout(() => {
            overlay.classList.add('fade-out');
            setTimeout(() => {
                overlay.classList.add('hidden');
                overlay.classList.remove('fade-out');
            }, 500);
        }, 1000);
    }

    // ========================================================================
    // Card Selection
    // ========================================================================

    onCardClicked(index) {
        if (this.state.currentPlayer.isAI) return;
        if (!this.state.currentPlayer.hand[index]) return;
        const direct = this.selectedAction === ACTIONS.BUILD || this.selectedAction === ACTIONS.NETWORK;
        if (direct && this.actionStep > 0 && this.pendingData.move) {
            const target = this.selectedAction === ACTIONS.BUILD
                ? { cityId: this.pendingData.move.location, industryType: this.pendingData.move.industry } : null;
            if (!this.logic.getValidCardsForAction(this.state.currentPlayerId, this.selectedAction, target).includes(index)) {
                this.showToast('This card cannot pay for the selected build', 'warning'); return;
            }
        }
        if (!this.selectedAction || (direct && this.actionStep === 0 && !this.pendingData.secondRail)) {
            if (this.selectedCard === index && this.selectedAction === ACTIONS.BUILD) { this.cancelAction(); return; }
            this.selectedCard = index;
            if (this.selectedAction !== ACTIONS.NETWORK) this.selectedAction = ACTIONS.BUILD;
            this.pendingData = {};
            this.startAction(this.selectedAction);
            this.updateActionButtons(); this.updateHand(); this.updatePhaseBar(); this.updateActionDetails();
            return;
        }
        if (this.selectedCard === index) {
            this.selectedCard = null;
        } else {
            this.selectedCard = index;
        }
        this.updateHand();

        // If we have an action selected and this was a card selection step
        if (this.selectedAction && this.actionStep > 0) {
            this.processActionStep();
        }
        this.updatePhaseBar(); this.updateActionDetails();
    }

    // ========================================================================
    // Action Selection
    // ========================================================================

    onActionSelected(action) {
        if (this.state.currentPlayer.isAI) return;
        if (this.selectedAction === action) {
            this.cancelAction();
            return;
        }

        this.selectedAction = action;
        this.actionStep = 0;
        this.pendingData = {};
        if (action !== ACTIONS.BUILD && action !== ACTIONS.NETWORK) this.selectedCard = null;

        this.updateActionButtons();
        this.updatePhaseBar();
        this.startAction(action);
        this.updateHand(); this.updateActionDetails();
    }

    cancelAction() {
        this.selectedAction = null;
        this.actionStep = 0;
        this.pendingData = {};
        this.selectedCard = null;
        this.renderer.clearHighlights();
        this.updateActionButtons();
        this.updateHand();
        this.updatePhaseBar();
        this.closeModal();
        this.updateActionDetails();
    }

    // ========================================================================
    // Action Execution
    // ========================================================================

    startAction(action) {
        const playerId = this.state.currentPlayerId;

        switch (action) {
            case ACTIONS.BUILD:
                this.startBuild(playerId);
                break;
            case ACTIONS.NETWORK:
                this.startNetwork(playerId);
                break;
            case ACTIONS.DEVELOP:
                this.startDevelop(playerId);
                break;
            case ACTIONS.SELL:
                this.startSell(playerId);
                break;
            case ACTIONS.LOAN:
                this.startLoan(playerId);
                break;
            case ACTIONS.SCOUT:
                this.startScout(playerId);
                break;
            case ACTIONS.PASS:
                this.startPass(playerId);
                break;
        }
    }

    // ========================================================================
    // BUILD
    // ========================================================================

    startBuild(playerId) {
        const targets = this.logic.getValidBuildTargets(playerId).filter(t => this.selectedCard === null ||
            this.logic.getValidCardsForAction(playerId, ACTIONS.BUILD, t).includes(this.selectedCard));
        if (targets.length === 0) {
            if (this.selectedCard !== null) {
                this.pendingData.buildTargets = []; this.renderer.clearHighlights();
                this.updateActionDetails(); return;
            }
            this.showToast('No valid build targets available', 'warning');
            this.cancelAction();
            return;
        }

        // Store targets for board-click selection
        this.pendingData.buildTargets = targets;

        // Highlight valid slots on the board
        this.renderer.highlightSlots(targets);

        // The map stays visible. Only choosing among industries sharing a
        // clicked slot needs a small, local list.
    }

    showBuildModal(playerId, targets) {
        const byCity = {};
        for (const t of targets) {
            if (!byCity[t.cityId]) byCity[t.cityId] = [];
            byCity[t.cityId].push(t);
        }

        let html = '<div class="choice-list">';
        for (const [cityId, cityTargets] of Object.entries(byCity)) {
            const cityName = CITIES[cityId]?.name || BREWERY_FARMS[cityId]?.name || cityId;
            for (const target of cityTargets) {
                const display = INDUSTRY_DISPLAY[target.industryType];
                html += `
                    <div class="choice-item" data-city="${target.cityId}"
                         data-slot="${target.slotIndex}" data-type="${target.industryType}">
                        <div class="choice-item-icon">${display.icon}</div>
                        <div class="choice-item-text">
                            <div class="choice-item-name">${display.name} Lv${target.tileData.level}</div>
                            <div class="choice-item-detail">${cityName} (Slot ${target.slotIndex + 1})</div>
                        </div>
                        <div class="choice-item-cost">£${target.cost.total}
                            ${target.cost.coal > 0 ? ` + ${target.cost.coal} coal` : ''}
                            ${target.cost.iron > 0 ? ` + ${target.cost.iron} iron` : ''}
                        </div>
                    </div>
                `;
            }
        }
        html += '</div>';

        this.showModal('Build Industry', html, () => {});

        document.querySelectorAll('#modal-body .choice-item').forEach(item => {
            item.addEventListener('click', () => {
                this.proceedWithMove({ type: ACTIONS.BUILD, location: item.dataset.city,
                    slot: parseInt(item.dataset.slot), industry: item.dataset.type });
            });
        });
    }

    // ========================================================================
    // NETWORK
    // ========================================================================

    startNetwork(playerId) {
        const targets = this.logic.getValidNetworkTargets(playerId);
        if (targets.length === 0) {
            this.showToast('No valid network targets', 'warning');
            this.cancelAction();
            return;
        }

        this.renderer.highlightConnections(targets.map(t => t.connectionId));
        this.pendingData.networkTargets = targets;
    }

    // In the Rail Era a second link may be added (£15 total, +1 coal, +1 beer
    // from a brewery). Offer the option after the first link is chosen.
    afterNetworkFirstSelection(connectionId) {
        const playerId = this.state.currentPlayerId;

        if (this.state.era === ERA.RAIL) {
            const seconds = this.logic.getValidSecondRailLinks(playerId, connectionId);
            if (seconds.length > 0) {
                this.pendingData.firstLink = connectionId;
                this.pendingData.secondRail = seconds;
                this.renderer.highlightConnections(seconds.map(s => s.connectionId));
                this.closeModal(); this.updatePhaseBar(); this.updateActionDetails();
                return;
            }
        }

        this.proceedWithMove({ type: ACTIONS.NETWORK, links: [connectionId] });
    }

    // ========================================================================
    // DEVELOP
    // ========================================================================

    startDevelop(playerId) {
        const types = this.logic.getDevelopableTypes(playerId);
        if (types.length === 0) {
            this.showToast('Nothing to develop', 'warning');
            this.cancelAction();
            return;
        }

        let html = '<p style="margin-bottom:12px;color:var(--text-secondary);font-size:13px;">Remove 1-2 tiles from your mat to access higher levels. Costs 1 iron per tile.</p>';
        html += '<div class="choice-list">';
        for (const t of types) {
            const display = INDUSTRY_DISPLAY[t.type];
            html += `
                <div class="choice-item" data-type="${t.type}">
                    <div class="choice-item-icon">${display.icon}</div>
                    <div class="choice-item-text">
                        <div class="choice-item-name">${display.name} Lv${t.level}</div>
                        <div class="choice-item-detail">Remove this tile</div>
                    </div>
                </div>
            `;
        }
        html += '</div>';

        this.showModal('Develop (Select 1st tile)', html, () => {});

        document.querySelectorAll('#modal-body .choice-item').forEach(item => {
            item.addEventListener('click', () => {
                const type1 = item.dataset.type;
                this.pendingData.industryType1 = type1;
                this.showDevelopSecondChoice(playerId, type1);
            });
        });
    }

    showDevelopSecondChoice(playerId, firstType) {
        // Only second tiles that are developable once the first is removed
        // (no lightbulb tiles) and affordable with a second iron
        const remainingTypes = this.logic.getSecondDevelopOptions(playerId, firstType);

        if (remainingTypes.length === 0) {
            this.proceedWithMove({ type: ACTIONS.DEVELOP, industries: [firstType] });
            return;
        }

        let html = '<p style="margin-bottom:12px;color:var(--text-secondary);font-size:13px;">Optionally develop a second tile (costs another iron).</p>';
        html += '<div class="choice-list">';
        html += '<div class="choice-item" data-type="none"><div class="choice-item-text"><div class="choice-item-name">Done (develop 1 tile only)</div></div></div>';

        for (const t of remainingTypes) {
            const display = INDUSTRY_DISPLAY[t.type];
            html += `
                <div class="choice-item" data-type="${t.type}">
                    <div class="choice-item-icon">${display.icon}</div>
                    <div class="choice-item-text">
                        <div class="choice-item-name">${display.name} Lv${t.level}</div>
                    </div>
                </div>
            `;
        }
        html += '</div>';

        this.showModal('Develop (Optional 2nd tile)', html, () => {});

        document.querySelectorAll('#modal-body .choice-item').forEach(item => {
            item.addEventListener('click', () => {
                const type2 = item.dataset.type;
                this.proceedWithMove({ type: ACTIONS.DEVELOP,
                    industries: type2 === 'none' ? [firstType] : [firstType, type2] });
            });
        });
    }

    // ========================================================================
    // SELL
    // ========================================================================

    startSell(playerId) {
        const targets = this.logic.getValidSellTargets(playerId);
        if (targets.length === 0) {
            this.showToast('Nothing to sell', 'warning');
            this.cancelAction();
            return;
        }

        let html = '<p style="margin-bottom:12px;color:var(--text-secondary);font-size:13px;">Select industries to sell (you may sell multiple in one action). Next you choose the merchant for each — drinking a merchant\'s beer barrel grants its bonus — and which beer to use.</p>';
        html += '<div class="choice-list">';
        for (const target of targets) {
            const display = INDUSTRY_DISPLAY[target.tile.type];
            const cityName = CITIES[target.cityId]?.name || target.cityId;
            html += `
                <div class="choice-item" data-key="${target.key}" data-selected="false">
                    <div class="choice-item-icon">${display.icon}</div>
                    <div class="choice-item-text">
                        <div class="choice-item-name">${display.name} Lv${target.tile.tileData.level}</div>
                        <div class="choice-item-detail">${cityName} | VP: ${target.tile.tileData.vp} | Income: +${target.tile.tileData.income}
                        ${target.beerNeeded > 0 ? ` | Beer: ${target.beerNeeded}` : ''}${target.merchantBeerAvailable && target.beerNeeded > 0 ? ' | merchant beer available' : ''}</div>
                    </div>
                </div>
            `;
        }
        html += '</div>';

        const footer = '<button class="modal-btn modal-btn-primary" id="confirm-sell">Sell Selected</button>';
        this.showModal('Sell Goods', html, null, footer);

        const selectedKeys = new Set();
        document.querySelectorAll('#modal-body .choice-item').forEach(item => {
            item.addEventListener('click', () => {
                const key = item.dataset.key;
                if (selectedKeys.has(key)) {
                    selectedKeys.delete(key);
                    item.style.borderColor = '';
                } else {
                    selectedKeys.add(key);
                    item.style.borderColor = 'var(--accent-gold)';
                }
            });
        });

        document.getElementById('confirm-sell').addEventListener('click', () => {
            if (selectedKeys.size === 0) {
                this.showToast('Select at least one industry to sell', 'warning');
                return;
            }
            // Tiles in one sale share the available beer — reject a
            // combination that can't all be sold before a card is spent
            const move = { type: ACTIONS.SELL, sales: [...selectedKeys].map(tile => ({ tile })) };
            const check = this.logic.resolveMove(playerId, move, { requireCard: false });
            if (!check.ok) {
                this.showToast(check.message, 'warning');
                return;
            }
            this.proceedWithMove(move);
        });
    }

    // ========================================================================
    // LOAN
    // ========================================================================

    startLoan(playerId) {
        this.actionStep = 1;
        this.updatePhaseBar();
        this.updateHand();
    }

    // ========================================================================
    // SCOUT
    // ========================================================================

    startScout(playerId) {
        this.pendingData.scoutCards = [];
        this.actionStep = 1;
        this.updatePhaseBar();
        this.updateHand();
    }

    // ========================================================================
    // PASS
    // ========================================================================

    startPass(playerId) {
        this.actionStep = 1;
        this.updatePhaseBar();
        this.updateHand();
    }

    // ========================================================================
    // Process multi-step action
    // ========================================================================

    processActionStep() {
        if (this.selectedCard === null) return;

        const playerId = this.state.currentPlayerId;
        const cardIndex = this.selectedCard;
        if (this.selectedAction === ACTIONS.BUILD || this.selectedAction === ACTIONS.NETWORK) {
            if (!this.pendingData.move) return;
            const move = { ...this.pendingData.move, card: cardIndex };
            const check = this.logic.resolveMove(playerId, move);
            if (!check.ok) { this.showToast(check.message, 'warning'); return; }
            this.proceedWithMove(move);
            return;
        }

        if (this.selectedAction === ACTIONS.SCOUT) {
            if (!this.pendingData.scoutCards) this.pendingData.scoutCards = [];
            // Prevent selecting the same card index twice
            if (this.pendingData.scoutCards.includes(cardIndex)) {
                this.selectedCard = null;
                this.updateHand();
                return;
            }
            this.pendingData.scoutCards.push(cardIndex);
            if (this.pendingData.scoutCards.length < 3) {
                this.selectedCard = null;
                this.updatePhaseBar();
                this.updateHand();
                return;
            }
            this.playMove(playerId, { type: ACTIONS.SCOUT, cards: this.pendingData.scoutCards });
            return;
        }

        // The move built (and its choices made) in the target step, plus the
        // card; Loan and Pass need nothing but the card
        const move = this.pendingData.move
            ? { ...this.pendingData.move, card: cardIndex }
            : { type: this.selectedAction, card: cardIndex };
        this.playMove(playerId, move);
    }

    // Every decision — human or AI, action or shortfall — is played through
    // the engine, which also advances the game (turns, rounds, income, era
    // scoring, game end) and reports what happened as events.
    updateUndoControls() {
        const enabled = this.undoHistory.length > 0 && !this.state.currentPlayer.isAI
            && this.logic.getCurrentDecision().type === 'action';
        for (const id of ['undo-action', 'reset-turn']) document.getElementById(id).disabled = !enabled;
    }

    restoreTurn(reset) {
        if (!this.undoHistory.length || this.state.currentPlayer.isAI
            || this.logic.getCurrentDecision().type !== 'action') return;
        const snapshot = reset ? this.undoHistory[0] : this.undoHistory[this.undoHistory.length - 1];
        if (reset) this.undoHistory = []; else this.undoHistory.pop();
        // Preserve references held by main.js, the renderer and the logic.
        for (const key of Object.keys(this.state)) delete this.state[key];
        Object.assign(this.state, snapshot.state.clone());
        this.gameLog = snapshot.log.slice();
        this.cancelAction();
        this.closeModal();
        this.renderLog();
        this.refresh();
    }

    scoringBreakdown() {
        const board = this.scoringBoard;
        if (!board) return '';
        const escape = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
        let html = '';
        for (const player of board.players) {
            html += `<details><summary>${escape(player.name)} — scoring breakdown</summary><ul>`;
            // Isolate each component and ask the existing scoring implementation
            // for its contribution. No scoring rules are reimplemented in UI.
            for (const [key, link] of Object.entries(board.boardLinks)) {
                if (link.playerId !== player.id) continue;
                const copy = board.clone(); copy.boardLinks = { [key]: link };
                const score = copy.calculateEraScore().find(s => s.playerId === player.id);
                html += `<li>${escape(key)}: ${score.linkVP} link VP</li>`;
            }
            for (const [field, tiles] of [['boardIndustries', board.boardIndustries], ['breweryFarmTiles', board.breweryFarmTiles]]) {
                for (const [key, tile] of Object.entries(tiles)) {
                    if (!tile || tile.playerId !== player.id) continue;
                    const copy = board.clone(); copy.boardIndustries = {}; copy.breweryFarmTiles = {};
                    copy[field] = { [key]: tile };
                    const score = copy.calculateEraScore().find(s => s.playerId === player.id);
                    html += `<li>${escape(key)} (${escape(tile.type || 'industry')}, ${tile.flipped ? 'flipped' : 'unflipped'}): ${score.industryVP} industry VP</li>`;
                }
            }
            html += '</ul></details>';
        }
        return html;
    }

    playMove(playerId, move) {
        const before = this.state.clone();
        const log = this.gameLog.slice();
        // Replay only on an independent copy to capture the board immediately
        // before scoring, including the final action and income shortfalls.
        let scoringBoard = null;
        if (before.drawDeck.length === 0) {
        const probe = before.clone();
        const calculate = probe.calculateEraScore;
        probe.calculateEraScore = function () {
            scoringBoard = this.clone();
            return calculate.call(this);
        };
        new GameLogic(probe).play(playerId, move);
        }
        const result = this.logic.play(playerId, move);
        if (result.success) {
            this.scoringBoard = scoringBoard;
            const sameTurn = this.state.era === before.era && this.state.round === before.round
                && this.state.currentPlayerId === playerId && this.logic.getCurrentDecision().type === 'action';
            if (!before.players[playerId].isAI && sameTurn) this.undoHistory.push({ state: before, log });
            else this.undoHistory = [];
        }
        if (result.success) {
            const msg = result.message;
            this.addLogEntry(playerId, msg.charAt(0).toLowerCase() + msg.slice(1));
        }
        this.completeAction(result);
    }

    // After the target step: ask the player every decision the rules leave to
    // them (coal between equally close mines, which iron works, which beer,
    // which merchant, the free develop), one at a time, then go to the card
    // step. Options the engine reports are always legal and completable.
    proceedWithMove(move) {
        const playerId = this.state.currentPlayerId;
        if ((move.type === ACTIONS.BUILD || move.type === ACTIONS.NETWORK) && this.selectedCard !== null) move = { ...move, card: this.selectedCard };
        const next = this.logic.getNextChoice(playerId, move);
        if (next) {
            this.showChoiceModal(next, value => this.proceedWithMove(withChoice(next.move, next.slot, value)));
            return;
        }
        const check = this.logic.resolveMove(playerId, move, { requireCard: false });
        if (!check.ok) {
            this.showToast(check.message, 'warning');
            this.cancelAction();
            return;
        }
        this.pendingData = { move: check.resolved };
        if ((move.type === ACTIONS.BUILD || move.type === ACTIONS.NETWORK) && this.selectedCard !== null) this.pendingData.review = true;
        this.closeModal();
        this.renderer.clearHighlights();
        this.actionStep = 1;
        this.updatePhaseBar();
        this.updateHand();
        this.updateActionDetails();
    }

    updateActionDetails() {
        const dock = document.getElementById('action-details');
        dock.innerHTML = '';
        const direct = this.selectedAction === ACTIONS.BUILD || this.selectedAction === ACTIONS.NETWORK;
        dock.classList.toggle('hidden', !direct);
        if (!direct) return;
        const name = id => CITIES[id]?.name || MERCHANTS[id]?.name || BREWERY_FARMS[id]?.name || id;
        const button = (label, onClick) => {
            const btn = document.createElement('button'); btn.type = 'button'; btn.textContent = label;
            btn.addEventListener('click', onClick); dock.appendChild(btn);
        };
        const info = document.createElement('span');
        const move = this.pendingData.move;
        if (this.pendingData.secondRail) {
            const route = CONNECTIONS.find(c => c.id === this.pendingData.firstLink);
            info.textContent = `${route.cities.map(name).join(' ↔ ')} selected. Choose a second highlighted route, or build one.`;
            button('Keep one link', () => this.proceedWithMove({ type: ACTIONS.NETWORK, links: [this.pendingData.firstLink] }));
        } else if (move) {
            const label = move.type === ACTIONS.BUILD ? `${INDUSTRY_DISPLAY[move.industry].name} in ${name(move.location)}`
                : move.links.map(id => CONNECTIONS.find(c => c.id === id).cities.map(name).join(' ↔ ')).join(' + ');
            const resolved = this.logic.resolveMove(this.state.currentPlayerId, move, { requireCard: false });
            info.textContent = `${label}${resolved.ok ? ` · Total £${resolved.plan.cost}` : ''}${this.selectedCard === null ? ' · Choose a discard card' : ` · Discard: ${this.state.currentPlayer.hand[this.selectedCard]?.name || 'selected card'}`}`;
            if (this.pendingData.review && this.selectedCard !== null) button(`Confirm ${move.type === ACTIONS.BUILD ? 'build' : 'link'}`, () => this.confirmPendingMove());
            button('Change target', () => {
                this.pendingData = {}; this.actionStep = 0; this.closeModal();
                this.startAction(this.selectedAction); this.updateHand(); this.updatePhaseBar(); this.updateActionDetails();
            });
        } else {
            info.textContent = this.selectedAction === ACTIONS.BUILD
                ? this.pendingData.buildTargets?.length === 0 ? 'No legal builds for this card. Choose another card or another action.'
                    : `${this.selectedCard === null ? 'Choose a card or' : 'Card selected —'} click a highlighted slot to build.`
                : 'Click a highlighted route on the board. You can choose the discard card first.';
        }
        dock.prepend ? dock.prepend(info) : dock.appendChild(info);
        button('Cancel', () => this.cancelAction());
    }

    confirmPendingMove() {
        if (!this.pendingData.review || this.selectedCard === null || !this.pendingData.move) return;
        const move = { ...this.pendingData.move, card: this.selectedCard };
        const check = this.logic.resolveMove(this.state.currentPlayerId, move);
        if (!check.ok) { this.showToast(check.message, 'warning'); return; }
        this.playMove(this.state.currentPlayerId, move);
    }

    // A modal listing the options of one decision; onPick(value)
    showChoiceModal(choice, onPick) {
        const titles = {
            coal: 'Choose Coal', iron: 'Choose Iron', beer: 'Choose Beer',
            merchant: 'Choose Merchant', freeDevelop: 'Merchant Bonus: Free Develop',
            shortfall: 'Income Shortfall',
        };
        let html = `<p style="margin-bottom:12px;color:var(--text-secondary);font-size:13px;">${choice.prompt || ''}</p>`;
        html += '<div class="choice-list">';
        choice.options.forEach((o, i) => {
            html += `
                <div class="choice-item" data-index="${i}">
                    <div class="choice-item-text"><div class="choice-item-name">${o.label}</div></div>
                </div>`;
        });
        html += '</div>';
        this.showModal(titles[choice.kind] || 'Choose', html, () => {});
        document.querySelectorAll('#modal-body .choice-item').forEach(item => {
            item.addEventListener('click', () => onPick(choice.options[parseInt(item.dataset.index)].value));
        });
    }

    // A human player who can't pay their income chooses which tile to sell
    // (one shortfall move at a time, until covered)
    promptShortfall(playerId) {
        const player = this.state.players[playerId];
        const options = this.logic.getLegalMoves(playerId).map(m => {
            const farm = BREWERY_FARMS[m.tile];
            const tile = farm ? this.state.breweryFarmTiles[m.tile] : this.state.boardIndustries[m.tile];
            const where = farm ? farm.name : CITIES[m.tile.split('_')[0]].name;
            return { value: m.tile, label: `Sell ${INDUSTRY_DISPLAY[tile.type].name} Lv${tile.tileData.level} in ${where} ` +
                `for £${Math.floor(tile.tileData.cost / 2)}${tile.flipped ? '' : ' (unflipped)'}` };
        });
        this.refresh();
        this.showChoiceModal({
            kind: 'shortfall',
            prompt: `${player.name} is £${-player.money} short of paying their income. Choose an industry tile to sell for half its cost (repeat until covered).`,
            options,
        }, (tile) => {
            this.closeModal();
            this.playMove(playerId, { type: 'shortfall', tile });
        });
    }

    completeAction(result) {
        if (result.success) {
            this.showToast(result.message, 'success');
        } else {
            this.showToast(result.message, 'error');
            const decision = this.logic.getCurrentDecision();
            if (decision.type === 'action' && this.state.players[decision.playerId].isAI) {
                // A failed AI action must never stall the game
                this.recoverAITurn(result.message);
                return;
            }
            this.cancelAction();
            return;
        }

        // Reset action state
        this.selectedAction = null;
        this.actionStep = 0;
        this.pendingData = {};
        this.selectedCard = null;
        this.renderer.clearHighlights();

        // Present what the engine did: end-of-round notices, shortfalls,
        // era scoring, game end
        for (const ev of result.events || []) {
            if (ev.type === 'roundEnd') {
                for (const n of ev.notices) this.addLogEntry(n.playerId, n.message);
            } else if (ev.type === 'shortfall') {
                ev.playerIds.forEach((id, i) => this.addLogEntry(id, `must cover an income shortfall of £${ev.owed[i]}`));
            } else if (ev.type === 'eraEnd') {
                this.addLogEntry(null, 'Canal Era Scoring', 'era');
                this.addLogEntry(null, 'Rail Era', 'era');
                this.refresh();
                // The game continues from the scoring screen's Continue button
                this.showScoring('Canal Era Complete', ev.scores);
                return;
            } else if (ev.type === 'gameEnd') {
                this.addLogEntry(null, 'Final Scoring', 'era');
                this.refresh();
                this.showScoring('Rail Era Complete', ev.scores, () => this.showGameOver(ev.ranking));
                return;
            }
        }
        this.continueGame();
    }

    // Ask the engine what the game is waiting for and get it: a shortfall
    // decision (AI seats use the engine's automatic choice; humans are
    // prompted), an AI turn, or a human turn.
    continueGame() {
        const decision = this.logic.getCurrentDecision();
        if (decision.type === 'gameOver') return;
        if (decision.type === 'shortfall') {
            if (this.state.players[decision.playerId].isAI) {
                this.playMove(decision.playerId, this.logic.defaultShortfallMove(decision.playerId));
            } else {
                this.promptShortfall(decision.playerId);
            }
            return;
        }
        const changed = decision.playerId !== this.turnPlayerId;
        if (changed) {
            this.addLogEntry(null, `${this.state.players[decision.playerId].name}'s turn`, 'system');
            this.showTurnTransition(this.state.players[decision.playerId]);
            this.turnPlayerId = decision.playerId;
        }
        this.refresh();
        this.runAITurnLoop(changed ? 1600 : 800);
    }

    // ========================================================================
    // AI Turn Loop
    // ========================================================================

    runAITurnLoop(delay = 1600) {
        const decision = this.logic.getCurrentDecision();
        if (decision.type !== 'action' || !this.state.players[decision.playerId].isAI) {
            this.setAIOverlay(false);
            return;
        }
        this.setAIOverlay(true);
        setTimeout(() => this.executeOneAITurn(), delay);
    }

    executeOneAITurn() {
        const turn = this.logic.getCurrentDecision();
        if (turn.type !== 'action') return; // safety guard against stale timers
        const playerId = turn.playerId;
        const player = this.state.players[playerId];
        if (!player.isAI) return;

        let decision;
        try {
            decision = AIPlayer.chooseAction(this.state, this.logic, playerId, player.aiDifficulty, this.aiRng);
        } catch (err) {
            this.recoverAITurn(err && err.message ? err.message : String(err));
            return;
        }

        this.selectedAction = decision.action;
        this.playMove(playerId, this.logic.moveFromDecision(decision));
    }

    // Safety net for the interactive game: if an AI action fails (or the AI
    // throws), log it and Pass with the AI's first card so play continues.
    // Headless tests do NOT use this — they fail loudly on any AI error.
    recoverAITurn(reason) {
        const playerId = this.state.currentPlayerId;
        console.error(`AI action failed for player ${playerId}: ${reason}`);
        this.addLogEntry(playerId, `AI action failed (${reason}) — passing instead`);
        this.selectedAction = null;
        this.actionStep = 0;
        this.pendingData = {};
        this.selectedCard = null;
        this.closeModal();

        this.playMove(playerId, { type: ACTIONS.PASS, card: 0 });
    }

    setAIOverlay(active) {
        document.getElementById('game-screen').classList.toggle('ai-turn-active', active);
    }

    // ========================================================================
    // Board Click Handler
    // ========================================================================

    onBoardClick(e) {
        if (this.state.currentPlayer.isAI) return;
        const target = e.target.closest('.industry-slot, .connection-line, .brewery-farm, .merchant-group');
        if (!target) return;
        if (!this.selectedAction) {
            const slot = target.closest('.industry-slot'), farm = target.closest('.brewery-farm');
            if (slot || farm) this.onActionSelected(ACTIONS.BUILD);
            else if (target.closest('.connection-line')) this.onActionSelected(ACTIONS.NETWORK);
        }

        if (this.selectedAction === ACTIONS.BUILD && this.actionStep === 0) {
            // Farm brewery clicks
            const farm = target.closest('.brewery-farm');
            if (farm && farm.classList.contains('highlight-slot')) {
                const farmId = farm.dataset.farm;
                const farmTargets = (this.pendingData.buildTargets || []).filter(t => t.cityId === farmId);
                if (farmTargets.length >= 1) {
                    this.proceedWithMove({ type: ACTIONS.BUILD, location: farmId, slot: 0, industry: INDUSTRY_TYPES.BREWERY });
                    return;
                }
            }

            const slot = target.closest('.industry-slot');
            if (slot && slot.classList.contains('highlight-slot')) {
                const cityId = slot.dataset.city;
                const slotIndex = parseInt(slot.dataset.slot);
                const targets = (this.pendingData.buildTargets || []).filter(
                    t => t.cityId === cityId && t.slotIndex === slotIndex
                );
                if (targets.length === 1) {
                    // Single option for this slot — select it directly
                    this.proceedWithMove({ type: ACTIONS.BUILD, location: cityId, slot: slotIndex,
                        industry: targets[0].industryType });
                } else if (targets.length > 1) {
                    // Multiple types for this slot — show filtered modal
                    this.closeModal();
                    this.showBuildModal(this.state.currentPlayerId, targets);
                }
            }
        }

        if (this.selectedAction === ACTIONS.NETWORK) {
            const line = target.closest('.connection-line');
            if (line && line.classList.contains('highlight')) {
                if (this.pendingData.secondRail) {
                    if (this.pendingData.secondRail.some(t => t.connectionId === line.dataset.connection))
                        this.proceedWithMove({ type: ACTIONS.NETWORK, links: [this.pendingData.firstLink, line.dataset.connection] });
                } else if (this.actionStep === 0) this.afterNetworkFirstSelection(line.dataset.connection);
            }
        }
    }

    // ========================================================================
    // Modal
    // ========================================================================

    showModal(title, bodyHtml, onClose, footerHtml = '') {
        document.getElementById('modal-title').textContent = title;
        document.getElementById('modal-body').innerHTML = bodyHtml;
        document.getElementById('modal-footer').innerHTML = footerHtml;
        document.getElementById('modal-overlay').classList.remove('hidden');
    }

    closeModal() {
        document.getElementById('modal-overlay').classList.add('hidden');
    }

    // ========================================================================
    // Toast
    // ========================================================================

    showToast(message, type = 'info') {
        const container = document.getElementById('toast-container');
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;
        container.appendChild(toast);

        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateX(100px)';
            toast.style.transition = 'all 0.3s';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    // ========================================================================
    // Scoring Display
    // ========================================================================

    showScoring(title, scores, onContinue = null) {
        const overlay = document.getElementById('scoring-overlay');
        document.getElementById('scoring-title').textContent = title;

        let html = '<table class="scoring-table"><thead><tr><th>Player</th><th>Link VP</th><th>Industry VP</th><th>Era VP</th><th>Cumulative VP</th></tr></thead><tbody>';
        for (const s of scores) {
            const player = this.state.players[s.playerId];
            html += `<tr>
                <td style="color:${player.color}">${player.name}</td>
                <td>${s.linkVP}</td>
                <td>${s.industryVP}</td>
                <td>${s.linkVP + s.industryVP}</td><td class="total-row">${s.totalVP}</td>
            </tr>`;
        }
        html += '</tbody></table>';

        document.getElementById('scoring-details').innerHTML = html + this.scoringBreakdown();
        overlay.classList.remove('hidden');

        const continueFromScoring = () => {
            overlay.classList.add('hidden');
            if (onContinue) onContinue(); else this.continueGame(); // only safe to resume AFTER the modal is dismissed
        };
        document.getElementById('scoring-continue-btn').onclick = continueFromScoring;

        // In an all-AI (spectator) game there's no human to click Continue —
        // auto-dismiss after a brief pause so the game keeps progressing.
        if (this.state.players.every(p => p.isAI)) {
            setTimeout(continueFromScoring, 2500);
        }
    }

    // ranking: GameState.getFinalRanking() — VP, then income level, then
    // money (rulebook p.7); fully tied players share a rank
    showGameOver(ranking) {
        const overlay = document.getElementById('gameover-overlay');

        let html = '<table class="scoring-table"><thead><tr><th>Rank</th><th>Player</th><th>VP</th><th>Income</th><th>Money</th></tr></thead><tbody>';
        ranking.forEach(r => {
            const p = this.state.players[r.playerId];
            html += `<tr${r.rank === 1 ? ' class="total-row"' : ''}>
                <td>${r.rank}</td>
                <td style="color:${p.color}">${p.name}</td>
                <td>${r.vp}</td>
                <td>${r.incomeLevel}</td>
                <td>£${r.money}</td>
            </tr>`;
        });
        html += '</tbody></table>';

        document.getElementById('final-scores').innerHTML = html;
        overlay.classList.remove('hidden');

        document.getElementById('new-game-btn').onclick = () => {
            overlay.classList.add('hidden');
            document.getElementById('game-screen').classList.remove('active');
            document.getElementById('setup-screen').classList.add('active');
        };
    }
}
