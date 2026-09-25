import { marketDayKey } from "../domain/market-day.js";
import { regularSessionOpen } from "../domain/market-session.js";
import type { AtmQuotePort } from "../ports/atm-quotes.js";
import { JsonlIvHistoryStore } from "./iv-history-store.js";
import { type IvTickReport, recordIvTick } from "./iv-instrument.js";
import type { IvHistoryPort } from "./iv-record.js";

/**
 * THE IV CLOCK — schedules the IV instrument once per trading day, in the session's last half hour
 * (#3729). Until this ran, `recordIvTick` had no caller, so no IV history existed and the position
 * guidance could never grade a write above medium: IV rank needs a year of daily points, and every
 * day not recorded is a day that can never be backfilled from this feed.
 *
 * WHEN: the first check where the session is open now and will not be in 30 minutes — the last
 * half hour, which lands on 3:30–4:00 PM ET and on 12:30–1:00 PM on an early close, with no second
 * copy of the calendar here. Near the close is the convention daily IV series use, and the quotes
 * are still two-sided (after the bell, stale sides would solve to fabricated numbers).
 *
 * WHY IN-PROCESS: this repo is event-driven, no crons (docs/ROUTINES.md). The equity history
 * sampler (`observatory/history-sampler.ts`) already runs this way; this is that shape with a
 * daily gate. A missed day (the server down through the window) is a gap `iv-rank.ts` tolerates up
 * to `MAX_SAMPLE_GAP_DAYS`, never a fabricated point.
 */

type Env = Readonly<Record<string, string | undefined>>;

/** How long before the close the daily sample falls due. */
export const SAMPLE_LEAD_MS = 30 * 60 * 1000;

/** True when a sample is due: inside the session's last half hour, and not yet taken today. PURE. */
export function sampleDue(now: Date, lastSampledDay: string | undefined): boolean {
  const closingWindow =
    regularSessionOpen(now) && !regularSessionOpen(new Date(now.getTime() + SAMPLE_LEAD_MS));
  return closingWindow && marketDayKey(now.toISOString()) !== lastSampledDay;
}

/**
 * The durable IV store, or why there is none. There is deliberately NO relative default (see
 * `iv-history-store.ts`): an unset `SKYNET_IV_HISTORY_DIR` means the clock does not run, rather than
 * writing a year-long series inside a container image that the next deploy erases. On Fly, a dir
 * off the mounted volume is refused for the same reason.
 */
export function createIvHistoryStore(
  env: Env,
  mount = "/data",
): { readonly store: IvHistoryPort } | { readonly reason: string } {
  const dir = env.SKYNET_IV_HISTORY_DIR;
  if (!dir) return { reason: "SKYNET_IV_HISTORY_DIR is unset — the IV clock is off" };
  if (env.FLY_APP_NAME && !dir.startsWith(`${mount}/`)) {
    return { reason: `SKYNET_IV_HISTORY_DIR "${dir}" is off the ${mount} volume — refusing` };
  }
  return { store: new JsonlIvHistoryStore(dir) };
}

export interface IvSamplerOptions {
  readonly quotes: AtmQuotePort;
  readonly store: IvHistoryPort;
  /** How often to check whether the daily sample is due (default 5 min — six chances a window). */
  readonly intervalMs?: number;
  readonly now?: () => Date;
  readonly onTick?: (report: IvTickReport) => void;
  readonly onError?: (error: unknown) => void;
}

/**
 * Check on an interval; take the day's sample when it falls due. The last sampled day is seeded
 * from the store, so a restart inside the window never records the same day twice. Returns a stop
 * function; the interval is `unref`'d so it never keeps the process alive on its own.
 */
export function startIvSampler(opts: IvSamplerOptions): () => void {
  const now = opts.now ?? (() => new Date());
  let lastDay: string | undefined;
  let busy = true;
  void opts.store
    .list()
    .then((samples) => {
      const latest = samples
        .map((s) => s.at)
        .sort()
        .at(-1);
      lastDay = latest ? marketDayKey(latest) : undefined;
    })
    .catch((error: unknown) => opts.onError?.(error))
    .finally(() => {
      busy = false;
    });
  const check = async (): Promise<void> => {
    const at = now();
    if (busy || !sampleDue(at, lastDay)) return;
    busy = true;
    try {
      const report = await recordIvTick({
        quotes: opts.quotes,
        store: opts.store,
        at: at.toISOString(),
      });
      // Only a tick that recorded something closes the day: a feed outage at 3:30 gets retried at
      // 3:35, not written off.
      if (report.recorded.length > 0) lastDay = marketDayKey(report.at);
      opts.onTick?.(report);
    } catch (error) {
      opts.onError?.(error);
    } finally {
      busy = false;
    }
  };
  const handle = setInterval(
    () => {
      void check();
    },
    opts.intervalMs ?? 5 * 60 * 1000,
  );
  if (typeof handle.unref === "function") handle.unref();
  return () => clearInterval(handle);
}
