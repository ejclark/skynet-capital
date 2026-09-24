import { daysUntil, type EarningsPrint, UPCOMING_PRINTS } from "../domain/earnings-calendar.js";
import { allEvents, MARKET_EVENTS, type MarketEvent } from "../domain/market-events.js";

/**
 * A POSITION'S NEXT EVENT (#3689 follow-up, design handoff: the table's "Next event" column, the
 * "Earnings before expiry" chip, and the decision cards' clocks). One dated thing that can move
 * this position, in plain words: "Earnings Oct 28", "Fed meeting Oct 28".
 *
 * WHICH EVENT. The market calendar holds hundreds of rows a week (auctions, PMIs, minutes); a
 * column that printed the soonest of them would say "Treasury 7y auction" on every row and teach
 * nothing. So two tiers, and the stock's own event wins when it matters:
 *  1. The underlying's own dated event — its earnings print, or a high/critical event naming the
 *     symbol (a product launch, a court date) — when it lands before expiry (options) or inside
 *     60 days (shares, which never expire). Earnings is the one that can move a single name 10%+.
 *  2. Otherwise the next headline macro print everyone watches: the Fed decision, CPI, or the jobs
 *     report.
 *
 * "BEFORE EXPIRY" is literal. Prints land after the close, so an earnings print ON expiry day comes
 * after the option has already expired and does not count; a Fed decision or CPI lands during
 * the session, so on expiry day it does. Shares never expire, so it's always false for them.
 *
 * Offline and pure: it reads the checked-in calendars (`domain/earnings-calendar.ts`,
 * `domain/market-events-data.ts`), never the network, and the clock is passed in.
 */

export interface NextEvent {
  /** "Earnings Oct 28", "Fed meeting Oct 28", "CPI report Oct 14", "Jobs report Oct 2". */
  readonly label: string;
  /** The event's date, YYYY-MM-DD. */
  readonly at: string;
  /** Lands while the option is still alive. Always false for shares. */
  readonly beforeExpiry: boolean;
  /** Whether it's this stock's own event (earnings or a named event) or a market-wide print. */
  readonly scope: "stock" | "market";
}

const SHARE_HORIZON_DAYS = 60;

/** The headline macro prints, by the calendar's stable id prefixes, with the words we print. */
const HEADLINE_MACRO: ReadonlyArray<readonly [prefix: string, noun: string]> = [
  ["fomc-2", "Fed meeting"],
  ["cpi-2", "CPI report"],
  ["jobs-2", "Jobs report"],
];

const shortDate = (date: string): string =>
  new Date(`${date}T12:00:00Z`).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });

function stockNoun(event: MarketEvent): string {
  if (event.kind === "earnings") return "Earnings";
  return event.title.replace(/\s*\(.*\)\s*$/, "");
}

export function nextEventFor(
  underlying: string,
  /** The option's expiry (YYYY-MM-DD); undefined for shares. */
  expiration: string | undefined,
  asOfIso: string,
  events: readonly MarketEvent[] = MARKET_EVENTS,
  prints: readonly EarningsPrint[] = UPCOMING_PRINTS,
): NextEvent | undefined {
  const upcoming = allEvents(asOfIso, events, prints).filter((e) => !e.supersededBy);
  const before = (e: MarketEvent): boolean => {
    if (!expiration) return false;
    return e.kind === "earnings" ? e.date < expiration : e.date <= expiration;
  };

  const own = upcoming.find(
    (e) =>
      e.symbols.includes(underlying) &&
      (e.kind === "earnings" || e.impact === "critical" || e.impact === "high") &&
      (expiration ? before(e) : daysUntil(asOfIso, e.date) <= SHARE_HORIZON_DAYS),
  );
  if (own) {
    return {
      label: `${stockNoun(own)} ${shortDate(own.date)}`,
      at: own.date,
      beforeExpiry: before(own),
      scope: "stock",
    };
  }

  for (const e of upcoming) {
    if (e.symbols.length > 0) continue;
    const macro = HEADLINE_MACRO.find(([prefix]) => e.id.startsWith(prefix));
    if (macro) {
      return {
        label: `${macro[1]} ${shortDate(e.date)}`,
        at: e.date,
        beforeExpiry: before(e),
        scope: "market",
      };
    }
  }
  return undefined;
}
