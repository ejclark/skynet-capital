import {
  daysUntil,
  type EarningsPrint,
  nextPrint,
  PRINT_WINDOWS,
  recentPrint,
  UPCOMING_PRINTS,
} from "../domain/earnings-calendar.js";
import { escapeHtml } from "../ui/escape-html.js";

/**
 * EARNINGS PROXIMITY, ON THE CHAIN ITSELF.
 *
 * Every mature platform puts the earnings marker on the price CHART — a screen you are not
 * looking at while you pick a strike. The decision ("is a binary event inside this contract's
 * life?") happens on the chain, so the tell belongs on the chain.
 *
 * READ-ONLY BY CONSTRUCTION. This module reads `domain/earnings-calendar.ts` — the same checked-in
 * table the S2 entry guard and the date-keyed playbooks read — and returns strings. It fetches
 * nothing, stores nothing, and changes no eligibility: refusing a trade is `engine/guards.ts`'s
 * job and stays there. A human on the desk is informed here, never blocked.
 *
 * NO NEW NUMBER. The horizons are `PRINT_WINDOWS`, the trading-discipline constants themselves,
 * so a badge can never drift away from the discipline it is describing.
 *
 * HONESTY. An `estimate` date is never phrased as fact ("Earnings expected in 4 days", not
 * "Earnings in 4 days"), the status rides visibly in the badge, and the calendar entry's own
 * source is the tooltip. Absence renders as NOTHING — no "no earnings" zero-state, which would
 * read as a checked, cleared all-clear the table cannot actually promise.
 */

/** How close the print is, in the house's own terms. */
type PrintNearness = "flat-zone" | "dead-zone" | "just-printed";

export interface EarningsProximity {
  readonly print: EarningsPrint;
  /** Signed calendar days: > 0 = days until, 0 = the print day itself, < 0 = days since. */
  readonly days: number;
  readonly nearness: PrintNearness;
}

/**
 * The nearest print worth showing next to a chain, or undefined when there isn't one.
 * Upcoming wins over recent: what you are about to trade into matters more than what just
 * happened, and on the print day itself both are true.
 */
export function earningsProximity(
  symbol: string,
  asOfIso: string,
  calendar: readonly EarningsPrint[] = UPCOMING_PRINTS,
): EarningsProximity | undefined {
  const next = nextPrint(symbol, asOfIso, calendar);
  if (next) {
    const days = daysUntil(asOfIso, next.date);
    if (days <= PRINT_WINDOWS.entryFlatDays) {
      return { print: next, days, nearness: "flat-zone" };
    }
    if (days <= PRINT_WINDOWS.deadZoneDays) {
      return { print: next, days, nearness: "dead-zone" };
    }
  }
  const prior = recentPrint(symbol, asOfIso, PRINT_WINDOWS.postPrintFlatDays, calendar);
  return prior
    ? { print: prior, days: daysUntil(asOfIso, prior.date), nearness: "just-printed" }
    : undefined;
}

/** Plain English for a signed day count — the desk never makes anyone decode "D-2". */
const whenPhrase = (days: number): string => {
  if (days === 0) return "today, after the close";
  if (days === 1) return "tomorrow";
  if (days > 1) return `in ${days} days`;
  return days === -1 ? "yesterday" : `${-days} days ago`;
};

/** An estimated date must never be spoken as a fact — "expected", not a flat assertion. */
function headline(near: EarningsProximity): string {
  const estimated = near.print.status === "estimate";
  const when = whenPhrase(near.days);
  if (near.days < 0) {
    return estimated ? `Print expected ${when}` : `Printed ${when}`;
  }
  return estimated ? `Earnings expected ${when}` : `Earnings ${when}`;
}

/**
 * What the proximity MEANS for the premium in front of you. Educational and hedged — these are
 * tendencies, and the desk never states a market outcome as certain.
 */
const GLOSS: Record<PrintNearness, string> = {
  "flat-zone": "the bots open nothing this close to a print — the move is binary from here",
  "dead-zone": "premiums usually carry an event premium into a print, and you'd be paying it",
  "just-printed": "premiums usually deflate once the number is out",
};

/**
 * Only the flat zone wears `--neg`: it is the window in which the house discipline genuinely
 * refuses new risk, which is the alarm role BRAND reserves the colour for. The wider dead zone
 * is informative (machine teal), and a print already behind us is past tense (muted).
 */
const TONE: Record<PrintNearness, string> = {
  "flat-zone": "var(--neg)",
  "dead-zone": "var(--accent)",
  "just-printed": "var(--muted)",
};

const BADGE_STYLE =
  "display:inline-flex;align-items:baseline;gap:6px;flex-wrap:wrap;padding:3px 9px;border-radius:999px;font-size:11px;line-height:1.5";

/**
 * The chain's earnings badge — empty string when no print is near, which is the whole point of
 * the absence rule. `symbol` is optional so callers can pass the ticket's own possibly-unset one.
 */
export function earningsBadge(
  symbol: string | undefined,
  asOfIso: string,
  calendar?: readonly EarningsPrint[],
): string {
  if (!symbol) return "";
  const near = earningsProximity(symbol, asOfIso, calendar);
  if (!near) return "";
  const tone = TONE[near.nearness];
  const skin = `${BADGE_STYLE};color:${tone};border:1px solid color-mix(in srgb,${tone} 45%,transparent);background:color-mix(in srgb,${tone} 10%,transparent)`;
  return `<span class="ec-badge" data-nearness="${near.nearness}" title="${escapeHtml(near.print.source)}" style="${skin}">
    <span aria-hidden="true">⚡</span><b>${escapeHtml(headline(near))}</b>
    <small style="opacity:.8;font-family:var(--mono)">${escapeHtml(near.print.date)} · ${escapeHtml(near.print.status)}</small>
    <small style="opacity:.75">${escapeHtml(GLOSS[near.nearness])}</small>
  </span>`;
}

/**
 * The per-expiration tell: a ⚡ on the expirations whose contracts are still alive on print day.
 * This is the question the chain header can't answer, because it is different for every row —
 * an option expiring the week BEFORE the print never sees it; the next one out is a bet on it.
 * Uses `nextPrint` (not the proximity windows) on purpose: a print 30 days out is irrelevant to
 * proximity and decisive for a 45-day contract.
 */
export function expirationPrintMark(
  symbol: string | undefined,
  expiration: string,
  asOfIso: string,
  calendar: readonly EarningsPrint[] = UPCOMING_PRINTS,
): string {
  if (!symbol) return "";
  const next = nextPrint(symbol, asOfIso, calendar);
  // ISO dates compare lexicographically; the print is after the close, so same-day counts as held.
  if (!next || next.date > expiration) return "";
  const verb = next.status === "estimate" ? "is expected to report" : "reports";
  const why = `${symbol} ${verb} ${next.date} — on or before this expiration, so this contract lives through the print`;
  return `<span aria-label="lives through the earnings print" title="${escapeHtml(why)}" style="margin-left:4px">⚡</span>`;
}
