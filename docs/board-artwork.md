# Board Artwork and Calibration

## Bundled artwork

The repository includes the board, industry chips, card faces, and player mat
under `assets/`:

```
assets/board.jpg              the map
assets/tiles/<kind>-<n>.jpg   industry chips, e.g. coal-1.jpg, iron-3-flipped.jpg
assets/cards/<id>.jpg         card faces, keyed by city id or industry id
assets/player-mat.jpg         the player mat
```

![Full Brass: Birmingham board artwork](../assets/board.jpg)

The printed map carries the towns, routes, and merchant buildings. The game
draws the changing state on top: placed chips, resource cubes, beer barrels,
and highlights.

The printed coal and iron markets now carry live cubes, with the next
purchase outlined and its price quoted above the track. Empty markets quote
the General Supply price (£8 coal / £6 iron). The sidebar keeps every space's
price visible even when occupied. These quotes describe market purchases;
the normal rules for consuming industry cubes and coal connectivity still apply.

The printed Turn Order Track shows players in current order, their gross
action spending this round, and a provisional next position. The sidebar
also lists both orders in full. The preview uses the engine's round-end
ordering: least spent first, with ties retaining current order. Spending
resets after the round; loans and sale proceeds do not reduce it.

Merchant beer is shown beside each demand tile with a barrel and `1 BEER`,
or a crossed empty space marked `0 USED`. Blank merchant tiles show `0 NONE`.
Non-blank merchants refill at the start of the Rail Era. Demand remains
visible after beer is consumed. The fallback board uses barrel counts too.

These overlays refresh during normal board updates and after artwork loads.
Market and turn-track coordinates match the bundled retail board image;
town calibration adjusts the adjacent merchant beer positions along with
their demand tiles.

> This artwork is the publisher's copyright and is included as inherited from
> the upstream project. If you supply your own image, use art you have the
> right to use.

## Using a different board image

Replace `assets/board.jpg` locally, or point the browser at another image:

```js
localStorage.brassBoardAsset = 'https://example.com/board.jpg'
```

Browser overrides and calibration are kept in local storage only.

## Calibration

All 27 locations sit at positions measured on a retail board. Each location's
industry spaces follow the arrangement the board prints (Coalbrookdale one
space over two, Birmingham two over two, and so on). To adjust the alignment,
open the page with `?calibrate=1`:

| Input | Effect |
|---|---|
| Drag a town, merchant, or brewery | Move it onto its printed space |
| `c` | Print the finished layout as JSON to the console |
| `r` | Reset to the measured defaults |

Positions are stored normalised, so one calibration holds for any image at any
resolution. They are saved automatically as you drag.

## Procedural fallback board

Without a board image, the game draws an original procedural night-time map:

- a hill-shaded elevation raster generated in the page, with an industrial haze over the Black Country;
- region washes tinting each county, and warm furnace light over every town;
- towns on slate plinths with region-coloured name ribbons;
- engraved industry art (a spinning mill, pithead winding gear, a blast furnace, a sawtooth workshop, a bottle kiln, and a cask);
- canals drawn as waterways and railways as ballast with sleepers, with rivers desaturated so they don't read as buildable links;
- a numbered 0–99 score track around a brass frame.

Slots that allow two industries show both icons, split on the diagonal.
