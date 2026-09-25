import * as THREE from "three";
import { createStage, frameLights } from "./kit/env.js";
import { FIRE_TIME } from "./kit/fire-glsl.js";
import { EMBER_EMISSIVE } from "./kit/materials.js";
import { DEFAULT_PARAMS, resolveTowerParams } from "./kit/params.js";
import { createEmbers } from "./pieces/embers.js";
import { buildEye, EYE_LIFT, flicker } from "./pieces/eye.js";
import { buildTower } from "./pieces/tower.js";

/**
 * Entry point for the `/tower` scene: compose the stage, the tower, the Eye and its embers, then
 * drive them. Kept thin — every reusable decision lives in the kit.
 *
 * `?power=` / `?health=` preview how the landmark levels (docs/LIVING-UNIVERSE.md) without a live
 * account behind it — the same dials the observatory will feed from real standings.
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

/** A camera pose on a sphere round `target` — the old ArcRotate convention the harness speaks. */
export interface Pose {
  readonly alpha: number;
  readonly beta: number;
  readonly radius: number;
  readonly target: readonly [number, number, number];
}

/** The reduced-motion freeze frame — the reference's own choice of instant. */
const FROZEN_T = 4;
/** Idle orbit, as OrbitControls.autoRotateSpeed (1.2 ≈ one lap per 50 s, the reference's pace). */
const ORBIT_SPEED = 1.2;

export function start(canvas: HTMLCanvasElement): void {
  const params = paramsFromQuery();
  const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
  const stage = createStage(canvas);
  const { scene, camera, controls, renderer } = stage;

  const tower = buildTower(params);
  scene.add(tower.root);
  frameLights(stage, tower.root);

  const eyeAt = tower.crown.clone().add(new THREE.Vector3(0, EYE_LIFT, 0));
  const eye = buildEye(eyeAt, params);
  scene.add(eye.group);
  const embers = createEmbers(eyeAt, params.stormDensity);
  scene.add(embers.points);
  embers.step(0, FROZEN_T);

  const pose = (p: Pose): void => {
    const [x, y, z] = p.target;
    controls.target.set(x, y, z);
    camera.position.set(
      x + p.radius * Math.cos(p.alpha) * Math.sin(p.beta),
      y + p.radius * Math.cos(p.beta),
      z + p.radius * Math.sin(p.alpha) * Math.sin(p.beta),
    );
    controls.update();
  };

  // Frame the full height at any aspect — the reference's fit: whichever of height or a 120-unit
  // half-width needs the longer throw, plus 25% air.
  const H = eyeAt.y + 63;
  const vf = (camera.fov * Math.PI) / 360;
  const hf = Math.atan(Math.tan(vf) * camera.aspect);
  const throw_ = Math.max(H / 2 / Math.tan(vf), 120 / Math.tan(hf)) * 1.25;
  pose({ alpha: 0.893, beta: 1.43, radius: throw_, target: [0, H / 2 - 18, 0] });
  controls.autoRotate = !reduce;
  controls.autoRotateSpeed = ORBIT_SPEED;
  controls.addEventListener("start", () => {
    controls.autoRotate = false;
  });

  /** Everything time-driven, as a pure function of the clock — so a seek is repeatable. */
  const applyTime = (t: number): void => {
    FIRE_TIME.value = t;
    eye.update(t, camera);
    tower.materials.ember.emissiveIntensity =
      EMBER_EMISSIVE * params.forgeIntensity * (1 + flicker(t) * 0.08);
  };

  const clock = new THREE.Clock();
  const frame = (): void => {
    const dt = Math.min(0.05, clock.getDelta());
    const now = clock.elapsedTime;
    controls.update(dt);
    applyTime(reduce ? FROZEN_T : now);
    if (!reduce) embers.step(dt, now);
    renderer.render(scene, camera);
  };
  renderer.setAnimationLoop(frame);

  // ---- Hooks for the screenshot harness (scripts/shoot/tower.mjs) ----
  window.__towerPose = pose;
  window.__towerPause = () => renderer.setAnimationLoop(null);
  // Seek: stop the loop, set the clock, render one frame. Two seeks to the same time are the same
  // picture (embers aside — they are a simulation, not a function of t).
  window.__towerSeek = (time: number) => {
    renderer.setAnimationLoop(null);
    applyTime(time);
    renderer.render(scene, camera);
  };
  // The Eye gazes down +z at rest, i.e. toward alpha = π/2 in the pose convention above.
  window.__eye = { x: eyeAt.x, y: eyeAt.y, z: eyeAt.z, facingAlpha: Math.PI / 2 };
  window.__tower = { height: H };
  renderer.compile(scene, camera);
  window.__ready = true;
}

declare global {
  interface Window {
    __startTower?: (canvas: HTMLCanvasElement) => void;
    /** Set once the scene has compiled — the screenshot harness waits on this. */
    __ready?: boolean;
    /** Park the camera at a deterministic pose. */
    __towerPose?: (pose: Pose) => void;
    /** Stops the render loop so a screenshot can settle. */
    __towerPause?: () => void;
    /** Where the Eye is, and the pose alpha that looks straight into it. */
    __eye?: { x: number; y: number; z: number; facingAlpha: number };
    /** Overall height of the model (to the horn tips), for whole-tower framing. */
    __tower?: { height: number };
    /** Freeze the scene at an exact time and render one frame — deterministic screenshots. */
    __towerSeek?: (time: number) => void;
  }
}

window.__startTower = start;
