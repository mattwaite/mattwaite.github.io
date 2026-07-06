class Ladder extends Obstacle {
  constructor(worldX) {
    super(worldX, 16, C.TUNNEL_Y - C.GROUND_Y);
    this.topY    = C.GROUND_Y;
    this.bottomY = C.TUNNEL_Y;
    this.layer   = 'surface'; // visible from both layers
  }

  atTop(player) {
    const dx = Math.abs(player.worldX - (this.worldX + 8));
    return player.layer === 'surface' && dx < 12 && player.grounded;
  }

  atBottom(player) {
    const dx = Math.abs(player.worldX - (this.worldX + 8));
    return player.layer === 'underground' && dx < 12 && player.grounded;
  }

  draw(ctx, camX) {
    const sx  = this.worldX - camX;
    const top = C.GROUND_Y;
    const bot = C.TUNNEL_Y;
    const { COL } = C;

    // Rails
    ctx.fillStyle = COL.GOLD;
    ctx.fillRect(sx + 2,  top, 2, bot - top);
    ctx.fillRect(sx + 12, top, 2, bot - top);

    // Rungs
    ctx.fillStyle = COL.GOLD;
    for (let y = top + 5; y < bot - 2; y += 8) {
      ctx.fillRect(sx + 2, y, 12, 2);
    }
  }
}
