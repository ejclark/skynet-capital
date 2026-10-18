/**
 * THE PROTECTED WINDOW (#4807 slice 5) — the days around a print when no new entry opens on a
 * symbol and exits always run. One pure function, read by everything that has to agree on it:
 * the symbol summary's ■ Protected strip (`research/symbol-outlook.ts`), the house entry guard
 * (S2, `engine/guards.ts`), and the playbooks that check it themselves before they ask
 * (`playbooks/wheel.ts`). Before this, each counted its own days to the print, and the card could
 * say "no new entries" on a session the share guard still let a buy through (the session after an
 * after-close print).
 *
 * THE WINDOW is the union of the two house print rules it replaced, so nothing reading it is
 * looser than the code that already refused:
 *   - from `PRINT_WINDOWS.entryFlatDays` calendar days before the print's first possible day (S2's
 *     entry side: don't open what you'd be forced to flatten before the print);
 *   - through the session after its last possible day (the option print blackout: an after-close
 *     print moves the stock on the next session).
 * An estimate counts its whole researched window (`printSpan`) — the date policy lets an estimate
 * only widen a safety window. A symbol's facts file (`src/domain/symbols/<SYM>.json`) may widen
 * the tail by naming more sessions; never narrow it.
 *
 * NOT HERE: a strategy's own timing. The run-up's "out at D-5", GOOG's 15:45 exit and an option
 * expiry that must clear the blackout stay the strategy's settings; this is only the house's "no
 * new entries" span. "Today" is the ET market day.
 */

import { type EarningsPrint, PRINT_WINDOWS, printSpan } from "./earnings-calendar.js";
import { nextSession } from "./market-calendar.js";
import { marketDayKey } from "./market-day.js";
import type { SymbolFacts } from "./symbol-facts.js";

export interface ProtectedWindow {
  /** First protected day (a calendar day, possibly a weekend). */
  readonly start: string;
  /** Last protected day — always a session. */
  readonly end: string;
  readonly print: EarningsPrint;
  /** Sessions past the print's last possible day that the window keeps (1 unless facts widen it). */
  readonly sessionsAfter: number;
}

const shiftDays = (date: string, days: number): string => {
  const at = new Date(`${date}T00:00:00Z`);
  at.setUTCDate(at.getUTCDate() + days);
  return at.toISOString().slice(0, 10);
};

/** One print's protected window. */
export function printProtectedWindow(print: EarningsPrint, facts?: SymbolFacts): ProtectedWindow {
  const span = printSpan(print);
  const sessionsAfter = Math.max(1, facts?.printReaction?.sessionsAfter ?? 1);
  let end = span.end;
  for (let i = 0; i < sessionsAfter; i += 1) end = nextSession(end);
  return {
    start: shiftDays(span.start, -PRINT_WINDOWS.entryFlatDays),
    end,
    print,
    sessionsAfter,
  };
}

/**
 * The protected window `symbol` is inside on `asOfIso`'s ET market day, or `undefined` when it is
 * open. Every one of the symbol's rows is read, so two overlapping estimates both count.
 */
export function protectedWindowOn(
  symbol: string,
  asOfIso: string,
  prints: readonly EarningsPrint[],
  facts?: SymbolFacts,
): ProtectedWindow | undefined {
  const today = marketDayKey(asOfIso);
  return prints
    .filter((p) => p.symbol === symbol)
    .map((p) => printProtectedWindow(p, facts))
    .filter((w) => w.start <= today && today <= w.end)
    .sort((a, b) => a.start.localeCompare(b.start))[0];
}
