import type { Camera } from "../core/Camera.js";
import type { Input } from "../core/Input.js";
import type { Renderer } from "../core/Renderer.js";
import type { Body } from "../physics/Body.js";
import type { Tilemap } from "../physics/Tilemap.js";

/** Everything an entity needs from the world to update itself for one step. */
export interface UpdateContext {
  readonly input: Input;
  readonly map: Tilemap;
}

/**
 * Base class for anything that lives in the world, owns a physics {@link Body},
 * and participates in the update/render cycle. Enemies, NPCs, projectiles, etc.
 * will extend this in later phases.
 */
export abstract class Entity {
  abstract readonly body: Body;

  /** Advance simulation by one fixed step. */
  abstract update(dt: number, ctx: UpdateContext): void;

  /** Draw the entity in world space. `time` is an animation clock (seconds). */
  abstract render(r: Renderer, cam: Camera, time: number): void;
}
