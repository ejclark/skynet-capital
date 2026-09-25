import * as THREE from "three";
import type { Bucket } from "../kit/bucket.js";
import { turret } from "../kit/greebles.js";
import type { Rng } from "../kit/rng.js";
import { type HornSpec, hornGeometry, type V3 } from "../kit/shapes.js";

/**
 * THE CROWN AND HORNS — design handoff §5. A flared open bowl with a ring of short teeth, a front
 * and a back spike, three unequal spires hanging off the flanks, and two plated horns swept along
 * cubic Béziers. The horns are deliberately UNEQUAL — different reach, height, radius, ridge count
 * and z-lean — because a mirrored pair reads as a logo, and an unequal one reads as something grown.
 */

/** The two horn curves, relative to the crown's centre `(ox, cy, oz)`. */
export function hornSpecs(ox: number, cy: number, oz: number): readonly HornSpec[] {
  const p = (x: number, y: number, z: number): V3 => [ox + x, cy + y, oz + z];
  return [
    {
      side: -1,
      r0: 6,
      ridges: 22,
      curve: [p(-7.5, 6, 0), p(-25, 10, 0.8), p(-24, 38, 1.2), p(-14, 64, 2)],
    },
    {
      side: 1,
      r0: 5.6,
      ridges: 19,
      curve: [p(7.5, 6, 0), p(23, 12, -0.6), p(22.5, 34, -1.4), p(15.5, 58, -2.4)],
    },
  ];
}

export function buildCrown(b: Bucket, rng: Rng, ox: number, cy: number, oz: number): void {
  b.add("crown", "iron", new THREE.CylinderGeometry(11.5, 6.9, 9, 20, 1, true), [ox, cy + 4.5, oz]);
  b.add("crown", "iron", new THREE.CylinderGeometry(6.9, 6.9, 0.6, 20), [ox, cy + 3, oz]);
  for (let k = 0; k < 17; k++) {
    const a = (k / 17) * Math.PI * 2 + rng.range(-0.08, 0.08);
    const th = rng.range(1.2, 3.2);
    const tooth = new THREE.ConeGeometry(rng.range(0.4, 0.8), th, 6);
    b.add(
      "crown-teeth",
      "iron",
      tooth,
      [ox + Math.cos(a) * 11.2, cy + 9 + th / 2 - 0.5, oz + Math.sin(a) * 11.2],
      [0, 0, rng.range(-0.2, 0.2)],
    );
  }
  b.add(
    "crown-teeth",
    "iron",
    new THREE.ConeGeometry(1.1, 9, 8),
    [ox, cy + 10, oz + 6.5],
    [-0.2, 0, 0],
  );
  b.add(
    "crown-teeth",
    "iron",
    new THREE.ConeGeometry(0.9, 7, 8),
    [ox + 0.5, cy + 9, oz - 6.5],
    [0.22, 0, 0.05],
  );
  turret(b, rng, "crown-spires", [ox - 9, cy - 16, oz + 5], 1.5, 17, 0.3);
  turret(b, rng, "crown-spires", [ox + 8.5, cy - 12, oz - 4.5], 1.3, 13, 0.9);
  turret(b, rng, "crown-spires", [ox + 9.5, cy - 20, oz + 4], 1.2, 19, 0.6);

  for (const spec of hornSpecs(ox, cy, oz)) {
    const raw = hornGeometry(spec);
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(raw.positions, 3));
    g.setIndex(raw.indices);
    g.computeVertexNormals();
    b.add(spec.side < 0 ? "horn-left" : "horn-right", "iron", g);
  }
}
