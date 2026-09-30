import { type ReactElement, useEffect, useState } from "react";
import { marketSession } from "../live/market-session";
import type { ChainQuoteCoverage } from "../live/options";

/**
 * THE CHAIN'S AS-OF STAMP (#4327, #3407 slice 3) — every chain answer says, in words, WHEN it is
 * from and how far to trust that. Two clocks, never merged: `asOf` is when the server read the
 * feed (the fetch time — no cache sits between, so this is also the refresh time; a re-render
 * never moves it), and `quotedAt` is when the feed says its quotes were made. The indicative feed
 * is delayed and derived, so it is NEVER called live or current — the best it earns is "delayed".
 *
 * Grading mirrors the position guidance's chain pulse (`src/server/guidance-pulse.ts`): in session,
 * quotes older than 15 minutes (or a pane left sitting that long since its fetch) read STALE; out
 * of session, the last session's quotes are honest until they span a missing session (4 days).
 * Colour never carries the state (a standing reader is red/green colourblind): a glyph and a word
 * always travel together, and stale also gets weight + a left rule (`straddle.css`).
 * @category trading
 */

export type ChainAsOfState = "delayed" | "stale" | "closed" | "unquoted";

export interface ChainAsOfView {
  /** "as of 14:32:05 ET" — the fetch time, Eastern, to the second. */
  readonly stamp: string;
  readonly state: ChainAsOfState;
  /** The plain sentence after the stamp: what kind of data, how old, what to do about it. */
  readonly detail: string;
}

const MIN = 60_000;
const STALE_MS = 15 * MIN;
const CLOSED_STALE_MS = 4 * 24 * 60 * MIN;
const TICK_MS = 30_000;

const ET_CLOCK = new Intl.DateTimeFormat("en-US", {
  timeZone: "America/New_York",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hourCycle: "h23",
});

/** An age in the words a member reads at a glance — minutes in session, hours/days across one. */
export function ageWords(ms: number): string {
  if (ms < MIN) return "under a minute";
  if (ms < 60 * MIN) return `${Math.round(ms / MIN)} min`;
  if (ms < 24 * 60 * MIN) return `${(ms / (60 * MIN)).toFixed(1)} h`;
  return `${(ms / (24 * 60 * MIN)).toFixed(1)} days`;
}

/** Pure in `now` and `open`, so a spec pins both the clock and the session. */
export function chainAsOf(quotes: ChainQuoteCoverage, now: Date, open: boolean): ChainAsOfView {
  const fetched = Date.parse(quotes.asOf);
  const stamp = Number.isFinite(fetched)
    ? `as of ${ET_CLOCK.format(new Date(fetched))} ET`
    : "as of an unknown time";
  const sinceFetch = Number.isFinite(fetched) ? now.getTime() - fetched : Number.NaN;
  const quotedMs = quotes.quotedAt ? Date.parse(quotes.quotedAt) : Number.NaN;
  // The age a member should weigh is the OLDER of the two clocks: a fresh fetch of old quotes is
  // old, and so is an old fetch of once-fresh quotes left sitting on screen.
  const age = Math.max(
    Number.isFinite(quotedMs) ? now.getTime() - quotedMs : Number.NEGATIVE_INFINITY,
    Number.isFinite(sinceFetch) ? sinceFetch : Number.NEGATIVE_INFINITY,
  );
  const known = Number.isFinite(age);
  const quoteAge = Number.isFinite(quotedMs)
    ? `quotes about ${ageWords(Math.max(0, now.getTime() - quotedMs))} old`
    : "the feed sent no quote times";
  if (quotes.source === "unavailable") {
    return {
      stamp,
      state: "unquoted",
      detail: "No feed quotes — strikes are listed, premiums are last close, nothing here is live.",
    };
  }
  if (!open) {
    if (known && age > CLOSED_STALE_MS) {
      return {
        stamp,
        state: "stale",
        detail: `Stale — ${quoteAge}, older than the last session. Refresh before trusting a price.`,
      };
    }
    return {
      stamp,
      state: "closed",
      detail: `Market closed — delayed quotes from the last session (${quoteAge}), not live.`,
    };
  }
  if (known && age > STALE_MS) {
    const which =
      Number.isFinite(sinceFetch) && sinceFetch > STALE_MS
        ? `fetched ${ageWords(sinceFetch)} ago`
        : quoteAge;
    return {
      stamp,
      state: "stale",
      detail: `Stale — ${which}. Refresh before trusting a price.`,
    };
  }
  return {
    stamp,
    state: "delayed",
    detail: `Delayed feed, not the full market — ${quoteAge}, not live.`,
  };
}

const MARK: Record<ChainAsOfState, string> = {
  delayed: "~",
  stale: "!",
  closed: "·",
  unquoted: "·",
};

function useTick(): Date {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), TICK_MS);
    return () => window.clearInterval(id);
  }, []);
  return now;
}

export function ChainAsOf({
  quotes,
  refreshing,
  onRefresh,
  now,
}: {
  readonly quotes: ChainQuoteCoverage;
  /** A fetch is in flight — the rows and stamp on screen are the previous answer's, said so. */
  readonly refreshing?: boolean;
  /** Omitted, no Refresh button (the ticket's inline chain refreshes with the ticket). */
  readonly onRefresh?: () => void;
  readonly now?: Date;
}): ReactElement {
  const ticking = useTick();
  const at = now ?? ticking;
  const session = marketSession(at).state;
  const view = chainAsOf(quotes, at, session === "open" || session === "power");
  return (
    <div className="chain-as-of" data-state={view.state} role="status" aria-live="polite">
      <p>
        <span aria-hidden="true">{MARK[view.state]}</span> <strong>{view.stamp}</strong>
        {refreshing ? " · refreshing…" : ""} — {view.detail}
      </p>
      {onRefresh ? (
        <button
          type="button"
          className="chain-as-of-refresh"
          onClick={onRefresh}
          disabled={refreshing}
        >
          Refresh
        </button>
      ) : null}
    </div>
  );
}
