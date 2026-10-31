import type { OpenLot } from "../trading/round-trips.js";
import type { ActivityStore } from "./activity-record.js";
import { deskLedger } from "./desk-data.js";
import type { ParticipantSnapshot } from "./participant-snapshot.js";
import { type PulseTrades, pulseTradesFrom } from "./pulse-json-view.js";

/**
 * WHAT THE DESK READS FROM A TRADE LEDGER, KEPT UNTIL ITS INPUTS MOVE (#4612 slice 7, #4619).
 *
 * Two GETs match a participant's whole trade ledger: Pulse for its weekly bars and stat tiles, and
 * the blotter (`/api/desk/:id`) for the open lots behind each position's lot breakdown and the
 * book's health. Building either means parsing the whole ledger and FIFO-matching every fill —
 * about 80 ms per request for Sauron at 180 days (40 parse, 35–45 match). Neither input changes
 * between most requests: the ledger grows only when an order moves, and the snapshot's broker
 * window only when the broker reports one.
 *
 * So this keeps the answer, not the ledger: Pulse's twelve weekly bars and stat family, plus the
 * lots still open, per participant — a few kilobytes each, from ONE match, so the rebuild after a
 * fill is paid once for both GETs. A request first asks the store whether anything was appended
 * since the answer was built (`ActivityStore.since` from the held byte offset — an `fstat` when
 * nothing was) and compares the snapshot's broker window to the one the answer saw. Both
 * unchanged → the held answer, which is exactly what a fresh build would return, because nothing
 * it was built from moved. Either changed → the whole ledger is read and matched again, the same
 * work as before this existed. That is deliberate: a fill can reorder FIFO lots and late fills
 * can rewrite an order, so an incremental match would be a second matcher to keep honest, and a
 * rebuild on the rare request after a fill costs only what every request cost before.
 *
 * The open lots are held UNTAGGED. Playbook tags are attribution only — the matcher never reads
 * them — so an owner's tagged lots are these lots with their opening order's tag laid on
 * (`desk-json-routes.ts`), and the tags still come fresh from the decision store per request.
 *
 * Kept in memory, not cached raw: holding parsed ledger rows broke the 300 MB budget twice
 * (#4619, 2026-10-07 and 2026-10-26). A store with no `since` (the in-memory one offline mode
 * runs) is rebuilt on every read; its ledgers are small by construction.
 */
export interface HeldLedger {
  readonly trades: PulseTrades;
  /** Lots still open, without playbook attribution — read-only, shared across requests. */
  readonly open: readonly OpenLot[];
}

export function heldLedgerReader(
  store: ActivityStore,
): (snapshot: ParticipantSnapshot) => Promise<HeldLedger> {
  const held = new Map<string, { answer: HeldLedger; offset: number; window: string }>();

  return async (snapshot) => {
    const since = store.since?.bind(store);
    if (!since) return heldLedgerOf(snapshot, await store.list(snapshot.id));
    const window = brokerWindowKey(snapshot);
    const prior = held.get(snapshot.id);
    if (prior && prior.window === window) {
      const tail = await since(snapshot.id, prior.offset);
      if (!tail.reset && tail.entries.length === 0) return prior.answer;
    }
    const ledger = await since(snapshot.id, 0);
    const answer = heldLedgerOf(snapshot, ledger.entries);
    held.set(snapshot.id, { answer, offset: ledger.offset, window });
    return answer;
  };
}

function heldLedgerOf(
  snapshot: ParticipantSnapshot,
  durable: Parameters<typeof deskLedger>[1],
): HeldLedger {
  const { trips, open } = deskLedger(snapshot, durable);
  return { trades: pulseTradesFrom(trips), open };
}

/** The snapshot's broker window as one comparable string — every field of it reaches the merge
 *  (`recordsFromActivity` spreads each row), so any change at all invalidates the held answer. */
function brokerWindowKey(snapshot: ParticipantSnapshot): string {
  return JSON.stringify(snapshot.activity ?? []);
}
