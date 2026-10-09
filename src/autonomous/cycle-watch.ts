/**
 * Says out loud when the bots stop being able to trade (#4995).
 *
 * #4864 ran for days because "connected, quiet, no trades" looked identical for three states: a
 * healthy cycle that simply found no signal, a tripped safety breaker (silent and sticky), and a
 * loop that stopped evaluating (a dead price feed, or a hung cycle). Telling them apart took a
 * production read of the audit log. This watcher puts the answer in `fly logs` instead:
 *
 *  - a block (breaker or owner suspend) is logged once when it starts and once when it clears;
 *  - a cycle that throws is logged, and the caller's latch is always released (see `guard`);
 *  - while the market is open, a heartbeat line every `heartbeatMs` counts the cycles run;
 *  - while the market is open, no completed cycle for `stallMs` logs a `[stall]` warning.
 *
 * Logging only: it never changes what the bots trade.
 */
export interface CycleWatchDeps {
  readonly isMarketOpen: () => boolean;
  /** Non-null when the bots are blocked from trading (breaker reason or owner suspend). */
  readonly blockedReason: () => string | null;
  readonly log: (line: string) => void;
  readonly now?: () => number;
  readonly heartbeatMs?: number;
  readonly stallMs?: number;
}

export interface CycleWatch {
  /** Run one cycle under the watch: counts it, logs a throw, never rethrows. */
  guard(cycle: () => Promise<void>): Promise<void>;
  /** Call on a timer (every ~minute): block transitions, heartbeat, stall. */
  tick(): void;
}

export const DEFAULT_HEARTBEAT_MS = 15 * 60_000;
export const DEFAULT_STALL_MS = 5 * 60_000;

export function createCycleWatch(deps: CycleWatchDeps): CycleWatch {
  const now = deps.now ?? Date.now;
  const heartbeatMs = deps.heartbeatMs ?? DEFAULT_HEARTBEAT_MS;
  const stallMs = deps.stallMs ?? DEFAULT_STALL_MS;
  let cyclesSinceBeat = 0;
  let errorsSinceBeat = 0;
  let lastCompleted: number | null = null;
  let lastBeat = now();
  let lastBlock: string | null = null;
  let stallWarned = false;
  let wasOpen = false;

  const minutesAgo = (at: number | null) =>
    at === null ? "none this process" : `${Math.round((now() - at) / 60_000)}m ago`;

  return {
    async guard(cycle) {
      try {
        await cycle();
      } catch (error) {
        errorsSinceBeat += 1;
        deps.log(`[cycle] failed: ${error instanceof Error ? error.message : String(error)}`);
      } finally {
        cyclesSinceBeat += 1;
        lastCompleted = now();
        if (stallWarned) deps.log("[stall] cleared — cycles are running again");
        stallWarned = false;
      }
    },
    tick() {
      const block = deps.blockedReason();
      if (block !== lastBlock) {
        deps.log(
          block ? `[safety] BLOCKED — ${block}; no orders until cleared` : "[safety] block cleared",
        );
        lastBlock = block;
      }

      const open = deps.isMarketOpen();
      if (open && !wasOpen) {
        // A fresh session: don't count overnight silence as a stall.
        lastBeat = now();
        lastCompleted = now();
      }
      wasOpen = open;
      if (!open) return;

      if (now() - lastBeat >= heartbeatMs) {
        deps.log(
          `[heartbeat] ${cyclesSinceBeat} cycle(s), ${errorsSinceBeat} failed, in the last ${Math.round((now() - lastBeat) / 60_000)}m; ${block ? `BLOCKED — ${block}` : "not blocked"}`,
        );
        cyclesSinceBeat = 0;
        errorsSinceBeat = 0;
        lastBeat = now();
      }

      const sinceCycle = lastCompleted === null ? Number.POSITIVE_INFINITY : now() - lastCompleted;
      if (!stallWarned && sinceCycle >= stallMs) {
        deps.log(
          `[stall] market open but no cycle completed (last: ${minutesAgo(lastCompleted)}) — price feed down or a cycle hung`,
        );
        stallWarned = true;
      }
    },
  };
}
