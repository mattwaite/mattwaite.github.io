// A rope that swings on its own (undamped pendulum). The player must time a
// jump to catch the lower part of the rope; on grab they inherit the rope's
// angle and angular velocity, so WHEN you catch it decides how far you carry.
class Vine extends Obstacle {
  constructor(worldX, phase) {
    super(worldX, 6, C.VINE_LEN);
    this.anchorY = C.VINE_ANCHOR_Y;
    this.layer   = 'surface';
    this.held    = false;

    // Start mid-swing at a per-vine phase so vines aren't synchronized.
    const w0 = Math.sqrt(C.GRAVITY / C.VINE_LEN); // natural frequency
    const p  = phase || 0;
    this.angle = C.VINE_AMP * Math.cos(p);
    this.omega = -C.VINE_AMP * w0 * Math.sin(p);
  }

  get bobX() { return this.worldX + Math.sin(this.angle) * C.VINE_LEN; }
  get bobY() { return this.anchorY + Math.cos(this.angle) * C.VINE_LEN; }

  update(dt) {
    if (this.held) return; // player's swing physics drives the rope
    this.omega -= (C.GRAVITY / C.VINE_LEN) * Math.sin(this.angle) * dt;
    this.angle += this.omega * dt;
  }

  // Can the player grab this vine right now?
  canGrab(player) {
    if (this.held) return false;
    if (player.layer !== 'surface') return false;
    if (player.grounded) return false;                     // must be airborne
    // Hand position: upper body
    const hx = player.worldX;
    const hy = player.y - C.PH + 6;
    // Closest point on the rope segment (anchor → bob) to the hand
    const ax = this.worldX, ay = this.anchorY;
    const dx = this.bobX - ax, dy = this.bobY - ay;
    let t = ((hx - ax) * dx + (hy - ay) * dy) / (dx * dx + dy * dy);
    if (t < 0.55) return false;                            // lower half only
    t = Math.min(t, 1);
    const px = ax + dx * t, py = ay + dy * t;
    return Math.hypot(hx - px, hy - py) < 11;
  }

  draw(ctx, camX) {
    if (this.held) return; // player draws the rope while swinging on it

    const ax = this.worldX - camX;
    const bx = this.bobX - camX;
    const by = this.bobY;
    const { COL, VINE_ANCHOR_Y } = C;

    // Main rope
    ctx.strokeStyle = COL.VINE;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(ax, VINE_ANCHOR_Y);
    ctx.lineTo(bx, by);
    ctx.stroke();

    // Texture ticks along the rope
    ctx.strokeStyle = COL.LEAF_D;
    ctx.lineWidth = 1;
    for (let t = 0.1; t < 1; t += 0.11) {
      const x = ax + (bx - ax) * t;
      const y = VINE_ANCHOR_Y + (by - VINE_ANCHOR_Y) * t;
      ctx.beginPath();
      ctx.moveTo(x - 3, y);
      ctx.lineTo(x + 3, y);
      ctx.stroke();
    }
  }
}
