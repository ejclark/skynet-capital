import { clamp01, lerp } from "../../math/num.js";

/**
 * The shaft's SHAPE as pure data — the tier table from the Barad-dûr design handoff, with no three.js
 * and no meshes. The silhouette IS the design, so it lives here where a spec can assert it.
 *
 * The tower is no longer one smooth necking curve: it is seven stacked tiers, each a drum that steps
 * in at the ledge above it. The builder then randomises every tier (polygon count, rotation, axis
 * drift, fins, annexes) — that per-tier irregularity is what kills the symmetry the old ring-stack had.
 *
 * World units ≈ metres, y-up, origin at the base centre. The shaft rises out of the stepped fortress,
 * whose top keep ends at y ≈ 102.
 */

/** One stacked tier of the shaft: `[y0, y1]` vertical extent, radius at its foot and its lip. */
export interface Tier {
  readonly y0: number;
  readonly y1: number;
  readonly rBottom: number;
  readonly rTop: number;
}

export interface TowerProfile {
  /** Base → crown. Each tier's y0 is the previous tier's y1. */
  readonly tiers: readonly Tier[];
}

const t = (y0: number, y1: number, rBottom: number, rTop: number): Tier => ({
  y0,
  y1,
  rBottom,
  rTop,
});

export const DEFAULT_PROFILE: TowerProfile = {
  tiers: [
    t(100, 140, 19.5, 17.2),
    t(140, 176, 16.2, 14.6),
    t(176, 210, 13.6, 12.2),
    t(210, 240, 11.4, 10.3),
    t(240, 266, 9.6, 8.7),
    t(266, 288, 8.2, 7.4),
    t(288, 302, 7.2, 6.8),
  ],
};

/** Where the shaft meets the fortress — the fixed point `scaleProfile` stretches away from. */
export const SHAFT_FOOT = 100;

/** World-space Y of the crown (the top of the last tier), where the bowl and horns sit. */
export function crownY(profile: TowerProfile): number {
  return profile.tiers.at(-1)?.y1 ?? SHAFT_FOOT;
}

/**
 * Scale a profile by a 0..1 power level — the landmark "levels up" (docs/LIVING-UNIVERSE.md).
 * Height reads as dominance, so the shaft stretches (from its foot, so it stays rooted in the
 * fortress); radii barely move so it never looks bloated. Power ≈ 0.62 (the standalone default)
 * reproduces the handoff's proportions almost exactly.
 */
export function scaleProfile(profile: TowerProfile, power: number): TowerProfile {
  const p = clamp01(power);
  const h = lerp(0.72, 1.18, p);
  const r = lerp(0.92, 1.06, p);
  const y = (v: number): number => SHAFT_FOOT + (v - SHAFT_FOOT) * h;
  return {
    tiers: profile.tiers.map((tier) => t(y(tier.y0), y(tier.y1), tier.rBottom * r, tier.rTop * r)),
  };
}
