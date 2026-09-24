import { parseOccSymbol } from "../trading/option-symbols.js";
import type { PositionView } from "./broker-positions.js";
import { OPTION_MULTIPLIER } from "./broker-positions.js";
import { formatPrice } from "./desk-data.js";
import { type NextEvent, nextEventFor } from "./position-event.js";
import { formatCurrency } from "./render-atoms.js";

/**
 * A POSITION IN PLAIN WORDS (#3689 slice 6), covering the columns the redesigned positions table
 * prints for beginners:
 *  - what it is and what it's betting on ("Put option · profits if TSLA falls"),
 *  - when it expires, in days ("Expires in 37 days", never "37d" or "DTE"),
 *  - the breakeven price at expiry,
 *  - the best and worst case if held to expiry, as signed dollars, or the word "unlimited" when
 *    that's the truth.
 *
 * Single legs only, which is how the broker reports positions: a spread arrives as its legs, and
 * each leg's best/worst is its own. Numbers come from the position alone (strike, premium paid per
 * share, contracts), so there's no feed dependency and nothing to go stale. Pure: the clock is
 * passed in.
 */

export interface PlainPosition {
  readonly plainName: string;
  /** "37 days", "1 day", "today", or "no expiry" for shares. */
  readonly expiresIn: string;
  /** Whole calendar days to expiry; absent for shares. Feeds the `dte:` filter. */
  readonly expiresInDays?: number;
  /** "$385.90" — the underlying price where this breaks even at expiry. */
  readonly breakeven: string;
  /** "+$13,440" or "unlimited". */
  readonly best: string;
  /** "−$6,560" or "unlimited". */
  readonly worst: string;
  /** The next dated thing that can move it ("Earnings Oct 28"), from `position-event.ts`. */
  readonly nextEvent?: NextEvent;
}

const DAY_MS = 86_400_000;
const UNLIMITED = "unlimited";

/** Calendar days from `now`'s New York date to the expiry date. */
function calendarDaysTo(expiration: string, now: Date): number {
  const today = now.toLocaleDateString("en-CA", { timeZone: "America/New_York" });
  const days = Math.round(
    (Date.parse(`${expiration}T00:00:00Z`) - Date.parse(`${today}T00:00:00Z`)) / DAY_MS,
  );
  return Math.max(0, days);
}

function expiresInLabel(days: number): string {
  if (days === 0) return "today";
  return days === 1 ? "1 day" : `${days} days`;
}

const gain = (x: number) => `+${formatCurrency(x)}`;
const loss = (x: number) => `−${formatCurrency(Math.abs(x))}`;

export function plainPosition(position: PositionView, now: Date): PlainPosition {
  const parts = parseOccSymbol(position.symbol);
  const event = nextEventFor(
    parts?.underlying ?? position.symbol,
    parts?.expiration,
    now.toISOString(),
  );
  const withEvent = (p: PlainPosition): PlainPosition => (event ? { ...p, nextEvent: event } : p);
  return withEvent(plainFacts(position, parts, now));
}

function plainFacts(
  position: PositionView,
  parts: ReturnType<typeof parseOccSymbol>,
  now: Date,
): PlainPosition {
  const qty = position.quantity;
  if (!parts) {
    // Shares: a long can lose what it cost and has no ceiling; a short is the mirror image.
    const cost = Math.abs(qty) * position.avgPrice;
    return qty >= 0
      ? {
          plainName: `Shares · profits if ${position.symbol} rises`,
          expiresIn: "no expiry",
          breakeven: formatPrice(position.avgPrice),
          best: UNLIMITED,
          worst: loss(cost),
        }
      : {
          plainName: `Short shares · profits if ${position.symbol} falls`,
          expiresIn: "no expiry",
          breakeven: formatPrice(position.avgPrice),
          best: gain(cost),
          worst: UNLIMITED,
        };
  }

  const { underlying, type, strike, expiration } = parts;
  const contracts = Math.abs(qty);
  // The broker's avgPrice on an option is per contract (x100); the premium per share is what the
  // breakeven arithmetic needs.
  const premium = position.avgPrice / OPTION_MULTIPLIER;
  const premiumTotal = premium * OPTION_MULTIPLIER * contracts;
  const intrinsicCap = strike * OPTION_MULTIPLIER * contracts;
  const breakeven = formatPrice(type === "call" ? strike + premium : strike - premium);
  const days = calendarDaysTo(expiration, now);
  const common = { expiresIn: expiresInLabel(days), expiresInDays: days, breakeven };

  if (qty > 0) {
    return type === "call"
      ? {
          ...common,
          plainName: `Call option · profits if ${underlying} rises`,
          best: UNLIMITED,
          worst: loss(premiumTotal),
        }
      : {
          ...common,
          plainName: `Put option · profits if ${underlying} falls`,
          best: gain(intrinsicCap - premiumTotal),
          worst: loss(premiumTotal),
        };
  }
  return type === "call"
    ? {
        ...common,
        plainName: `Sold call · profits if ${underlying} stays below ${formatPrice(strike)}`,
        best: gain(premiumTotal),
        worst: UNLIMITED,
      }
    : {
        ...common,
        plainName: `Sold put · profits if ${underlying} stays above ${formatPrice(strike)}`,
        best: gain(premiumTotal),
        worst: loss(intrinsicCap - premiumTotal),
      };
}
