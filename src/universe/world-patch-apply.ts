import type { EmpireVitals, WorldPatchOp } from "./world-patch.js";
import type { EmpireState, StructureState, WorldState } from "./world-state.js";

/**
 * The reducer half of the patch transport: ops back into world state.
 *
 * It exists for two reasons, both load-bearing. First, it makes the producer PROVABLE — a spec can
 * assert `applyWorldOps(prev, diffWorld(prev, next)) === next` and, applying the same ops twice,
 * that a replayed patch lands on the same world as one applied once. That round-trip is the actual
 * contract the reconnect path depends on; without it "idempotent replay" is a claim, not a fact.
 * Second, any consumer that keeps its own copy of the world (a headless board, a screenshot
 * harness, the S4 canvas' model layer) needs exactly this function and must not re-invent it.
 *
 * Pure: no clock, no I/O, no mutation of the input. Unknown/DOM-only ops (`field`, `cue`,
 * `reframe`) are deliberately ignored here — they carry no world state.
 */

/** Re-establish the world's own ordering rule after piece ops: mass first, key as the tiebreak. */
function byMassDesc(structures: readonly StructureState[]): StructureState[] {
  return [...structures].sort((a, b) => b.mass - a.mass || a.key.localeCompare(b.key));
}

function withPiece(empire: EmpireState, piece: StructureState): EmpireState {
  const kept = empire.structures.filter((s) => s.key !== piece.key);
  return { ...empire, structures: byMassDesc([...kept, piece]) };
}

function withoutPiece(empire: EmpireState, key: string): EmpireState {
  return { ...empire, structures: empire.structures.filter((s) => s.key !== key) };
}

/** An empire rebuilt onto new vitals. Field by field, deliberately — see the landmark note. */
function withVitals(empire: EmpireState, v: EmpireVitals): EmpireState {
  return {
    id: empire.id,
    owner: empire.owner,
    ownerKind: empire.ownerKind,
    theme: v.theme,
    founded: v.founded,
    structures: empire.structures,
    reserve: { share: v.reserveShare, cash: v.reserveCash },
    // Rebuilt rather than spread-and-patched so a null landmark ends as an ABSENT key — spreading
    // would leave the stale landmark in place and quietly fabricate a crown that is gone.
    ...(v.landmark ? { landmark: v.landmark } : {}),
    equity: v.equity,
  };
}

type EmpireIndex = Map<string, EmpireState>;

/** Fold ONE op into the working index. Ops for an empire that isn't here are no-ops, never a crash. */
function applyOp(empires: EmpireIndex, order: string[], op: WorldPatchOp): void {
  if (op.kind === "empire-added") {
    if (!empires.has(op.empire.id)) order.push(op.empire.id);
    empires.set(op.empire.id, op.empire);
    return;
  }
  if (op.kind === "empire-removed") {
    empires.delete(op.empireId);
    return;
  }
  if (op.kind === "empire-vitals" || op.kind === "piece-set" || op.kind === "piece-removed") {
    const empire = empires.get(op.empireId);
    if (!empire) return;
    if (op.kind === "empire-vitals") empires.set(op.empireId, withVitals(empire, op.vitals));
    else if (op.kind === "piece-set") empires.set(op.empireId, withPiece(empire, op.piece));
    else empires.set(op.empireId, withoutPiece(empire, op.key));
  }
}

/**
 * Fold ops into a world. Order is preserved: an added empire is appended, a removed one drops out,
 * and everything else keeps the position it already held — so a replayed stream never reshuffles a
 * board behind the viewer's back.
 */
export function applyWorldOps(state: WorldState, ops: readonly WorldPatchOp[]): WorldState {
  const empires: EmpireIndex = new Map(state.empires.map((e) => [e.id, e]));
  const order = state.empires.map((e) => e.id);
  for (const op of ops) applyOp(empires, order, op);

  const seen = new Set<string>();
  const next: EmpireState[] = [];
  for (const id of order) {
    const empire = empires.get(id);
    if (empire && !seen.has(id)) {
      seen.add(id);
      next.push(empire);
    }
  }
  return { empires: next };
}
