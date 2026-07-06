// Solid chainlink fence on the surface. Player must jump over it.
// Height is carefully chosen so the jump arc clears it with moderate precision.
class ChainlinkFence extends Obstacle {
  constructor(worldX) {
    const w     = 12;
    const wallH = 38;
    super(worldX, w, wallH);
    this.layer   = 'surface';
    this.solid   = true;
    this.wallH   = wallH;
    this.bottomY = C.GROUND_Y;
    this.topY    = C.GROUND_Y - wallH;
  }

  overlaps(player) {
    if (!this.active) return false;
    if (player.layer !== 'surface') return false;
    const dx   = Math.abs(player.worldX - (this.worldX + this.w / 2));
    const ptop = player.y - C.PH;
    return dx < (C.PW / 2 + this.w / 2) &&
           player.y > this.topY           &&
           ptop     < this.bottomY;
  }

  onHit(player) {
    const dx = player.worldX - (this.worldX + this.w / 2);
    if (dx >= 0) {
      player.worldX = this.worldX + this.w + C.PW / 2 + 1;
    } else {
      player.worldX = this.worldX - C.PW / 2 - 1;
    }
    player.vx = 0;
  }

  draw(ctx, camX) {
    const sx   = Math.round(this.worldX - camX);
    const topY = this.topY;
    const w    = this.w;
    const h    = this.wallH;

    // Greyed galvanized steel palette
    const POST   = '#7a8880';   // pipe post
    const POST_S = '#4a5850';   // shadow edge of post
    const RAIL   = '#909890';   // horizontal top rail
    const MESH   = '#a0a8a0';   // wire mesh
    const FOOT   = '#5a6860';   // ground anchor

    // ── Top rail ─────────────────────────────────────────────────────────
    ctx.fillStyle = RAIL;
    ctx.fillRect(sx, topY, w, 2);

    // ── Posts (left and right, 2px wide) ─────────────────────────────────
    ctx.fillStyle = POST;
    ctx.fillRect(sx,       topY, 2, h);
    ctx.fillRect(sx + w - 2, topY, 2, h);
    // Shadow stripe on inner edge of each post
    ctx.fillStyle = POST_S;
    ctx.fillRect(sx + 1,   topY, 1, h);
    ctx.fillRect(sx + w - 1, topY, 1, h);

    // ── Chainlink mesh (crossing diagonal lines, diamond pattern) ─────────
    const mxStart = sx + 2;
    const mw      = w - 4;   // 8px interior
    ctx.fillStyle = MESH;
    for (let r = 0; r < h; r++) {
      for (let c = 0; c < mw; c++) {
        if ((r - c) % 4 === 0 || (r + c) % 4 === 0) {
          ctx.fillRect(mxStart + c, topY + r, 1, 1);
        }
      }
    }

    // ── Ground anchor / bottom kickrail ───────────────────────────────────
    ctx.fillStyle = FOOT;
    ctx.fillRect(sx - 1, topY + h - 3, w + 2, 3);
  }
}
