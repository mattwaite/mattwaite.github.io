// Procedural world. Rooms are ROOM_W wide; room index 0 is the starting screen.
// Negative indices go left, positive go right.

class World {
  constructor() {
    this.surfaceObstacles   = [];
    this.undergroundObstacles = [];
    this.collectibles       = [];
    this.ladders            = [];
    this.vines              = [];
    this.pits               = []; // TarPit refs also live here for ground-cut

    this._generated = new Set();
    // Always generate a few rooms ahead/behind at start
    for (let i = -2; i <= 5; i++) this._generateRoom(i);
  }

  // ── Ground query ──────────────────────────────────────────────────────────
  // Returns the Y the player stands on, or Infinity if there's no ground (pit).
  getGroundY(worldX, layer) {
    if (layer === 'underground') return C.TUNNEL_Y;
    for (const pit of this.pits) {
      if (worldX > pit.worldX + 2 && worldX < pit.worldX + pit.pitW - 2) {
        return Infinity; // gap — player falls
      }
    }
    return C.GROUND_Y;
  }

  getLadderAt(worldX) {
    for (const lad of this.ladders) {
      if (Math.abs(worldX - (lad.worldX + 8)) < 16) return lad;
    }
    return null;
  }

  getVineAt(player) {
    for (const vine of this.vines) {
      if (vine.canGrab(player)) return vine;
    }
    return null;
  }

  // ── Update ────────────────────────────────────────────────────────────────
  update(dt, playerWorldX) {
    // Ensure rooms near player are generated
    const roomIdx = Math.floor(playerWorldX / C.ROOM_W);
    for (let i = roomIdx - 2; i <= roomIdx + 6; i++) this._generateRoom(i);

    for (const obs of this.surfaceObstacles)     obs.update(dt);
    for (const obs of this.undergroundObstacles) obs.update(dt);
    for (const col of this.collectibles)         col.update(dt);
    for (const v   of this.vines)                v.update(dt);
  }

  // ── Collision ─────────────────────────────────────────────────────────────
  checkCollisions(player) {
    const all = [...this.surfaceObstacles, ...this.undergroundObstacles];
    for (const obs of all) {
      if (obs.overlaps(player)) obs.onHit(player);
    }
  }

  collectItems(player) {
    let gained = 0;
    for (const col of this.collectibles) gained += col.check(player);
    return gained;
  }

  // ── Drawing ───────────────────────────────────────────────────────────────
  drawSurface(ctx, camX) {
    for (const obs of this.surfaceObstacles) {
      if (obs.layer === 'surface') obs.draw(ctx, camX);
    }
    for (const lad of this.ladders)    lad.draw(ctx, camX);
    for (const v   of this.vines)      v.draw(ctx, camX);
    for (const col of this.collectibles) col.draw(ctx, camX);
  }

  drawUnderground(ctx, camX) {
    for (const obs of this.undergroundObstacles) obs.draw(ctx, camX);
  }

  // ── Procedural generation ─────────────────────────────────────────────────
  _generateRoom(idx) {
    if (this._generated.has(idx)) return;
    this._generated.add(idx);

    const rng = this._rng(idx);
    const rx  = idx * C.ROOM_W;

    if (idx === 0) {
      // Starting room: open, player gets oriented
      this.collectibles.push(new Collectible(rx + 160, 'gold'));
      this._generateUnderground(idx, rx, rng);
      return;
    }

    // Difficulty ramps with distance from the start room (0 → 1 over 15 rooms)
    const d = Math.min(Math.abs(idx) / 15, 1);

    // Surface room type — weighted table; harder rooms grow more likely far out
    const table = [
      ['open',     18 - 12 * d],
      ['pit1',     12],
      ['pit2',     10 +  2 * d],
      ['fence',    10 +  4 * d],
      ['vinePit',  13 +  3 * d],
      ['vinePit2',  9 +  5 * d],
      ['scorpion',  9 +  3 * d],
      ['log',       9 +  1 * d],
      ['ladder',   10 -  6 * d],
    ];
    const total = table.reduce((s, [, w]) => s + w, 0);
    let roll = rng() * total;
    let type = table[table.length - 1][0];
    for (const [name, w] of table) {
      if (roll < w) { type = name; break; }
      roll -= w;
    }

    switch (type) {
      case 'open':     this._roomOpen(rx, rng);        break;
      case 'pit1':     this._roomPit1(rx, rng, d);     break;
      case 'pit2':     this._roomPit2(rx, rng, d);     break;
      case 'fence':    this._roomFence(rx, rng, d);    break;
      case 'vinePit':  this._roomVinePit(rx, rng, d);  break;
      case 'vinePit2': this._roomVinePit2(rx, rng);    break;
      case 'scorpion': this._roomScorpion(rx, rng, d); break;
      case 'log':      this._roomLog(rx, rng, d);      break;
      case 'ladder':   this._roomLadder(rx, rng);      break;
    }

    this._generateUnderground(idx, rx, rng, d);
  }

  _roomOpen(rx, rng) {
    if (rng() < 0.4) {
      const type = ['gold','silver','ring','bag'][Math.floor(rng() * 4)];
      this.collectibles.push(new Collectible(rx + 80 + rng() * 160, type));
    }
  }

  // Max standing jump carries the player ~86px, so pools up to ~80px are
  // jumpable (tightly); anything wider requires the rope.
  _roomPit1(rx, rng, d) {
    const pitW = 48 + Math.min(2, Math.floor(rng() * 3 + d)) * 16; // 48/64/80
    const pitX = rx + 80 + rng() * 80;
    const pit  = new TarPit(pitX, pitW);
    this.pits.push(pit);
    this.surfaceObstacles.push(pit);
    if (rng() < 0.3) {
      const type = rng() < 0.5 ? 'silver' : 'bag';
      this.collectibles.push(new Collectible(pitX - 30, type));
    }
  }

  _roomPit2(rx, rng, d) {
    const pitW = 48 + Math.round(d * 10); // landing strip shrinks with distance
    const pit1 = new TarPit(rx + 50,  pitW);
    const pit2 = new TarPit(rx + 130, pitW);
    this.pits.push(pit1, pit2);
    this.surfaceObstacles.push(pit1, pit2);
  }

  _roomFence(rx, rng, d) {
    // A reflecting pool and a chainlink fence in sequence. The gap between
    // them is too short to clear both in one jump, so the player must land
    // between and take them one at a time.
    const variant = rng() < 0.5;
    if (variant) {
      // Fence first, then pool
      const fenceX = rx + 70 + rng() * 40;
      const fence  = new ChainlinkFence(fenceX);
      this.surfaceObstacles.push(fence);
      const pitX = fenceX + 28 + Math.floor(rng() * 2) * 10;
      const pitW = 56 + Math.floor(rng() * 2) * 12 + Math.round(d * 8);
      const pit  = new TarPit(pitX, pitW);
      this.pits.push(pit);
      this.surfaceObstacles.push(pit);
    } else {
      // Pool first, then fence
      const pitW  = 56 + Math.round(d * 8);
      const pitX  = rx + 60 + rng() * 40;
      const pit   = new TarPit(pitX, pitW);
      this.pits.push(pit);
      this.surfaceObstacles.push(pit);
      const fenceX = pitX + pitW + 24 + rng() * 20;
      const fence  = new ChainlinkFence(fenceX);
      this.surfaceObstacles.push(fence);
    }
  }

  _roomVinePit(rx, rng, d) {
    // Pool too wide to jump — the swinging rope is the only way across.
    const pitW = 100 + Math.round(d * 12);
    const pitX = rx + 80;
    const pit  = new TarPit(pitX, pitW);
    this.pits.push(pit);
    this.surfaceObstacles.push(pit);
    // Rope anchored over pool center; its bob swings past both edges
    const vine = new Vine(pitX + pitW / 2, rng() * Math.PI * 2);
    this.vines.push(vine);
    if (rng() < 0.5) {
      this.collectibles.push(new Collectible(pitX + pitW + 20, 'gold'));
    }
  }

  _roomVinePit2(rx, rng) {
    // Two wide pools split by a narrow marble strip, one rope over the strip.
    // Intended path: catch the rope and release on the upswing to carry past
    // the second pool. (Experts can chain two frame-tight jumps instead.)
    const pitW = 84;
    const pit1 = new TarPit(rx + 56,  pitW);          // ends rx+140
    const pit2 = new TarPit(rx + 156, pitW);          // strip rx+140..156
    const vine = new Vine(rx + 148, rng() * Math.PI * 2);
    this.pits.push(pit1, pit2);
    this.surfaceObstacles.push(pit1, pit2);
    this.vines.push(vine);
    if (rng() < 0.6) {
      this.collectibles.push(new Collectible(rx + 156 + pitW + 20, 'gold'));
    }
  }

  _roomScorpion(rx, rng, d) {
    const cx     = rx + 80 + rng() * 100;
    const patrol = 80 + rng() * 80;
    const scorp  = new Scorpion(cx, 'surface', cx - patrol / 2, cx + patrol / 2,
                                32 + d * 20);
    this.surfaceObstacles.push(scorp);
    // Sometimes add a pit to the right of scorpion to create a challenge
    if (rng() < 0.4) {
      const pitX = cx + 60;
      const pit  = new TarPit(pitX, 48);
      this.pits.push(pit);
      this.surfaceObstacles.push(pit);
    }
  }

  _roomLog(rx, rng, d) {
    const cx  = rx + 160;
    const log = new Log(cx, 'surface', 55 + d * 30);
    this.surfaceObstacles.push(log);
  }

  _roomLadder(rx, rng) {
    const lx  = rx + 80 + rng() * 120;
    const lad = new Ladder(lx);
    this.ladders.push(lad);
    // A pit to one side makes the ladder strategic
    if (rng() < 0.5) {
      const pitX = lx + 30;
      const pit  = new TarPit(pitX, 56);
      this.pits.push(pit);
      this.surfaceObstacles.push(pit);
    }
  }

  _generateUnderground(idx, rx, rng, d = 0) {
    const roll = rng();
    if (roll < 0.35) {
      // Open tunnel — safe
    } else if (roll < 0.60) {
      // Brick wall
      const wx   = rx + 80 + rng() * 140;
      const wall = new BrickWall(wx);
      this.undergroundObstacles.push(wall);
    } else if (roll < 0.78) {
      // Scorpion underground
      const cx    = rx + 100 + rng() * 100;
      const pat   = 80;
      const scorp = new Scorpion(cx, 'underground', cx - pat, cx + pat, 32 + d * 14);
      this.undergroundObstacles.push(scorp);
    } else {
      // Log underground
      const log = new Log(rx + 160, 'underground', 55 + d * 20);
      this.undergroundObstacles.push(log);
    }
  }

  // Deterministic per-room RNG (no dependency on global state)
  _rng(seed) {
    let s = (seed * 2654435761) | 0;
    s = Math.imul(s ^ (s >>> 16), 0x45d9f3b);
    s = Math.imul(s ^ (s >>> 16), 0x45d9f3b);
    s = s ^ (s >>> 16);
    return () => {
      s = Math.imul(s + 0x6D2B79F5, s ^ (s >>> 15)) | 0;
      return ((s >>> 0) + 0.5) / 0x100000000;
    };
  }
}
