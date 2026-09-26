import * as THREE from "three";
import { createStage, frameLights } from "./kit/env.js";
import { armContextLoss } from "./kit/fallback.js";
import { FIRE_TIME } from "./kit/fire-glsl.js";
import {
  aimAt,
  blendGaze,
  type Gaze,
  glanceOver,
  glanceWeight,
  releaseWeight,
} from "./kit/glance.js";
import { createLoop, FrameStats, fireTime, type TowerStats } from "./kit/loop.js";
import { EMBER_EMISSIVE } from "./kit/materials.js";
import { readTowerMessage, type TowerNotice } from "./kit/messages.js";
import { DEFAULT_PARAMS, resolveTowerParams, type TowerParams } from "./kit/params.js";
import { fpsMeter, probeLines, wantsProbe } from "./kit/probe.js";
import { qualityFromSearch, restStillFromSearch } from "./kit/quality.js";
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

/** The framings a page can ask for with `?frame=`. */
type Framing = "card" | "crown";

/**
 * How the page embeds us. `frame=card` is the art column of the profile's Sauron character card
 * (plan #3727, design handoff 6a): the camera frames the whole tower to whatever box the page gives
 * it, holds still (no zoom, no drag, no orbit — the card is static), and sets the Eye right of
 * centre. `frame=crown` (plan #3807 slice 3a) is the crest at the right cap of the calendar band:
 * the same still camera, framed tight on the crown and the Eye for a ~96–150px-tall box. `embed=1`
 * alone just turns zoom off, so a page's scroll wheel scrolls the page.
 */
function embedFromQuery(): { readonly frame: Framing | undefined; readonly embed: boolean } {
  try {
    const q = new URLSearchParams(window.location.search);
    const f = q.get("frame");
    const frame = f === "card" || f === "crown" ? f : undefined;
    return { frame, embed: frame !== undefined || q.get("embed") === "1" };
  } catch {
    return { frame: undefined, embed: false };
  }
}

/**
 * The card's framing, as fractions of the frame's height and width (handoff 6a): the horn tips sit
 * ~20px under the top of a 664px art box, the lit fortress wall falls in the bottom 90px (the shade
 * that blends into the league), and the Eye lands ~60% across — right of centre on purpose.
 */
const CARD = { top: 0.03, wall: 0.9, eyeAcross: 0.6, wallY: 30 } as const;

/**
 * The crest's framing, in the same terms, measured from the Eye: the horn tips (Eye + 42) sit just
 * under the top, the frame's floor is the crown's shoulders (Eye − 58), and the Eye lands a little
 * right of centre — the crest is the band's RIGHT cap and its glances go left, toward the page.
 */
const CROWN = { top: 0.04, floor: 1, eyeAcross: 0.56, above: 42, below: 58 } as const;

/** The reduced-motion freeze frame — the reference's own choice of instant. */
const FROZEN_T = 4;
/** Idle orbit, as OrbitControls.autoRotateSpeed (1.2 ≈ one lap per 50 s, the reference's pace). */
const ORBIT_SPEED = 1.2;

export function start(canvas: HTMLCanvasElement): void {
  const params = paramsFromQuery();
  const mode = embedFromQuery();
  const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
  // `?quality=presence` (the band crest, slice 3a-2): 30 draws a second, DPR ≤ 1, no shadow map,
  // half the embers — kit/quality.ts says why each.
  const quality = qualityFromSearch(window.location.search);
  // `?rest=still` (slice 3a-3): one frame at rest, the loop only while a glance or regard plays.
  const restStill = restStillFromSearch(window.location.search);
  const stage = createStage(canvas, quality);
  const { scene, camera, controls, renderer } = stage;

  const tower = buildTower(params);
  scene.add(tower.root);
  frameLights(stage, tower.root);

  const eyeAt = tower.crown.clone().add(new THREE.Vector3(0, EYE_LIFT, 0));
  const eye = buildEye(eyeAt, params);
  scene.add(eye.group);
  const embers = createEmbers(eyeAt, params.stormDensity * quality.emberScale);
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

  // The throw that fits a `halfH` × `halfW` window at the current aspect — whichever axis is tighter.
  const throwFor = (halfH: number, halfW: number): number => {
    const vf = (camera.fov * Math.PI) / 360;
    const hf = Math.atan(Math.tan(vf) * camera.aspect);
    return Math.max(halfH / Math.tan(vf), halfW / Math.tan(hf));
  };
  const H = eyeAt.y + 63;
  if (mode.frame) {
    // Fit a top → bottom band of the model to `top` → `bottom` of the frame's height, then slide the
    // view window so the Eye sits `across` of the way over. A view offset shifts the picture
    // without turning the camera, so the perspective stays the hero's. Re-fit on every resize.
    const card = mode.frame === "card";
    const hi = eyeAt.y + (card ? 42 : CROWN.above);
    const lo = card ? CARD.wallY : eyeAt.y - CROWN.below;
    const [top, bottom, across] = card
      ? [CARD.top, CARD.wall, CARD.eyeAcross]
      : [CROWN.top, CROWN.floor, CROWN.eyeAcross];
    const span = (hi - lo) / (bottom - top);
    const centreY = hi + top * span - span / 2;
    const fit = (): void => {
      const w = canvas.clientWidth || window.innerWidth;
      const h = canvas.clientHeight || window.innerHeight;
      camera.setViewOffset(w, h, -(across - 0.5) * w, 0, w, h);
      pose({
        alpha: 0.893,
        beta: 1.43,
        radius: span / 2 / Math.tan((camera.fov * Math.PI) / 360),
        target: [eyeAt.x, centreY, eyeAt.z],
      });
    };
    fit();
    window.addEventListener("resize", fit);
  } else {
    // The whole tower at any aspect — the reference's fit: height or a 120-unit half-width, + 25% air.
    pose({
      alpha: 0.893,
      beta: 1.43,
      radius: throwFor(H / 2, 120) * 1.25,
      target: [0, H / 2 - 18, 0],
    });
  }
  controls.enableZoom = !mode.embed;
  controls.enabled = !mode.frame;
  controls.autoRotate = !(reduce || mode.frame || restStill);
  controls.autoRotateSpeed = ORBIT_SPEED;
  controls.addEventListener("start", () => {
    controls.autoRotate = false;
  });

  // ---- The glance (plan #3725) and the regard (#3807 slice 3a): the page says where to look ----
  // Aimed at a point partway from the camera toward the Eye along the ray through the point, so the
  // Eye looks OUT of the frame toward the control — from behind the page, never across it. ONE slot:
  // a click and a hover share it, the newest wins, and either is capped by the glance's own hold
  // (`glance.ts`) — a hover that lingers is let go after ~1.5 s anyway: noticed, never stared at.
  const clock = new THREE.Clock();
  /** Scene time: advanced by clamped deltas, so a pause never makes the sweep jump on resume. */
  let t = restStill ? FROZEN_T : 0;
  let glance: { readonly at: number; readonly target: Gaze; releasedAt?: number } | undefined;
  const ray = new THREE.Vector3();
  const lookToward = (x: number, y: number): void => {
    const w = canvas.clientWidth || 1;
    const h = canvas.clientHeight || 1;
    ray.set((x / w) * 2 - 1, -((y / h) * 2 - 1), 0.5).unproject(camera);
    ray.sub(camera.position).normalize();
    const point = camera.position
      .clone()
      .addScaledVector(ray, camera.position.distanceTo(eyeAt) * 0.45);
    glance = { at: t, target: aimAt(eyeAt.toArray(), point.toArray()) };
  };
  const aim = (sweep: Gaze): Gaze => {
    if (!glance) return sweep;
    const { at, target, releasedAt } = glance;
    const held = glanceWeight(t - at);
    const w = releasedAt === undefined ? held : Math.min(held, releaseWeight(t - releasedAt));
    if (glanceOver(t - at, releasedAt === undefined ? undefined : t - releasedAt))
      glance = undefined;
    return w > 0 ? blendGaze(sweep, target, w) : sweep;
  };

  // ---- The dials: `?power=&health=` at load, `tower:mood` live. Light only, never geometry ----
  let dials: TowerParams = params;
  const setMood = (power: number, health: number): void => {
    dials = resolveTowerParams({ prominence: power, health });
    eye.setDials(dials);
  };

  /** Everything time-driven, as a pure function of the clock — so a seek is repeatable. */
  const applyTime = (time: number): void => {
    FIRE_TIME.value = fireTime(time);
    eye.update(time, camera, aim);
    tower.materials.ember.emissiveIntensity =
      EMBER_EMISSIVE * dials.forgeIntensity * (1 + flicker(time) * 0.08);
  };

  // Every draw goes through here, timed: the harness's `__towerStats` and the frame-time budget.
  const stats = new FrameStats();
  // An embedded frame keeps its first picture (the drawing buffer is preserved, so this is one small
  // read-back, outside the timed submit) — shown in the canvas's place if the GPU takes the context.
  let still: string | null | undefined = mode.embed ? undefined : null;
  const draw = (): void => {
    const t0 = performance.now();
    renderer.render(scene, camera);
    stats.record(performance.now() - t0);
    if (still === undefined) {
      try {
        still = canvas.toDataURL("image/png");
      } catch {
        still = null;
      }
    }
  };

  // The key light is static (bucket.ts, env.ts), so its shadow map is drawn once, on the first frame.
  renderer.shadowMap.autoUpdate = false;
  renderer.shadowMap.needsUpdate = true;

  const loop = createLoop({
    reduce,
    fpsCap: quality.fpsCap,
    tick: () => {
      const dt = Math.min(0.05, clock.getDelta());
      t += dt;
      controls.update(dt);
      applyTime(t);
      embers.step(dt, t);
      draw();
      // `rest=still`: the gaze is home — this was the settled frame, so the loop stops on it.
      if (restStill && !glance) loop.settle();
    },
    still: () => {
      controls.update();
      applyTime(reduce ? FROZEN_T : t);
      draw();
    },
    setAnimationLoop: (cb) => renderer.setAnimationLoop(cb),
    // Discard the time spent hidden: the next tick's delta starts from now.
    onResume: () => void clock.getDelta(),
    restStill,
  });
  // A resize changes the picture: under reduced motion (or while paused) draw the one still again.
  // Deferred a frame so the stage's own resize handler has already refit the renderer.
  window.addEventListener("resize", () => requestAnimationFrame(() => loop.invalidate()));

  // The GPU took the context back: stop drawing into nothing and show the kept still instead.
  armContextLoss({
    canvas,
    still: () => still ?? null,
    halt: () => loop.halt(),
    show: (url) => {
      const img = document.createElement("img");
      img.src = url;
      img.alt = canvas.getAttribute("aria-label") ?? "";
      img.className = "tower-still";
      img.style.cssText = "position:fixed;inset:0;width:100%;height:100%;display:block";
      canvas.style.visibility = "hidden";
      document.body.append(img);
    },
  });

  // `?probe=1`: the on-screen readout (kit/probe.ts) — the real number, read on a real machine.
  if (wantsProbe(window.location.search)) {
    const hud = document.createElement("div");
    hud.className = "tower-probe";
    hud.setAttribute("aria-hidden", "true");
    hud.style.cssText =
      "position:fixed;left:4px;top:4px;z-index:3;pointer-events:none;padding:2px 4px;" +
      "font:9px/1.3 ui-monospace,SFMono-Regular,Menlo,monospace;color:#E6EDF3;" +
      "background:rgba(5,7,11,.78);border-radius:2px;white-space:pre";
    document.body.append(hud);
    const meter = fpsMeter();
    const read = (): void => {
      hud.textContent = probeLines(
        meter.sample(stats.frames, performance.now()),
        stats.snapshot(),
      ).join("\n");
    };
    read();
    window.setInterval(read, 500);
  }

  window.addEventListener("message", (e: MessageEvent) => {
    const m = readTowerMessage(e, { origin: window.location.origin, parent: window.parent });
    if (!m) return;
    switch (m.type) {
      case "tower:glance":
      case "tower:regard":
        // Under reduced motion the Eye holds still: no glance, no regard.
        if (!reduce) {
          lookToward(m.x, m.y);
          loop.wake();
        }
        return;
      case "tower:release":
        if (glance && glance.releasedAt === undefined) glance.releasedAt = t;
        return;
      case "tower:mood":
        setMood(m.power, m.health);
        loop.invalidate();
        return;
      case "tower:run":
        loop.run(m.on);
        return;
    }
  });
  loop.start();

  // ---- Hooks for the screenshot harness (scripts/shoot/tower.mjs) and the probe ----
  window.__towerPose = pose;
  window.__towerPause = () => loop.halt();
  // Seek: stop the loop, set the clock, render one frame. Two seeks to the same time are the same
  // picture (embers aside — they are a simulation, not a function of t).
  window.__towerSeek = (time: number) => {
    loop.halt();
    applyTime(time);
    draw();
  };
  window.__towerStats = () => stats.snapshot();
  // The Eye gazes down +z at rest, i.e. toward alpha = π/2 in the pose convention above.
  window.__eye = { x: eyeAt.x, y: eyeAt.y, z: eyeAt.z, facingAlpha: Math.PI / 2 };
  window.__tower = { height: H };
  renderer.compile(scene, camera);
  window.__ready = true;
  // Ms since this frame's navigation started — load, parse, build and compile.
  stats.mountToReadyMs = Math.round(performance.now());
  // Tell the embedding page we can hear it now, so it re-sends its latest mood and run state.
  if (window.parent !== window) {
    const ready: TowerNotice = { type: "tower:ready" };
    window.parent.postMessage(ready, window.location.origin);
  }
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
    /** Draws so far, CPU submit time p50/p95 (ms) and ms to ready — the frame-time budget's probe. */
    __towerStats?: () => TowerStats;
  }
}

window.__startTower = start;
