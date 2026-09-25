import * as THREE from "three";
import type { Bucket, Vec3 } from "../kit/bucket.js";
import { box, keep, turret } from "../kit/greebles.js";
import type { TowerProfile } from "../kit/profile.js";
import type { Rng } from "../kit/rng.js";
import { bladeShape, finShape, type Pt } from "../kit/shapes.js";

/**
 * THE SHAFT — design handoff §4. Seven stacked tiers from `kit/profile.ts`, and EVERY tier is
 * randomised: polygon count, rotation, an axis that drifts ±0.5 per tier, fin count and height,
 * ribs, slits, blade skirts, one-sided annex keeps and buttress turrets. That per-tier irregularity
 * is what kills the lathe-turned symmetry the old ring stack had.
 */

const shape = (pts: readonly Pt[]): THREE.Shape =>
  new THREE.Shape(pts.map(([x, y]) => new THREE.Vector2(x, y)));

const pick = <T>(rng: Rng, arr: readonly T[]): T => arr[Math.floor(rng.next() * arr.length)] as T;

export interface ShaftBuild {
  /** Where the drifting axis ended up — the crown and the Eye sit on it, not on x = z = 0. */
  readonly ox: number;
  readonly oz: number;
}

/** Everything one tier's details need: where the drifted axis is, its extent and its dials. */
interface Tier {
  readonly b: Bucket;
  readonly rng: Rng;
  readonly ox: number;
  readonly oz: number;
  readonly y0: number;
  readonly y1: number;
  readonly r0: number;
  readonly r1: number;
  readonly hh: number;
  readonly rot: number;
  readonly sides: number;
  readonly windowBoost: number;
}

/** Fins: sides + 2–8, 14% missing, leaning in to the taper; a rib (70%) and a lit slit between. */
function fins(t: Tier): number {
  const { b, rng, ox, oz, y0, r0, r1, hh, rot } = t;
  const count = t.sides + Math.floor(rng.range(2, 8));
  const thick = Math.max(0.7, r0 * 0.07);
  for (let k = 0; k < count; k++) {
    if (rng.next() < 0.14) continue;
    const a = rot + (k / count) * Math.PI * 2 + rng.range(-0.06, 0.06);
    const dd = r0 * rng.range(0.1, 0.24);
    const fh = hh * rng.range(0.7, 0.98);
    const g = new THREE.ExtrudeGeometry(shape(finShape(rng, dd, fh, rng.range(0.5, 4.5))), {
      depth: thick * rng.range(0.7, 1.4),
      bevelEnabled: false,
    });
    g.translate(0, 0, -thick / 2);
    g.rotateZ(Math.atan2(r0 - r1, hh));
    const finAt: Vec3 = [ox + Math.cos(a) * r0 * 0.9, y0, oz - Math.sin(a) * r0 * 0.9];
    b.add("shaft-fins", "basalt", g, finAt, [0, a, 0]);
    const a2 = a + Math.PI / count;
    if (rng.next() < 0.7) {
      const rib = box(dd * 0.35, hh * rng.range(0.5, 0.9), thick * 0.6);
      const ribAt: Vec3 = [
        ox + Math.cos(a2) * r0 * 0.93,
        y0 + hh * 0.46,
        oz - Math.sin(a2) * r0 * 0.93,
      ];
      b.add("shaft-fins", "basalt", rib, ribAt, [0, a2, 0]);
    }
    if (rng.next() < 0.28 * t.windowBoost) {
      const wy = y0 + rng.range(0.2, 0.75) * hh;
      const rw = THREE.MathUtils.lerp(r0, r1, (wy - y0) / hh) * 0.93 + 0.05;
      const slit = box(0.25, rng.range(1.4, 3.2), 0.7);
      b.add(
        "windows",
        "ember",
        slit,
        [ox + Math.cos(a2) * rw, wy, oz - Math.sin(a2) * rw],
        [0, a2, 0],
      );
    }
  }
  return count;
}

/** A downward-raking skirt of iron blades under the lip; 18% missing, lengths 0.6–1.3×. */
function bladeSkirt(t: Tier, blades: number): void {
  const { b, rng, ox, oz, y1, r1, rot } = t;
  const len = r1 * rng.range(0.3, 0.5);
  for (let k = 0; k < blades; k++) {
    if (rng.next() < 0.18) continue;
    const a = rot + (k / blades) * Math.PI * 2;
    const g = new THREE.ExtrudeGeometry(shape(bladeShape(rng, len * rng.range(0.6, 1.3))), {
      depth: 0.5,
      bevelEnabled: false,
    });
    g.translate(0, 0, -0.25);
    const at: Vec3 = [ox + Math.cos(a) * r1 * 1.02, y1 - 1.2, oz - Math.sin(a) * r1 * 1.02];
    b.add("blade-skirts", "iron", g, at, [0, a, 0]);
  }
}

/** One-sided annex keeps — they break the round silhouette. */
function annexes(t: Tier, count: number): void {
  const { b, rng, ox, oz, y0, r0, hh } = t;
  for (let k = 0; k < count; k++) {
    const a = rng.range(0, Math.PI * 2);
    const aw = r0 * rng.range(0.35, 0.6);
    const at: Vec3 = [
      ox + Math.cos(a) * r0 * 0.78,
      y0 + rng.range(0, hh * 0.35),
      oz + Math.sin(a) * r0 * 0.78,
    ];
    const d = aw * rng.range(0.8, 1.2);
    const h = hh * rng.range(0.5, 1.05);
    keep(b, rng, "shaft-annex", { at, w: aw, d, h, ry: -a, winChance: 0.35 * t.windowBoost });
  }
}

/** 1–3 buttress turrets clinging to a lower tier. */
function buttresses(t: Tier): void {
  const { b, rng, ox, oz, y0, r0, hh } = t;
  const n = Math.floor(rng.range(1, 4));
  for (let k = 0; k < n; k++) {
    const a = rng.range(0, Math.PI * 2);
    const r = r0 + rng.range(1, 3);
    const at: Vec3 = [ox + Math.cos(a) * r, y0 - rng.range(2, 10), oz + Math.sin(a) * r];
    turret(b, rng, "buttress-turrets", at, rng.range(1.8, 2.8), hh * rng.range(0.8, 1.6));
  }
}

/**
 * @param windowBoost multiplies the lit-slit chance (TowerParams.detailPasses).
 */
export function buildShaft(
  b: Bucket,
  rng: Rng,
  profile: TowerProfile,
  windowBoost: number,
): ShaftBuild {
  let ox = 0;
  let oz = 0;
  profile.tiers.forEach(({ y0, y1, rBottom: r0, rTop: r1 }, ti) => {
    const rot = rng.range(0, Math.PI);
    const sides = pick(rng, [8, 10, 12, 14]);
    ox += rng.range(-0.5, 0.5);
    oz += rng.range(-0.5, 0.5);
    const t: Tier = { b, rng, ox, oz, y0, y1, r0, r1, hh: y1 - y0, rot, sides, windowBoost };
    const drum = new THREE.CylinderGeometry(r1 * 0.93, r0 * 0.93, t.hh, sides);
    b.add("shaft", "basalt", drum, [ox, y0 + t.hh / 2, oz], [0, rot, 0]);
    const finCount = fins(t);
    const ledge = new THREE.CylinderGeometry(
      r1 * rng.range(1.04, 1.12),
      r1 * 0.98,
      rng.range(1, 2.2),
      sides * 2,
    );
    b.add("ledges", "iron", ledge, [ox, y1 - 0.8, oz], [0, rot, 0]);
    if (ti % 2 === 0 || rng.next() < 0.4) bladeSkirt(t, finCount + 2);
    annexes(t, ti < 4 ? Math.floor(rng.range(1, 3)) : rng.next() < 0.5 ? 1 : 0);
    if (ti <= 2) buttresses(t);
  });
  return { ox, oz };
}
