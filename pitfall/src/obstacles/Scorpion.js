// Reporter: patrols back and forth with a camera, lethal on contact.
// Replaced the original Scorpion sprite; all game logic unchanged.
class Scorpion extends Obstacle {
  constructor(worldX, layer, patrolLeft, patrolRight) {
    super(worldX, 10, 14);
    this.layer       = layer || 'surface';
    this.lethal      = true;
    this.patrolLeft  = patrolLeft;
    this.patrolRight = patrolRight;
    this.vx          = 32;
    this.frame       = 0;
  }

  update(dt) {
    this.worldX += this.vx * dt;
    if (this.worldX >= this.patrolRight) { this.worldX = this.patrolRight; this.vx = -32; }
    if (this.worldX <= this.patrolLeft)  { this.worldX = this.patrolLeft;  this.vx =  32; }
    this.frame++;
  }

  overlaps(player) {
    if (!this.active) return false;
    if (player.layer !== this.layer) return false;
    const floorY = this.layer === 'surface' ? C.GROUND_Y : C.TUNNEL_Y;
    const dx = Math.abs(player.worldX - (this.worldX + this.w / 2));
    return dx < (C.PW / 2 + this.w / 2 - 1) && player.y >= floorY - C.PH;
  }

  draw(ctx, camX) {
    const floorY      = this.layer === 'surface' ? C.GROUND_Y : C.TUNNEL_Y;
    const by          = floorY;
    const facingRight = this.vx >= 0;
    const legPhase    = Math.floor(this.frame / 8) % 2;

    ctx.save();
    ctx.translate(Math.round(this.worldX - camX + this.w / 2), by);
    // (0,0) = bottom-center of reporter

    // ── Shoes ────────────────────────────────────────────────────────────
    ctx.fillStyle = '#100a04';
    ctx.fillRect(-4, -2, 9, 2);

    // ── Legs (alternating walk stride) ────────────────────────────────────
    ctx.fillStyle = '#28283a';
    const lo = legPhase ? 0 : -1;
    const ho = legPhase ? -1 : 0;
    ctx.fillRect(-4, -7 + lo, 3, 5);   // near leg
    ctx.fillRect( 1, -7 + ho, 3, 5);   // far leg

    // ── Press jacket (grey) ───────────────────────────────────────────────
    ctx.fillStyle = '#485060';
    ctx.fillRect(-5, -13, 10, 6);

    // ── Yellow press badge ────────────────────────────────────────────────
    ctx.fillStyle = '#e0c000';
    ctx.fillRect(facingRight ? 1 : -3, -11, 2, 2);

    // ── White collar ─────────────────────────────────────────────────────
    ctx.fillStyle = '#e0e0d8';
    ctx.fillRect(-2, -13, 4, 1);

    // ── Head / face ───────────────────────────────────────────────────────
    ctx.fillStyle = '#d88050';
    ctx.fillRect(-3, -14, 6, 1);

    // ── Camera (held up toward face, sticking past shoulder) ─────────────
    const camBaseX = facingRight ? 4 : -8;  // 4px-wide body to front
    ctx.fillStyle = '#1c2028';
    ctx.fillRect(camBaseX, -13, 4, 3);
    // Lens (dark blue glass)
    ctx.fillStyle = '#2848a8';
    ctx.fillRect(facingRight ? 8 : -9, -12, 1, 2);
    // Viewfinder hump on top
    ctx.fillStyle = '#303840';
    ctx.fillRect(facingRight ? 4 : -6, -14, 2, 1);

    ctx.restore();
  }
}
