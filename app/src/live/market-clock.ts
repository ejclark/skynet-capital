import { useEffect, useSyncExternalStore } from "react";
import type { MarketClockDay, MarketClockView } from "../../../src/domain/market-clock";

/**
 * THE SHELL'S ONE READ OF MARKET HOURS (#8248 PR 2). `GET /api/market/clock` answers the broker's
 * calendar (or the checked-in table, labelled) for every signed-in member; the status line, the
 * trade form's notes and the receipt all draw from this one copy, so they can never disagree.
 *
 * WHY A MODULE STORE, NOT A QUERY. The clock is one value for the whole page, read by components
 * that mount with no query client around them (the trade form's time-in-force field, the milestone
 * strip) and by Moneypenny's non-React intro. `useSyncExternalStore` needs no provider, and one
 * module-level copy is the "one request in flight" the issue asks for without a cache key to share.
 *
 * WHEN IT READS (criterion 8): on first use, then again once the broker's `phaseUntil` passes or 15
 * minutes elapse, whichever is first — checked on the clock's own 30-second tick, so no extra timer.
 * A failed read keeps the last good answer (its days still list the next 30 sessions) and tries again
 * after a minute; with no good answer at all, `marketSession` falls back to the bundled table and
 * says so (criterion 9). Display only: every order still asks Alpaca at review and submit.
 */

const REFRESH_MS = 15 * 60_000;
const RETRY_MS = 60_000;

let snapshot: MarketClockView | undefined;
let fetchedAt = 0;
let failedAt = Number.NEGATIVE_INFINITY;
let inFlight = false;
const listeners = new Set<() => void>();

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const isInstant = (v: unknown): v is string =>
  typeof v === "string" && !Number.isNaN(Date.parse(v));

function isDay(v: unknown): v is MarketClockDay {
  const d = v as Partial<MarketClockDay> | null;
  return (
    !!d &&
    typeof d.date === "string" &&
    DATE_RE.test(d.date) &&
    isInstant(d.openAt) &&
    isInstant(d.closeAt) &&
    Date.parse(d.closeAt) > Date.parse(d.openAt) &&
    typeof d.halfDay === "boolean"
  );
}

/** The route's body, or undefined when it is not that shape — a half-read answer is no answer, so
 *  the shell falls back whole rather than drawing a session that was never listed. */
export function parseMarketClock(body: unknown): MarketClockView | undefined {
  const v = body as Partial<MarketClockView> | null;
  if (!v || (v.source !== "broker" && v.source !== "table")) return undefined;
  if (!isInstant(v.asOf) || typeof v.isOpen !== "boolean") return undefined;
  if (!(Array.isArray(v.days) && v.days.every(isDay))) return undefined;
  if (v.phaseUntil !== undefined && !isInstant(v.phaseUntil)) return undefined;
  return v as MarketClockView;
}

async function read(): Promise<MarketClockView | undefined> {
  try {
    const res = await fetch("/api/market/clock", { credentials: "same-origin" });
    return res.ok ? parseMarketClock(await res.json()) : undefined;
  } catch {
    return undefined;
  }
}

/** When the held answer stops being current: its phase's end or 15 minutes, whichever is first. */
function dueAt(): number {
  const retry = failedAt + RETRY_MS;
  if (!snapshot) return retry;
  const phaseEnd = snapshot.phaseUntil ? Date.parse(snapshot.phaseUntil) : Number.POSITIVE_INFINITY;
  return Math.max(Math.min(fetchedAt + REFRESH_MS, phaseEnd), retry);
}

/** Read the route again if the held answer is due — a no-op while one read is in flight. */
export function refreshMarketClock(now: number = Date.now()): void {
  if (inFlight || now < dueAt()) return;
  inFlight = true;
  void read().then((view) => {
    if (view) {
      snapshot = view;
      fetchedAt = now;
    } else {
      failedAt = now;
    }
    inFlight = false;
    for (const listener of listeners) listener();
  });
}

/** The held answer, for a reader outside React (Moneypenny's intro); undefined before the first. */
export function currentMarketClock(): MarketClockView | undefined {
  return snapshot;
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** The held answer, re-checked for freshness each time `now` ticks. */
export function useMarketClock(now: Date): MarketClockView | undefined {
  const view = useSyncExternalStore(subscribe, currentMarketClock, currentMarketClock);
  // biome-ignore lint/correctness/useExhaustiveDependencies: the tick IS the trigger.
  useEffect(() => refreshMarketClock(), [now]);
  return view;
}

/** Forget the held answer — specs only, so one file's tests don't read each other's clock. */
export function resetMarketClock(): void {
  snapshot = undefined;
  fetchedAt = 0;
  failedAt = Number.NEGATIVE_INFINITY;
  inFlight = false;
}
