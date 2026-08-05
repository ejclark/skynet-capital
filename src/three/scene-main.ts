import { GlowLayer } from "@babylonjs/core/Layers/glowLayer";
import { attachPost, createStage } from "./kit/env.js";
import { DEFAULT_PARAMS, resolveTowerParams } from "./kit/params.js";
import { createSmoke } from "./kit/smoke.js";
import { buildEye } from "./pieces/eye.js";
import { buildTower } from "./pieces/tower.js";

/**
 * Entry point for the `/tower` scene: compose the stage, the tower and the Eye, then drive them.
 * Kept deliberately thin — every decision that could be reused by another game piece lives in the
 * kit, not here.
 *
 * `?power=` / `?health=` let us preview how the landmark levels (docs/LIVING-UNIVERSE.md) without a
 * live account behind it — the same dials the observatory will feed from real standings.
 */

function paramsFromQuery(): ReturnType<typeof resolveTowerParams> {
  try {
    const q = new URLSearchParams(window.location.search);
    const power = q.get("power");
    const health = q.get("health");
    if (power === null && health === null) return DEFAULT_PARAMS;
    return resolveTowerParams({
      prominence: power === null ? 0.62 : Number(power),
      health: health === null ? 0.15 : Number(health),
    });
  } catch {
    return DEFAULT_PARAMS;
  }
}

export function start(canvas: HTMLCanvasElement): void {
  const params = paramsFromQuery();
  const stage = createStage(canvas);
  const { scene, engine, camera, shadows, forge } = stage;

  const tower = buildTower(scene, params);
  for (const mesh of tower.meshes) shadows.addShadowCaster(mesh);
  forge.intensity = params.forgeIntensity;

  const eye = buildEye(scene, tower.crownY + 15, params);

  // Cloud around the crown: atmosphere, but mostly it gives the Eye's light something to land on.
  createSmoke(scene, {
    y: tower.crownY + 6,
    radius: tower.crownRadius * 4.2,
    glow: params.eyeIntensity,
  });

  // Post comes AFTER the Eye exists, because volumetric scattering needs it as its emitter — and it
  // must be built before the default pipeline (see attachPost).
  const pipe = attachPost(scene, camera, eye.emitter);

  // Bloom-adjacent glow for the emissive bits only; the pipeline's bloom handles the rest.
  const glow = new GlowLayer("glow", scene, { blurKernelSize: 44 });
  glow.intensity = 0.6;

  let t = 0;

  /**
   * Everything time-driven in the scene, as a pure function of the clock. Factored out of the render
   * observable so a screenshot can SEEK to an exact moment: the harness pins the camera, but until
   * now the animation ran on wall-clock, so every run captured a different instant and shot-to-shot
   * comparison — the entire point of the poses — was unreliable.
   */
  const applyTime = (time: number): void => {
    eye.material.setFloat("iTime", time);
    // The EYE sweeps, searching — never a static spotlight, and never locked onto the viewer. Two
    // incommensurate frequencies keep the scan from reading as a metronome.
    eye.pivot.rotation.y = Math.sin(time * 0.19) * 0.44 + Math.sin(time * 0.071) * 0.16;
    eye.pivot.rotation.x = 0.05 + Math.sin(time * 0.11) * 0.05;
    // A slower, wider sweep for the beam on top of the eye's own aim, so the light rakes the land.
    eye.gaze.rotation.y = Math.sin(time * 0.13) * 0.3;
    eye.gaze.rotation.x = 0.12 + Math.sin(time * 0.09) * 0.05;
    // Breathing intensity so the Eye feels alive rather than a lamp.
    const pulse = 0.9 + Math.sin(time * 1.7) * 0.08 + Math.sin(time * 0.53) * 0.05;
    eye.light.intensity = params.eyeIntensity * 1.15 * pulse;
    forge.intensity = params.forgeIntensity * (0.92 + Math.sin(time * 0.9) * 0.1);
  };

  // The idle orbit, in radians per SECOND. It used to be `camera.alpha += 0.0014` — per *frame* — so
  // the scene literally turned at a different speed on different hardware: full rate on a 60fps
  // desktop, half that on a phone holding 30fps, and it would surge whenever the tab caught up after a
  // stall. Anything advanced per frame is a bug wearing a constant; time is the only honest clock.
  const ORBIT_RAD_PER_SEC = 0.0014 * 60;

  // A seek OWNS the clock and the camera for its one frame. Without this guard `__towerSeek` was a
  // lie: it set `t`, then called `scene.render()`, which fires this observable BEFORE drawing, which
  // advanced `t` and `camera.alpha` right back. Measured drift was 0.14 rad — eight degrees of camera
  // rotation — and two seeks to the same timestamp produced different pixels. Every screenshot
  // comparison this project has made was therefore between two different moments from two different
  // angles, with the difference attributed to the code change. The comment below used to assert the
  // opposite, which is what made it dangerous rather than merely broken.
  let seeking = false;

  scene.onBeforeRenderObservable.add(() => {
    if (seeking) return;
    const dt = engine.getDeltaTime() / 1000;
    t += dt;
    camera.alpha += ORBIT_RAD_PER_SEC * dt;
    applyTime(t);
  });

  engine.runRenderLoop(() => scene.render());
  window.addEventListener("resize", () => engine.resize());
  // Exposed for the screenshot harness (scripts/shoot-tower.mjs) so it can park the camera at a
  // known pose — deterministic framing is what makes visual diffs meaningful.
  window.__towerCamera = camera;
  // The harness pauses the loop before capturing — a continuously-rendering canvas never
  // reaches the 'stable' state screenshot tooling waits for.
  window.__towerPause = () => engine.stopRenderLoop();
  // Seek to an exact moment and render one frame. This is what makes visual diffs meaningful: two
  // runs at the same seek time are the same picture, so a difference is a real change.
  window.__towerSeek = (time: number) => {
    engine.stopRenderLoop();
    seeking = true;
    // Animated film grain reseeds every frame by design — lovely in motion, fatal to a visual diff,
    // because it alone guarantees two captures of the identical scene never match. Freeze it for the
    // captured frame only; the live scene keeps its moving grain.
    const wasAnimated = pipe.grain.animated;
    pipe.grain.animated = false;
    t = time;
    applyTime(time);
    scene.render();
    pipe.grain.animated = wasAnimated;
    seeking = false;
  };
  // Where the Eye is, and which way it faces. The harness needs both to frame the aperture head-on;
  // hard-coding them there would silently drift the moment the tower's proportions change.
  window.__eye = { y: eye.root.position.y, facingAlpha: Math.PI / 2 };
  scene.executeWhenReady(() => {
    window.__ready = true;
  });
}

declare global {
  interface Window {
    __startTower?: (canvas: HTMLCanvasElement) => void;
    /** Set once the scene has finished loading — the screenshot harness waits on this. */
    __ready?: boolean;
    /** The orbit camera, so the harness can pose deterministic shots. */
    __towerCamera?: { alpha: number; beta: number; radius: number };
    /** Stops the render loop so a screenshot can settle. */
    __towerPause?: () => void;
    /** The Eye's height and the camera alpha that looks straight into its aperture. */
    __eye?: { y: number; facingAlpha: number };
    /** Freeze the scene at an exact time and render one frame — deterministic screenshots. */
    __towerSeek?: (time: number) => void;
  }
}

window.__startTower = start;
