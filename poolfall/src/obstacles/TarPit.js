// A gap in the ground. Drawn by the theme (ground strip with a cutout).
// Collision is handled by World.getGroundY() returning Infinity when player
// is over a pit — no explicit overlaps() needed here.
class TarPit extends Obstacle {
  constructor(worldX, width) {
    super(worldX, width, C.GROUND_BOT - C.GROUND_Y);
    this.pitW  = width;
    this.layer = 'surface';
  }

  // No draw() — the theme's drawBackground() cuts pits out of the ground strip.
  draw() {}
}
