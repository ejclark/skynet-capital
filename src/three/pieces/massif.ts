import * as THREE from "three";
import type { Bucket, Vec3 } from "../kit/bucket.js";
import { ridged, vnoise } from "../kit/noise.js";
import type { Rng } from "../kit/rng.js";

/**
 * THE GROUND — the lopsided massif the fortress is driven into, its scree, and the crags that break
 * the silhouette (one great diagonal crag wraps the shaft itself). Design handoff §1 and §3.
 *
 * All rock is a low-poly icosphere pushed around by ridged noise and flat-shaded: faceted planes
 * catch the key light as ridgelines, which is what reads as geology rather than a lumpy ball.
 */

/** Displace every vertex of a unit icosphere by `k(v)` — radial (xyz) or per-axis via `map`. */
function sculpt(detail: number, map: (v: THREE.Vector3) => Vec3): THREE.BufferGeometry {
  const g = new THREE.IcosahedronGeometry(1, detail);
  const p = g.attributes.position as THREE.BufferAttribute;
  const v = new THREE.Vector3();
  for (let i = 0; i < p.count; i++) {
    v.fromBufferAttribute(p, i);
    p.setXYZ(i, ...map(v));
  }
  g.computeVertexNormals();
  return g;
}

/**
 * The massif: ~224 × 192 across, ~34 high, lopsided by `1 + .18·sin(2θ+.7) + .1·cos(3θ)` so no two
 * sides match, clamped flat at y = 0 and offset +6 on x — the tower does not sit on the summit,
 * which is half of why the whole composition reads asymmetric.
 */
function massif(b: Bucket): void {
  const g = sculpt(7, (v) => {
    const n = ridged(v.x * 2 + 3, v.y * 2, v.z * 2 - 7);
    const th = Math.atan2(v.z, v.x);
    const lop = 1 + 0.18 * Math.sin(th * 2 + 0.7) + 0.1 * Math.cos(th * 3);
    const k = (0.72 + n * 0.5) * lop;
    return [v.x * 112 * k, Math.max(0, v.y * 34 * (0.6 + n * 0.8) * lop), v.z * 96 * k];
  });
  b.add("massif", "rock", g, [6, 0, 0]);
}

/** 70 scree boulders strewn round the mountain's skirt. */
function scree(b: Bucket, rng: Rng): void {
  for (let i = 0; i < 70; i++) {
    const a = rng.range(0, Math.PI * 2);
    const r = rng.range(60, 118);
    const s = rng.range(2, 8);
    b.add(
      "massif",
      "rock",
      new THREE.DodecahedronGeometry(1, 0),
      [Math.cos(a) * r, rng.range(0, 10), Math.sin(a) * r],
      [rng.range(0, 3), rng.range(0, 3), rng.range(0, 3)],
      [s, s * rng.range(0.4, 1), s * rng.range(0.7, 1.3)],
    );
  }
}

interface CragSpec {
  readonly pos: Vec3;
  readonly scl: Vec3;
  readonly rot: Vec3;
  readonly detail: number;
  readonly rough: number;
  readonly seed: number;
}

/** The great diagonal crag that wraps the shaft, and two lesser ones lower down. */
const CRAGS: readonly CragSpec[] = [
  {
    pos: [18, 124, 10],
    scl: [13, 60, 19],
    rot: [0.35, 0.7, -0.62],
    detail: 5,
    rough: 0.62,
    seed: 11,
  },
  {
    pos: [-34, 68, -24],
    scl: [10, 36, 14],
    rot: [0.2, -0.5, 0.72],
    detail: 4,
    rough: 0.6,
    seed: 29,
  },
  { pos: [40, 40, 30], scl: [14, 22, 16], rot: [0.1, 0.9, -0.3], detail: 4, rough: 0.55, seed: 47 },
];

/** A ridged, displaced boulder, stretched and tilted into a blade of rock. */
function crag(b: Bucket, c: CragSpec): void {
  const g = sculpt(c.detail, (v) => {
    const n = ridged(v.x * 2.4 + c.seed, v.y * 2.4, v.z * 2.4 + c.seed);
    const k =
      1 - c.rough * 0.5 + n * c.rough + vnoise(v.x * 11 + c.seed, v.y * 11, v.z * 11) * 0.04;
    return [v.x * k, v.y * k, v.z * k];
  });
  b.add("crags", "rock", g, c.pos, c.rot, c.scl);
}

export function buildGround(b: Bucket, rng: Rng): void {
  massif(b);
  scree(b, rng);
  for (const c of CRAGS) crag(b, c);
}
