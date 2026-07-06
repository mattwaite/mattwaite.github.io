class Collectible {
  constructor(worldX, type) {
    this.worldX    = worldX;
    this.type      = type; // 'gold' | 'silver' | 'ring' | 'bag'
    this.collected = false;
    this.bob       = 0;    // animation counter
  }

  get value() {
    return C.SCORE[this.type] || 1000;
  }

  update(dt) {
    this.bob += dt * 3;
  }

  // Returns score gained (0 if no pickup)
  check(player) {
    if (this.collected) return 0;
    if (player.layer !== 'surface') return 0;
    const dx = Math.abs(player.worldX - this.worldX);
    const dy = Math.abs(player.y - C.GROUND_Y);
    if (dx < 12 && dy < 18) {
      this.collected = true;
      return this.value;
    }
    return 0;
  }

  draw(ctx, camX) {
    if (this.collected) return;
    const sx  = this.worldX - camX;
    const bob = Math.sin(this.bob) * 2;
    const y   = C.GROUND_Y - 10 + bob;
    const { COL } = C;

    switch (this.type) {
      case 'gold':
        ctx.fillStyle = COL.GOLD;
        ctx.fillRect(sx - 5, y - 6, 10, 8);
        ctx.fillStyle = '#ffe840';
        ctx.fillRect(sx - 3, y - 5, 6, 5);
        break;
      case 'silver':
        ctx.fillStyle = COL.SILVER;
        ctx.fillRect(sx - 5, y - 6, 10, 8);
        ctx.fillStyle = COL.WHITE;
        ctx.fillRect(sx - 3, y - 5, 6, 5);
        break;
      case 'ring':
        ctx.strokeStyle = COL.GOLD;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(sx, y - 3, 5, 0, Math.PI * 2);
        ctx.stroke();
        break;
      case 'bag':
        ctx.fillStyle = COL.GREY;
        ctx.fillRect(sx - 4, y - 7, 8, 9);
        ctx.fillStyle = '#555';
        ctx.fillRect(sx - 2, y - 8, 4, 2);
        break;
    }
  }
}
