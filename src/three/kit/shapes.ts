import type { Rng } from "./rng.js";

/**
 * The tower's custom shapes as plain arrays — fin and blade profiles, the swept horn, the almond
 * pinch — with no three.js, so every one is unit-testable. Ported verbatim in intent from the
 * Barad-dûr design handoff (the reference is three.js too, so winding and axes carry over 1:1:
 * right-handed, y-up, counter-clockwise front faces).
 */

export type Pt = readonly [number, number];
export type V3 = [number, number, number];

/**
 * A shaft fin in profile: x = depth out from the wall, y = up. Jagged on the outer edge with a spike
 * over the top, so a ring of them reads as the tower's organ-pipe ribs rather than a gear.
 */
export function finShape(rng: Rng, depth: number, height: number, spike: number): Pt[] {
  return [
    [0, 0],
    [depth * 0.7, 0],
    [depth, height * 0.12],
    [depth * 1.05, height * rng.range(0.6, 0.85)],
    [depth * 0.55, height + spike],
    [depth * 0.35, height * 0.9],
    [0, height],
  ];
}

/** A downward-raking iron blade for the tier skirts: x = out, y = up (the tip hangs below 0). */
export function bladeShape(rng: Rng, len: number): Pt[] {
  return [
    [0, 0],
    [len, -len * rng.range(0.4, 0.75)],
    [len * 0.82, -len * 0.3],
    [len * 0.25, 0.9],
    [0, 1.4],
  ];
}

/** Point and unit tangent on a cubic Bézier at f ∈ [0, 1]. */
export function bezier(p: readonly [V3, V3, V3, V3], f: number): { point: V3; tangent: V3 } {
  const [a, b, c, d] = p;
  const u = 1 - f;
  const at = (i: 0 | 1 | 2): number =>
    u * u * u * a[i] + 3 * u * u * f * b[i] + 3 * u * f * f * c[i] + f * f * f * d[i];
  const dt = (i: 0 | 1 | 2): number =>
    3 * u * u * (b[i] - a[i]) + 6 * u * f * (c[i] - b[i]) + 3 * f * f * (d[i] - c[i]);
  const raw: V3 = [dt(0), dt(1), dt(2)];
  const len = Math.hypot(...raw) || 1;
  return { point: [at(0), at(1), at(2)], tangent: [raw[0] / len, raw[1] / len, raw[2] / len] };
}

export interface HornSpec {
  /** −1 = left horn, +1 = right. */
  readonly side: -1 | 1;
  readonly curve: readonly [V3, V3, V3, V3];
  /** Radius at the root. */
  readonly r0: number;
  /** Plate-ridge frequency along the blade (the horns differ so they never read as mirrored). */
  readonly ridges: number;
}

export interface RawGeometry {
  readonly positions: number[];
  readonly indices: number[];
}

/**
 * Sweep a plated horn along its Bézier. The cross-section is lopsided on purpose: 0.7 on the side
 * facing the Eye, 1.0 outside, 1.35 in depth — a blade, not a pipe. Radius tapers `r0·(1−f)^0.8`
 * with raised plates `1 + .09·max(0, sin(f·π·ridges))·(1−f)` that fade toward the tip.
 */
export function hornGeometry(spec: HornSpec, samples = 110, radial = 36): RawGeometry {
  const positions: number[] = [];
  const indices: number[] = [];
  for (let i = 0; i <= samples; i++) {
    const f = i / samples;
    const { point: c, tangent: t } = bezier(spec.curve, f);
    // In-plane normal = tangent × Z.
    const nl = Math.hypot(t[1], t[0]) || 1;
    const nx = t[1] / nl;
    const ny = -t[0] / nl;
    let r = spec.r0 * (1 - f) ** 0.8 + 0.05;
    r *= 1 + 0.09 * Math.max(0, Math.sin(f * Math.PI * spec.ridges)) * (1 - f);
    for (let j = 0; j < radial; j++) {
      const th = (j / radial) * Math.PI * 2;
      const ci = Math.cos(th);
      const across = ci * r * (ci * spec.side > 0 ? 1.0 : 0.7);
      positions.push(c[0] + nx * across, c[1] + ny * across, c[2] + Math.sin(th) * r * 1.35);
    }
  }
  for (let i = 0; i < samples; i++) {
    for (let j = 0; j < radial; j++) {
      const a = i * radial + j;
      const b = i * radial + ((j + 1) % radial);
      const c2 = (i + 1) * radial + j;
      const d2 = (i + 1) * radial + ((j + 1) % radial);
      indices.push(a, c2, b, b, c2, d2);
    }
  }
  return { positions, indices };
}

/**
 * Pinch a unit sphere into the Eye's almond: y (and optionally z) scaled by √(1−x²), so both
 * canthi come to a point. In place. The pupil uses the same shape without the z taper.
 */
export function almondify(positions: { length: number; [i: number]: number }, taperZ = true): void {
  for (let i = 0; i < positions.length; i += 3) {
    const x = positions[i] ?? 0;
    const k = Math.sqrt(Math.max(0, 1 - x * x));
    positions[i + 1] = (positions[i + 1] ?? 0) * k;
    if (taperZ) positions[i + 2] = (positions[i + 2] ?? 0) * k;
  }
}
