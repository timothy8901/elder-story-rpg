import { Game } from "./core/Game.js";
import { GameLoop } from "./core/GameLoop.js";
import { atlas } from "./rendering/Atlas.js";
import { icons } from "./rendering/Icons.js";
import { props } from "./rendering/Props.js";
/**
 * Entry point: grab the canvas, build the game, and start the fixed-timestep
 * loop. The loop is also paused while the tab is hidden so it never has to
 * fast-forward a large accumulated delta on return.
 */
const canvas = document.getElementById("game");
if (!(canvas instanceof HTMLCanvasElement)) {
    throw new Error('Expected a <canvas id="game"> element.');
}
// Load the pixel-art sprite atlas + item-icon sheet; entities/UI render from them
// once ready, and fall back to procedural drawing / text labels until then.
atlas.load();
icons.load();
props.load();
const game = new Game(canvas);
const loop = new GameLoop((dt) => game.update(dt), () => game.render(loop.fps));
loop.start();
// Dev convenience: inspect/tune live state from the browser console, e.g.
// `game` or `loop.fps`. Exposed ONLY on local dev hosts so the public build
// doesn't hand players a trivial cheat/debug handle via DevTools.
const devHost = ["localhost", "127.0.0.1", ""].includes(location.hostname);
if (devHost) {
    Object.assign(globalThis, { game, loop });
}
document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
        game.saveNow(); // persist before the tab is backgrounded / the loop stops
        loop.stop();
    }
    else {
        loop.start();
    }
});
// Belt-and-suspenders saves for refresh / close / navigation. localStorage
// writes are synchronous, so they're safe in these handlers. pagehide is the
// most reliable across browsers (incl. bfcache/mobile); beforeunload backs it up.
window.addEventListener("pagehide", () => game.saveNow());
window.addEventListener("beforeunload", () => game.saveNow());
//# sourceMappingURL=main.js.map