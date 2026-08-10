import type { DashboardData } from "./dashboard-data.js";
import type { EquitySample, HistoryStore } from "./history-store.js";
import { TransitionBaseline } from "./transition-baseline.js";
import type { WorldTransition } from "./world-transitions.js";

/**
 * Turn a live dashboard snapshot into one equity sample per participant (the pure core, so the
 * cadence + I/O stay out of the test). Error participants are skipped — a failed account read carries
 * zeros and would pollute the history with a false crash to $0.
 */
export function sampleAll(data: DashboardData, at: string): EquitySample[] {
  return data.participants
    .filter((p) => !p.error)
    .map((p) => ({
      at,
      participantId: p.id,
      equity: p.equity,
      cash: p.cash,
      realizedPl: p.realizedPl ?? 0,
    }));
}

export interface HistorySamplerOptions {
  readonly getState: () => DashboardData;
  readonly store: HistoryStore;
  /** Sampling cadence in ms (default 5 min) — equity-over-time only needs coarse points. */
  readonly intervalMs?: number;
  /** Wall clock, injectable for tests. */
  readonly now?: () => Date;
  /**
   * Ceremony seam: the transitions derived this tick (see world-transitions.ts). Optional so
   * sampling stays independent of who celebrates.
   */
  readonly onTransitions?: (transitions: readonly WorldTransition[]) => void;
  /** Seeded from the boot samples so transitions never span a restart. */
  readonly baseline?: TransitionBaseline;
}

/**
 * Periodically append an equity sample per participant to the history store. Coarse by design (one
 * point every few minutes), so a long history stays tiny on disk. Returns a stop function; the
 * interval is `unref`'d so it never keeps the process alive on its own.
 */
export function startHistorySampler(opts: HistorySamplerOptions): () => void {
  const intervalMs = opts.intervalMs ?? 5 * 60 * 1000;
  const now = opts.now ?? (() => new Date());
  const baseline = opts.baseline ?? new TransitionBaseline();
  const tick = () => {
    const at = now().toISOString();
    const transitions: WorldTransition[] = [];
    for (const sample of sampleAll(opts.getState(), at)) {
      transitions.push(...baseline.advance(sample));
      // Fire-and-forget: a sample write failure must never disrupt the live server.
      void opts.store.save(sample).catch(() => {
        /* fire-and-forget: sampling must never break the request path */
      });
    }
    if (transitions.length > 0) opts.onTransitions?.(transitions);
  };
  const handle = setInterval(tick, intervalMs);
  if (typeof handle.unref === "function") handle.unref();
  return () => clearInterval(handle);
}
