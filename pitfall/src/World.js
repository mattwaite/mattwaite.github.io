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

  getVineAt(worldX, playerY) {
    for (const vine of this.vines) {
      const dx = Math.abs(worldX - vine.worldX);
      const inHeight = playerY > C.VINE_ANCHOR_Y && playerY < C.VINE_ANCHOR_Y + C.VINE_LEN;
      if (dx < 14 && inHeight) return vine;
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

    // Surface room type
    const roll = rng();
    if (roll < 0.18) {
      this._roomOpen(rx, rng);
    } else if (roll < 0.30) {
      this._roomPit1(rx, rng);
    } else if (roll < 0.40) {
      this._roomPit2(rx, rng);
    } else if (roll < 0.50) {
      this._roomFence(rx, rng);
    } else if (roll < 0.63) {
      this._roomVinePit(rx, rng);
    } else if (roll < 0.72) {
      this._roomVinePit2(rx, rng);
    } else if (roll < 0.81) {
      this._roomScorpion(rx, rng);
    } else if (roll < 0.90) {
      this._roomLog(rx, rng);
    } else {
      this._roomLadder(rx, rng);
    }

    this._generateUnderground(idx, rx, rng);
  }

  _roomOpen(rx, rng) {
    if (rng() < 0.4) {
      const type = ['gold','silver','ring','bag'][Math.floor(rng() * 4)];
      this.collectibles.push(new Collectible(rx + 80 + rng() * 160, type));
    }
  }

  _roomPit1(rx, rng) {
    const pitW = 48 + Math.floor(rng() * 3) * 16; // 48, 64, or 80
    const pitX = rx + 80 + rng() * 80;
    const pit  = new TarPit(pitX, pitW);
    this.pits.push(pit);
    this.surfaceObstacles.push(pit);
    if (rng() < 0.3) {
      const type = rng() < 0.5 ? 'silver' : 'bag';
      this.collectibles.push(new Collectible(pitX - 30, type));
    }
  }

  _roomPit2(rx, rng) {
    const pitW = 48;
    const pit1 = new TarPit(rx + 50,  pitW);
    const pit2 = new TarPit(rx + 130, pitW);
    this.pits.push(pit1, pit2);
    this.surfaceObstacles.push(pit1, pit2);
  }

  _roomFence(rx, rng) {
    // Two reflecting pools with a chainlink fence between them.
    // Player must jump the fence, then clear the pool beyond it, or vice versa.
    const variant = rng() < 0.5;
    if (variant) {
      // Fence first, then pool
      const fenceX = rx + 70 + rng() * 40;
      const fence  = new ChainlinkFence(fenceX);
      this.surfaceObstacles.push(fence);
      const pitX = fenceX + 28 + Math.floor(rng() * 2) * 10;
      const pitW = 56 + Math.floor(rng() * 2) * 16;
      const pit  = new TarPit(pitX, pitW);
      this.pits.push(pit);
      this.surfaceObstacles.push(pit);
    } else {
      // Pool first, then fence
      const pitW  = 56;
      const pitX  = rx + 60 + rng() * 40;
      const pit   = new TarPit(pitX, pitW);
      this.pits.push(pit);
      this.surfaceObstacles.push(pit);
      const fenceX = pitX + pitW + 24 + rng() * 20;
      const fence  = new ChainlinkFence(fenceX);
      this.surfaceObstacles.push(fence);
    }
  }

  _roomVinePit(rx, rng) {
    const pitW = 72;
    const pitX = rx + 90;
    const pit  = new TarPit(pitX, pitW);
    this.pits.push(pit);
    this.surfaceObstacles.push(pit);
    // Vine centered slightly left of pit center so player swings right
    const vine = new Vine(pitX + pitW * 0.35);
    this.vines.push(vine);
    if (rng() < 0.5) {
      this.collectibles.push(new Collectible(pitX + pitW + 20, 'gold'));
    }
  }

  _roomVinePit2(rx, rng) {
    // Double pit with a single vine in the middle
    const pitW = 56;
    const pit1 = new TarPit(rx + 40,  pitW);
    const pit2 = new TarPit(rx + 120, pitW);
    const vine  = new Vine(rx + 40 + pitW + 8);
    this.pits.push(pit1, pit2);
    this.surfaceObstacles.push(pit1, pit2);
    this.vines.push(vine);
  }

  _roomScorpion(rx, rng) {
    const cx     = rx + 80 + rng() * 100;
    const patrol = 80 + rng() * 80;
    const scorp  = new Scorpion(cx, 'surface', cx - patrol / 2, cx + patrol / 2);
    this.surfaceObstacles.push(scorp);
    // Sometimes add a pit to the right of scorpion to create a challenge
    if (rng() < 0.4) {
      const pitX = cx + 60;
      const pit  = new TarPit(pitX, 48);
      this.pits.push(pit);
      this.surfaceObstacles.push(pit);
    }
  }

  _roomLog(rx, rng) {
    const cx  = rx + 160;
    const log = new Log(cx, 'surface');
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

  _generateUnderground(idx, rx, rng) {
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
      const scorp = new Scorpion(cx, 'underground', cx - pat, cx + pat);
      this.undergroundObstacles.push(scorp);
    } else {
      // Log underground
      const log = new Log(rx + 160, 'underground');
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
