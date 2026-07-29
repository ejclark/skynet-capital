import { GlowLayer } from "@babylonjs/core/Layers/glowLayer";
import { createStage } from "./kit/env.js";
import { DEFAULT_PARAMS, resolveTowerParams } from "./kit/params.js";
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

  const eye = buildEye(scene, tower.crownY + 9, params);

  // Bloom-adjacent glow for the emissive bits only; the pipeline's bloom handles the rest.
  const glow = new GlowLayer("glow", scene, { blurKernelSize: 44 });
  glow.intensity = 0.85;

  let t = 0;
  scene.onBeforeRenderObservable.add(() => {
    t += engine.getDeltaTime() / 1000;
    camera.alpha += 0.0014;
    eye.material.setFloat("iTime", t);
    // The gaze sweeps, searching — never a static spotlight.
    eye.gaze.rotation.y = Math.sin(t * 0.19) * 0.85;
    eye.gaze.rotation.x = 0.16 + Math.sin(t * 0.11) * 0.06;
    // Breathing intensity so the Eye feels alive rather than a lamp.
    const pulse = 0.9 + Math.sin(t * 1.7) * 0.08 + Math.sin(t * 0.53) * 0.05;
    eye.light.intensity = params.eyeIntensity * 1.8 * pulse;
    forge.intensity = params.forgeIntensity * (0.92 + Math.sin(t * 0.9) * 0.1);
  });

  engine.runRenderLoop(() => scene.render());
  window.addEventListener("resize", () => engine.resize());
  // Exposed for the screenshot harness (scripts/shoot-tower.mjs) so it can park the camera at a
  // known pose — deterministic framing is what makes visual diffs meaningful.
  window.__towerCamera = camera;
  // The harness pauses the loop before capturing — a continuously-rendering canvas never
  // reaches the 'stable' state screenshot tooling waits for.
  window.__towerPause = () => engine.stopRenderLoop();
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
  }
}

window.__startTower = start;
