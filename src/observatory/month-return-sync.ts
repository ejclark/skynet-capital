import type { Participant } from "../participants/participant.js";
import type { DashboardData, TradingClientFactory } from "./dashboard-data.js";
import type { ObservatoryEvent } from "./events.js";

/**
 * MONTH-RETURN SYNC — feeds the league's "1M return" metric (#3689's first follow-up; the design
 * handoff's league card defaults to "this month, not all-time", so a member who joined last week
 * can lead it).
 *
 * The board ranks synchronously from snapshots, so the number has to live ON the snapshot; it
 * comes from Alpaca's own portfolio history (`period=1M`), whose `profit_loss_pct` is already
 * flow-adjusted — a deposit never reads as a gain, which a naive equity-then-vs-now would get
 * wrong. A month-long window barely moves minute to minute, so this runs on its own slow cadence
 * (default 10 min) instead of riding the 60s broker re-sync, and one history call per account per
 * tick is the whole cost.
 *
 * Honesty rules, mirroring `broker-sync.ts`: a failed read or a history with no finite value never
 * writes (the last good number stands, or the league shows "—"); an unchanged value never applies.
 * `reduce.ts` carries the value across the other syncs' snapshot rebuilds.
 */

/** The last finite value in an Alpaca history array — skips the `null`s the broker emits for spans
 *  it had no value for, so a trailing gap never reads as a 0 return. */
export function lastFinite(arr: readonly (number | null)[] | undefined): number | undefined {
  if (!arr) return undefined;
  for (let i = arr.length - 1; i >= 0; i--) {
    const v = arr[i];
    if (typeof v === "number" && Number.isFinite(v)) return v;
  }
  return undefined;
}

export interface MonthReturnSyncOptions {
  readonly getState: () => DashboardData;
  readonly apply: (event: ObservatoryEvent) => void;
  readonly findParticipant: (id: string) => Participant | undefined;
  readonly clientFactory: TradingClientFactory;
  readonly now?: () => Date;
}

export interface MonthReturnSync {
  /** Read every account's 1-month return and fold the ones that changed. Never rejects. */
  syncAll(): Promise<void>;
  /** Run once now, then on the interval; returns a stop function. */
  start(intervalMs?: number): () => void;
}

const DEFAULT_INTERVAL_MS = 10 * 60_000;

export function createMonthReturnSync(options: MonthReturnSyncOptions): MonthReturnSync {
  const now = options.now ?? (() => new Date());

  const syncOne = async (id: string): Promise<void> => {
    const participant = options.findParticipant(id);
    if (!participant) return;
    const history = await options.clientFactory(participant).getPortfolioHistory("1M");
    const fraction = lastFinite(history.profit_loss_pct);
    if (fraction === undefined) return;
    const pct = Math.round(fraction * 10_000) / 100;
    // Read the board after the await: a fill may have replaced the snapshot meanwhile.
    const latest = options.getState().participants.find((p) => p.id === id);
    if (!latest || latest.monthReturnPct === pct) return;
    options.apply({
      type: "participant_updated",
      participant: { ...latest, monthReturnPct: pct },
      at: now().toISOString(),
    });
  };

  const syncAll = async (): Promise<void> => {
    const ids = options.getState().participants.map((p) => p.id);
    await Promise.all(
      ids.map((id) =>
        syncOne(id).catch(() => {
          /* the last good value stands; the next tick tries again */
        }),
      ),
    );
  };

  return {
    syncAll,
    start(intervalMs = DEFAULT_INTERVAL_MS) {
      void syncAll();
      const handle = setInterval(() => void syncAll(), intervalMs);
      if (typeof handle.unref === "function") handle.unref();
      return () => clearInterval(handle);
    },
  };
}
