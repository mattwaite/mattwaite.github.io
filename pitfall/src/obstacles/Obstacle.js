// Base class for all surface and underground hazards.
// Subclasses override update(), draw(), and onHit().
class Obstacle {
  constructor(worldX, w, h) {
    this.worldX = worldX;
    this.w = w || 16;
    this.h = h || 16;
    this.active  = true;
    this.lethal  = false;   // touching kills player
    this.solid   = false;   // pushes player back (walls)
    this.layer   = 'surface';
  }

  update(dt) {}

  draw(ctx, camX) {}

  // World-space AABB center x, bottom y
  getCenter() { return this.worldX + this.w / 2; }

  // Default overlap: axis-aligned box vs player box.
  // Concrete obstacles that need pit-style checks override this.
  overlaps(player) {
    if (!this.active) return false;
    if (player.layer !== this.layer) return false;
    const floorY = player.layer === 'surface' ? C.GROUND_Y : C.TUNNEL_Y;
    const px = player.worldX, py = player.y;
    const hw = C.PW / 2;
    return (
      px + hw > this.worldX &&
      px - hw < this.worldX + this.w &&
      py       > floorY - C.PH - 2 &&
      py - C.PH < floorY
    );
  }

  onHit(player) {
    if (this.lethal) player.die();
  }
}
