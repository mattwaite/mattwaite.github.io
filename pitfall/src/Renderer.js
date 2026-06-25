class Renderer {
  constructor(displayCanvas) {
    displayCanvas.width  = C.W * C.SCALE;
    displayCanvas.height = C.H * C.SCALE;
    this.display = displayCanvas;
    this.dctx = displayCanvas.getContext('2d');
    this.dctx.imageSmoothingEnabled = false;

    // Offscreen buffer at native (low) resolution
    this.buf = document.createElement('canvas');
    this.buf.width  = C.W;
    this.buf.height = C.H;
    this.ctx = this.buf.getContext('2d');
    this.ctx.imageSmoothingEnabled = false;
  }

  clear() {
    this.ctx.fillStyle = C.COL.BLACK;
    this.ctx.fillRect(0, 0, C.W, C.H);
  }

  // Scale and blit the offscreen buffer to the display canvas
  blit() {
    this.dctx.drawImage(this.buf, 0, 0, C.W * C.SCALE, C.H * C.SCALE);
  }
}
