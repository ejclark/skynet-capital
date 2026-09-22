import type { DecisionRecord } from "../autonomous/decision-record.js";
import type { OrderIntent } from "../domain/types.js";

/** The raw→guarded quantity delta, in one honest sentence — the only per-intent guard signal
 *  that's ever actually available for a CLAMP (a full refusal gets a named rule via
 *  `GuardRefusalReason`; a clamp does not, `paramsForRawIntent` never records one). Shared by the
 *  `/wire` feed's reasoning join and the decisions-cycle view — both need the same fact. */
export function guardDeltaFor(record: DecisionRecord, intent: OrderIntent): string | undefined {
  const raw = record.rawIntents.find((i) => i.symbol === intent.symbol && i.side === intent.side);
  if (!raw || raw.quantity === intent.quantity) return undefined;
  return `persona asked for ${raw.quantity}, risk guards sized it to ${intent.quantity}`;
}
