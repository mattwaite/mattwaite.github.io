const C = {
  // Canvas
  W: 320, H: 200, SCALE: 3,

  // Y layout (all in internal pixels)
  GROUND_Y:    115,   // surface floor — player bottom rests here
  GROUND_BOT:  133,   // bottom of yellow ground strip = underground ceiling
  TUNNEL_Y:    192,   // underground floor — player bottom rests here

  // Player
  PW: 12, PH: 20,

  // Physics
  GRAVITY:   640,
  JUMP_VY:  -290,
  WALK_SPD:   95,
  LADDER_SPD: 55,

  // Camera: player appears at this screen X
  CAM_LEAD: 80,

  // World
  ROOM_W:      320,
  TOTAL_ROOMS:  40,   // rooms in each direction from start

  // Game
  LIVES:     3,
  GAME_TIME: 1200,    // 20 minutes in seconds

  // Vine
  VINE_ANCHOR_Y: 18,
  VINE_LEN:      88,

  // Score values
  SCORE: { gold: 4000, silver: 3250, ring: 2000, bag: 1000 },

  // Colors — Atari-era palette, 16 named entries
  COL: {
    BLACK:    '#000000',
    SKY_A:    '#003a00',
    SKY_B:    '#0f5c0f',
    SKY_C:    '#1f7a1f',
    TRUNK:    '#7a3a10',
    LEAF_D:   '#5a3818',  // rope shadow
    LEAF_L:   '#8a6040',  // rope highlight
    GROUND:   '#c8a000',
    PIT:      '#000000',
    UNDER:    '#000000',
    BRICK_L:  '#cc4422',
    BRICK_D:  '#7a1800',
    VINE:     '#7a5030',  // rope brown (works across themes)
    P_BODY:   '#22aa22',
    P_SKIN:   '#f0a060',
    P_HAT:    '#cc2000',
    P_PANTS:  '#1a5200',
    SCORP:    '#cc8800',
    LOG_L:    '#aa6633',
    LOG_D:    '#6b3e1a',
    GOLD:     '#ffd700',
    SILVER:   '#c0c0c0',
    WHITE:    '#ffffff',
    GREY:     '#888888',
  }
};
