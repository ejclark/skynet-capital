/**
 * The forward earnings calendar — the data the S2 flat-through-print guard and every date-keyed
 * playbook window read from.
 *
 * WHY A CHECKED-IN TABLE: print dates change rarely, must be reviewable (a wrong date silently
 * corrupts every window keyed to it — see the sweep's pipeline-integrity finding), and the
 * trading path must never fetch the network to decide (offline instruments only). The table is
 * refreshed as part of the research loop; a stale entry ages out safely because past dates are
 * ignored by every query below.
 *
 * DATE POLICY (docs/plans/trade-playbooks.md → decision log, 2026-08-12): an `estimate` may only
 * WIDEN a safety window (S2 goes flat on estimates too — the safe direction); date-keyed ENTRIES
 * require `confirmed`. AVGO's 83–98-day cadence spread is the cautionary tale: an estimated D-5
 * entry can land after the real print.
 *
 * A `confirmed` entry's `source` must cite HOW it was confirmed, one of two classes:
 *   - `IR:` — a hand-verified primary source (a company's own press release / newsroom).
 *   - `CAL:` — an automated cross-reference against a third-party earnings-calendar aggregator
 *     (src/scripts/confirm-print-dates.ts), which itself sources company announcements but is
 *     one hop removed from them. Both are "confirmed" for playbook purposes; the prefix is what
 *     makes an audit able to tell how confident to be without re-deriving it.
 *
 * Day math is calendar-day distance on UTC dates. Over weekends this errs toward going flat a
 * day or two early — deliberately the safe direction; do not "fix" it with trading-day math
 * without also bringing a holiday calendar.
 */

type PrintDateStatus = "confirmed" | "estimate";

export interface EarningsPrint {
  readonly symbol: string;
  /** The release day D (YYYY-MM-DD, after market close unless noted in `source`). */
  readonly date: string;
  readonly status: PrintDateStatus;
  /** Where the date came from — an IR announcement (confirmed) or cadence reasoning (estimate). */
  readonly source: string;
}

/**
 * Seeded from the 2026-08-12 eight-symbol sweep (docs/research/multi-symbol-sweep.md) — all
 * cadence estimates until IR confirms. Replace an entry's status with `confirmed` + the IR
 * source when the date is announced; that flip is what unlocks date-keyed playbook entries.
 */
export const UPCOMING_PRINTS: readonly EarningsPrint[] = [
  {
    symbol: "NVDA",
    date: "2026-08-26",
    status: "confirmed",
    source:
      "IR: nvidianews.nvidia.com call notice — results ~1:20pm PT Aug 26 (after the 4pm ET close)",
  },
  {
    symbol: "MRVL",
    date: "2026-08-27",
    status: "estimate",
    source: "8-K cadence, fiscal Q2 late-Aug pattern",
  },
  {
    symbol: "AVGO",
    date: "2026-09-03",
    status: "estimate",
    source: "8-K cadence; true window Aug 27–Sep 10 (83–98d spread)",
  },
  { symbol: "MSFT", date: "2026-10-27", status: "estimate", source: "8-K cadence" },
  { symbol: "GOOG", date: "2026-10-28", status: "estimate", source: "8-K cadence" },
  { symbol: "META", date: "2026-10-28", status: "estimate", source: "8-K cadence" },
  { symbol: "AMZN", date: "2026-10-29", status: "estimate", source: "8-K cadence" },
  { symbol: "AAPL", date: "2026-10-29", status: "estimate", source: "8-K cadence" },
  {
    symbol: "CRWV",
    date: "2026-11-10",
    status: "estimate",
    source: "8-K cadence off 2026-08-11 midday print",
  },
];

/** ET wall-clock "HH:MM" for an ISO timestamp — the whole market day is anchored on ET. */
export const etTimeOf = (iso: string): string =>
  new Date(iso).toLocaleTimeString("sv-SE", {
    timeZone: "America/New_York",
    hour: "2-digit",
    minute: "2-digit",
  });

/** UTC date-only (YYYY-MM-DD) of an ISO timestamp. */
const dateOf = (iso: string): string => iso.slice(0, 10);

/** Whole calendar days from `asOfIso`'s UTC date to `date` (negative = past). */
export function daysUntil(asOfIso: string, date: string): number {
  const ms = Date.parse(`${date}T00:00:00Z`) - Date.parse(`${dateOf(asOfIso)}T00:00:00Z`);
  return Math.round(ms / 86_400_000);
}

/** The symbol's next upcoming print (today counts as upcoming — the print is after the close). */
export function nextPrint(
  symbol: string,
  asOfIso: string,
  prints: readonly EarningsPrint[] = UPCOMING_PRINTS,
): EarningsPrint | undefined {
  return prints
    .filter((p) => p.symbol === symbol && daysUntil(asOfIso, p.date) >= 0)
    .sort((a, b) => a.date.localeCompare(b.date))[0];
}

/**
 * The print that already happened within the last `daysBack` calendar days (yesterday or
 * earlier — day D itself still counts as upcoming). The post-print hygiene question: a playbook
 * position that somehow survived its print must be exited, not silently carried.
 */
export function recentPrint(
  symbol: string,
  asOfIso: string,
  daysBack: number,
  prints: readonly EarningsPrint[] = UPCOMING_PRINTS,
): EarningsPrint | undefined {
  return prints.find((p) => {
    if (p.symbol !== symbol) {
      return false;
    }
    const days = daysUntil(asOfIso, p.date);
    return days < 0 && days >= -daysBack;
  });
}

/**
 * The print inside the next `days` calendar days, if any — the S2 question. Estimates count
 * (they widen the flat window; see the date policy above).
 */
export function printWithin(
  symbol: string,
  asOfIso: string,
  days: number,
  prints: readonly EarningsPrint[] = UPCOMING_PRINTS,
): EarningsPrint | undefined {
  const next = nextPrint(symbol, asOfIso, prints);
  return next && daysUntil(asOfIso, next.date) <= days ? next : undefined;
}
