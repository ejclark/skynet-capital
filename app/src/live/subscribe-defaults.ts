/**
 * WHAT A NEW SUBSCRIPTION STARTS WITH (Eric, 2026-10-16: "I need this process to be minimal
 * friction though. Default capital allocations that can be modified at any time are ideal to grease
 * the wheel. We can adjust based on findings in future user studies").
 *
 * The form opens filled in, so subscribing is one tap; every value stays editable before saving and
 * on the row afterwards (Edit). The numbers are a first guess from his own range ("25-50k, possibly
 * 100k"), held as a hypothesis: if, by 2026-12-31, most new subscriptions change the budget before
 * saving, the default is wrong and the next study picks a better one.
 */
import { nextSession } from "../../../src/domain/market-calendar";

/** A new subscription's budget, in dollars — the top of his stated usual range. */
export const DEFAULT_CAPITAL = 50_000;

/** How far out a conviction's check date starts: about one quarter, inside the server's one-year
 *  limit and long enough for a 3–6 month view to be read once before it is judged. */
export const DEFAULT_CHECK_DAYS = 91;

/** The first market session on or after a quarter from `today` — weekends and exchange holidays
 *  skipped with the exchange's own calendar, so the server never refuses the default. */
export function defaultCheckOn(today: Date = new Date()): string {
  const day = new Date(
    Date.UTC(
      today.getUTCFullYear(),
      today.getUTCMonth(),
      today.getUTCDate() + DEFAULT_CHECK_DAYS - 1,
    ),
  );
  return nextSession(day.toISOString().slice(0, 10));
}

/** What the budget field opens on: the default for a new subscription, the subscription's own
 *  budget on an edit, and empty for an uncapped one (which keeps its "Uncapped" box instead). */
export function initialCapital(editing?: { readonly capitalAllocated?: number }): string {
  if (!editing) return String(DEFAULT_CAPITAL);
  return editing.capitalAllocated === undefined ? "" : String(editing.capitalAllocated);
}
