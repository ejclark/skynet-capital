import { sampleOf } from "../observatory/book-health-history.js";
import type { ParticipantSnapshot } from "../observatory/participant-snapshot.js";
import { deskHealthView, openLotsOf } from "./book-health-payload.js";
import type { DashboardServerConfig } from "./dashboard-server-config.js";

/**
 * The hourly book-health sampler (#5493 slice 5): once an hour, read every account's book exactly
 * as its owner's desk route does (`deskHealthView`) and append what stands to the history
 * (`config.healthHistory`), so "how long, and which way" is there for a book nobody opened. Coarse
 * on purpose — the store keeps one sample per account per hour, so a faster clock only replaces.
 *
 * A failed read for one account never stops the rest, and never writes: a broker error is not a
 * clear book, and recording it as one would end every streak that account has. Fire-and-forget
 * like the equity sampler — sampling must never break the live server.
 */

export interface BookHealthSamplerOptions {
  readonly config: DashboardServerConfig;
  readonly participants: () => readonly ParticipantSnapshot[];
  readonly intervalMs?: number;
}

/** Sample every account once. Returns how many were recorded. */
export async function sampleBookHealth(opts: BookHealthSamplerOptions): Promise<number> {
  const { config } = opts;
  const history = config.healthHistory;
  if (!history) return 0;
  let recorded = 0;
  for (const found of opts.participants()) {
    try {
      const openLots = await openLotsOf(found, config);
      const view = await deskHealthView(found, config, openLots);
      if (!view) continue;
      history.record(found.id, sampleOf(view.asOf, view.findings));
      recorded++;
    } catch {
      // one account's failed read leaves its streak untouched; the next hour tries again
    }
  }
  return recorded;
}

/** Start the clock: one pass now-ish and then hourly. Returns a stop function; the interval is
 *  `unref`'d so it never keeps the process alive on its own. */
export function startBookHealthSampler(opts: BookHealthSamplerOptions): () => void {
  const run = () => {
    void sampleBookHealth(opts).catch(() => undefined);
  };
  const handle = setInterval(run, opts.intervalMs ?? 60 * 60 * 1000);
  if (typeof handle.unref === "function") handle.unref();
  const first = setTimeout(run, 60 * 1000);
  if (typeof first.unref === "function") first.unref();
  return () => {
    clearInterval(handle);
    clearTimeout(first);
  };
}
