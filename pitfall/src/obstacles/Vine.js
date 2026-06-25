class Vine extends Obstacle {
  constructor(worldX) {
    super(worldX, 6, C.VINE_LEN);
    this.anchorY = C.VINE_ANCHOR_Y;
    this.layer   = 'surface';
  }

  // Can the player grab this vine right now?
  canGrab(player) {
    if (player.layer !== 'surface') return false;
    if (player.grounded) return false;                     // must be airborne
    const dx = Math.abs(player.worldX - this.worldX);
    if (dx > 14) return false;
    const vineBottom = this.anchorY + C.VINE_LEN;
    return player.y > this.anchorY && player.y - C.PH < vineBottom;
  }

  draw(ctx, camX) {
    const sx = this.worldX - camX;
    const { COL, VINE_ANCHOR_Y, VINE_LEN } = C;

    // Main rope
    ctx.strokeStyle = COL.VINE;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(sx, VINE_ANCHOR_Y);
    ctx.lineTo(sx, VINE_ANCHOR_Y + VINE_LEN);
    ctx.stroke();

    // Leaf texture ticks
    ctx.strokeStyle = COL.LEAF_D;
    ctx.lineWidth = 1;
    for (let y = VINE_ANCHOR_Y + 4; y < VINE_ANCHOR_Y + VINE_LEN; y += 9) {
      ctx.beginPath();
      ctx.moveTo(sx - 3, y);
      ctx.lineTo(sx + 3, y);
      ctx.stroke();
    }
  }
}
