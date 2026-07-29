import { clamp01, lerp } from "../../math/num.js";

/**
 * The seam that turns the Tower from set-dressing into a GAME PIECE.
 *
 * `docs/LIVING-UNIVERSE.md` ("Landmarks that level up") says a persona's landmark is a character you
 * level: the better the bot does relative to its peers, the more its structure dominates — the
 * landmark IS the scoreboard. This module is the one place that maps world state
 * (`src/universe/world-state.ts` → `LandmarkState.prominence`, `EmpireState`) onto render dials, so
 * every renderer reads the same rules instead of re-deriving (and drifting from) them.
 *
 * Pure math, no Babylon — unit-testable without a browser.
 */

/** Every dial the tower render exposes, already resolved to concrete numbers. */
export interface TowerParams {
  /** 0..1 standing among peers — the master dial. Drives size, detail and light together. */
  readonly power: number;
  /**
   * −1..1 signed health from unrealized P/L. Positive = the forge burns hot and clean; negative =
   * dimmed, colder, more weathered. Honest by construction: it can dim the tower, never flatter it.
   */
  readonly health: number;
  /** Eye emissive intensity multiplier. */
  readonly eyeIntensity: number;
  /** How far the gaze beam reaches, world units — "commands more" at higher standing. */
  readonly gazeReach: number;
  /** Molten forge glow under the fortress; falls off hard when positions bleed. */
  readonly forgeIntensity: number;
  /** Storm/ember density multiplier around the crown. */
  readonly stormDensity: number;
  /** Extra masonry detail passes granted at higher standing (0..2). */
  readonly detailPasses: number;
}

/** A neutral, mid-power tower — what `/tower` shows standalone with no account behind it. */
export const DEFAULT_PARAMS: TowerParams = resolveTowerParams({ prominence: 0.62, health: 0.15 });

/** The honest inputs a landmark is derived from. Mirrors `LandmarkState` + the empire's health. */
export interface TowerStateInput {
  /** 0..1 rank among peers (`LandmarkState.prominence`). */
  readonly prominence: number;
  /** −1..1 signed P/L health. Defaults to neutral when an empire has no positions yet. */
  readonly health?: number;
}

/**
 * Map world state → render dials. Deliberately non-linear in places: a bit of extra standing near
 * the top should FEEL like a lot (the reward curve), while the bottom never collapses to nothing —
 * a lagging tower dims and recedes, but it's still standing, because players aren't punished with
 * spectacle (CLAUDE.md: positive reinforcement over negative).
 */
export function resolveTowerParams(state: TowerStateInput): TowerParams {
  const power = clamp01(state.prominence);
  const health = Math.min(1, Math.max(-1, state.health ?? 0));
  // Winning reads as heat and reach; losing reads as dimming, never as ruin.
  const warmth = (health + 1) / 2; // 0..1

  return {
    power,
    health,
    eyeIntensity: lerp(0.55, 1.6, power ** 1.4) * lerp(0.7, 1.15, warmth),
    gazeReach: lerp(70, 190, power),
    forgeIntensity: lerp(0.25, 1.35, warmth) * lerp(0.8, 1.2, power),
    stormDensity: lerp(0.45, 1.4, power),
    detailPasses: power > 0.8 ? 2 : power > 0.45 ? 1 : 0,
  };
}
