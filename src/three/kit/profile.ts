import { clamp, clamp01, lerp } from "../../math/num.js";

/**
 * The tower's SHAPE, as pure math — radius/height curves and per-ring layout, with no Babylon and no
 * meshes. Keeping the silhouette here (rather than inline in the builder) is what makes it tunable,
 * reviewable, and unit-testable: the profile IS the design, so it deserves to be tested like logic.
 */

/** The tower's overall dimensions. Scaled by game state (see params.ts) so the landmark can level. */
export interface TowerProfile {
  /** Radius at the base, world units. */
  readonly baseRadius: number;
  /** Radius at the crown. */
  readonly crownRadius: number;
  /** Total height from the plinth to the crown. */
  readonly height: number;
  /**
   * Neck exponent. <1 necks in FAST (broad fortress → slender spire, the Barad-dûr read);
   * 1 is a straight cone; >1 stays fat then tapers late.
   */
  readonly neck: number;
  /** How many stacked masonry rings compose the shaft. */
  readonly rings: number;
}

export const DEFAULT_PROFILE: TowerProfile = {
  baseRadius: 15.5,
  crownRadius: 2.4,
  height: 78,
  neck: 0.55,
  rings: 22,
};

/**
 * Radius at height fraction `t` (0 = base, 1 = crown). The `neck` exponent is what gives the
 * fortress its dramatic taper instead of a dull cone.
 */
export function radiusAt(profile: TowerProfile, t: number): number {
  const clamped = clamp01(t);
  return lerp(profile.baseRadius, profile.crownRadius, clamped ** profile.neck);
}

/** One masonry ring's placement — everything a builder needs, with no geometry decisions baked in. */
export interface RingLayout {
  /** 0-based index from the base. */
  readonly index: number;
  /** Height fraction 0..1. */
  readonly t: number;
  /** World-space Y of the ring's base. */
  readonly y: number;
  /** Ring radius at this height. */
  readonly radius: number;
  /** Vertical extent of this ring. */
  readonly height: number;
  /** How many slats go around — denser near the base so masonry scale stays constant. */
  readonly slats: number;
  /** True for the lower rings that carry buttress spikes. */
  readonly buttressed: boolean;
}

/** Circumference-proportional slat count, so stones look the same SIZE at every height. */
function slatsFor(radius: number): number {
  return clamp(Math.round(radius * 2.6), 8, 64);
}

/**
 * Lay out every ring of the shaft, base → crown. Pure: returns plain data a builder turns into
 * meshes, which is what lets the whole silhouette be asserted in a spec.
 */
export function layoutRings(profile: TowerProfile = DEFAULT_PROFILE): readonly RingLayout[] {
  const out: RingLayout[] = [];
  const ringHeight = profile.height / profile.rings;
  for (let index = 0; index < profile.rings; index++) {
    const t = index / profile.rings;
    const radius = radiusAt(profile, t);
    out.push({
      index,
      t,
      y: t * profile.height,
      radius,
      height: ringHeight,
      slats: slatsFor(radius),
      buttressed: index < Math.round(profile.rings * 0.4),
    });
  }
  return out;
}

/** Scale a profile by a 0..1 power level — the landmark "levels up" (docs/LIVING-UNIVERSE.md). */
export function scaleProfile(profile: TowerProfile, power: number): TowerProfile {
  const p = clamp01(power);
  // Height reads as dominance, so it gets the widest swing; the base barely moves so the tower
  // stays planted on its mountain rather than shrinking away from it.
  return {
    ...profile,
    height: profile.height * lerp(0.72, 1.18, p),
    baseRadius: profile.baseRadius * lerp(0.92, 1.06, p),
    rings: Math.round(profile.rings * lerp(0.8, 1.15, p)),
  };
}
