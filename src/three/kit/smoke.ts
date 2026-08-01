import { DynamicTexture } from "@babylonjs/core/Materials/Textures/dynamicTexture";
import { Color4, Vector3 } from "@babylonjs/core/Maths/math";
import { ParticleSystem } from "@babylonjs/core/Particles/particleSystem";
import type { Scene } from "@babylonjs/core/scene";

/**
 * SMOKE — slow cloud churning around the crown, lit from inside by the Eye.
 *
 * Two jobs, and the second is the one that matters. Obviously it adds atmosphere. Less obviously it
 * gives the Eye's light something to *land on*: a light source in clean air has nothing to prove it
 * is bright, which is why the crown read as a lamp bulb rather than a fire. Smoke is also the only
 * cheap way to soften the crown's stair-stepped horns, whose faceting is the most obviously
 * low-budget thing left at close range.
 *
 * Deliberately few, large, slow particles: a dense fast system reads as a video-game effect. This
 * should look like weather that happens to be near something terrible.
 */

/** A soft radial disc, drawn once at load. Beats shipping a PNG for a shape defined by one formula. */
function softDisc(scene: Scene, size = 128): DynamicTexture {
  const tex = new DynamicTexture("smokeDisc", { width: size, height: size }, scene, false);
  const ctx = tex.getContext() as CanvasRenderingContext2D;
  const r = size / 2;
  const g = ctx.createRadialGradient(r, r, 0, r, r, r);
  // A long, soft tail rather than a hard-edged puff — particles must overlap without showing seams.
  g.addColorStop(0, "rgba(255,255,255,0.55)");
  g.addColorStop(0.35, "rgba(255,255,255,0.22)");
  g.addColorStop(0.7, "rgba(255,255,255,0.06)");
  g.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  tex.update();
  tex.hasAlpha = true;
  return tex;
}

export interface SmokeOptions {
  /** World height the cloud gathers around — the crown, not the ground. */
  readonly y: number;
  /** How far out the cloud spreads. Scale with the tower's mass. */
  readonly radius: number;
  /** 0..1, how lit-from-within the cloud reads. Follows the Eye's power. */
  readonly glow: number;
}

/** Add the crown cloud. Returns the system so callers can retune or stop it. */
export function createSmoke(scene: Scene, opts: SmokeOptions): ParticleSystem {
  const ps = new ParticleSystem("crownSmoke", 420, scene);
  ps.particleTexture = softDisc(scene);
  ps.emitter = new Vector3(0, opts.y, 0);
  ps.minEmitBox = new Vector3(-opts.radius, -opts.radius * 0.45, -opts.radius);
  ps.maxEmitBox = new Vector3(opts.radius, opts.radius * 0.55, opts.radius);

  // Ember-lit soot: warm where the Eye reaches it, near-black where it doesn't. The gradient is what
  // makes the cloud read as LIT rather than as grey fog with a colour cast.
  const g = 0.35 + opts.glow * 0.65;
  ps.color1 = new Color4(0.52 * g, 0.17 * g, 0.06 * g, 0.3);
  ps.color2 = new Color4(0.1, 0.082, 0.088, 0.2);
  ps.colorDead = new Color4(0.02, 0.017, 0.02, 0);

  ps.minSize = opts.radius * 0.55;
  ps.maxSize = opts.radius * 1.35;
  ps.minLifeTime = 7;
  ps.maxLifeTime = 15;
  ps.emitRate = 34;

  // Standard alpha, not additive: additive smoke glows like steam and destroys the silhouette the
  // whole night sky exists to protect.
  ps.blendMode = ParticleSystem.BLENDMODE_STANDARD;

  // Barely-there drift. Convection carries it up and out; nothing here should look propelled.
  ps.gravity = new Vector3(0, 0.55, 0);
  ps.direction1 = new Vector3(-0.35, 0.35, -0.35);
  ps.direction2 = new Vector3(0.35, 0.9, 0.35);
  ps.minEmitPower = 0.25;
  ps.maxEmitPower = 0.9;
  ps.minAngularSpeed = -0.18;
  ps.maxAngularSpeed = 0.18;
  ps.updateSpeed = 0.012;

  // Open already weathered. The system otherwise takes a full particle lifetime to fill in, so both
  // a fresh page load and every screenshot (which seeks to an early clock) would show clean air.
  ps.preWarmCycles = 260;
  ps.preWarmStepOffset = 4;

  ps.start();
  return ps;
}
