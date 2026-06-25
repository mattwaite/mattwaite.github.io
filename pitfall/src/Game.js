class Game {
  constructor(canvas) {
    this.renderer = new Renderer(canvas);
    this.camera   = new Camera();
    this.world    = new World();
    this.player   = new Player(C.ROOM_W / 2);
    this.hud      = new HUD();
    this.theme    = DCMallTheme;

    this.score     = 0;
    this.lives     = C.LIVES;
    this.timeLeft  = C.GAME_TIME;
    this.gameState = 'menu'; // menu | playing | gameover | win

    this._lastTime   = null;
    this._keys       = {};
    this._jumpWas    = false;
    this._downWas    = false;

    this._bindInput();
  }

  _bindInput() {
    // ── Keyboard ──────────────────────────────────────────────────────────
    const prevent = new Set([
      'Space','ArrowLeft','ArrowRight','ArrowUp','ArrowDown'
    ]);
    document.addEventListener('keydown', e => {
      this._keys[e.code] = true;
      if (prevent.has(e.code)) e.preventDefault();
    });
    document.addEventListener('keyup', e => { this._keys[e.code] = false; });

    // ── On-screen touch buttons ───────────────────────────────────────────
    const btnMap = [
      ['btn-left',  'ArrowLeft'],
      ['btn-right', 'ArrowRight'],
      ['btn-jump',  'Space'],
      ['btn-down',  'ArrowDown'],
    ];
    for (const [id, code] of btnMap) {
      const el = document.getElementById(id);
      if (!el) continue;
      el.addEventListener('touchstart', e => {
        e.preventDefault();
        this._keys[code] = true;
        el.classList.add('pressed');
      }, { passive: false });
      const release = e => {
        e.preventDefault();
        this._keys[code] = false;
        el.classList.remove('pressed');
      };
      el.addEventListener('touchend',    release, { passive: false });
      el.addEventListener('touchcancel', release, { passive: false });
    }

    // Prevent page scroll while the game is running
    document.addEventListener('touchmove', e => {
      if (this.gameState === 'playing') e.preventDefault();
    }, { passive: false });
  }

  _readInput() {
    const k = this._keys;
    const left  = !!(k['ArrowLeft']  || k['KeyA']);
    const right = !!(k['ArrowRight'] || k['KeyD']);
    const up    = !!(k['ArrowUp']    || k['KeyW']);
    const down  = !!(k['ArrowDown']  || k['KeyS']);
    const jumpDown = !!(k['Space'] || k['ArrowUp'] || k['KeyW']);

    const jumpPressed = jumpDown && !this._jumpWas;
    const downPressed = down    && !this._downWas;

    this._jumpWas = jumpDown;
    this._downWas = down;

    return { left, right, up, down, jumpPressed, downPressed };
  }

  start() {
    this._lastTime = performance.now();
    requestAnimationFrame(t => this._loop(t));
  }

  _loop(ts) {
    const dt = Math.min((ts - this._lastTime) / 1000, 0.05);
    this._lastTime = ts;
    this._update(dt);
    this._render();
    requestAnimationFrame(t => this._loop(t));
  }

  _update(dt) {
    const input = this._readInput();

    if (this.gameState === 'menu') {
      if (input.jumpPressed) this.gameState = 'playing';
      return;
    }

    if (this.gameState === 'gameover' || this.gameState === 'win') {
      if (input.jumpPressed) this._reset();
      return;
    }

    // ── Playing ────────────────────────────────────────────────────────
    this.timeLeft -= dt;
    if (this.timeLeft <= 0) {
      this.timeLeft  = 0;
      this.gameState = 'gameover';
      return;
    }

    this.world.update(dt, this.player.worldX);
    this.player.update(dt, input, this.world);
    this.camera.follow(this.player.worldX);

    // Collect items
    this.score += this.world.collectItems(this.player);

    // Handle player death
    if (this.player.state === 'dead' && this.player.deadTimer <= 0) {
      this.lives--;
      if (this.lives <= 0) {
        this.gameState = 'gameover';
      } else {
        this._respawn();
      }
    }
  }

  _respawn() {
    const savedX   = this.player.worldX;
    this.player    = new Player(savedX);
    this.player.invincible = 3; // 3 seconds of invincibility
    this.camera.follow(savedX);
  }

  _reset() {
    this.score     = 0;
    this.lives     = C.LIVES;
    this.timeLeft  = C.GAME_TIME;
    this.world     = new World();
    this.player    = new Player(C.ROOM_W / 2);
    this.camera.follow(this.player.worldX);
    this.gameState = 'playing';
  }

  _render() {
    const r   = this.renderer;
    const ctx = r.ctx;

    r.clear();

    if (this.gameState === 'menu') {
      this.theme.drawBackground(ctx, 0, []);
      this.hud.drawOverlay(ctx, [
        'PITFALL!',
        '',
        'ARROW KEYS or WASD to move',
        'SPACE / UP to jump',
        'DOWN near ladder to descend',
        'Jump into vine to swing',
        '',
        'PRESS SPACE TO START',
      ]);
    } else if (this.gameState === 'playing') {
      const cam = this.camera.x;
      this.theme.drawBackground(ctx, cam, this.world.pits);
      this.world.drawUnderground(ctx, cam);
      this.world.drawSurface(ctx, cam);
      this.player.draw(ctx, cam, this.theme);
      this.hud.draw(ctx, this.score, this.lives, this.timeLeft);
    } else if (this.gameState === 'gameover') {
      this.theme.drawBackground(ctx, this.camera.x, this.world.pits);
      this.hud.drawOverlay(ctx, [
        'GAME OVER',
        '',
        `FINAL SCORE: ${this.score}`,
        '',
        'PRESS SPACE TO PLAY AGAIN',
      ]);
    }

    r.blit();
  }
}
