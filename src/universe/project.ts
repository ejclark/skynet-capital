import {
  fin,
  type ParticipantSnapshot,
  type PositionView,
  unrealizedPl,
} from "../observatory/participant-snapshot.js";
import { SECTOR_LABEL, type Sector, sectorOf } from "./sectors.js";
import type { EmpireState, LandmarkState, StructureState, WorldState } from "./world-state.js";

/**
 * The World Projection — the pure, deterministic function that turns account data into world state:
 * positions → structures (R1 mass, R2 health, R3 sector/theme), cash → reserve (R4), persona rank →
 * landmark prominence (R5). Every mapping rule the board renders by lives HERE, once, unit-tested —
 * renderers stay dumb skins. Same inputs → same world (no randomness, no clock, no I/O), which is
 * what keeps every city recognizable to its owner and every screenshot test stable.
 *
 * Honesty invariants (asserted by tests):
 *  - health/direction come only from real P/L; prominence only from real relative standing.
 *  - an empty portfolio is a FOUNDING state (frontier plot + reserve), never a blank or a fake city.
 */

/**
 * How many structures a compact skyline DISPLAYS as individual towers. The projection itself never
 * truncates — renderers show the top MAX_STRUCTURES and aggregate the rest via tailOf() so overflow
 * is visible ("+N OUTER"), never silent.
 */
export const MAX_STRUCTURES = 9;

/** A labeled aggregate of the holdings a renderer can't show individually (the "outer district"). */
export interface TailAggregate {
  readonly count: number;
  readonly marketValue: number;
  readonly unrealizedPl: number;
}

/** Aggregate the structures beyond a display cap; undefined when everything fits. */
export function tailOf(
  structures: readonly StructureState[],
  max: number = MAX_STRUCTURES,
): TailAggregate | undefined {
  if (structures.length <= max) return undefined;
  const rest = structures.slice(max);
  return {
    count: rest.length,
    marketValue: rest.reduce((s, x) => s + x.marketValue, 0),
    unrealizedPl: rest.reduce((s, x) => s + x.unrealizedPl, 0),
  };
}

/**
 * Clamp that also absorbs NaN/Infinity, falling back to the LOW bound. Deliberately NOT the shared
 * `math/num.clamp`: projection inputs come from live account data where a missing/garbage figure
 * must degrade to "nothing" rather than leak NaN into the rendered world (the honesty invariant).
 * The two look alike and are not the same — see tests/observatory/empire-skyline.spec.ts.
 */
const clampFinite = (v: number, lo: number, hi: number): number =>
  Number.isFinite(v) ? Math.min(hi, Math.max(lo, v)) : lo;

/** The dominant sector by invested weight (ties → the first seen); "DIVERSIFIED" if none ≥ 50%. */
export function empireTheme(positions: readonly PositionView[]): string {
  if (positions.length === 0) return "FRONTIER";
  const weight = new Map<Sector, number>();
  let total = 0;
  for (const p of positions) {
    const s = sectorOf(p.symbol);
    weight.set(s, (weight.get(s) ?? 0) + p.marketValue);
    total += p.marketValue;
  }
  let top: Sector = "market";
  let topW = -1;
  for (const [s, w] of weight) if (w > topW) [top, topW] = [s, w];
  if (total > 0 && topW / total < 0.5 && weight.size > 1) return "DIVERSIFIED";
  return SECTOR_LABEL[top];
}

// Persona → landmark kind: a persona's signature structure crowns its city. Extend per persona
// (the hero-character seam); unknown personas simply have no landmark yet.
const PERSONA_LANDMARK: Record<string, LandmarkState["kind"]> = { sauron: "eye" };

export interface ProjectOptions {
  /** R5 — the persona landmark's leveling dial 0..1 (rank among peer bots). Defaults to 1. */
  readonly personaProminence?: number;
}

/** Project one participant's snapshot into their empire. Pure; see module doc for the rules. */
export function projectEmpire(
  snapshot: ParticipantSnapshot,
  opts: ProjectOptions = {},
): EmpireState {
  // R1+R2+R2b+R3 — ALL holdings become structures (no silent truncation), sorted by weight;
  // mass is value relative to the largest, footprint is cost basis relative to the largest.
  const sorted = [...snapshot.positions].sort((a, b) => fin(b.marketValue) - fin(a.marketValue));
  const maxVal = Math.max(...sorted.map((p) => fin(p.marketValue)), 1);
  const maxBasis = Math.max(...sorted.map((p) => Math.abs(fin(p.quantity) * fin(p.avgPrice))), 1);
  const structures: StructureState[] = sorted.map((p) => {
    const u = unrealizedPl(p);
    const basis = Math.abs(fin(p.quantity) * fin(p.avgPrice));
    return {
      symbol: p.symbol,
      sector: sectorOf(p.symbol),
      mass: clampFinite(fin(p.marketValue) / maxVal, 0, 1),
      footprint: clampFinite(basis / maxBasis, 0, 1),
      health: basis > 0 ? clampFinite(u / basis, -1, 1) : 0,
      unrealizedPl: u,
      marketValue: fin(p.marketValue),
    };
  });

  // R4 — the reserve: cash share of equity (0 when equity is zero/errored — never fabricate).
  const share = snapshot.equity > 0 ? clampFinite(snapshot.cash / snapshot.equity, 0, 1) : 0;

  // R5 — the persona landmark, scaled by standing among peers (caller supplies the rank dial).
  const kind = snapshot.personaId ? PERSONA_LANDMARK[snapshot.personaId] : undefined;
  const landmark: LandmarkState | undefined =
    kind && snapshot.personaId
      ? {
          kind,
          personaId: snapshot.personaId,
          prominence: clampFinite(opts.personaProminence ?? 1, 0, 1),
        }
      : undefined;

  return {
    id: snapshot.id,
    owner: snapshot.displayName,
    ownerKind: snapshot.kind,
    theme: empireTheme(snapshot.positions),
    founded: structures.length > 0,
    structures,
    reserve: { share, cash: fin(snapshot.cash) },
    ...(landmark ? { landmark } : {}),
    equity: fin(snapshot.equity),
  };
}

/** Project the whole board. `prominence` = per-participant landmark dials (rank among peer bots). */
export function projectWorld(
  snapshots: readonly ParticipantSnapshot[],
  prominence?: ReadonlyMap<string, number>,
): WorldState {
  return {
    empires: snapshots.map((s) =>
      projectEmpire(s, {
        ...(prominence?.has(s.id) ? { personaProminence: prominence.get(s.id) } : {}),
      }),
    ),
  };
}
