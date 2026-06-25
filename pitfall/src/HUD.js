class HUD {
  draw(ctx, score, lives, timeLeft) {
    const { W, COL } = C;

    ctx.save();
    ctx.font      = '7px monospace';
    ctx.fillStyle = COL.WHITE;

    // Score — centered at top
    const scoreStr = String(Math.max(0, score)).padStart(6, ' ');
    ctx.textAlign = 'center';
    ctx.fillText(scoreStr, W / 2, 9);

    // Lives — pipe chars on the left
    ctx.textAlign = 'left';
    const livesStr = '|'.repeat(Math.max(0, lives));
    ctx.fillText(livesStr, 6, 18);

    // Timer — MM:SS right of lives
    const t    = Math.max(0, Math.ceil(timeLeft));
    const mins = String(Math.floor(t / 60)).padStart(2, ' ');
    const secs = String(t % 60).padStart(2, '0');
    ctx.fillText(`${mins}:${secs}`, 26, 18);

    ctx.restore();
  }

  // Draw a full-screen overlay (menu, game over, etc.)
  drawOverlay(ctx, lines) {
    const { W, H, COL } = C;
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(0, 0, W, H);

    ctx.save();
    ctx.font      = '8px monospace';
    ctx.fillStyle = COL.WHITE;
    ctx.textAlign = 'center';
    const startY = H / 2 - (lines.length * 12) / 2;
    lines.forEach((line, i) => ctx.fillText(line, W / 2, startY + i * 12));
    ctx.restore();
  }
}
