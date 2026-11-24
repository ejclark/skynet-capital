import type { MarketClockView } from "../../../src/domain/market-clock";

/**
 * The broker's market hours, as the shell last fetched them (#8248) — `GET /api/market/clock`,
 * which reads Alpaca's calendar and clock on the server and shares one answer with every member.
 *
 * A tiny store, not a query in every caller: the clock is drawn by seven surfaces (the status line,
 * the trade form's notes, the receipt, the time-in-force field…) that all call the pure
 * `marketSession(now)`. One feed (`useMarketClockFeed`, mounted by the status line, which every
 * page shows) writes here; `marketSession` reads here, and falls back to the bundled table when
 * nothing has arrived or the fetch failed — and then says so (`source: "table"`).
 */

let current: MarketClockView | undefined;
/** True once a fetch has failed with no good answer since — the table then speaks, and says so. */
let failed = false;
const listeners = new Set<() => void>();

/** The last good answer, or undefined before the first one (the table answers meanwhile). */
export function marketClock(): MarketClockView | undefined {
  return current;
}

/** Whose hours the shell draws: the broker's; the table's because the fetch (or, on the server,
 *  the broker) failed; or the table's for the moment before the first answer arrives. */
export function clockSource(): "broker" | "table" | "loading" {
  if (current) return current.source;
  return failed ? "table" : "loading";
}

/** Store a fetched answer, or `"failed"` when the fetch failed: the table answers and says so. */
export function setMarketClock(view: MarketClockView | "failed" | undefined): void {
  const next = view === "failed" ? undefined : view;
  const nextFailed = view === "failed";
  if (next === current && nextFailed === failed) return;
  current = next;
  failed = nextFailed;
  for (const listener of listeners) listener();
}

/** Called whenever the stored answer changes, so a drawn clock redraws without waiting a tick. */
export function onMarketClock(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

const REFETCH_MS = 15 * 60_000;
const MIN_REFETCH_MS = 30_000;

export async function fetchMarketClock(): Promise<MarketClockView> {
  const res = await fetch("/api/market/clock", { credentials: "same-origin" });
  if (!res.ok) throw new Error(`market clock ${res.status}`);
  const view = (await res.json()) as MarketClockView;
  if (!Array.isArray(view?.days)) throw new Error("market clock: not the clock's shape");
  return view;
}

/** When to ask again (#8248 criterion 8): when the broker's phase ends or in 15 minutes,
 *  whichever comes first — never sooner than 30 seconds. */
export function refetchDelay(view: MarketClockView | undefined, now: number): number {
  const until = view?.phaseUntil ? Date.parse(view.phaseUntil) - now : REFETCH_MS;
  return Math.max(MIN_REFETCH_MS, Math.min(REFETCH_MS, until));
}
