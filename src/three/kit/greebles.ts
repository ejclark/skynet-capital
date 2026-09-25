import * as THREE from "three";
import type { Bucket, MatKey, Vec3 } from "./bucket.js";
import type { Rng } from "./rng.js";

/**
 * MASONRY MOLECULES — the repeatable pieces the fortress, the shaft annexes and the crown are all
 * assembled from: a rectilinear KEEP (pilasters, crenels, lit slits), a TURRET with one of three
 * crowns, and a SPIRE. Ported from the Barad-dûr design handoff; every one is randomised through the
 * seeded `Rng`, so the fortress is irregular yet identical on every load.
 *
 * Each writes into a `Bucket` rather than returning meshes, so a whole district of these still costs
 * one draw call per material.
 */

export const box = (x: number, y: number, z: number): THREE.BufferGeometry =>
  new THREE.BoxGeometry(x, y, z);

const pick = <T>(rng: Rng, arr: readonly T[]): T => arr[Math.floor(rng.next() * arr.length)] as T;

/** A seven-sided spike standing on `at`. */
export function spire(
  b: Bucket,
  part: string,
  at: Vec3,
  r: number,
  h: number,
  mat: MatKey = "iron",
  tilt: Vec3 = [0, 0, 0],
): void {
  b.add(part, mat, new THREE.ConeGeometry(r, h, 7), [at[0], at[1] + h / 2, at[2]], tilt);
}

/** One of the three turret crowns, standing on `top`. `variant` in [0, 1) picks. */
function turretCrown(
  b: Bucket,
  rng: Rng,
  part: string,
  at: Vec3,
  r: number,
  sides: number,
  variant: number,
) {
  const [x, top, z] = at;
  if (variant < 0.45) {
    // A — a ring of six small spires round a tall central one.
    for (let k = 0; k < 6; k++) {
      const a = (k / 6) * Math.PI * 2;
      spire(
        b,
        part,
        [x + Math.cos(a) * r * 1.1, top, z + Math.sin(a) * r * 1.1],
        r * 0.2,
        r * rng.range(1.4, 3),
      );
    }
    spire(b, part, [x, top, z], r * 0.55, r * rng.range(4, 7));
  } else if (variant < 0.8) {
    // B — eight outward-leaning teeth under a lantern and a spire.
    for (let k = 0; k < 8; k++) {
      const a = (k / 8) * Math.PI * 2;
      const at8: Vec3 = [x + Math.cos(a) * r * 1.15, top - r * 0.3, z + Math.sin(a) * r * 1.15];
      spire(b, part, at8, r * 0.28, r * rng.range(2, 3.5), "iron", [0, -a, 0.35]);
    }
    b.add(part, "basalt", new THREE.CylinderGeometry(r * 0.45, r * 0.7, r * 2.5, sides), [
      x,
      top + r * 1.25,
      z,
    ]);
    spire(b, part, [x, top + r * 2.5, z], r * 0.5, r * rng.range(2, 4));
  } else {
    // C — a drum carrying two unequal spires.
    b.add(part, "basalt", new THREE.CylinderGeometry(r * 0.9, r * 1.2, r * 1.6, sides), [
      x,
      top + r * 0.8,
      z,
    ]);
    spire(b, part, [x - r * 0.5, top + r * 1.6, z], r * 0.3, r * 3.2);
    spire(b, part, [x + r * 0.4, top + r * 1.6, z + r * 0.3], r * 0.26, r * 2.1);
  }
}

/**
 * A satellite tower: a tapered 6/8/10-sided drum ribbed with fins (20% missing, 30% with a lit slit
 * beside them), a flared cap, and one of three crowns.
 */
export function turret(
  b: Bucket,
  rng: Rng,
  part: string,
  at: Vec3,
  r: number,
  h: number,
  variant = rng.next(),
): void {
  const [x, y0, z] = at;
  const sides = pick(rng, [6, 8, 8, 10]);
  b.add(
    part,
    "basalt",
    new THREE.CylinderGeometry(r * 0.8, r, h, sides),
    [x, y0 + h / 2, z],
    [0, rng.next() * 3, 0],
  );
  for (let k = 0; k < sides; k++) {
    if (rng.next() < 0.2) continue;
    const a = (k / sides) * Math.PI * 2 + rng.next() * 0.2;
    const fh = h * rng.range(0.55, 0.95);
    const fin = box(r * 0.26, fh, r * rng.range(0.3, 0.6));
    b.add(
      part,
      "basalt",
      fin,
      [x + Math.cos(a) * r * 0.92, y0 + fh / 2, z + Math.sin(a) * r * 0.92],
      [0, -a, 0],
    );
    if (rng.next() < 0.3) {
      const wa = a + 0.35;
      const wy = y0 + h * rng.range(0.4, 0.85);
      const slit = box(r * 0.12, r * 0.9, r * 0.12);
      b.add(
        "windows",
        "ember",
        slit,
        [x + Math.cos(wa) * r * 0.86, wy, z + Math.sin(wa) * r * 0.86],
        [0, -a, 0],
      );
    }
  }
  b.add(part, "basalt", new THREE.CylinderGeometry(r * 1.3, r * 0.82, r * 1.1, sides), [
    x,
    y0 + h + r * 0.5,
    z,
  ]);
  turretCrown(b, rng, part, [x, y0 + h + r * 1.05, z], r, sides, variant);
}

export interface KeepSpec {
  /** Centre of the keep's footprint, and the y it stands on. */
  readonly at: Vec3;
  readonly w: number;
  readonly d: number;
  readonly h: number;
  /** Yaw of the keep's local frame — the keeps are deliberately not aligned to each other. */
  readonly ry: number;
  /** Chance per bay per 9-unit row that a slit is lit. */
  readonly winChance: number;
}

const Y_AXIS = new THREE.Vector3(0, 1, 0);

/**
 * A rectilinear keep: box core, a 1.4-high cornice, pilasters every 2.8–3.8 along each face (depth
 * 0.5–1.8, 70–104% of the height, 12% missing, 22% carrying an iron spike), crenels on every other
 * 2.6, and lit slits between pilasters on a 9-unit row pitch.
 */
export function keep(b: Bucket, rng: Rng, part: string, spec: KeepSpec): void {
  const { at, w, d, h, ry, winChance } = spec;
  const q = new THREE.Quaternion().setFromAxisAngle(Y_AXIS, ry);
  const origin = new THREE.Vector3(...at);
  const P = (lx: number, ly: number, lz: number): Vec3 =>
    new THREE.Vector3(lx, ly, lz).applyQuaternion(q).add(origin).toArray();
  const R: Vec3 = [0, ry, 0];
  b.add(part, "basalt", box(w, h, d), P(0, h / 2, 0), R);
  b.add(part, "basalt", box(w + 1.2, 1.4, d + 1.2), P(0, h - 0.7, 0), R);
  const faces: readonly (readonly [number, number, number, number, number])[] = [
    [0, d / 2, w, 0, 1],
    [0, -d / 2, w, 0, -1],
    [w / 2, 0, d, 1, 0],
    [-w / 2, 0, d, -1, 0],
  ];
  for (const [fx, fz, len, nx, nz] of faces) {
    const n = Math.max(2, Math.round(len / rng.range(2.8, 3.8)));
    const step = len / n;
    const onFace = (along: number, out: number, y: number): Vec3 =>
      P(fx + (nz !== 0 ? along : 0) + nx * out, y, fz + (nx !== 0 ? along : 0) + nz * out);
    for (let k = 0; k < n; k++) {
      const along = ((k + 0.5) / n - 0.5) * len;
      const dep = rng.range(0.5, 1.8);
      const ph = h * rng.range(0.7, 1.04);
      if (rng.next() > 0.12)
        b.add(
          part,
          "basalt",
          box(nx ? dep : 0.9, ph, nz ? dep : 0.9),
          onFace(along, dep / 2, ph / 2),
          R,
        );
      if (rng.next() < 0.22) spire(b, part, onFace(along, dep / 2, ph), 0.5, rng.range(2, 6));
      for (let row = 0; row < Math.floor(h / 9); row++) {
        if (rng.next() > winChance) continue;
        const wa = along + step / 2;
        if (Math.abs(wa) > len / 2 - 1) continue;
        const slit = box(nx ? 0.3 : 0.8, rng.range(1.8, 3.6), nz ? 0.3 : 0.8);
        b.add("windows", "ember", slit, onFace(wa, 0.1, row * 9 + rng.range(3, 6)), R);
      }
    }
    const crenels = Math.floor(len / 2.6);
    for (let k = 0; k < crenels; k += 2) {
      const along = ((k + 0.5) / crenels - 0.5) * len;
      b.add(part, "basalt", box(1.3, 1.8, 1.3), onFace(along, 0.4, h + 0.9), R);
    }
  }
}
