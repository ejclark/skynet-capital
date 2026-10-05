import type { DecisionRecord } from "../autonomous/decision-record.js";
import { instrumentKey } from "../domain/option-order.js";
import type { OrderIntent } from "../domain/types.js";

/** The raw→guarded quantity delta, in one honest sentence — the only per-intent guard signal
 *  that's ever actually available for a CLAMP (a full refusal gets a named rule via
 *  `GuardRefusalReason`; a clamp does not, `intentParams` never records one). Shared by the
 *  `/wire` feed's reasoning join and the decisions-cycle view — both need the same fact. */
export function guardDeltaFor(record: DecisionRecord, intent: OrderIntent): string | undefined {
  // The instrument too: a covered call and a share sale on one ticker are different asks.
  const key = instrumentKey(intent);
  const raw = record.rawIntents.find(
    (i) => i.symbol === intent.symbol && i.side === intent.side && instrumentKey(i) === key,
  );
  if (!raw || raw.quantity === intent.quantity) return undefined;
  return `persona asked for ${raw.quantity}, risk guards sized it to ${intent.quantity}`;
}
