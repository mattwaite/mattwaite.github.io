class Camera {
  constructor() {
    this.x = 0; // world X of the left edge of the screen
  }

  // Keep player at CAM_LEAD pixels from the left
  follow(playerWorldX) {
    this.x = playerWorldX - C.CAM_LEAD;
  }

  toScreen(worldX) {
    return worldX - this.x;
  }

  inView(worldX, w = 0) {
    const sx = this.toScreen(worldX);
    return sx + w > -64 && sx < C.W + 64;
  }
}
