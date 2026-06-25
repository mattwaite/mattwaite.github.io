# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

A browser-based editorial game modeled on Atari Pitfall! (1982). The editorial subject is the algae bloom in the Lincoln Memorial Reflecting Pool (summer 2026). The player is a business-suited figure running the National Mall, jumping reflecting pools fouled with algae, dodging reporters with cameras and rolling news vans, and clearing chainlink fences.

## Running the game

No build step. Open `index.html` directly in a browser:

```
open index.html
```

For syntax validation of JS files (no test suite exists):

```bash
node -e "
const fs = require('fs');
const files = ['src/config.js', 'src/Game.js', 'src/World.js']; // etc.
files.forEach(f => {
  try { new Function(fs.readFileSync(f,'utf8')); console.log('OK:', f); }
  catch(e) { console.error('FAIL:', f, e.message); }
});"
```

## Canvas and coordinate system

- Internal canvas: **320×200 px** (`C.W`, `C.H`), displayed at 3× via `drawImage` scale
- All game coordinates are in internal pixels
- Y increases downward (standard canvas)
- Two playable layers share the same world X axis:

```
y=0
y=115  ← C.GROUND_Y   surface floor (player.y rests here)
y=133  ← C.GROUND_BOT  underground ceiling / bottom of ground strip
y=192  ← C.TUNNEL_Y   underground floor
y=200
```

Pits are "missing ground" — `World.getGroundY()` returns `Infinity` over a pit, causing `player.grounded = false` and gravity to engage. No explicit pit collision object exists.

## Theme system

The active theme is set in `Game.js` (`this.theme = DCMallTheme`). A theme is a plain object with three required methods:

| Method | Signature | Responsibility |
|--------|-----------|----------------|
| `drawBackground` | `(ctx, camX, pools)` | Sky, background landmarks, ground strip, reflecting pools, underground |
| `drawPlayer` | `(ctx, sx, sy, state, frame, facingRight, layer)` | Player sprite at screen coords |
| `drawBrick` | `(ctx, sx, topY, w, h)` | Underground brick wall pattern |

`pools` is `world.pits` — an array of `TarPit` objects. The theme decides how to render them (DCMallTheme draws green algae water; JungleTheme draws black tar). The `TarPit` class itself has an empty `draw()`.

To add a new theme, create `src/themes/mytheme.js`, define a theme object, load it in `index.html`, and point `Game.js` to it.

## Obstacle pattern

All hazards extend `Obstacle` (`src/obstacles/Obstacle.js`). Two flags drive behavior:

- `lethal = true` → `onHit()` calls `player.die()`
- `solid = true` → `onHit()` pushes the player back (walls)

`World.checkCollisions()` calls `obs.overlaps(player)` then `obs.onHit(player)` for every obstacle. The default `overlaps()` is an AABB check; obstacles with non-standard geometry override it.

Obstacles live in one of four arrays on `World`:
- `surfaceObstacles` / `undergroundObstacles` — updated and drawn each frame
- `vines` — queried by `World.getVineAt()`; drawn separately in `drawSurface()`
- `ladders` — queried by `World.getLadderAt()`; drawn separately
- `pits` — queried by `World.getGroundY()` and passed to `theme.drawBackground()`

**Do not push vines into `surfaceObstacles`** — they are drawn separately and will double-render.

## World generation

Rooms are `C.ROOM_W = 320` px wide. `World._generateRoom(idx)` is called lazily as the player scrolls; a seeded LCG RNG keyed to `idx` makes each room deterministic and reproducible. Room type is chosen by a single `rng()` roll against a probability table in `_generateRoom`. Underground rooms are generated independently after every surface room.

Current surface room types: `open`, `pit1`, `pit2`, `fence` (pool + chainlink combo), `vinePit`, `vinePit2`, `scorpion`, `log`, `ladder`.

## Player state machine

States: `idle → run → jump → swing → climb → dead`

- `swing` uses real pendulum physics: `omega -= (G/L)*sin(angle)*dt`
- `climb` transitions layer when `player.y` reaches `GROUND_Y` (up) or `TUNNEL_Y` (down)
- On death, `player.deadTimer` counts down; `Game.js` detects `deadTimer <= 0` and calls `_respawn()`

## Mobile controls

Touch buttons in `index.html` map to the same `this._keys` object as keyboard. The CSS media query `(hover: none) and (pointer: coarse)` shows the button row and shrinks the canvas to `60dvh`. The buttons are always in the DOM; no JS feature detection needed.

## Key constants (`src/config.js`)

| Constant | Value | Note |
|----------|-------|------|
| `C.PH` | 20 | Player hitbox height (increased from original 16 for suit character) |
| `C.GROUND_BOT` | 133 | Raised from 138 to give headroom underground with taller player |
| `C.VINE_LEN` | 88 | Pendulum length in px |
| `C.GAME_TIME` | 1200 | 20 minutes in seconds |

`C.COL` holds obstacle-shared colors (`BRICK_L/D`, `VINE`, `GOLD`, `SILVER`, `SCORP`, `LOG_L/D`). Theme-specific colors (sky, ground, player suit) live inside each theme's `_c` object.
