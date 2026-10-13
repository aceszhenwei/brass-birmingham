// ============================================================================
// Brass: Birmingham - Board image assets (optional, local)
// ============================================================================
// The game ships with original, procedurally drawn art. If you want it to use
// a scan or photograph of a board instead, supply one locally — nothing here
// is committed to the repository:
//
//   1. Drop a file at  assets/board.jpg  (or .png / .jpeg / .webp), or
//   2. Point it anywhere:
//        localStorage.brassBoardAsset = 'https://example.com/board.jpg'
//
// Then open the page with ?calibrate=1 to drag each town onto its printed
// space. Positions save automatically and persist across reloads.
//
// Supplying the image is your call and your responsibility — board artwork is
// usually the publisher's copyright, so only use art you have the right to use.
// ============================================================================

const BoardAssets = (() => {
    const STORAGE_URL = 'brassBoardAsset';
    const STORAGE_LAYOUT = 'brassBoardLayout';

    const CANDIDATES = [
        'assets/board.jpg',
        'assets/board.jpeg',
        'assets/board.png',
        'assets/board.webp',
    ];

    // Where each location sits on a printed board, normalised to 0..1 of the
    // map's width and height. Measured off a photograph of the retail board
    // (perspective corrected), so it lands close but not exact — ?calibrate=1
    // is there to finish the job for whatever image you supply.
    const OFFICIAL_LAYOUT = {
        // Cities (warrington is a merchant, but is keyed with the cities)
        warrington:    [0.2794, 0.1123],
        leek:          [0.5532, 0.0732],
        belper:        [0.7515, 0.0873],
        stokeOnTrent:  [0.4115, 0.1450],
        uttoxeter:     [0.5651, 0.2308],
        stone:         [0.3056, 0.2515],
        derby:         [0.7610, 0.2592],
        stafford:      [0.4003, 0.3455],
        burtonOnTrent: [0.6826, 0.3729],
        cannock:       [0.4757, 0.4474],
        tamworth:      [0.6991, 0.4994],
        wolverhampton: [0.3697, 0.5399],
        walsall:       [0.5313, 0.5633],
        coalbrookdale: [0.2318, 0.5841],
        nuneaton:      [0.7894, 0.5994],
        dudley:        [0.4170, 0.6627],
        birmingham:    [0.6299, 0.7015],
        coventry:      [0.8132, 0.7324],
        kidderminster: [0.3476, 0.7666],
        redditch:      [0.5844, 0.8186],
        worcester:     [0.3592, 0.8965],
        // Merchants
        shrewsbury:    [0.0892, 0.5721],
        nottingham:    [0.9044, 0.1879],
        oxford:        [0.8295, 0.8527],
        gloucester:    [0.6030, 0.9259],
        // Brewery farms
        northern:      [0.2989, 0.4341],
        southern:      [0.2597, 0.8400],
    };

    // Tile centres/tangents measured on the printed routes, not straight midpoints.
    const LINK_PLACEMENTS = {
        'belper-derby': [0.783, 0.170, 75],
        'belper-leek': [0.645, 0.081, 8],
        'birmingham-coventry': [0.744, 0.722, 19],
        'birmingham-dudley': [0.530, 0.682, 13],
        'birmingham-nuneaton': [0.741, 0.670, -36],
        'birmingham-oxford': [0.721, 0.780, 65],
        'birmingham-redditch': [0.610, 0.774, -80],
        'birmingham-tamworth': [0.646, 0.614, -84],
        'birmingham-walsall': [0.551, 0.625, 56],
        'birmingham-worcester': [0.478, 0.793, -58],
        'burtonOnTrent-cannock': [0.587, 0.420, -21],
        'burtonOnTrent-derby': [0.747, 0.326, -37],
        'burtonOnTrent-stone': [0.494, 0.289, 9],
        'burtonOnTrent-tamworth': [0.712, 0.438, 80],
        'burtonOnTrent-walsall': [0.585, 0.476, -63],
        'cannock-stafford': [0.473, 0.395, 70],
        'cannock-northern': [0.385, 0.436, 2],
        'cannock-walsall': [0.539, 0.507, 80],
        'cannock-wolverhampton': [0.414, 0.478, -42],
        'coalbrookdale-kidderminster': [0.256, 0.716, 51],
        'coalbrookdale-shrewsbury': [0.161, 0.541, 0],
        'coalbrookdale-wolverhampton': [0.305, 0.539, 0],
        'coventry-nuneaton': [0.849, 0.655, 76],
        'derby-nottingham': [0.829, 0.200, -19],
        'derby-uttoxeter': [0.668, 0.250, 9],
        'dudley-kidderminster': [0.355, 0.715, -58],
        'dudley-wolverhampton': [0.369, 0.619, 64],
        'gloucester-redditch': [0.501, 0.861, -80],
        'gloucester-worcester': [0.437, 0.928, 10],
        'kidderminster-worcester': [0.325, 0.851, 60],
        'leek-stokeOnTrent': [0.468, 0.099, -31],
        'nuneaton-tamworth': [0.763, 0.554, 41],
        'redditch-oxford': [0.675, 0.831, 13],
        'stafford-stone': [0.333, 0.327, 35],
        'stokeOnTrent-stone': [0.354, 0.207, -48],
        'stokeOnTrent-warrington': [0.352, 0.101, 26],
        'stone-uttoxeter': [0.433, 0.239, -3],
        'tamworth-walsall': [0.615, 0.558, -20],
        'walsall-wolverhampton': [0.444, 0.542, 13],
    };

    function linkPlacement(connId, layout) {
        const p = LINK_PLACEMENTS[connId], conn = CONNECTIONS.find(c => c.id === connId);
        if (!p || !conn) return null;
        const delta = conn.cities.map(id => {
            const original = OFFICIAL_LAYOUT[id], actual = layout && layout[id] || original;
            return [actual[0] - original[0], actual[1] - original[1]];
        });
        return { x: p[0] + (delta[0][0] + delta[1][0]) / 2,
            y: p[1] + (delta[0][1] + delta[1][1]) / 2, angle: p[2] };
    }

    // Our industry ids -> the filename stem used under assets/tiles/.
    const TILE_STEM = {
        cottonMill: 'cotton',
        coalMine: 'coal',
        ironWorks: 'iron',
        manufacturer: 'goods',
        pottery: 'pottery',
        brewery: 'brewery',
    };

    // Set once a probe confirms assets/tiles/ is populated.
    let tilesAvailable = false;

    function tilesReady() { return tilesAvailable; }

    function tileUrl(industryType, level, flipped, color = null) {
        const stem = TILE_STEM[industryType];
        if (!stem) return null;
        return playerArt(`assets/tiles/${stem}-${level}${flipped ? '-flipped' : ''}.jpg`, color, 'industry');
    }

    function linkUrl(type, color = null) {
        return playerArt(`assets/tiles/${type === 'canal' ? 'canal' : 'rail'}.jpg`, color, 'link');
    }

    // Card faces live under assets/cards/, keyed by our own ids: a location
    // card by its city id, an industry card by its industry type.
    let cardsAvailable = false;
    let matAvailable = false;

    function cardsReady() { return cardsAvailable; }
    function matReady() { return matAvailable; }
    function matUrl() { return 'assets/player-mat.jpg'; }

    function cardUrl(card) {
        if (!cardsAvailable || !card) return null;
        switch (card.type) {
            case CARD_TYPES.LOCATION:      return `assets/cards/${card.location}.jpg`;
            // Dual cards have no printed equivalent; use the first industry.
            case CARD_TYPES.INDUSTRY:      return `assets/cards/${card.industryTypes[0]}.jpg`;
            case CARD_TYPES.WILD_LOCATION: return 'assets/cards/wild-location.jpg';
            case CARD_TYPES.WILD_INDUSTRY: return 'assets/cards/wild-industry.jpg';
            default: return null;
        }
    }

    function cardBackUrl() { return 'assets/cards/back.jpg'; }

    async function probeCards() {
        cardsAvailable = !!(await tryLoad('assets/cards/birmingham.jpg'));
        matAvailable = !!(await tryLoad('assets/player-mat.jpg'));
        return cardsAvailable;
    }

    const tileImages = new Map(), coloredImages = new Map();

    // Change the coloured ground, preserving neutral details and buildings.
    function recolorPixels(data, color, kind) {
        const target = color.match(/^#([a-f0-9]{6})$/i);
        if (!target) return data;
        const rgb = [0, 2, 4].map(i => parseInt(target[1].slice(i, i + 2), 16) / 255);
        const hi = Math.max(...rgb), lo = Math.min(...rgb), d = hi - lo;
        const saturation = hi ? d / hi : 0;
        const hue = !d ? 0 : hi === rgb[0] ? ((rgb[1] - rgb[2]) / d + 6) % 6
            : hi === rgb[1] ? (rgb[2] - rgb[0]) / d + 2 : (rgb[0] - rgb[1]) / d + 4;
        for (let i = 0; i < data.length; i += 4) {
            const r = data[i] / 255, g = data[i + 1] / 255, b = data[i + 2] / 255;
            const max = Math.max(r, g, b), min = Math.min(r, g, b), diff = max - min;
            if (!diff || max < 0.15 || diff / max < 0.16) continue;
            const h = (max === r ? ((g - b) / diff + 6) % 6
                : max === g ? (b - r) / diff + 2 : (r - g) / diff + 4) * 60;
            if (kind === 'industry' ? h < 255 || h > 315 : h < 38 || h > 62 || max < 0.45) continue;
            const v = saturation < 0.2 ? 0.65 + max * 0.35 : max;
            const c = v * saturation, x = c * (1 - Math.abs(hue % 2 - 1)), m = v - c;
            const tones = hue < 1 ? [c,x,0] : hue < 2 ? [x,c,0] : hue < 3 ? [0,c,x]
                : hue < 4 ? [0,x,c] : hue < 5 ? [x,0,c] : [c,0,x];
            tones.forEach((t, n) => { data[i + n] = Math.round((t + m) * 255); });
        }
        return data;
    }

    function playerArt(url, color, kind) {
        if (!color || !tileImages.has(url)) return url;
        const key = `${url}:${color}`;
        if (coloredImages.has(key)) return coloredImages.get(key);
        try {
            const image = tileImages.get(url), canvas = document.createElement('canvas');
            canvas.width = image.naturalWidth; canvas.height = image.naturalHeight;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(image, 0, 0);
            const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height);
            recolorPixels(pixels.data, color, kind);
            ctx.putImageData(pixels, 0, 0);
            const result = canvas.toDataURL('image/png');
            coloredImages.set(key, result);
            return result;
        } catch (_) {
            coloredImages.set(key, url); // Canvas unavailable: retain owner borders.
            return url;
        }
    }

    async function probeTiles() {
        // One representative tile is enough to decide the set is present.
        tilesAvailable = !!(await tryLoad('assets/tiles/coal-1.jpg'));
        if (tilesAvailable) {
            const urls = ['assets/tiles/canal.jpg', 'assets/tiles/rail.jpg'];
            for (const [type, levels] of Object.entries(INDUSTRY_DATA)) {
                for (const tile of levels) for (const flipped of [false, true]) urls.push(tileUrl(type, tile.level, flipped));
            }
            await Promise.all(urls.map(url => new Promise(resolve => {
                const image = new Image();
                image.onload = () => { tileImages.set(url, image); resolve(); };
                image.onerror = () => resolve();
                image.src = url;
            })));
        }
        return tilesAvailable;
    }


    // How the printed board arranges each town's industry spaces, read off the
    // artwork. Rows run top to bottom; the LAST row sits on the location's
    // anchor (the anchor is derived from the name banner directly beneath it)
    // and each row above is one row-pitch higher. Counts match CITIES exactly.
    const SLOT_ROWS = {
        belper:        [3],
        derby:         [1, 2],
        leek:          [2],
        stokeOnTrent:  [1, 2],
        uttoxeter:     [2],
        stone:         [2],
        stafford:      [2],
        burtonOnTrent: [2],
        cannock:       [2],
        tamworth:      [2],
        walsall:       [2],
        wolverhampton: [2],
        coalbrookdale: [1, 2],
        dudley:        [2],
        kidderminster: [2],
        worcester:     [2],
        birmingham:    [2, 2],
        coventry:      [1, 2],
        nuneaton:      [2],
        redditch:      [2],
        // Merchants and brewery farms
        warrington:    [2],
        nottingham:    [2],
        shrewsbury:    [1],
        oxford:        [2],
        gloucester:    [2],
        northern:      [1],
        southern:      [1],
    };

    // Measured off the board: spaces are 38.8 x 36.3 board units, laid on a
    // 41.6 unit horizontal pitch and a 39.6 unit vertical one.
    const SLOT_PITCH_X = 41.6 / 900;
    const SLOT_PITCH_Y = 39.6 / 850;

    // Centres of a location's printed spaces, in reading order (top row first,
    // left to right), normalised to the board.
    function slotPositions(locationId, layout) {
        const a = (layout || OFFICIAL_LAYOUT)[locationId];
        const rows = SLOT_ROWS[locationId];
        if (!a || !rows) return null;
        const out = [];
        rows.forEach((n, r) => {
            const y = a[1] - (rows.length - 1 - r) * SLOT_PITCH_Y;
            for (let i = 0; i < n; i++) {
                out.push([a[0] + (i - (n - 1) / 2) * SLOT_PITCH_X, y]);
            }
        });
        return out;
    }

    function savedUrl() {
        try { return localStorage.getItem(STORAGE_URL) || null; } catch (e) { return null; }
    }

    function savedLayout() {
        try {
            const raw = localStorage.getItem(STORAGE_LAYOUT);
            return raw ? JSON.parse(raw) : null;
        } catch (e) {
            return null;
        }
    }

    function saveLayout(layout) {
        try { localStorage.setItem(STORAGE_LAYOUT, JSON.stringify(layout)); } catch (e) { /* private mode */ }
    }

    function clearLayout() {
        try { localStorage.removeItem(STORAGE_LAYOUT); } catch (e) { /* ignore */ }
    }

    function tryLoad(url) {
        return new Promise((resolve) => {
            const img = new Image();
            img.onload = () => resolve(url);
            img.onerror = () => resolve(null);
            img.src = url;
        });
    }

    // Resolves to a usable image URL, or null to keep the drawn-from-scratch board.
    async function resolve() {
        const explicit = savedUrl();
        if (explicit) {
            const ok = await tryLoad(explicit);
            if (ok) return ok;
            console.warn('[board] configured image failed to load:', explicit);
        }
        for (const path of CANDIDATES) {
            const ok = await tryLoad(path);
            if (ok) return ok;
        }
        return null;
    }

    // Layout actually in force: hand calibration wins, then the measured
    // defaults, then null (meaning "use the coordinates in gameData.js").
    function layoutFor(hasImage) {
        const custom = savedLayout();
        if (custom) return custom;
        return hasImage ? { ...OFFICIAL_LAYOUT } : null;
    }

    return {
        resolve, layoutFor, saveLayout, clearLayout, savedLayout,
        OFFICIAL_LAYOUT, STORAGE_URL, SLOT_ROWS, slotPositions, LINK_PLACEMENTS, linkPlacement, recolorPixels,
        probeTiles, tilesReady, tileUrl, linkUrl,
        probeCards, cardsReady, cardUrl, cardBackUrl, matReady, matUrl,
    };
})();
