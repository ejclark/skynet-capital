import type { OutlookDirection } from "./outlook.js";

/**
 * THE SHAPE CATALOGUE — which structures answer which view, and where each of their legs points.
 *
 * Split out from `structure-candidates.ts` deliberately: this file is the OPINION (these nine
 * shapes, these anchor prices) and that one is the MECHANISM (which of them a given chain can
 * actually carry). Adding a tenth structure, or re-anchoring an existing one, should be an edit to
 * a table here and nothing else.
 *
 * The nine are the textbook expressions of the three views — a debit play, a defined-risk debit
 * spread and a defined-risk credit spread per direction, plus the three ways a chain expresses
 * "nothing much happens". Every one is ONE LOT per leg: sizing is not this engine's business.
 *
 * Anchors are PRICES, expressed off the frame `outlook.ts` computes — spot, where the view points,
 * how far out a boundary it expects to hold, and how wide a wing is. Nothing here knows what
 * strikes exist; snapping to real contracts happens downstream, and a leg that cannot be snapped
 * makes the whole structure ABSENT rather than approximately right.
 *
 * PURE: no I/O, no clock. Total over `StructureKind`.
 */

/** The named structures this engine can propose. Nothing here has been ordered or filled. */
export type StructureKind =
  | "long-call"
  | "bull-call-spread"
  | "short-put-spread"
  | "long-put"
  | "bear-put-spread"
  | "short-call-spread"
  | "iron-condor"
  | "short-strangle"
  | "long-call-butterfly";

/** One leg before it has met the chain: a kind, a signed lot count, and the price it aims at. */
export interface LegAnchor {
  readonly kind: "call" | "put";
  readonly quantity: number;
  readonly price: number;
}

/** The prices every template draws its anchors from. */
export interface AnchorFrame {
  readonly spot: number;
  /** Where the view says price is going — spot itself for a neutral view. */
  readonly target: number;
  /** How far out a boundary the view expects to HOLD sits, in dollars. */
  readonly hold: number;
  /** The width of a spread's wing, in dollars, before snapping. */
  readonly wing: number;
  /** The chain's own tightest strike spacing — the tolerance an anchor has to land inside. */
  readonly step: number;
}

/** Which structures belong to which stated direction, in the order they are considered. */
const BY_DIRECTION: Readonly<Record<OutlookDirection, readonly StructureKind[]>> = {
  bullish: ["long-call", "bull-call-spread", "short-put-spread"],
  bearish: ["long-put", "bear-put-spread", "short-call-spread"],
  neutral: ["iron-condor", "short-strangle", "long-call-butterfly"],
};

/** The structures a stated direction is expressed with. */
export function structuresFor(direction: OutlookDirection): readonly StructureKind[] {
  return BY_DIRECTION[direction];
}

/**
 * Each structure's legs, as anchor prices off the frame. Two rules are worth naming because they
 * are the difference between a spread and a degenerate one:
 *
 * - A debit vertical's short leg is floored one WING away from its long leg, so a slight view whose
 *   target barely clears spot still asks for a real spread rather than two legs on one strike.
 * - A credit vertical's short leg sits at the boundary the view says price will NOT reach (`hold`),
 *   which is why a stronger conviction sells closer to the money rather than further out.
 */
export function anchorsFor(kind: StructureKind, frame: AnchorFrame): readonly LegAnchor[] {
  const { spot, target, hold, wing } = frame;
  switch (kind) {
    case "long-call":
      return [{ kind: "call", quantity: 1, price: spot }];
    case "bull-call-spread":
      return [
        { kind: "call", quantity: 1, price: spot },
        { kind: "call", quantity: -1, price: Math.max(target, spot + wing) },
      ];
    case "short-put-spread":
      return [
        { kind: "put", quantity: -1, price: spot - hold },
        { kind: "put", quantity: 1, price: spot - hold - wing },
      ];
    case "long-put":
      return [{ kind: "put", quantity: 1, price: spot }];
    case "bear-put-spread":
      return [
        { kind: "put", quantity: 1, price: spot },
        { kind: "put", quantity: -1, price: Math.min(target, spot - wing) },
      ];
    case "short-call-spread":
      return [
        { kind: "call", quantity: -1, price: spot + hold },
        { kind: "call", quantity: 1, price: spot + hold + wing },
      ];
    case "iron-condor":
      return [
        { kind: "put", quantity: -1, price: spot - hold },
        { kind: "put", quantity: 1, price: spot - hold - wing },
        { kind: "call", quantity: -1, price: spot + hold },
        { kind: "call", quantity: 1, price: spot + hold + wing },
      ];
    case "short-strangle":
      return [
        { kind: "put", quantity: -1, price: spot - hold },
        { kind: "call", quantity: -1, price: spot + hold },
      ];
    case "long-call-butterfly":
      return [
        { kind: "call", quantity: 1, price: spot - hold },
        { kind: "call", quantity: -2, price: spot },
        { kind: "call", quantity: 1, price: spot + hold },
      ];
  }
}
