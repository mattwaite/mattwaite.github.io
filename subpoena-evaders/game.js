(() => {
  "use strict";

  // ---------------------------------------------------------------------------
  // Words on screen. Edit freely.
  // ---------------------------------------------------------------------------
  const COPY = {
    title: "SUBPOENA EVADERS",
    subtitle: ["A NEW CONGRESS IS COMING.", "IT HAS QUESTIONS."],
    start: "PRESS SPACE OR TAP TO START",
    bonusName: "JOE BIDEN",
    gameOver: "SUBPOENAED",
    gameOverSub: "THE COMMITTEE WILL SEE YOU NOW.",
    landed: "THEY'RE IN THE BUILDING.",
    cleared: "SUBPOENAS QUASHED",
    clearedSub: "MORE ARE COMING.",
    paused: "RECESS",
    again: "PRESS SPACE OR TAP TO PLAY AGAIN",
  };

  // Formation, top row first.
  const ROWS = [
    { key: "row5", name: "THE DEMOCRATS", pts: 50 },
    { key: "row4", name: "SEN. BERNIE SANDERS", pts: 40 },
    { key: "row3", name: "SEN. CHUCK SCHUMER", pts: 30 },
    { key: "row2", name: "REP. A. OCASIO-CORTEZ", pts: 20 },
    { key: "row1", name: "REP. HAKEEM JEFFRIES", pts: 10 },
  ];
  const BONUS_POINTS = [50, 100, 150, 300];

  // ---------------------------------------------------------------------------
  // Layout (logical pixels)
  // ---------------------------------------------------------------------------
  const W = 384, H = 336;
  const COLS = 11, CELL_W = 26, CELL_H = 26;
  const FORM_TOP = 56;
  const BUNKER_Y = 238;
  const PLAYER_Y = 302;
  const GROUND_Y = H - 5;
  const BONUS_Y = 20;

  const canvas = document.getElementById("game");
  const ctx = canvas.getContext("2d");

  // ---------------------------------------------------------------------------
  // Sprites
  // ---------------------------------------------------------------------------
  function buildSprite(def) {
    const c = document.createElement("canvas");
    c.width = def.w;
    c.height = def.h;
    const x = c.getContext("2d");
    const mask = new Uint8Array(def.w * def.h);
    def.rows.forEach((row, yy) => {
      for (let xx = 0; xx < row.length; xx++) {
        const ch = row[xx];
        if (ch === ".") continue;
        x.fillStyle = def.palette[+ch];
        x.fillRect(xx, yy, 1, 1);
        mask[yy * def.w + xx] = 1;
      }
    });
    return { img: c, mask, w: def.w, h: def.h, color: def.palette[0] };
  }

  function fromArt(rows, colors) {
    const keys = Object.keys(colors);
    return buildSprite({
      w: rows[0].length,
      h: rows.length,
      palette: keys.map((k) => colors[k]),
      rows: rows.map((r) => r.replace(/./g, (ch) => (ch in colors ? String(keys.indexOf(ch)) : "."))),
    });
  }

  const SPR = {};
  for (const k of Object.keys(window.SPRITES || {})) SPR[k] = buildSprite(window.SPRITES[k]);

  // Placeholder bonus ship if source-images/bonus.png hasn't been added.
  if (!SPR.bonus) {
    SPR.bonus = fromArt(
      [
        "....gggggg....",
        "..gggggggggg..",
        ".gg?gg??gg?gg.",
        "gggggggggggggg",
        ".gg.gg..gg.gg.",
        "..g........g..",
      ],
      { g: "#9a9aaa", "?": "#f2d35b" }
    );
  }

  // VETO, stacked vertically: the President's shot.
  const VETO = fromArt(
    [
      "r.r", "r.r", "r.r", "r.r", ".r.", "...",
      "rrr", "r..", "rr.", "r..", "rrr", "...",
      "rrr", ".r.", ".r.", ".r.", ".r.", "...",
      "rrr", "r.r", "r.r", "r.r", "rrr",
    ],
    { r: "#ff3b3b" }
  );

  // Subpoena: a rolled document with a red seal ribbon.
  const SUBPOENA = [
    fromArt(
      [".ppp.", "ppppp", "plplp", "ppppp", "rrrrr", "ppppp", "plplp", ".ppp."],
      { p: "#f4ecd4", l: "#8b8577", r: "#d0202e" }
    ),
    fromArt(
      ["..pp.", ".pppp", "pplpp", "ppppp", "rrrrr", "ppppp", "pplpp", ".pp.."],
      { p: "#f4ecd4", l: "#8b8577", r: "#d0202e" }
    ),
  ];

  // ---------------------------------------------------------------------------
  // White House bunkers (destructible, per pixel)
  // ---------------------------------------------------------------------------
  // North facade: flag, pediment, columned portico, two windowed wings.
  const WH_W = 44, WH_H = 24;
  const WH_COLORS = {
    f: "#d0202e", F: "#f4f2ec", b: "#2b4fbf", "|": "#bdbdbd", a: "#f6f4ee",
    w: "#f1efe8", s: "#c9c6bd", c: "#a29f95", k: "#4d5566", g: "#9b988f",
  };
  const WH_ART = (() => {
    const g = Array.from({ length: WH_H }, () => new Array(WH_W).fill("."));
    const set = (x, y, ch) => { if (x >= 0 && x < WH_W && y >= 0 && y < WH_H) g[y][x] = ch; };
    const mid = WH_W / 2; // 22
    // flag
    for (let y = 0; y <= 4; y++) set(mid - 1, y, "|");
    for (let y = 0; y <= 2; y++)
      for (let x = mid; x <= mid + 4; x++)
        set(x, y, x <= mid + 1 && y <= 1 ? "b" : y % 2 ? "F" : "f");
    // pediment
    for (let r = 0; r < 4; r++) {
      const half = 3 + r * 2.4;
      for (let x = Math.round(mid - half); x < Math.round(mid + half); x++) set(x, 5 + r, r === 3 ? "s" : "a");
    }
    // portico
    for (let x = 12; x < 32; x++) {
      set(x, 9, "s");
      for (let y = 10; y < 22; y++) set(x, y, (x - 12) % 4 < 2 ? "w" : "c");
      set(x, 22, "g");
      set(x, 23, "g");
    }
    // wings
    for (const [x0, x1] of [[0, 12], [32, 44]]) {
      for (let x = x0; x < x1; x++) {
        set(x, 11, (x - x0) % 2 ? "." : "s");
        set(x, 12, "s");
        for (let y = 13; y < 22; y++) set(x, y, "w");
        set(x, 22, "g");
        set(x, 23, "g");
      }
      for (let wx = x0 + 1; wx < x1 - 1; wx += 4)
        for (const wy of [15, 19]) { set(wx + 1, wy, "k"); set(wx + 2, wy, "k"); set(wx + 1, wy + 1, "k"); set(wx + 2, wy + 1, "k"); }
    }
    // front door (a notch, like the classic bunkers)
    for (let y = 18; y < 24; y++) for (let x = mid - 2; x < mid + 2; x++) set(x, y, ".");
    return g.map((r) => r.join(""));
  })();

  function makeBunker(x) {
    const h = WH_H, w = WH_W;
    const cells = new Array(w * h).fill(null);
    for (let y = 0; y < h; y++)
      for (let xx = 0; xx < w; xx++) {
        const ch = WH_ART[y][xx];
        if (ch !== ".") cells[y * w + xx] = WH_COLORS[ch];
      }
    return { x, y: BUNKER_Y, w, h, cells };
  }

  function bunkerHit(b, rx, ry, rw, rh, fromAbove) {
    const x0 = Math.max(rx, b.x), x1 = Math.min(rx + rw, b.x + b.w);
    const y0 = Math.max(ry, b.y), y1 = Math.min(ry + rh, b.y + b.h);
    if (x0 >= x1 || y0 >= y1) return null;
    // scan from the side the shot comes from
    for (let i = 0; i < y1 - y0; i++) {
      const y = fromAbove ? y0 + i : y1 - 1 - i;
      for (let x = x0; x < x1; x++)
        if (b.cells[(y - b.y) * b.w + (x - b.x)]) return { x, y };
    }
    return null;
  }

  function damageBunker(b, cx, cy) {
    for (let y = -3; y <= 3; y++)
      for (let x = -3; x <= 3; x++) {
        const d = x * x + y * y;
        if (d > 10 || (d > 4 && Math.random() < 0.45)) continue;
        const bx = cx + x - b.x, by = cy + y - b.y;
        if (bx >= 0 && bx < b.w && by >= 0 && by < b.h) b.cells[by * b.w + bx] = null;
      }
  }

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------
  function spriteHit(spr, sx, sy, rx, ry, rw, rh) {
    const x0 = Math.max(rx, sx), x1 = Math.min(rx + rw, sx + spr.w);
    const y0 = Math.max(ry, sy), y1 = Math.min(ry + rh, sy + spr.h);
    for (let y = y0; y < y1; y++)
      for (let x = x0; x < x1; x++)
        if (spr.mask[(y - sy) * spr.w + (x - sx)]) return true;
    return false;
  }

  const rand = (a, b) => a + Math.floor(Math.random() * (b - a + 1));

  function loadHigh() {
    try { return +localStorage.getItem("subpoena-evaders-high") || 0; } catch (e) { return 0; }
  }
  function saveHigh(v) {
    try { localStorage.setItem("subpoena-evaders-high", String(v)); } catch (e) { /* private mode */ }
  }

  // ---------------------------------------------------------------------------
  // Sound (synthesized)
  // ---------------------------------------------------------------------------
  const Sound = {
    ac: null, on: true, bonusOsc: null,
    init() {
      if (this.ac) return;
      try { this.ac = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { this.ac = null; }
    },
    tone(type, f0, f1, dur, vol = 0.12, when = 0) {
      if (!this.on || !this.ac) return;
      const t = this.ac.currentTime + when;
      const o = this.ac.createOscillator(), g = this.ac.createGain();
      o.type = type;
      o.frequency.setValueAtTime(f0, t);
      o.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + dur);
      g.gain.setValueAtTime(vol, t);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(g).connect(this.ac.destination);
      o.start(t);
      o.stop(t + dur + 0.02);
    },
    noise(dur, vol = 0.15, cutoff = 1800) {
      if (!this.on || !this.ac) return;
      const n = Math.floor(this.ac.sampleRate * dur);
      const buf = this.ac.createBuffer(1, n, this.ac.sampleRate);
      const d = buf.getChannelData(0);
      for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / n);
      const s = this.ac.createBufferSource(), g = this.ac.createGain(), f = this.ac.createBiquadFilter();
      f.type = "lowpass";
      f.frequency.value = cutoff;
      s.buffer = buf;
      g.gain.value = vol;
      s.connect(f).connect(g).connect(this.ac.destination);
      s.start();
    },
    gavel(hi) { // the formation marches to a gavel
      this.tone("triangle", hi ? 190 : 150, 60, 0.09, 0.22);
      this.noise(0.03, 0.08, 3000);
    },
    shoot() { this.tone("square", 880, 220, 0.12, 0.06); },
    hit() { this.noise(0.18, 0.2, 2400); this.tone("square", 300, 80, 0.15, 0.05); },
    bunker() { this.noise(0.05, 0.06, 1200); },
    playerHit() { this.noise(0.7, 0.28, 900); this.tone("sawtooth", 400, 40, 0.8, 0.08); },
    bonusHit() { [523, 659, 784, 1046].forEach((f, i) => this.tone("square", f, f, 0.09, 0.06, i * 0.07)); },
    bonusStart() {
      if (!this.on || !this.ac || this.bonusOsc) return;
      const o = this.ac.createOscillator(), lfo = this.ac.createOscillator();
      const lg = this.ac.createGain(), g = this.ac.createGain();
      o.type = "sine"; o.frequency.value = 620;
      lfo.frequency.value = 7; lg.gain.value = 120;
      g.gain.value = 0.04;
      lfo.connect(lg).connect(o.frequency);
      o.connect(g).connect(this.ac.destination);
      o.start(); lfo.start();
      this.bonusOsc = { o, lfo };
    },
    bonusStop() {
      if (!this.bonusOsc) return;
      try { this.bonusOsc.o.stop(); this.bonusOsc.lfo.stop(); } catch (e) { /* already stopped */ }
      this.bonusOsc = null;
    },
  };

  // ---------------------------------------------------------------------------
  // Game state
  // ---------------------------------------------------------------------------
  const G = {
    state: "title",
    score: 0, high: loadHigh(), lives: 3, wave: 1,
    enemies: [], fx: 0, fy: 0, dir: 1, stepTimer: 0, animFrame: 0,
    player: { x: W / 2 }, shot: null, bombs: [], bunkers: [],
    bonus: null, bonusTimer: 0, fireTimer: 0,
    effects: [], timer: 0, frame: 0, gameOverReason: "",
  };

  function newWave() {
    G.enemies = [];
    for (let r = 0; r < ROWS.length; r++)
      for (let c = 0; c < COLS; c++)
        G.enemies.push({ r, c, alive: true, spr: SPR[ROWS[r].key] });
    G.fx = Math.floor((W - COLS * CELL_W) / 2);
    G.fy = FORM_TOP + Math.min(G.wave - 1, 6) * 8;
    G.dir = 1;
    G.stepTimer = 30;
    G.shot = null;
    G.bombs = [];
    G.bonus = null;
    G.bonusTimer = rand(900, 1400);
    G.fireTimer = 90;
    const gap = (W - 4 * WH_W) / 5;
    G.bunkers = [0, 1, 2, 3].map((i) => makeBunker(Math.round(gap + i * (WH_W + gap))));
    G.player.x = W / 2;
    Sound.bonusStop();
  }

  function newGame() {
    G.score = 0;
    G.lives = 3;
    G.wave = 1;
    G.effects = [];
    newWave();
    G.state = "playing";
  }

  function enemyPos(e) {
    const bob = (e.c + e.r + G.animFrame) % 2;
    return {
      x: G.fx + e.c * CELL_W + Math.floor((CELL_W - e.spr.w) / 2),
      y: G.fy + e.r * CELL_H + (CELL_H - e.spr.h) - bob,
    };
  }

  function addScore(n) {
    G.score += n;
    if (G.score > G.high) { G.high = G.score; saveHigh(G.high); }
  }

  // ---------------------------------------------------------------------------
  // Input
  // ---------------------------------------------------------------------------
  const keys = { left: false, right: false, fire: false };
  let firePressed = false;

  function press(k, down) {
    Sound.init();
    if (Sound.ac && Sound.ac.state === "suspended") Sound.ac.resume();
    if (k === "fire" && down && !keys.fire) firePressed = true;
    keys[k] = down;
  }

  window.addEventListener("keydown", (e) => {
    const map = { ArrowLeft: "left", KeyA: "left", ArrowRight: "right", KeyD: "right", Space: "fire", ArrowUp: "fire" };
    if (map[e.code]) { e.preventDefault(); press(map[e.code], true); return; }
    if (e.code === "KeyP" || e.code === "Escape") togglePause();
    if (e.code === "KeyM") toggleMute();
    if (e.code === "Enter") press("fire", true);
  });
  window.addEventListener("keyup", (e) => {
    const map = { ArrowLeft: "left", KeyA: "left", ArrowRight: "right", KeyD: "right", Space: "fire", ArrowUp: "fire", Enter: "fire" };
    if (map[e.code]) { e.preventDefault(); press(map[e.code], false); }
  });
  window.addEventListener("blur", () => { keys.left = keys.right = keys.fire = false; slideTarget = slidePointer = null; slider.classList.remove("held"); if (G.state === "playing") togglePause(); });

  document.querySelectorAll(".touch button").forEach((b) => {
    const k = b.dataset.key;
    const down = (e) => { e.preventDefault(); b.classList.add("held"); press(k, true); };
    const up = (e) => { e.preventDefault(); b.classList.remove("held"); press(k, false); };
    b.addEventListener("pointerdown", down);
    b.addEventListener("pointerup", up);
    b.addEventListener("pointercancel", up);
    b.addEventListener("pointerleave", up);
  });
  // Touch slider: the finger's spot on the track is where the President heads,
  // at the same top speed as the arrow keys.
  const slider = document.getElementById("slider");
  const knob = document.getElementById("knob");
  let slideTarget = null, slidePointer = null;
  const playerMin = () => SPR.defender.w / 2 + 4;
  const playerMax = () => W - SPR.defender.w / 2 - 4;
  const KNOB_PAD = 22; // keeps the knob inside the track at either end
  function slideTo(e) {
    const r = slider.getBoundingClientRect();
    const t = Math.max(0, Math.min(1, (e.clientX - r.left - KNOB_PAD) / (r.width - KNOB_PAD * 2)));
    slideTarget = playerMin() + t * (playerMax() - playerMin());
  }
  slider.addEventListener("pointerdown", (e) => {
    e.preventDefault();
    Sound.init();
    if (Sound.ac && Sound.ac.state === "suspended") Sound.ac.resume();
    slidePointer = e.pointerId;
    try { slider.setPointerCapture(e.pointerId); } catch (_) {}
    slider.classList.add("held");
    slideTo(e);
  });
  slider.addEventListener("pointermove", (e) => { if (e.pointerId === slidePointer) slideTo(e); });
  const slideEnd = (e) => {
    if (e.pointerId !== slidePointer) return;
    slidePointer = null; slideTarget = null;
    slider.classList.remove("held");
  };
  slider.addEventListener("pointerup", slideEnd);
  slider.addEventListener("pointercancel", slideEnd);
  function drawKnob() {
    if (!slider.offsetWidth) return;
    const x = slideTarget != null && G.state !== "playing" ? slideTarget : G.player.x;
    const t = (x - playerMin()) / (playerMax() - playerMin());
    knob.style.left = (KNOB_PAD + Math.max(0, Math.min(1, t)) * (slider.clientWidth - KNOB_PAD * 2)) + "px";
  }

  canvas.addEventListener("pointerdown", (e) => {
    e.preventDefault();
    if (G.state === "paused") togglePause();
    else if (G.state !== "playing" && G.state !== "dying") { press("fire", true); press("fire", false); }
  });

  function togglePause() {
    if (G.state === "playing") { G.state = "paused"; Sound.bonusStop(); }
    else if (G.state === "paused") { G.state = "playing"; if (G.bonus) Sound.bonusStart(); }
  }

  const muteBtn = document.getElementById("mute");
  function toggleMute() {
    Sound.on = !Sound.on;
    if (!Sound.on) Sound.bonusStop();
    else if (G.bonus && G.state === "playing") Sound.bonusStart();
    muteBtn.textContent = "Sound: " + (Sound.on ? "on" : "off");
  }
  muteBtn.addEventListener("click", toggleMute);

  // ---------------------------------------------------------------------------
  // Update
  // ---------------------------------------------------------------------------
  function update() {
    G.frame++;
    const fire = firePressed;
    firePressed = false;

    for (const fx of G.effects) fx.t--;
    G.effects = G.effects.filter((fx) => fx.t > 0);

    if (G.state === "title" || G.state === "gameover") {
      if (fire && (G.state === "title" || G.timer <= 0)) newGame();
      if (G.timer > 0) G.timer--;
      return;
    }
    if (G.state === "paused") return;
    if (G.state === "cleared") {
      if (--G.timer <= 0) { G.wave++; newWave(); G.state = "playing"; }
      return;
    }
    if (G.state === "dying") {
      updateBombs();
      if (--G.timer <= 0) {
        if (G.lives <= 0) return endGame("");
        G.bombs = [];
        G.player.x = W / 2;
        G.state = "playing";
      }
      return;
    }

    // player
    const p = G.player, pw = SPR.defender.w;
    if (keys.left) p.x -= 2;
    if (keys.right) p.x += 2;
    if (slideTarget != null && !keys.left && !keys.right) p.x += Math.max(-2, Math.min(2, slideTarget - p.x));
    p.x = Math.max(pw / 2 + 4, Math.min(W - pw / 2 - 4, p.x));
    if (fire && !G.shot) {
      G.shot = { x: Math.round(p.x) - 1, y: PLAYER_Y - VETO.h };
      Sound.shoot();
    }

    updateShot();
    updateFormation();
    updateBombs();
    updateBonus();

    if (G.state === "playing" && G.enemies.every((e) => !e.alive)) {
      G.state = "cleared";
      G.timer = 150;
      Sound.bonusStop();
    }
  }

  function updateShot() {
    const s = G.shot;
    if (!s) return;
    s.y -= 6;
    if (s.y + VETO.h < 14) { G.shot = null; return; }
    const sx = s.x, sy = Math.floor(s.y), sw = VETO.w, sh = VETO.h;

    for (const e of G.enemies) {
      if (!e.alive) continue;
      const pos = enemyPos(e);
      if (sx + sw <= pos.x || sx >= pos.x + e.spr.w || sy + sh <= pos.y || sy >= pos.y + e.spr.h) continue;
      if (spriteHit(e.spr, pos.x, pos.y, sx, sy, sw, sh)) {
        e.alive = false;
        addScore(ROWS[e.r].pts);
        G.effects.push({ kind: "burst", x: pos.x + e.spr.w / 2, y: pos.y + e.spr.h / 2, t: 16, color: e.spr.color });
        G.shot = null;
        Sound.hit();
        return;
      }
    }

    if (G.bonus) {
      const b = G.bonus;
      if (spriteHit(SPR.bonus, Math.round(b.x), BONUS_Y, sx, sy, sw, sh)) {
        const pts = BONUS_POINTS[rand(0, BONUS_POINTS.length - 1)];
        addScore(pts);
        G.effects.push({ kind: "text", text: String(pts), x: b.x + SPR.bonus.w / 2, y: BONUS_Y + 14, t: 70, color: "#f2d35b" });
        G.effects.push({ kind: "burst", x: b.x + SPR.bonus.w / 2, y: BONUS_Y + SPR.bonus.h / 2, t: 16, color: "#f2d35b" });
        G.bonus = null;
        G.shot = null;
        Sound.bonusStop();
        Sound.bonusHit();
        return;
      }
    }

    for (let i = 0; i < G.bombs.length; i++) {
      const b = G.bombs[i];
      if (sx < b.x + 5 && sx + sw > b.x && sy < b.y + 8 && sy + sh > b.y) {
        G.bombs.splice(i, 1);
        G.effects.push({ kind: "burst", x: b.x + 2, y: b.y + 4, t: 10, color: "#f4ecd4" });
        G.shot = null;
        return;
      }
    }

    for (const b of G.bunkers) {
      const hit = bunkerHit(b, sx, sy, sw, sh, false);
      if (hit) { damageBunker(b, hit.x, hit.y); G.shot = null; Sound.bunker(); return; }
    }
  }

  function updateFormation() {
    const alive = G.enemies.filter((e) => e.alive);
    if (!alive.length) return;
    if (--G.stepTimer > 0) return;
    G.stepTimer = Math.max(2, Math.floor(alive.length * 0.8) - (G.wave - 1));

    let minX = Infinity, maxX = -Infinity;
    for (const e of alive) {
      const pos = enemyPos(e);
      minX = Math.min(minX, pos.x);
      maxX = Math.max(maxX, pos.x + e.spr.w);
    }
    const dx = 3 * G.dir;
    if (maxX + dx > W - 4 || minX + dx < 4) { G.fy += 8; G.dir *= -1; }
    else G.fx += dx;
    G.animFrame ^= 1;
    Sound.gavel(G.animFrame);

    // the formation tramples the bunkers and can reach the President
    for (const e of alive) {
      const pos = enemyPos(e);
      for (const b of G.bunkers) {
        if (pos.x + e.spr.w <= b.x || pos.x >= b.x + b.w || pos.y + e.spr.h <= b.y || pos.y >= b.y + b.h) continue;
        for (let y = 0; y < e.spr.h; y++)
          for (let x = 0; x < e.spr.w; x++) {
            if (!e.spr.mask[y * e.spr.w + x]) continue;
            const bx = pos.x + x - b.x, by = pos.y + y - b.y;
            if (bx >= 0 && bx < b.w && by >= 0 && by < b.h) b.cells[by * b.w + bx] = null;
          }
      }
      if (pos.y + e.spr.h >= PLAYER_Y + 4) { endGame(COPY.landed); return; }
    }
  }

  function updateBombs() {
    if (G.state === "playing") {
      if (--G.fireTimer <= 0) {
        const alive = G.enemies.filter((e) => e.alive);
        G.fireTimer = Math.max(14, 55 - G.wave * 5 - Math.floor((55 - alive.length) / 2)) + rand(0, 20);
        if (alive.length && G.bombs.length < 2 + G.wave) {
          // prefer columns near the President about half the time
          const cols = [...new Set(alive.map((e) => e.c))];
          let col = cols[rand(0, cols.length - 1)];
          if (Math.random() < 0.5) {
            col = cols.reduce((best, c) => {
              const cx = G.fx + c * CELL_W + CELL_W / 2;
              const bx = G.fx + best * CELL_W + CELL_W / 2;
              return Math.abs(cx - G.player.x) < Math.abs(bx - G.player.x) ? c : best;
            }, cols[0]);
          }
          const shooter = alive.filter((e) => e.c === col).sort((a, b) => b.r - a.r)[0];
          const pos = enemyPos(shooter);
          G.bombs.push({ x: pos.x + Math.floor(shooter.spr.w / 2) - 2, y: pos.y + shooter.spr.h, v: 1.4 + Math.min(G.wave, 6) * 0.15 + Math.random() * 0.4 });
        }
      }
    }

    const p = G.player, ps = SPR.defender;
    const px = Math.round(p.x - ps.w / 2);
    G.bombs = G.bombs.filter((b) => {
      b.y += b.v;
      const by = Math.floor(b.y);
      if (by > GROUND_Y - 8) {
        G.effects.push({ kind: "burst", x: b.x + 2, y: GROUND_Y - 2, t: 8, color: "#f4ecd4" });
        return false;
      }
      for (const bk of G.bunkers) {
        const hit = bunkerHit(bk, b.x, by, 5, 8, true);
        if (hit) { damageBunker(bk, hit.x, hit.y); Sound.bunker(); return false; }
      }
      if (G.state === "playing" && spriteHit(ps, px, PLAYER_Y, b.x, by, 5, 8)) {
        playerHit();
        return false;
      }
      return true;
    });
  }

  function playerHit() {
    G.lives--;
    G.state = "dying";
    G.timer = 100;
    G.shot = null;
    G.effects.push({ kind: "burst", x: G.player.x, y: PLAYER_Y + 12, t: 40, color: "#f4ecd4", big: true });
    Sound.bonusStop();
    Sound.playerHit();
  }

  function updateBonus() {
    if (G.bonus) {
      G.bonus.x += G.bonus.dir * 0.9;
      if (G.bonus.x < -SPR.bonus.w - 2 || G.bonus.x > W + 2) { G.bonus = null; Sound.bonusStop(); }
      return;
    }
    if (--G.bonusTimer <= 0) {
      G.bonusTimer = rand(1100, 1700);
      if (G.enemies.filter((e) => e.alive).length < 8) return;
      const dir = Math.random() < 0.5 ? 1 : -1;
      G.bonus = { dir, x: dir > 0 ? -SPR.bonus.w : W };
      Sound.bonusStart();
    }
  }

  function endGame(reason) {
    G.state = "gameover";
    G.gameOverReason = reason;
    G.timer = 60;
    Sound.bonusStop();
    if (reason) Sound.playerHit();
  }

  // ---------------------------------------------------------------------------
  // Draw
  // ---------------------------------------------------------------------------
  function text(str, x, y, size = 8, color = "#e8e6df", align = "left") {
    ctx.font = `${size}px "Press Start 2P", monospace`;
    ctx.fillStyle = color;
    ctx.textAlign = align;
    ctx.textBaseline = "top";
    ctx.fillText(str, x, y);
  }

  function drawSprite(spr, x, y) { ctx.drawImage(spr.img, Math.round(x), Math.round(y)); }

  function drawBurst(fx) {
    const r = fx.big ? 14 : 8;
    const k = 1 - fx.t / (fx.big ? 40 : 16);
    ctx.fillStyle = fx.color;
    for (let i = 0; i < (fx.big ? 18 : 10); i++) {
      const a = (i / (fx.big ? 18 : 10)) * Math.PI * 2 + (i % 2) * 0.3;
      const d = r * (0.35 + k * 0.9) * (i % 3 === 0 ? 1 : 0.7);
      ctx.fillRect(Math.round(fx.x + Math.cos(a) * d), Math.round(fx.y + Math.sin(a) * d), i % 2 ? 2 : 1, i % 2 ? 1 : 2);
    }
  }

  function drawHUD() {
    text("SCORE " + String(G.score).padStart(6, "0"), 6, 5);
    text("HIGH " + String(G.high).padStart(6, "0"), W / 2 + 18, 5, 8, "#e8e6df", "center");
    text("LIVES " + Math.max(0, G.lives), W - 6, 5, 8, "#e8e6df", "right");
  }

  function drawPlay() {
    drawHUD();

    // formation
    for (const e of G.enemies) if (e.alive) { const p = enemyPos(e); drawSprite(e.spr, p.x, p.y); }

    if (G.bonus) drawSprite(SPR.bonus, G.bonus.x, BONUS_Y);

    // bunkers
    for (const b of G.bunkers)
      for (let y = 0; y < b.h; y++)
        for (let x = 0; x < b.w; x++) {
          const c = b.cells[y * b.w + x];
          if (c) { ctx.fillStyle = c; ctx.fillRect(b.x + x, b.y + y, 1, 1); }
        }

    // player
    if (G.state !== "dying" || (G.timer > 70 && G.frame % 6 < 3)) {
      drawSprite(SPR.defender, G.player.x - SPR.defender.w / 2, PLAYER_Y);
    }
    if (G.shot) drawSprite(VETO, G.shot.x, G.shot.y);
    for (const b of G.bombs) drawSprite(SUBPOENA[(G.frame >> 3) & 1], b.x, b.y);

    // ground
    ctx.fillStyle = "#3a6b46";
    ctx.fillRect(0, GROUND_Y, W, 1);

    for (const fx of G.effects) {
      if (fx.kind === "burst") drawBurst(fx);
      else text(fx.text, fx.x, fx.y, 8, fx.color, "center");
    }

    if (G.state === "cleared") banner(COPY.cleared, COPY.clearedSub, "#f2d35b");
    if (G.state === "paused") banner(COPY.paused, "PRESS P TO RESUME", "#e8e6df");
    if (G.state === "gameover") {
      banner(COPY.gameOver, G.gameOverReason || COPY.gameOverSub, "#ff3b3b");
      if (G.timer <= 0 && (G.frame >> 5) % 2 === 0) text(COPY.again, W / 2, 214, 8, "#e8e6df", "center");
    }
  }

  function banner(big, small, color) {
    ctx.fillStyle = "rgba(0,0,0,0.78)";
    ctx.fillRect(0, 132, W, 102);
    text(big, W / 2, 150, 16, color, "center");
    text(small, W / 2, 178, 8, "#e8e6df", "center");
  }

  function drawTitle() {
    drawHUD();
    text(COPY.title, W / 2, 34, 16, "#ff3b3b", "center");
    COPY.subtitle.forEach((l, i) => text(l, W / 2, 62 + i * 14, 8, "#e8e6df", "center"));

    const top = 102, rowH = 30, sx = 64;
    const table = [{ spr: SPR.bonus, name: COPY.bonusName, pts: "??? POINTS", color: "#f2d35b" }]
      .concat(ROWS.map((r) => ({ spr: SPR[r.key], name: r.name, pts: r.pts + " POINTS", color: "#e8e6df" })));
    table.forEach((row, i) => {
      const y = top + i * rowH;
      drawSprite(row.spr, sx - Math.floor(row.spr.w / 2), y + Math.floor((26 - row.spr.h) / 2));
      text(row.name, sx + 22, y + 6, 8, row.color);
      text(row.pts, sx + 22, y + 17, 8, "#8a8798");
    });

    if ((G.frame >> 5) % 2 === 0) text(COPY.start, W / 2, H - 22, 8, "#e8e6df", "center");
  }

  function draw() {
    ctx.setTransform(scale, 0, 0, scale, 0, 0);
    ctx.imageSmoothingEnabled = false;
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, W, H);
    if (G.state === "title") drawTitle();
    else drawPlay();
  }

  // ---------------------------------------------------------------------------
  // Sizing: the backing store is an integer multiple of the logical size, so
  // every sprite pixel lands on whole device pixels.
  // ---------------------------------------------------------------------------
  let scale = 1;
  function resize() {
    const touch = document.getElementById("touch");
    const reserved = (touch.offsetHeight ? touch.offsetHeight + 14 : 0) + 70;
    const availW = Math.min(window.innerWidth - 32, 1100);
    const availH = window.innerHeight - reserved;
    let css = Math.min(availW / W, availH / H);
    if (css >= 1) css = Math.max(1, Math.floor(css * 2) / 2);
    css = Math.max(0.5, css);
    const dpr = window.devicePixelRatio || 1;
    scale = Math.max(1, Math.ceil(css * dpr));
    canvas.width = W * scale;
    canvas.height = H * scale;
    canvas.style.width = Math.floor(W * css) + "px";
    canvas.style.height = Math.floor(H * css) + "px";
  }
  window.addEventListener("resize", resize);
  resize();

  // ---------------------------------------------------------------------------
  // Loop: fixed 60 updates per second
  // ---------------------------------------------------------------------------
  let last = performance.now(), acc = 0;
  function loop(now) {
    acc += Math.min(100, now - last);
    last = now;
    while (acc >= 1000 / 60) { update(); acc -= 1000 / 60; }
    draw();
    drawKnob();
    requestAnimationFrame(loop);
  }
  const fontReady = document.fonts && document.fonts.load ? document.fonts.load('8px "Press Start 2P"') : Promise.resolve();
  fontReady.catch(() => {}).finally(() => requestAnimationFrame(loop));

  // hooks for testing in the console
  window.__SE = { G, newGame, step: (n = 1) => { for (let i = 0; i < n; i++) update(); draw(); } };
})();
