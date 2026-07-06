const JungleTheme = {
  name: 'jungle',

  // ── Background: sky, parallax trees, ground strip, underground ──────────
  drawBackground(ctx, camX, pits) {
    const { W, H, GROUND_Y, GROUND_BOT, TUNNEL_Y, COL } = C;

    // Sky — three horizontal bands
    ctx.fillStyle = COL.SKY_A;
    ctx.fillRect(0, 0, W, 40);
    ctx.fillStyle = COL.SKY_B;
    ctx.fillRect(0, 40, W, 40);
    ctx.fillStyle = COL.SKY_C;
    ctx.fillRect(0, 80, W, GROUND_Y - 80);

    // Parallax trees (scroll at 40% of camera speed)
    this._drawTrees(ctx, camX * 0.4);

    // Yellow ground strip — full width first, pits cut out below
    ctx.fillStyle = COL.GROUND;
    ctx.fillRect(0, GROUND_Y, W, GROUND_BOT - GROUND_Y);

    // Pit gaps cut into the ground strip
    if (pits) {
      ctx.fillStyle = COL.PIT;
      for (const pit of pits) {
        const sx = pit.worldX - camX;
        if (sx + pit.pitW > 0 && sx < W) {
          ctx.fillRect(sx, GROUND_Y, pit.pitW, GROUND_BOT - GROUND_Y);
        }
      }
    }

    // Underground tunnel (black)
    ctx.fillStyle = COL.UNDER;
    ctx.fillRect(0, GROUND_BOT, W, TUNNEL_Y - GROUND_BOT);

    // Underground floor (same yellow as surface ground)
    ctx.fillStyle = COL.GROUND;
    ctx.fillRect(0, TUNNEL_Y, W, H - TUNNEL_Y);

    // Bottom black border
    ctx.fillStyle = COL.BLACK;
    ctx.fillRect(0, TUNNEL_Y + 5, W, H - TUNNEL_Y - 5);
  },

  _drawTrees(ctx, scrollX) {
    const SPACING = 76;
    // Offset so trees tile seamlessly as the world scrolls
    const offset = ((scrollX % SPACING) + SPACING) % SPACING;
    for (let x = -offset - SPACING; x < C.W + SPACING; x += SPACING) {
      this._drawTree(ctx, Math.round(x));
    }
  },

  _drawTree(ctx, cx) {
    const { COL, GROUND_Y } = C;
    // Trunk
    const trunkW = 12, trunkH = 36;
    ctx.fillStyle = COL.TRUNK;
    ctx.fillRect(cx - trunkW / 2, GROUND_Y - trunkH, trunkW, trunkH);

    // Canopy outer (darker)
    const cW = 44, cH = 76;
    ctx.fillStyle = COL.LEAF_D;
    ctx.fillRect(cx - cW / 2, GROUND_Y - trunkH - cH + 8, cW, cH);

    // Canopy inner highlight
    ctx.fillStyle = COL.LEAF_L;
    ctx.fillRect(cx - cW / 2 + 5, GROUND_Y - trunkH - cH, cW - 10, cH - 8);
  },

  // ── Player sprite ────────────────────────────────────────────────────────
  drawPlayer(ctx, sx, sy, state, frame, facingRight, layer) {
    const { COL, PW, PH } = C;
    const f = facingRight ? 1 : -1; // horizontal flip factor

    // sy = player bottom y on screen
    // all rects drawn relative to (sx, sy) where sy is the bottom

    ctx.save();
    ctx.translate(Math.round(sx), Math.round(sy));

    // Hat (red)
    ctx.fillStyle = COL.P_HAT;
    ctx.fillRect(-4 * f, -PH, 8, 3);

    // Head (skin)
    ctx.fillStyle = COL.P_SKIN;
    ctx.fillRect(-3 * f, -PH + 3, 7, 6);

    // Body (green shirt)
    ctx.fillStyle = COL.P_BODY;
    ctx.fillRect(-4 * f, -PH + 9, 8, 5);

    // Legs
    ctx.fillStyle = COL.P_PANTS;
    if (state === 'run') {
      const phase = Math.floor(frame / 5) % 4;
      // Four-frame walk cycle: front/back leg alternates
      const legOffsets = [[0, -3], [0, 0], [0, 3], [0, 0]];
      const [fo, bo] = [legOffsets[phase], legOffsets[(phase + 2) % 4]];
      ctx.fillRect(-4 * f, -5 + bo[1], 4, 5);  // back leg
      ctx.fillRect(0,      -5 + fo[0], 4, 5);  // front leg
    } else if (state === 'swing' || state === 'jump') {
      // Legs bent up slightly
      ctx.fillRect(-4 * f, -7, 4, 5);
      ctx.fillRect(0,      -7, 4, 5);
    } else if (state === 'climb') {
      const cp = Math.floor(frame / 8) % 2;
      ctx.fillRect(-4 * f, -5 + (cp ? -2 : 0), 4, 5);
      ctx.fillRect(0,      -5 + (cp ? 0 : -2), 4, 5);
    } else {
      ctx.fillRect(-4 * f, -5, 4, 5);
      ctx.fillRect(0,      -5, 4, 5);
    }

    ctx.restore();
  },

  // ── Underground brick wall ───────────────────────────────────────────────
  drawBrick(ctx, sx, topY, w, h) {
    const { COL } = C;
    const BRICK_H = 7, BRICK_W = 8;
    for (let row = 0; row < h; row += BRICK_H + 1) {
      const rowOdd = Math.floor(row / (BRICK_H + 1)) % 2;
      ctx.fillStyle = COL.BRICK_L;
      ctx.fillRect(sx, topY + row, w, BRICK_H);
      // Mortar
      ctx.fillStyle = COL.BRICK_D;
      ctx.fillRect(sx, topY + row + BRICK_H, w, 1);
      // Vertical joints (offset every other row)
      const jOffset = rowOdd * (BRICK_W / 2);
      for (let jx = sx + jOffset; jx < sx + w; jx += BRICK_W) {
        ctx.fillRect(jx, topY + row, 1, BRICK_H);
      }
    }
  },
};
