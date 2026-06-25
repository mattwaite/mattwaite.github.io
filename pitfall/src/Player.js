class Player {
  constructor(worldX) {
    this.worldX = worldX;
    this.y      = C.GROUND_Y;   // bottom of player
    this.vx     = 0;
    this.vy     = 0;

    this.layer    = 'surface';   // 'surface' | 'underground'
    this.state    = 'idle';      // idle | run | jump | swing | climb | dead
    this.grounded = true;
    this.facingRight = true;
    this.frame    = 0;

    // Vine swing
    this.vineRef    = null;
    this.vineAngle  = 0;
    this.vineOmega  = 0;

    // Ladder
    this.ladderRef = null;

    // Death countdown before respawn signal
    this.deadTimer = 0;

    // Invincibility frames after respawn
    this.invincible = 0;
  }

  get airborne() { return !this.grounded; }

  get floorY() { return this.layer === 'surface' ? C.GROUND_Y : C.TUNNEL_Y; }

  // ── Public actions ────────────────────────────────────────────────────────
  doJump() {
    if (this.state === 'swing') {
      this.releaseVine();
    } else if (this.state === 'climb') {
      // Jump off ladder back onto surface
      this.state    = 'jump';
      this.ladderRef = null;
      this.vy       = C.JUMP_VY * 0.7;
    } else if (this.grounded) {
      this.vy       = C.JUMP_VY;
      this.grounded = false;
      this.state    = 'jump';
    }
  }

  grabVine(vine) {
    this.state    = 'swing';
    this.vineRef  = vine;
    // Start at a pre-set angle in the approach direction so the player
    // gets a full, satisfying arc regardless of exact grab timing.
    const movingRight = this.vx >= 0;
    this.vineAngle = movingRight ? -Math.PI / 4.5 : Math.PI / 4.5;
    const speed    = Math.abs(this.vx) / C.VINE_LEN;
    this.vineOmega = movingRight ? speed : -speed;
    this.vx = 0;
    this.vy = 0;
  }

  releaseVine() {
    const L     = C.VINE_LEN;
    const theta = this.vineAngle;
    const omega = this.vineOmega;
    // Tangential velocity from pendulum motion (y increases downward)
    this.vx = L * omega * Math.cos(theta);
    this.vy = -L * omega * Math.sin(theta);
    this.state    = 'jump';
    this.vineRef  = null;
    this.grounded = false;
  }

  die() {
    if (this.state === 'dead' || this.invincible > 0) return;
    this.state     = 'dead';
    this.deadTimer = 1.8; // seconds before game signals respawn
    this.vx = 0;
    this.vy = 0;
  }

  // ── Main update ───────────────────────────────────────────────────────────
  update(dt, input, world) {
    this.frame++;
    if (this.invincible > 0) this.invincible -= dt;

    if (this.state === 'dead') {
      this.deadTimer -= dt;
      return;
    }

    if (this.state === 'swing') {
      this._updateSwing(dt, input);
      world.checkCollisions(this);
      return;
    }

    if (this.state === 'climb') {
      this._updateClimb(dt, input);
      return;
    }

    // ── Horizontal movement ───────────────────────────────────────────
    if (input.left) {
      this.vx = -C.WALK_SPD;
      this.facingRight = false;
      if (this.grounded) this.state = 'run';
    } else if (input.right) {
      this.vx = C.WALK_SPD;
      this.facingRight = true;
      if (this.grounded) this.state = 'run';
    } else {
      this.vx = 0;
      if (this.grounded && this.state !== 'jump') this.state = 'idle';
    }

    if (input.jumpPressed) this.doJump();

    // Descend ladder (down key while grounded on surface)
    if (input.downPressed && this.grounded && this.layer === 'surface') {
      const lad = world.getLadderAt(this.worldX);
      if (lad) {
        this.ladderRef = lad;
        this.worldX    = lad.worldX + 8;
        this.state     = 'climb';
        this.vx = 0; this.vy = 0;
        return;
      }
    }

    // ── Physics ───────────────────────────────────────────────────────
    if (!this.grounded) {
      this.vy += C.GRAVITY * dt;
      // Underground ceiling
      if (this.layer === 'underground' && this.y - C.PH < C.GROUND_BOT) {
        this.y  = C.GROUND_BOT + C.PH;
        this.vy = 0;
      }
    }

    this.worldX += this.vx * dt;
    this.y      += this.vy * dt;

    // ── Ground collision ──────────────────────────────────────────────
    const groundY = world.getGroundY(this.worldX, this.layer);

    if (groundY === Infinity) {
      // Over a pit — gravity takes over, player falls
      this.grounded = false;
      if (this.y > C.GROUND_Y + 30) this.die();
    } else if (this.y >= groundY && this.vy >= 0) {
      this.y        = groundY;
      this.vy       = 0;
      this.grounded = true;
      if (this.state === 'jump') this.state = 'idle';
    } else {
      this.grounded = false;
    }

    // ── Vine grab ────────────────────────────────────────────────────
    if (this.airborne && this.state === 'jump' && this.layer === 'surface') {
      const vine = world.getVineAt(this.worldX, this.y);
      if (vine) this.grabVine(vine);
    }

    // Left world boundary
    if (this.worldX < C.PW / 2) this.worldX = C.PW / 2;

    // Obstacle collisions
    world.checkCollisions(this);
  }

  // ── Swing (pendulum) ──────────────────────────────────────────────────────
  _updateSwing(dt, input) {
    const L = C.VINE_LEN, G = C.GRAVITY;
    this.vineOmega -= (G / L) * Math.sin(this.vineAngle) * dt;
    this.vineAngle += this.vineOmega * dt;

    const vine    = this.vineRef;
    this.worldX   = vine.worldX + Math.sin(this.vineAngle) * L;
    this.y        = C.VINE_ANCHOR_Y + Math.cos(this.vineAngle) * L;

    if (input.jumpPressed) this.releaseVine();
  }

  // ── Ladder climbing ───────────────────────────────────────────────────────
  _updateClimb(dt, input) {
    if (input.up)   this.vy = -C.LADDER_SPD;
    else if (input.down) this.vy = C.LADDER_SPD;
    else             this.vy = 0;

    this.y += this.vy * dt;

    // Reached surface top
    if (this.y <= C.GROUND_Y && this.vy <= 0) {
      this.y         = C.GROUND_Y;
      this.layer     = 'surface';
      this.state     = 'idle';
      this.ladderRef = null;
      this.grounded  = true;
    }

    // Reached underground bottom
    if (this.y >= C.TUNNEL_Y && this.vy >= 0) {
      this.y         = C.TUNNEL_Y;
      this.layer     = 'underground';
      this.state     = 'idle';
      this.ladderRef = null;
      this.grounded  = true;
    }
  }

  // ── Drawing ───────────────────────────────────────────────────────────────
  draw(ctx, camX, theme) {
    // Flicker during invincibility
    if (this.invincible > 0 && Math.floor(this.invincible * 12) % 2 === 0) return;

    const sx = this.worldX - camX;
    const sy = this.y;

    theme.drawPlayer(ctx, sx, sy, this.state, this.frame, this.facingRight, this.layer);

    // Draw vine rope when swinging
    if (this.state === 'swing' && this.vineRef) {
      const vineSx = this.vineRef.worldX - camX;
      ctx.strokeStyle = C.COL.VINE;
      ctx.lineWidth   = 2;
      ctx.beginPath();
      ctx.moveTo(vineSx, C.VINE_ANCHOR_Y);
      ctx.lineTo(sx, sy - C.PH / 2);
      ctx.stroke();
    }

    // Ladder line when climbing
    if (this.state === 'climb' && this.ladderRef) {
      // Already drawn by world; just show player on it
    }
  }
}
