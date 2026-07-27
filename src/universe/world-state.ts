import type { Sector } from "./sectors.js";

/**
 * The Living Universe world model — the single, renderer-agnostic description of every empire on the
 * board. `project()` (see project.ts) derives it deterministically from account data; renderers (the
 * SVG skyline today, the animated canvas board next, anything later) are interchangeable skins over it.
 * Keeping every mapping rule behind this seam is what stops each new renderer from re-deriving —
 * and drifting from — the rules. Pure data: serializable, no methods, no I/O.
 */

/** One holding rendered as a structure (a tower). Identity = the ticker; size/health = the position. */
export interface StructureState {
  readonly symbol: string;
  readonly sector: Sector;
  /** R1 — relative mass 0..1 within the empire (market value / the empire's largest position). */
  readonly mass: number;
  /**
   * R2 — signed health −1..1 from unrealized P/L over cost basis (clamped). Positive = lit/thriving,
   * negative = dim/weathered. Derived from real P/L only — never flatters (honesty invariant).
   */
  readonly health: number;
  /** The real dollars behind the health read, carried so renderers can be honest in detail views. */
  readonly unrealizedPl: number;
  readonly marketValue: number;
}

/** R4 — the treasury: uninvested capital as a landmark reserve (the empire "about to rise"). */
export interface ReserveState {
  /** Cash share of equity, 0..1. */
  readonly share: number;
  readonly cash: number;
}

/** R5 — a persona's signature hero structure; prominence is the leveling dial (rank among peers). */
export interface LandmarkState {
  readonly kind: "eye";
  readonly personaId: string;
  /** 0..1 — better standing relative to peers → larger/brighter landmark. */
  readonly prominence: number;
}

/** One participant's empire — everything a renderer needs to draw their city at any level of detail. */
export interface EmpireState {
  readonly id: string;
  readonly owner: string;
  readonly ownerKind: "human" | "bot";
  /** R3 — the dominant-sector theme label ("TECH", "DIVERSIFIED", "FRONTIER", …). */
  readonly theme: string;
  /** False = no holdings yet: the pre-founding state (a frontier plot, not a blank). */
  readonly founded: boolean;
  /** Structures sorted by mass, largest first (the skyline order). */
  readonly structures: readonly StructureState[];
  readonly reserve: ReserveState;
  readonly landmark?: LandmarkState;
  readonly equity: number;
}

/** The whole board: every empire, projected from the same instant. */
export interface WorldState {
  readonly empires: readonly EmpireState[];
}
