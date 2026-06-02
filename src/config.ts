/**
 * Central tuning constants for the engine. Everything you'd want to tweak while
 * "perfecting the physics" lives here so gameplay feel can be adjusted in one
 * place without touching logic. Units are pixels and seconds unless noted.
 */

// ---------------------------------------------------------------------------
// Rendering / world scale
// ---------------------------------------------------------------------------

/** Size of a single tile, in pixels. The grid, player and camera derive from this. */
export const TILE_SIZE = 32;

/** Internal canvas resolution (must match the <canvas> width/height in index.html). */
export const VIEW_W = 960;
export const VIEW_H = 540;

/** Player collision box dimensions (pixels). Slightly under one tile wide. */
export const PLAYER_W = 28;
export const PLAYER_H = 44;

// ---------------------------------------------------------------------------
// Fixed-timestep loop
// ---------------------------------------------------------------------------

/** Seconds simulated per physics step (60 Hz). Physics is frame-rate independent. */
export const FIXED_DT = 1 / 60;

/** Clamp on a single rAF delta so a paused/backgrounded tab can't fast-forward. */
export const MAX_FRAME_TIME = 0.25;

// ---------------------------------------------------------------------------
// Player movement & gravity
// ---------------------------------------------------------------------------

export const GRAVITY = 2200; // downward acceleration (px/s^2)
export const TERMINAL_VY = 1400; // max fall speed (px/s)

export const MOVE_ACCEL = 6000; // ground horizontal acceleration (px/s^2)
export const AIR_ACCEL = 3200; // reduced air control (px/s^2)
export const MAX_RUN_SPEED = 320; // horizontal speed cap (px/s)
export const FRICTION = 5200; // ground deceleration when no input (px/s^2)

export const JUMP_VELOCITY = 760; // upward impulse applied on jump (px/s)
export const JUMP_CUT = 0.45; // vy multiplier when jump released while rising (short hops)
export const COYOTE_TIME = 0.08; // grace window to still jump just after leaving ground (s)
export const JUMP_BUFFER = 0.1; // remember a jump press this long before landing (s)
export const DROP_THROUGH_TIME = 0.18; // ignore one-way platforms this long after a drop (s)

// ---------------------------------------------------------------------------
// Camera
// ---------------------------------------------------------------------------

/** Lerp factor toward the follow target each physics step (0 = frozen, 1 = instant). */
export const CAMERA_LERP = 0.12;

// ---------------------------------------------------------------------------
// Placeholder palette (mock blocks until pixel art arrives)
// ---------------------------------------------------------------------------

export const COLORS = {
  sky: "#161c2c",
  parallaxFar: "#202944",
  parallaxNear: "#2c3858",
  solid: "#465168",
  solidTop: "#5d6b86",
  oneWay: "#8a6d3b",
  oneWayTop: "#b08c4f",
  player: "#e8c170",
  playerFace: "#15171f",
  text: "#e8edf4",
  textDim: "#8b94a6",
  debugBox: "#ff5d5d",
  panel: "rgba(0,0,0,0.55)",
} as const;
