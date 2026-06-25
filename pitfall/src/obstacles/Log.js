// News van: rolls back and forth, lethal on contact.
// Replaced the original rolling-log sprite; all game logic unchanged.
class Log extends Obstacle {
  constructor(worldX, layer) {
    super(worldX, 28, 14);
    this.layer  = layer || 'surface';
    this.lethal = true;
    this.vx     = -55;
    this.frame  = 0;
    this.leftBound  = worldX - 140;
    this.rightBound = worldX + 140;
  }

  update(dt) {
    this.worldX += this.vx * dt;
    if (this.worldX <= this.leftBound)  { this.worldX = this.leftBound;  this.vx =  55; }
    if (this.worldX >= this.rightBound) { this.worldX = this.rightBound; this.vx = -55; }
    this.frame++;
  }

  overlaps(player) {
    if (!this.active) return false;
    if (player.layer !== this.layer) return false;
    const floorY = this.layer === 'surface' ? C.GROUND_Y : C.TUNNEL_Y;
    const dx = Math.abs(player.worldX - (this.worldX + this.w / 2));
    return dx < (C.PW / 2 + this.w / 2 - 2) && player.y >= floorY - C.PH;
  }

  draw(ctx, camX) {
    const sx          = Math.round(this.worldX - camX);
    const floorY      = this.layer === 'surface' ? C.GROUND_Y : C.TUNNEL_Y;
    const facingRight = this.vx >= 0;

    // Body top (van body sits 4px above ground to leave room for wheels)
    const bodyTop = floorY - 14;
    const bodyH   = 10;

    // ── Van body (off-white) ──────────────────────────────────────────────
    ctx.fillStyle = '#dddad0';
    ctx.fillRect(sx, bodyTop, 28, bodyH);

    // ── Roof band (slightly darker) ───────────────────────────────────────
    ctx.fillStyle = '#b8b5ac';
    ctx.fillRect(sx, bodyTop, 28, 2);

    // ── News stripe (network blue) ────────────────────────────────────────
    ctx.fillStyle = '#2048a0';
    ctx.fillRect(sx, bodyTop + 3, 28, 3);

    // ── Windshield (front of van) ─────────────────────────────────────────
    ctx.fillStyle = '#182050';
    const windX = facingRight ? sx + 20 : sx;
    ctx.fillRect(windX, bodyTop, 8, bodyH - 1);

    // Windshield glare (1px highlight)
    ctx.fillStyle = '#4868b8';
    ctx.fillRect(facingRight ? sx + 21 : sx + 1, bodyTop + 1, 1, 3);

    // ── Side window ───────────────────────────────────────────────────────
    ctx.fillStyle = '#202848';
    const winX = facingRight ? sx + 8 : sx + 12;
    ctx.fillRect(winX, bodyTop + 1, 6, bodyH - 4);

    // ── Satellite dish / mast ─────────────────────────────────────────────
    ctx.fillStyle = '#909898';
    ctx.fillRect(sx + 12, bodyTop - 5, 1, 5);   // mast
    ctx.fillRect(sx + 10, bodyTop - 6, 5, 1);   // dish rim
    ctx.fillRect(sx + 11, bodyTop - 5, 3, 1);   // dish bowl

    // ── Wheels ────────────────────────────────────────────────────────────
    ctx.fillStyle = '#181818';
    ctx.fillRect(sx + 2,  floorY - 4, 5, 4);
    ctx.fillRect(sx + 21, floorY - 4, 5, 4);
    // Wheel hubs (light grey center)
    ctx.fillStyle = '#7a8088';
    ctx.fillRect(sx + 4,  floorY - 3, 1, 2);
    ctx.fillRect(sx + 23, floorY - 3, 1, 2);
  }
}
