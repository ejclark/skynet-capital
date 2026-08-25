import type { Participant } from "../participants/participant.js";
import type { DashboardData, TradingClientFactory } from "./dashboard-data.js";
import type { ObservatoryEvent } from "./events.js";
import { buildParticipantSnapshot, type ParticipantSnapshot } from "./participant-snapshot.js";

/**
 * BROKER RE-SYNC — the net that makes "the app disagrees with my broker" self-heal.
 *
 * The board reads every account once at boot and thereafter folds a live `trade_updates` stream.
 * That is fast and cheap, and it has one failure mode that is invisible from the inside: anything
 * the stream never delivered — a socket that dropped and left a gap, an order filled while the
 * process was restarting, a trade placed somewhere other than this app — is simply absent from
 * memory forever. Refreshing the page cannot help, because the page renders memory, not Alpaca.
 * That is #591: two orders confirmed executed at the broker, no rows on the portfolio screen.
 *
 * So the broker gets the last word, on a cadence and on demand. The stream stays the fast path;
 * this is the slow, authoritative one that repairs whatever the fast path missed, regardless of
 * WHY it missed it. Two honesty rules bind it:
 *
 *  - **A failed read never overwrites a good row.** `buildParticipantSnapshot` degrades a network
 *    failure into an error-tagged snapshot carrying zeros; applying that would flash a member's
 *    real holdings to $0 because Alpaca blinked. The previous snapshot stands instead.
 *  - **Locally-accumulated realized P/L is carried forward.** Alpaca's account read does not
 *    return it — the reducer accumulates it from sells — so a naive overwrite would silently
 *    reset every account's booked P/L to zero on the first tick.
 */

/** Positions/cash/equity a re-read can legitimately correct; identity fields never move. */
function sameNumbers(a: ParticipantSnapshot, b: ParticipantSnapshot): boolean {
  if (a.cash !== b.cash || a.equity !== b.equity) return false;
  if (a.positions.length !== b.positions.length) return false;
  return a.positions.every((pos, i) => {
    const other = b.positions[i];
    return (
      other !== undefined &&
      pos.symbol === other.symbol &&
      pos.quantity === other.quantity &&
      pos.avgPrice === other.avgPrice &&
      pos.marketValue === other.marketValue &&
      pos.lastdayPrice === other.lastdayPrice
    );
  });
}

/**
 * Fold a fresh broker read over the snapshot the board is currently showing. Returns `current`
 * unchanged (same reference) when the read failed or changed nothing, so callers can skip the
 * hub apply — an unchanged reference is how the rest of the observatory says "nothing moved".
 */
export function reconciledSnapshot(
  current: ParticipantSnapshot,
  fresh: ParticipantSnapshot,
): ParticipantSnapshot {
  if (fresh.error) return current;
  const merged: ParticipantSnapshot = {
    ...fresh,
    // Never lost to a re-read: the reducer owns this number, the broker doesn't report it.
    ...(current.realizedPl !== undefined ? { realizedPl: current.realizedPl } : {}),
  };
  // An error-tagged row becoming healthy is itself a change worth pushing, even at identical
  // numbers — it's what clears "Account unreachable" from the desk.
  if (current.error === undefined && sameNumbers(current, merged)) return current;
  return merged;
}

export interface BrokerSyncOptions {
  /** The live board — read fresh each tick so accounts added at runtime are included. */
  readonly getState: () => DashboardData;
  /** Where a reconciled snapshot goes; the hub's `apply`. */
  readonly apply: (event: ObservatoryEvent) => void;
  /** The live roster, credentials included — the store merge, not a boot-time copy. */
  readonly findParticipant: (id: string) => Participant | undefined;
  readonly clientFactory: TradingClientFactory;
  /**
   * Floor between two reads of the SAME account, in ms. A page view asks for a re-sync, so this
   * is what stops a reload-happy member (or a browser preloading links) turning one desk into a
   * burst of broker calls. Default 15s: far below the cadence a human perceives as "stale",
   * far above what a refresh key can spam.
   */
  readonly minIntervalMs?: number;
  readonly now?: () => Date;
}

export interface BrokerSync {
  /** Re-read one account and fold the result. Resolves when the board reflects it. */
  syncParticipant(id: string): Promise<void>;
  /** Re-read every account on the board, in parallel. */
  syncAll(): Promise<void>;
  /** Begin the periodic sweep; returns a stop function. */
  start(intervalMs?: number): () => void;
}

const DEFAULT_SYNC_INTERVAL_MS = 60_000;

export function createBrokerSync(options: BrokerSyncOptions): BrokerSync {
  const minIntervalMs = options.minIntervalMs ?? 15_000;
  const now = options.now ?? (() => new Date());
  const lastRead = new Map<string, number>();
  // One in-flight read per account: ten simultaneous page views are one broker call, and each
  // caller still awaits the real answer rather than being told "too soon, render what you have".
  const inFlight = new Map<string, Promise<void>>();

  const readAndFold = async (id: string): Promise<void> => {
    const participant = options.findParticipant(id);
    const current = options.getState().participants.find((p) => p.id === id);
    if (!(participant && current)) return;
    lastRead.set(id, now().getTime());
    const fresh = await buildParticipantSnapshot(participant, options.clientFactory(participant));
    // Re-read the board rather than closing over `current`: a fill may have landed on the stream
    // while this request was in the air, and that fill's realized P/L must not be rolled back.
    const latest = options.getState().participants.find((p) => p.id === id) ?? current;
    const reconciled = reconciledSnapshot(latest, fresh);
    if (reconciled === latest) return;
    options.apply({
      type: "participant_updated",
      participant: reconciled,
      at: now().toISOString(),
    });
  };

  const syncParticipant = (id: string): Promise<void> => {
    const pending = inFlight.get(id);
    if (pending) return pending;
    const since = now().getTime() - (lastRead.get(id) ?? Number.NEGATIVE_INFINITY);
    if (since < minIntervalMs) return Promise.resolve();
    // Never rejects: a re-sync is a repair, and a failed repair must not fail the page it rode in on.
    const run = readAndFold(id)
      .catch(() => {
        /* the previous snapshot stands; the next tick tries again */
      })
      .finally(() => inFlight.delete(id));
    inFlight.set(id, run);
    return run;
  };

  const syncAll = async (): Promise<void> => {
    const ids = options.getState().participants.map((p) => p.id);
    await Promise.all(ids.map((id) => syncParticipant(id)));
  };

  return {
    syncParticipant,
    syncAll,
    start(intervalMs = DEFAULT_SYNC_INTERVAL_MS) {
      const handle = setInterval(() => void syncAll(), intervalMs);
      if (typeof handle.unref === "function") handle.unref();
      return () => clearInterval(handle);
    },
  };
}
