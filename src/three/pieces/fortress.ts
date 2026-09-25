import type { Bucket, Vec3 } from "../kit/bucket.js";
import { keep, turret } from "../kit/greebles.js";
import type { Rng } from "../kit/rng.js";

/**
 * THE STEPPED FORTRESS — design handoff §2, and the core of the asymmetry. The keeps are
 * rectilinear and deliberately NOT concentric: each sits off the one below at its own yaw, and four
 * lesser keeps hang off the flanks at different heights. The old tower was a lathe; this is a city.
 */

/** `[x, y0, z, w, d, h, rotY]` — the handoff's keep table, verbatim. */
const KEEPS: readonly (readonly [number, number, number, number, number, number, number])[] = [
  [4, 6, -2, 126, 98, 32, 0.1],
  [-8, 38, 8, 90, 72, 28, 0.04],
  [9, 66, -5, 60, 52, 22, -0.09],
  [-2, 88, 3, 42, 38, 14, 0.19],
  [-58, 4, 30, 32, 28, 50, 0.3],
  [52, 4, -40, 26, 36, 60, -0.2],
  [34, 38, 36, 22, 20, 40, 0.1],
  [-40, 38, -34, 18, 26, 34, 0.45],
];

/** `[x, y, z, r, h]` — satellite towers rising off the keeps' roofs. */
const TOWERS: readonly (readonly [number, number, number, number, number])[] = [
  [-64, 4, -48, 3.6, 76],
  [60, 4, 42, 3.2, 62],
  [-46, 38, -18, 3.4, 60],
  [38, 66, 20, 2.9, 50],
  [-22, 66, -22, 3.1, 64],
  [21, 102, -17, 2.8, 78],
  [-19, 102, 13, 2.4, 44],
  [66, 4, -6, 4.2, 44],
  [-30, 4, 62, 3.6, 38],
  [10, 38, -48, 2.8, 70],
];

/**
 * @param windowBoost multiplies the lit-slit chance — a higher-standing tower is a busier fortress
 *   (TowerParams.detailPasses), never a different shape.
 */
export function buildFortress(b: Bucket, rng: Rng, windowBoost: number): void {
  KEEPS.forEach(([x, y, z, w, d, h, ry], i) => {
    const at: Vec3 = [x, y, z];
    keep(b, rng, "fortress", { at, w, d, h, ry, winChance: (i < 4 ? 0.42 : 0.3) * windowBoost });
  });
  for (const [x, y, z, r, h] of TOWERS) turret(b, rng, "fortress-towers", [x, y, z], r, h);
}
