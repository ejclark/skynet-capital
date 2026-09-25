import * as THREE from "three";
import { fireMaterial } from "../kit/fire-glsl.js";
import type { TowerParams } from "../kit/params.js";
import { almondify } from "../kit/shapes.js";
import { BEAM, BODY, CORONA } from "./eye-shader.js";

/**
 * THE EYE — fire first. Design handoff §6–7; art direction `docs/art/EYE.md`.
 *
 *   eye (gaze rotation) ─ body   almond of flowing fire, breathing with the flicker
 *                       └ pupil  the one thing up there that does not burn
 *   gaze (same rotation) ─ beam  two faint cones, starting OUTSIDE the eyeball
 *   corona                       camera-facing flame field fitted to the projected outline
 *   glow / glowBack              the Eye lights its own tower
 *
 * The Eye and the beam share one rotation, so the pupil always faces down the beam. Nothing here
 * tracks the camera except the corona plane, which is only a canvas for the fire around the rim —
 * the Eye itself sweeps on its own schedule. Being ignored is the point.
 */

/** Half-extents of the almond (≈35% larger than the previous globe). */
export const EW = 15;
export const EH = 8.2;
export const ED = 5.4;
/** Height of the Eye's centre above the crown bowl. */
export const EYE_LIFT = 30;
/** Corona plane edge, in multiples of EW. */
const CORONA_SIZE = 3.2;

/** The handoff's flicker: three incommensurate sines, range ≈ ±1. */
export const flicker = (t: number): number =>
  0.5 * Math.sin(t * 5.3) + 0.3 * Math.sin(t * 11.7 + 1.3) + 0.2 * Math.sin(t * 23.1 + 0.4);

/** The slow searching gaze: yaw sweeps ±~1.2 rad over minutes, pitch nods just below level. */
export function gazeAt(t: number): { yaw: number; pitch: number } {
  return {
    yaw: Math.sin(t * 0.11) * 0.85 + Math.sin(t * 0.037) * 0.35,
    pitch: 0.16 + Math.sin(t * 0.07) * 0.06,
  };
}

function almond(widthSegs: number, taperZ: boolean): THREE.BufferGeometry {
  const g = new THREE.SphereGeometry(1, widthSegs, widthSegs / 2);
  almondify((g.attributes.position as THREE.BufferAttribute).array as Float32Array, taperZ);
  g.computeVertexNormals();
  return g;
}

export interface EyeBuild {
  /** Everything the Eye owns, ready to add to the scene. */
  readonly group: THREE.Group;
  /** Drive the Eye to time `t` (seconds). Pure in `t` — a seek renders the same frame every time. */
  update(t: number, camera: THREE.Camera): void;
}

export function buildEye(at: THREE.Vector3, params: TowerParams): EyeBuild {
  const group = new THREE.Group();
  group.name = "eye-of-sauron";

  const eye = new THREE.Group();
  eye.name = "eye";
  eye.position.copy(at);
  eye.rotation.order = "YXZ";
  const body = new THREE.Mesh(almond(72, true), fireMaterial("eye-fire", BODY));
  body.name = "eye-fire";
  body.scale.set(EW, EH, ED);
  eye.add(body);
  const pupil = new THREE.Mesh(
    almond(48, false),
    new THREE.MeshBasicMaterial({ name: "eye-pupil", color: 0x140300 }),
  );
  pupil.name = "eye-pupil";
  pupil.rotation.z = Math.PI / 2;
  pupil.scale.set(EH * 0.9, 1.7, ED * 1.32);
  eye.add(pupil);
  group.add(eye);

  // Corona — drawn after the body (renderOrder) so its additive fire lays over the rim.
  const coronaU = {
    uW: { value: 1 },
    uH: { value: EH / EW },
    uEW: { value: EW },
    uReach: { value: params.eyeIntensity },
  };
  const coronaMat = fireMaterial(
    "eye-corona",
    CORONA,
    { transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false },
    coronaU,
  );
  const corona = new THREE.Mesh(
    new THREE.PlaneGeometry(EW * CORONA_SIZE, EW * CORONA_SIZE),
    coronaMat,
  );
  corona.name = "eye-corona";
  corona.renderOrder = 5;
  group.add(corona);

  // Beam: an outer veil and a hotter core. Starts ED·1.05 in front, OUTSIDE the eyeball — spanning
  // from the centre washed the pupil grey and cost the almond a canthus (an earlier attempt's bug).
  const gaze = new THREE.Group();
  gaze.name = "gaze";
  gaze.rotation.order = "YXZ";
  const len = params.gazeReach;
  for (const [r0, r1, strength, streak] of [
    [3.2, 120, 0.09, 3],
    [1.2, 40, 0.16, 6],
  ] as const) {
    const g = new THREE.CylinderGeometry(r1, r0, len, 48, 1, true);
    g.rotateX(Math.PI / 2);
    g.translate(0, 0, len / 2 + ED * 1.05);
    const mat = fireMaterial(
      `eye-beam-${streak}`,
      BEAM,
      {
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        fog: false,
        side: THREE.DoubleSide,
      },
      { uLen: { value: len }, uStrength: { value: strength }, uStreak: { value: streak } },
    );
    gaze.add(new THREE.Mesh(g, mat));
  }
  group.add(gaze);

  // The Eye lights its own tower: a hot key just in front along the gaze, a softer one behind.
  const I = params.eyeIntensity;
  const glow = new THREE.PointLight(0xff7a2e, 16000 * I, 320, 1.6);
  const glowBack = new THREE.PointLight(0xff9e3d, 5000 * I, 160, 1.6);
  group.add(glow, glowBack);

  // A bleeding account's Eye still burns — it just gutters less (flicker amplitude follows health).
  const amp = THREE.MathUtils.lerp(0.7, 1.15, (params.health + 1) / 2);
  const fwd = new THREE.Vector3();
  const side = new THREE.Vector3();
  const camRight = new THREE.Vector3();

  return {
    group,
    update(t, camera) {
      const { yaw, pitch } = gazeAt(t);
      eye.rotation.set(pitch, yaw, 0);
      gaze.position.copy(at);
      gaze.rotation.copy(eye.rotation);
      const f = flicker(t) * amp;
      body.scale.set(EW * (1 + f * 0.018), EH * (1 + f * 0.028), ED * (1 + f * 0.018));

      corona.position.copy(at);
      corona.quaternion.copy(camera.quaternion);
      fwd.set(0, 0, 1).applyEuler(eye.rotation);
      side.set(1, 0, 0).applyEuler(eye.rotation);
      camRight.set(1, 0, 0).applyQuaternion(camera.quaternion);
      coronaU.uW.value = Math.hypot(EW * side.dot(camRight), ED * fwd.dot(camRight)) / EW;

      glow.position.set(at.x + Math.sin(yaw) * 8, at.y, at.z + Math.cos(yaw) * 8);
      glowBack.position.set(at.x - Math.sin(yaw) * 7, at.y + 4, at.z - Math.cos(yaw) * 7);
      glow.intensity = 16000 * I * (1 + f * 0.14);
      glowBack.intensity = 5000 * I * (1 - f * 0.1);
    },
  };
}
