import { Game } from "./core/Game.js";
import { GameLoop } from "./core/GameLoop.js";

/**
 * Entry point: grab the canvas, build the game, and start the fixed-timestep
 * loop. The loop is also paused while the tab is hidden so it never has to
 * fast-forward a large accumulated delta on return.
 */
const canvas = document.getElementById("game");
if (!(canvas instanceof HTMLCanvasElement)) {
  throw new Error('Expected a <canvas id="game"> element.');
}

const game = new Game(canvas);
const loop = new GameLoop(
  (dt) => game.update(dt),
  () => game.render(loop.fps),
);
loop.start();

// Dev convenience: inspect/tune live state from the browser console,
// e.g. `game` or `loop.fps`. Harmless in production.
Object.assign(globalThis as Record<string, unknown>, { game, loop });

document.addEventListener("visibilitychange", () => {
  if (document.hidden) loop.stop();
  else loop.start();
});
