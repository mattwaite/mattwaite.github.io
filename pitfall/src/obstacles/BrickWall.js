// Solid wall in the underground tunnel. Player must jump over it.
// Height reduced to 24px so the taller character can still clear it.
class BrickWall extends Obstacle {
  constructor(worldX) {
    const wallH = 24;
    super(worldX, 16, wallH);
    this.layer   = 'underground';
    this.solid   = true;
    this.wallH   = wallH;
    this.bottomY = C.TUNNEL_Y;
    this.topY    = C.TUNNEL_Y - wallH;
  }

  overlaps(player) {
    if (!this.active) return false;
    if (player.layer !== 'underground') return false;
    const dx   = Math.abs(player.worldX - (this.worldX + this.w / 2));
    const ptop = player.y - C.PH;
    return dx < (C.PW / 2 + this.w / 2) && player.y >= this.topY && ptop < this.bottomY;
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
    const sx = this.worldX - camX;
    const { BRICK_L, BRICK_D } = C.COL;
    const BRICK_H = 7, BRICK_W = 8;
    const w = this.w, topY = this.topY;

    for (let row = 0; row < this.wallH; row += BRICK_H + 1) {
      const rowOdd = Math.floor(row / (BRICK_H + 1)) % 2;
      ctx.fillStyle = BRICK_L;
      ctx.fillRect(sx, topY + row, w, BRICK_H);
      ctx.fillStyle = BRICK_D;
      ctx.fillRect(sx, topY + row + BRICK_H, w, 1);
      const jOffset = rowOdd * (BRICK_W / 2);
      for (let jx = sx + jOffset; jx < sx + w; jx += BRICK_W) {
        ctx.fillRect(jx, topY + row, 1, BRICK_H);
      }
    }
  }
}
