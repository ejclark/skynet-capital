import type { ParticipantSnapshot, PositionView } from "../observatory/participant-snapshot.js";
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

/** How many structures a skyline renders — the top holdings by weight (matches the SVG renderer). */
export const MAX_STRUCTURES = 9;

const unrealized = (p: PositionView): number => p.marketValue - p.quantity * p.avgPrice;

const clamp = (v: number, lo: number, hi: number): number => Math.min(hi, Math.max(lo, v));

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
  // R1+R2+R3 — the skyline's structures: top holdings by weight, mass relative to the largest.
  const sorted = [...snapshot.positions]
    .sort((a, b) => b.marketValue - a.marketValue)
    .slice(0, MAX_STRUCTURES);
  const maxVal = Math.max(...sorted.map((p) => p.marketValue), 1);
  const structures: StructureState[] = sorted.map((p) => {
    const u = unrealized(p);
    const basis = Math.abs(p.quantity * p.avgPrice);
    return {
      symbol: p.symbol,
      sector: sectorOf(p.symbol),
      mass: p.marketValue / maxVal,
      health: basis > 0 ? clamp(u / basis, -1, 1) : 0,
      unrealizedPl: u,
      marketValue: p.marketValue,
    };
  });

  // R4 — the reserve: cash share of equity (0 when equity is zero/errored — never fabricate).
  const share = snapshot.equity > 0 ? clamp(snapshot.cash / snapshot.equity, 0, 1) : 0;

  // R5 — the persona landmark, scaled by standing among peers (caller supplies the rank dial).
  const kind = snapshot.personaId ? PERSONA_LANDMARK[snapshot.personaId] : undefined;
  const landmark: LandmarkState | undefined =
    kind && snapshot.personaId
      ? {
          kind,
          personaId: snapshot.personaId,
          prominence: clamp(opts.personaProminence ?? 1, 0, 1),
        }
      : undefined;

  return {
    id: snapshot.id,
    owner: snapshot.displayName,
    ownerKind: snapshot.kind,
    theme: empireTheme(snapshot.positions),
    founded: structures.length > 0,
    structures,
    reserve: { share, cash: snapshot.cash },
    ...(landmark ? { landmark } : {}),
    equity: snapshot.equity,
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
