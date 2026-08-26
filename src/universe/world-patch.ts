import type { EmpireState, LandmarkState, StructureState, WorldState } from "./world-state.js";

/**
 * THE WORLD PATCH VOCABULARY — what changed, never how the whole board looks.
 *
 * Why this exists (GAMEBOARD-PLAN, the "live transport" fork): the board's live channel used to push
 * a freshly rendered HTML body on every hub tick and the client did `root.innerHTML = …`. That
 * destroys every piece of client state on every push — an in-flight odometer roll, a canvas, a
 * scroll position, a focused control. A ~4Hz price stream therefore made animation structurally
 * impossible, which is why ceremony rendering (S5), the live board (S4) and the digit ticker all
 * queue behind this module.
 *
 * The producer is a PURE function of (previous world, next world) → ops, so the whole transport is
 * specifiable without a server, a socket or a browser. Two dialects share one envelope:
 *
 *  - **world ops** (`empire-*`, `piece-*`) — renderer-agnostic STATE, addressed by the stable
 *    `participantId:SYMBOL` piece key. A canvas/SVG board consumes these and animates between them.
 *  - **field ops** (`field`) — the DOM dialect: already-formatted text, tone and bar widths for the
 *    keyed nodes of a server-rendered view, so a live page updates its numbers in place instead of
 *    being rebuilt. Produced by the view that owns the formatting, never re-derived in the browser.
 *
 * Plus two envelope-level ops: `cue` (a ceremony marker — fire-once, no visual treatment here) and
 * `reframe` (an honest admission that this change cannot be expressed as a patch, so the consumer
 * should fetch a fresh frame rather than show something stale).
 *
 * Every op is IDEMPOTENT by construction: it states the value to land on, never a delta to add. A
 * replayed patch therefore lands on exactly the same world as one applied once.
 */

/** Everything about an empire EXCEPT its pieces — the parts that change without a tower changing. */
export interface EmpireVitals {
  readonly theme: string;
  readonly founded: boolean;
  readonly equity: number;
  readonly reserveShare: number;
  readonly reserveCash: number;
  /**
   * The persona landmark, or `null` for ABSENT. Deliberately null rather than a zeroed landmark:
   * "no landmark" and "a landmark at zero prominence" are different facts and must render
   * differently (the honesty invariant — absence is never a false zero).
   */
  readonly landmark: LandmarkState | null;
}

/** P/L tone for a patched field — the same three-way vocabulary the server-rendered views use. */
export type FieldTone = "pos" | "neg" | "flat";

/** A ceremony marker on the wire. What it LOOKS like is S5's job; this only guarantees delivery. */
export interface WorldCue {
  /** Stable, compare-only identity. The channel emits each id at most once, ever. */
  readonly id: string;
  readonly type: string;
  readonly participantId: string;
  readonly at: string;
  /** Type-specific detail carried verbatim from the source — never invented, never rounded. */
  readonly detail?: Readonly<Record<string, number | string>>;
}

export type WorldPatchOp =
  | { readonly kind: "empire-added"; readonly empire: EmpireState }
  | { readonly kind: "empire-removed"; readonly empireId: string }
  | { readonly kind: "empire-vitals"; readonly empireId: string; readonly vitals: EmpireVitals }
  | { readonly kind: "piece-set"; readonly empireId: string; readonly piece: StructureState }
  | { readonly kind: "piece-removed"; readonly empireId: string; readonly key: string }
  | {
      readonly kind: "field";
      /** The keyed node this addresses — a row id, `cohort:bot`, `match`, … */
      readonly key: string;
      /** field name → text to land on. */
      readonly text?: Readonly<Record<string, string>>;
      /** field name → P/L tone class for that same node. */
      readonly tone?: Readonly<Record<string, FieldTone>>;
      /** field name → percentage 0..100 for a bar-shaped node. */
      readonly bar?: Readonly<Record<string, number>>;
      /** Where this row sorts among its siblings (higher first) — lets a list reorder in place. */
      readonly sortValue?: number;
    }
  | { readonly kind: "cue"; readonly cue: WorldCue }
  | { readonly kind: "reframe"; readonly reason: string };

/** Read an empire's non-piece state. Pure; the landmark is normalized to null when absent. */
export function empireVitals(empire: EmpireState): EmpireVitals {
  return {
    theme: empire.theme,
    founded: empire.founded,
    equity: empire.equity,
    reserveShare: empire.reserve.share,
    reserveCash: empire.reserve.cash,
    landmark: empire.landmark ?? null,
  };
}

function sameLandmark(a: LandmarkState | null, b: LandmarkState | null): boolean {
  if (a === null || b === null) return a === b;
  return a.kind === b.kind && a.personaId === b.personaId && a.prominence === b.prominence;
}

function sameVitals(a: EmpireVitals, b: EmpireVitals): boolean {
  return (
    a.theme === b.theme &&
    a.founded === b.founded &&
    a.equity === b.equity &&
    a.reserveShare === b.reserveShare &&
    a.reserveCash === b.reserveCash &&
    sameLandmark(a.landmark, b.landmark)
  );
}

/** Every field of a structure compared — a patch must fire whenever ANY rendered number moved. */
function samePiece(a: StructureState, b: StructureState): boolean {
  return (
    a.symbol === b.symbol &&
    a.sector === b.sector &&
    a.mass === b.mass &&
    a.footprint === b.footprint &&
    a.health === b.health &&
    a.unrealizedPl === b.unrealizedPl &&
    a.marketValue === b.marketValue
  );
}

const byKey = (structures: readonly StructureState[]): Map<string, StructureState> =>
  new Map(structures.map((s) => [s.key, s]));

/** Ops for one empire that exists on both sides: vitals drift, then piece adds/changes/removals. */
function diffEmpire(prev: EmpireState, next: EmpireState): WorldPatchOp[] {
  const ops: WorldPatchOp[] = [];
  const before = empireVitals(prev);
  const after = empireVitals(next);
  if (!sameVitals(before, after)) {
    ops.push({ kind: "empire-vitals", empireId: next.id, vitals: after });
  }
  const prevPieces = byKey(prev.structures);
  for (const piece of next.structures) {
    const was = prevPieces.get(piece.key);
    if (!(was && samePiece(was, piece))) {
      ops.push({ kind: "piece-set", empireId: next.id, piece });
    }
  }
  const nextPieces = byKey(next.structures);
  for (const piece of prev.structures) {
    if (!nextPieces.has(piece.key)) {
      ops.push({ kind: "piece-removed", empireId: prev.id, key: piece.key });
    }
  }
  return ops;
}

/**
 * THE PATCH PRODUCER — (previous world, next world) → the ops that turn one into the other.
 *
 * Pure and total: no clock, no I/O, no ordering surprises. An unchanged board produces `[]`, which
 * is what lets the channel stay silent rather than push an empty frame. A first projection (no
 * previous world) produces one `empire-added` per empire — the honest full statement of a board a
 * client has never seen.
 */
export function diffWorld(prev: WorldState | undefined, next: WorldState): WorldPatchOp[] {
  if (!prev) return next.empires.map((empire) => ({ kind: "empire-added", empire }) as const);
  const prevById = new Map(prev.empires.map((e) => [e.id, e]));
  const ops: WorldPatchOp[] = [];
  for (const empire of next.empires) {
    const was = prevById.get(empire.id);
    if (!was) ops.push({ kind: "empire-added", empire });
    else ops.push(...diffEmpire(was, empire));
  }
  const nextIds = new Set(next.empires.map((e) => e.id));
  for (const empire of prev.empires) {
    if (!nextIds.has(empire.id)) ops.push({ kind: "empire-removed", empireId: empire.id });
  }
  return ops;
}
