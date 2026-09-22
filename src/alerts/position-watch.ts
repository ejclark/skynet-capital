import type { OptionPositionRow } from "../server/option-positions-view.js";
import type { Alert, AlertPriority } from "./alert.js";

/**
 * POSITION WATCH — the alerts a member's own option positions imply, derived from data the desk
 * already holds (#3407 P4 slice 1; the study's row 20 "plan-derived alerts, never default-on %
 * moves" and inventory row 183, Robinhood's options alerts: expiration reminders at a month / a
 * week / today, early-assignment risk). The first member-facing producer on the #586 substrate.
 *
 * Pure and re-derived on every read: the caller hands in the positions view and a clock, and
 * gets the alerts standing right now. Sameness across reads is the substrate's `dedupeKey`, so a
 * dismissed reminder stays dismissed while a NEW rung (a week out after a month out) re-shows —
 * `alertFingerprint` carries the priority for exactly that reason.
 *
 * Honesty rules: every alert is a signal about a contract the member holds, never a claim about a
 * fill or a P/L; `symbol` is the real underlying ticker; a position with no spot gets no
 * in-the-money alert at all (absence, never a guess).
 */

export const POSITION_WATCH_SOURCE = "position-watch";

/** The expiry reminder rungs, calendar days to expiry, loudest last. */
export const EXPIRY_RUNGS: readonly {
  readonly maxDays: number;
  readonly rung: string;
  readonly priority: AlertPriority;
}[] = [
  // Anything inside a day is expiry day itself — a 0.3-day contract expires this afternoon.
  { maxDays: 1, rung: "today", priority: "critical" },
  { maxDays: 7, rung: "week", priority: "warning" },
  { maxDays: 30, rung: "month", priority: "info" },
];

/** Inside this many days, in-the-money short contracts read as assignment risk. */
export const ASSIGNMENT_WINDOW_DAYS = 7;

function expiryWord(days: number): string {
  if (days < 1) return "expires today";
  const whole = Math.ceil(days);
  return `expires in ${whole} day${whole === 1 ? "" : "s"}`;
}

function expiryAlert(row: OptionPositionRow, at: number): Alert | undefined {
  const rung = EXPIRY_RUNGS.find((r) => row.daysToExpiry <= r.maxDays);
  if (!rung) return undefined;
  return {
    id: `${POSITION_WATCH_SOURCE}:expiry:${row.symbol}:${rung.rung}@${at}`,
    at,
    source: POSITION_WATCH_SOURCE,
    priority: rung.priority,
    symbol: row.underlying,
    title: `${row.display} ${expiryWord(row.daysToExpiry)}`,
    body:
      row.contracts < 0
        ? "A written contract at expiry settles by assignment or expires worthless — decide before the close."
        : "A held contract at expiry is exercised if in the money, otherwise expires worthless.",
    dedupeKey: `expiry:${row.symbol}:${rung.rung}`,
    data: { occSymbol: row.symbol, daysToExpiry: row.daysToExpiry, contracts: row.contracts },
  };
}

function moneynessAlert(row: OptionPositionRow, at: number): Alert | undefined {
  if (row.inTheMoney === undefined || row.daysToExpiry > ASSIGNMENT_WINDOW_DAYS) return undefined;
  const base = {
    at,
    source: POSITION_WATCH_SOURCE,
    symbol: row.underlying,
    data: {
      occSymbol: row.symbol,
      daysToExpiry: row.daysToExpiry,
      contracts: row.contracts,
      inTheMoney: row.inTheMoney,
      ...(row.spot !== undefined ? { spot: row.spot } : {}),
    },
  };
  if (row.contracts < 0 && row.inTheMoney) {
    return {
      ...base,
      id: `${POSITION_WATCH_SOURCE}:assignment:${row.symbol}@${at}`,
      priority: "critical",
      title: `${row.display} is in the money — assignment risk`,
      body: "A short contract in the money this close to expiry can be assigned any night. Close or roll it, or be ready for the shares.",
      dedupeKey: `assignment:${row.symbol}`,
    };
  }
  if (row.contracts > 0 && !row.inTheMoney) {
    return {
      ...base,
      id: `${POSITION_WATCH_SOURCE}:worthless:${row.symbol}@${at}`,
      priority: "warning",
      title: `${row.display} is out of the money — expires worthless at this price`,
      body: "Whatever it is still worth is time value, and that goes to zero at the close on expiry day.",
      dedupeKey: `worthless:${row.symbol}`,
    };
  }
  return undefined;
}

/** Every alert the positions imply right now, in the rows' order; loudness ordering is the
 *  consumer's (`sortAlerts`). */
export function positionAlerts(rows: readonly OptionPositionRow[], at: number): Alert[] {
  const alerts: Alert[] = [];
  for (const row of rows) {
    if (row.contracts === 0) continue;
    const expiry = expiryAlert(row, at);
    if (expiry) alerts.push(expiry);
    const moneyness = moneynessAlert(row, at);
    if (moneyness) alerts.push(moneyness);
  }
  return alerts;
}
