import type { ActivityStore } from "./activity-record.js";
import type { ParticipantSnapshot } from "./participant-snapshot.js";
import { type PulseTrades, pulseTradesOf } from "./pulse-json-view.js";

/**
 * PULSE'S TRADE HALF, KEPT UNTIL ITS INPUTS MOVE (#4612 slice 7, #4619).
 *
 * Pulse's weekly bars and stat tiles come from closed round trips, and building those means
 * parsing a participant's whole trade ledger and FIFO-matching every fill — about 90 ms per
 * request for Sauron at 180 days, the one desk still over the 150 ms budget after the history
 * fold (`pulse-history-cache.ts`). Neither input changes between most requests: the ledger grows
 * only when an order moves, and the snapshot's broker window only when the broker reports one.
 *
 * So this keeps the answer, not the ledger: the twelve weekly bars and the stat family per
 * participant, a few kilobytes each. A request first asks the store whether anything was appended
 * since the answer was built (`ActivityStore.since` from the held byte offset — an `fstat` when
 * nothing was) and compares the snapshot's broker window to the one the answer saw. Both
 * unchanged → the held answer, which is exactly what a fresh build would return, because nothing
 * it was built from moved. Either changed → the whole ledger is read and matched again, the same
 * work as before this existed. That is deliberate: a fill can reorder FIFO lots and late fills
 * can rewrite an order, so an incremental match would be a second matcher to keep honest, and a
 * rebuild on the rare request after a fill costs only what every request cost before.
 *
 * Kept in memory, not cached raw: holding parsed ledger rows broke the 300 MB budget twice
 * (#4619, 2026-10-07 and 2026-10-26). A store with no `since` (the in-memory one offline mode
 * runs) is rebuilt on every read; its ledgers are small by construction.
 */
export function pulseTradesReader(
  store: ActivityStore,
): (snapshot: ParticipantSnapshot) => Promise<PulseTrades> {
  const held = new Map<string, { trades: PulseTrades; offset: number; window: string }>();

  return async (snapshot) => {
    const since = store.since?.bind(store);
    if (!since) return pulseTradesOf(snapshot, await store.list(snapshot.id));
    const window = brokerWindowKey(snapshot);
    const prior = held.get(snapshot.id);
    if (prior && prior.window === window) {
      const tail = await since(snapshot.id, prior.offset);
      if (!tail.reset && tail.entries.length === 0) return prior.trades;
    }
    const ledger = await since(snapshot.id, 0);
    const trades = pulseTradesOf(snapshot, ledger.entries);
    held.set(snapshot.id, { trades, offset: ledger.offset, window });
    return trades;
  };
}

/** The snapshot's broker window as one comparable string — every field of it reaches the merge
 *  (`recordsFromActivity` spreads each row), so any change at all invalidates the held answer. */
function brokerWindowKey(snapshot: ParticipantSnapshot): string {
  return JSON.stringify(snapshot.activity ?? []);
}
