// DC National Mall theme — algae-filled Reflecting Pool as the water hazard,
// Washington Monument and Lincoln Memorial always visible in the background.
const DCMallTheme = {
  name: 'dcmall',

  _c: {
    // Sky — deep blue fading to hazy horizon
    SKY_T:    '#182468',
    SKY_M:    '#2858b0',
    SKY_B:    '#5898e0',
    CLOUD:    '#b8d4f4',
    CLOUD_S:  '#88a8d8',

    // Land
    PAVEMENT: '#9a9888',  // DC Mall concrete walkway
    PAV_LINE: '#7a7868',  // expansion joints

    // American elm trees lining the Mall
    TREE_D:   '#253d18',
    TREE_M:   '#386028',
    TREE_L:   '#4a7a34',
    TRUNK:    '#503a20',

    // Washington Monument — white Seneca sandstone / marble
    MON_W:    '#e4e4d8',
    MON_M:    '#c8c8bc',
    MON_S:    '#a8a89c',  // shadow side

    // Lincoln Memorial — white marble temple
    LIN_W:    '#d8d8cc',
    LIN_M:    '#b8b8ac',
    LIN_S:    '#909088',  // column shadow gaps

    // Reflecting Pool — algae bloom (from reference photos)
    POOL_EDG: '#c8c8b8',  // white marble pool surround
    POOL_TOP: '#dcdccc',  // marble edge highlight (top rim)
    WATER_D:  '#1a5828',  // dark murky algae base
    WATER_M:  '#2a7038',  // mid algae green
    WATER_L:  '#48a050',  // bright algae patch

    // Underground
    UNDER:    '#000000',
    BRICK_L:  '#cc4422',
    BRICK_D:  '#7a1800',

    // Business-suit character
    JACKET:   '#1e2e4c',  // dark navy blazer
    JACKET_H: '#2c3e64',  // lapel highlight
    PANTS:    '#16182c',  // charcoal trousers
    SHIRT:    '#eaeae0',  // white dress shirt
    TIE:      '#aa1400',  // deep red tie
    SKIN:     '#d88050',  // skin tone
    HAIR:     '#e85810',  // orange hair
    SHOES:    '#100a04',  // very dark leather

    // Obstacles / misc (shared with jungle so existing obstacle files work)
    GOLD:     '#ffd700',
    SILVER:   '#c0c0c0',
    WHITE:    '#ffffff',
    GREY:     '#888888',
    SCORP:    '#cc8800',
    LOG_L:    '#aa6633',
    LOG_D:    '#6b3e1a',
  },

  // ── Background ────────────────────────────────────────────────────────────
  drawBackground(ctx, camX, pools) {
    const { W, H, GROUND_Y, GROUND_BOT, TUNNEL_Y } = C;
    const col = this._c;

    // Sky — three bands
    ctx.fillStyle = col.SKY_T;
    ctx.fillRect(0, 0, W, 36);
    ctx.fillStyle = col.SKY_M;
    ctx.fillRect(0, 36, W, 44);
    ctx.fillStyle = col.SKY_B;
    ctx.fillRect(0, 80, W, GROUND_Y - 80);

    // Clouds (extremely slow scroll)
    this._drawClouds(ctx, camX * 0.04);

    // Lincoln Memorial — fixed left background
    this._drawLincoln(ctx);

    // Washington Monument — fixed right-center background
    this._drawMonument(ctx);

    // Mall trees (medium parallax — the ones lining the sides of the Mall)
    this._drawMallTrees(ctx, camX * 0.42);

    // DC Mall walkway / pavement (ground strip)
    ctx.fillStyle = col.PAVEMENT;
    ctx.fillRect(0, GROUND_Y, W, GROUND_BOT - GROUND_Y);

    // Pavement expansion-joint lines
    ctx.fillStyle = col.PAV_LINE;
    const jointSpacing = 22;
    const jointOffset  = Math.round(camX * 0.9) % jointSpacing;
    for (let x = -jointOffset; x < W + jointSpacing; x += jointSpacing) {
      ctx.fillRect(x, GROUND_Y, 1, GROUND_BOT - GROUND_Y);
    }

    // ── Reflecting pools (overwrites pavement where pools are) ────────────
    if (pools) {
      for (const pool of pools) {
        const sx = Math.round(pool.worldX - camX);
        const pw = pool.pitW;
        if (sx + pw < 0 || sx > W) continue;

        const py = GROUND_Y;
        const ph = GROUND_BOT - GROUND_Y;

        // Marble pool surround
        ctx.fillStyle = col.POOL_EDG;
        ctx.fillRect(sx, py, pw, ph);

        // Top-rim marble highlight
        ctx.fillStyle = col.POOL_TOP;
        ctx.fillRect(sx, py, pw, 2);

        // Water (inner area, inset by 3px each side)
        const wx = sx + 3, ww = pw - 6;
        if (ww > 4) {
          const wy = py + 2, wh = ph - 2;

          // Base algae water — dark green
          ctx.fillStyle = col.WATER_D;
          ctx.fillRect(wx, wy, ww, wh);

          // Mid-tone algae patches
          ctx.fillStyle = col.WATER_M;
          const p1w = Math.max(2, Math.floor(ww * 0.45));
          ctx.fillRect(wx + 2,            wy + 1, p1w, 3);
          const p2w = Math.max(2, Math.floor(ww * 0.28));
          ctx.fillRect(wx + Math.floor(ww * 0.58), wy + 2, p2w, 2);

          // Bright algae bloom highlights
          ctx.fillStyle = col.WATER_L;
          ctx.fillRect(wx + 3, wy + 1, Math.max(1, Math.floor(ww * 0.14)), 1);
          if (ww > 24) {
            ctx.fillRect(wx + Math.floor(ww * 0.62), wy + 2, 4, 1);
          }
        }
      }
    }

    // ── Underground ────────────────────────────────────────────────────────
    ctx.fillStyle = col.UNDER;
    ctx.fillRect(0, GROUND_BOT, W, TUNNEL_Y - GROUND_BOT);

    // Underground floor — same pavement as surface
    ctx.fillStyle = col.PAVEMENT;
    ctx.fillRect(0, TUNNEL_Y, W, H - TUNNEL_Y);

    // Bottom black strip
    ctx.fillStyle = col.UNDER;
    ctx.fillRect(0, TUNNEL_Y + 5, W, H - TUNNEL_Y - 5);
  },

  // ── Clouds ────────────────────────────────────────────────────────────────
  _drawClouds(ctx, scrollX) {
    const col = this._c;
    // Three clouds at fixed relative positions; they tile every W*3 pixels
    const TILE = C.W * 3;
    const clouds = [
      { tx: 40,  y: 8,  w: 52, h: 10 },
      { tx: 155, y: 5,  w: 68, h: 12 },
      { tx: 260, y: 12, w: 38, h: 8 },
    ];
    for (const cl of clouds) {
      const sx = Math.round(((cl.tx - scrollX) % TILE + TILE) % TILE);
      // Cloud body
      ctx.fillStyle = col.CLOUD;
      ctx.fillRect(sx, cl.y, cl.w, cl.h);
      // Top puff
      ctx.fillRect(sx + 10, cl.y - 3, cl.w - 20, 4);
      // Shadow base
      ctx.fillStyle = col.CLOUD_S;
      ctx.fillRect(sx + 4, cl.y + cl.h - 2, cl.w - 8, 2);
    }
  },

  // ── Washington Monument ───────────────────────────────────────────────────
  // Fixed screen position: always at x≈210. Represents the obelisk on the
  // east end of the Mall, visible throughout the game.
  _drawMonument(ctx) {
    const col = this._c;
    const mx  = 210;       // fixed screen X
    const by  = C.GROUND_Y;

    // Base / foundation block
    ctx.fillStyle = col.MON_W;
    ctx.fillRect(mx - 5, by - 7, 10, 7);
    ctx.fillStyle = col.MON_S;
    ctx.fillRect(mx + 3, by - 7, 2, 7);

    // Main shaft
    ctx.fillStyle = col.MON_W;
    ctx.fillRect(mx - 3, by - 60, 6, 53);
    // Shadow stripe on right
    ctx.fillStyle = col.MON_S;
    ctx.fillRect(mx + 2, by - 60, 1, 53);

    // Color-change line (the original monument has a visible line about
    // 1/3 up where different stone was used — a famous trivia fact)
    ctx.fillStyle = col.MON_M;
    ctx.fillRect(mx - 3, by - 38, 6, 1);

    // Pyramidion (tapered tip, 4 sections)
    ctx.fillStyle = col.MON_W;
    ctx.fillRect(mx - 3, by - 64, 6, 4);
    ctx.fillRect(mx - 2, by - 68, 4, 4);
    ctx.fillRect(mx - 1, by - 71, 2, 3);
    ctx.fillRect(mx,     by - 73, 1, 2);   // apex pixel
    ctx.fillStyle = col.MON_S;
    ctx.fillRect(mx + 2, by - 64, 1, 9);   // shadow on pyramidion
  },

  // ── Lincoln Memorial ──────────────────────────────────────────────────────
  // Fixed screen position: always at x≈55. Greek-temple silhouette with
  // recognisable columns, at the west end of the Mall.
  _drawLincoln(ctx) {
    const col = this._c;
    const lx  = 55;        // fixed screen X (center of structure)
    const by  = C.GROUND_Y;

    // Steps (two tiers)
    ctx.fillStyle = col.LIN_M;
    ctx.fillRect(lx - 26, by - 3, 52, 2);
    ctx.fillRect(lx - 24, by - 5, 48, 2);

    // Building body
    ctx.fillStyle = col.LIN_W;
    ctx.fillRect(lx - 22, by - 22, 44, 17);

    // Column vertical gaps (10 columns, 4px spacing)
    ctx.fillStyle = col.LIN_S;
    for (let i = 0; i <= 10; i++) {
      ctx.fillRect(lx - 20 + i * 4, by - 22, 1, 17);
    }

    // Entablature (horizontal band above columns)
    ctx.fillStyle = col.LIN_M;
    ctx.fillRect(lx - 24, by - 24, 48, 2);

    // Pediment (triangle-ish roof)
    ctx.fillStyle = col.LIN_W;
    ctx.fillRect(lx - 22, by - 27, 44, 3);
    ctx.fillRect(lx - 16, by - 30, 32, 3);
    ctx.fillRect(lx - 10, by - 33, 20, 3);
    ctx.fillRect(lx - 4,  by - 35, 8,  2);
    ctx.fillRect(lx - 1,  by - 37, 2,  2);  // peak

    // Shadow / depth on right side
    ctx.fillStyle = col.LIN_S;
    ctx.fillRect(lx + 20, by - 22, 2, 17);
  },

  // ── American Elm trees ────────────────────────────────────────────────────
  _drawMallTrees(ctx, scrollX) {
    const SPACING = 68;
    const offset  = ((scrollX % SPACING) + SPACING) % SPACING;
    for (let x = -offset - SPACING; x < C.W + SPACING; x += SPACING) {
      this._drawMallTree(ctx, Math.round(x));
    }
  },

  _drawMallTree(ctx, cx) {
    const col = this._c;
    const by  = C.GROUND_Y;

    // Trunk (short, grey-brown)
    ctx.fillStyle = col.TRUNK;
    ctx.fillRect(cx - 4, by - 22, 8, 22);
    // Trunk highlight
    ctx.fillStyle = col.TREE_M;
    ctx.fillRect(cx - 2, by - 20, 2, 18);

    // American elm canopy — wide vase/umbrella shape
    // Outer dark mass
    ctx.fillStyle = col.TREE_D;
    ctx.fillRect(cx - 20, by - 55, 40, 35);
    // Mid-tone layer
    ctx.fillStyle = col.TREE_M;
    ctx.fillRect(cx - 16, by - 60, 32, 34);
    // Light top cluster
    ctx.fillStyle = col.TREE_L;
    ctx.fillRect(cx - 10, by - 62, 20, 22);
    // Side spreading branches (the elm's distinctive silhouette)
    ctx.fillStyle = col.TREE_D;
    ctx.fillRect(cx - 26, by - 46, 10, 22);
    ctx.fillRect(cx + 16, by - 46, 10, 22);
    // Outer tips
    ctx.fillStyle = col.TREE_M;
    ctx.fillRect(cx - 28, by - 40, 8, 14);
    ctx.fillRect(cx + 20, by - 40, 8, 14);
  },

  // ── Business-suit player character ───────────────────────────────────────
  // PH = 20px. Taller than the original Harry; wears a dark navy suit,
  // red tie, white shirt — no hat.
  drawPlayer(ctx, sx, sy, state, frame, facingRight) {
    const col = this._c;
    const f   = facingRight ? 1 : -1;

    ctx.save();
    ctx.translate(Math.round(sx), Math.round(sy));
    // (0,0) = bottom-center of player

    // ── Shoes (very dark) ────────────────────────────────────────────────
    ctx.fillStyle = col.SHOES;
    ctx.fillRect(-6 * f, -2, 12, 2);

    // ── Trouser legs (charcoal) ──────────────────────────────────────────
    ctx.fillStyle = col.PANTS;
    if (state === 'run') {
      const phase   = Math.floor(frame / 5) % 4;
      const swings  = [0, -2, 0, 2];
      const front   = swings[phase];
      const back    = swings[(phase + 2) % 4];
      ctx.fillRect(-6 * f, -8 + back,  5, 6);
      ctx.fillRect(0,      -8 + front, 5, 6);
    } else if (state === 'jump' || state === 'swing') {
      // Legs slightly raised and spread
      ctx.fillRect(-7 * f, -10, 5, 6);
      ctx.fillRect(2 * f,  -10, 5, 6);
    } else if (state === 'climb') {
      const cp = Math.floor(frame / 8) % 2;
      ctx.fillRect(-6 * f, -8 + (cp ? -2 : 0), 5, 6);
      ctx.fillRect(0,      -8 + (cp ? 0 : -2), 5, 6);
    } else {
      ctx.fillRect(-6 * f, -8, 5, 6);
      ctx.fillRect(0,      -8, 5, 6);
    }

    // ── Jacket body (dark navy) ──────────────────────────────────────────
    ctx.fillStyle = col.JACKET;
    ctx.fillRect(-6, -14, 12, 6);   // torso
    ctx.fillRect(-6, -16, 12, 2);   // shoulders

    // Lapel highlight on facing side
    ctx.fillStyle = col.JACKET_H;
    ctx.fillRect(-6 * f, -15, 2, 6);

    // ── White shirt / collar visible between lapels ──────────────────────
    ctx.fillStyle = col.SHIRT;
    ctx.fillRect(-1, -15, 2, 6);    // shirt strip
    ctx.fillRect(-3, -16, 6, 1);    // collar

    // ── Tie (narrow, deep red) ───────────────────────────────────────────
    ctx.fillStyle = col.TIE;
    ctx.fillRect(0, -15, 1, 5);
    // Tie knot (slightly wider at top)
    ctx.fillRect(-1, -15, 3, 1);

    // ── Head / face ──────────────────────────────────────────────────────
    ctx.fillStyle = col.SKIN;
    ctx.fillRect(-3 * f, -20, 7, 4);   // face

    // Ear on the far side
    ctx.fillStyle = col.SKIN;
    ctx.fillRect(3 * f, -19, 1, 2);

    // ── Hair (short, professional) ────────────────────────────────────────
    ctx.fillStyle = col.HAIR;
    ctx.fillRect(-3 * f, -20, 7, 1);   // hairline strip
    ctx.fillRect(3 * f,  -19, 1, 1);   // sideburn

    ctx.restore();
  },

  // ── Brick pattern (used by BrickWall via drawBrick call) ─────────────────
  drawBrick(ctx, sx, topY, w, h) {
    const col = this._c;
    const BRICK_H = 7, BRICK_W = 8;
    for (let row = 0; row < h; row += BRICK_H + 1) {
      const rowOdd = Math.floor(row / (BRICK_H + 1)) % 2;
      ctx.fillStyle = col.BRICK_L;
      ctx.fillRect(sx, topY + row, w, BRICK_H);
      ctx.fillStyle = col.BRICK_D;
      ctx.fillRect(sx, topY + row + BRICK_H, w, 1);
      const jOffset = rowOdd * (BRICK_W / 2);
      for (let jx = sx + jOffset; jx < sx + w; jx += BRICK_W) {
        ctx.fillRect(jx, topY + row, 1, BRICK_H);
      }
    }
  },
};
