/**
 * THIS REPORT'S CALL, beside a pair's record (#5444, #5448 — Eric on #5163 round 10: "The almanac is
 * generally right, but would've told me to expect a high of 50-60 yesterday not 90 like the weather
 * forecast. I wish I had additional information to represent the forecast level information too").
 *
 * The record is the study's sample (the almanac). The forecast is R&D's dated call for the ticker's
 * NEXT earnings report: its ledger's headline row, its confidence and the observation that proves it
 * wrong, read verbatim from the decision header (`horizonRowsOf`) with only the emphasis taken off.
 * The two are never merged into one number.
 *
 * Honest absences, each said by the app rather than left blank: no report on file for the ticker
 * (no `forecast` at all); a report on file but no ledger, or a ledger with no call (`call` absent —
 * "No call for the Nov 18 report yet"). Nothing here invents a call.
 */
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { type EarningsPrint, nextPrint, UPCOMING_PRINTS } from "../domain/earnings-calendar.js";
import { earningsAsEvents } from "../domain/market-events.js";
import { type HorizonRow, horizonRowsOf } from "./research-event-calls.js";
import { RESEARCH_DIR } from "./research-service.js";

export interface PairForecast {
  /** The coming report's date, and whether the company has confirmed it. */
  readonly reportOn: string;
  readonly dateSet: boolean;
  /** R&D's headline call on that report, plain text; absent when no ledger states one. */
  readonly call?: string;
  readonly confidence?: string;
  /** The dated observation that proves the call wrong, plain text. */
  readonly wrongIf?: string;
  /** The ledger's page on the research shelf. */
  readonly href?: string;
}

/** Emphasis, code ticks and link markup off: the row is shown as words, never re-rendered. */
const words = (cell: string): string =>
  cell
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/\*\*|`/g, "")
    .replace(/\s+/g, " ")
    .trim();

/** The call itself, before the author's first " — " or " · ": "Stand aside — no print-keyed entry"
 *  reads "Stand aside". The rest is the ledger's shorthand for researchers (cohort ids, D-counts);
 *  the member reads the call, its date status and its falsifier, and the ledger is one tap away. */
const leadOf = (call: string): string => call.split(/ — | · /)[0]?.trim() || call;

/** The headline row: today's, else the nearest horizon the ledger states. */
function headline(md: string): HorizonRow | undefined {
  const rows = horizonRowsOf(md);
  return rows.today ?? rows.week ?? rows.month ?? rows.quarter;
}

/** The forecast for one ticker's next report, or undefined when no report is on file for it. */
export function forecastFor(
  symbol: string,
  asOfIso: string,
  root: string = RESEARCH_DIR(),
  prints: readonly EarningsPrint[] = UPCOMING_PRINTS,
): PairForecast | undefined {
  const print = nextPrint(symbol, asOfIso, prints);
  if (!print) return undefined;
  const [event] = earningsAsEvents([print]);
  const base = { reportOn: print.date, dateSet: print.status === "confirmed" };
  const file = event ? join(root, "events", `${event.id}.md`) : "";
  if (!(event && existsSync(file))) return base;
  // A ledger that can't be read or parsed costs this row its call, never the catalog its answer.
  let row: HorizonRow | undefined;
  try {
    row = headline(readFileSync(file, "utf8"));
  } catch {
    row = undefined;
  }
  if (!row) return base;
  return {
    ...base,
    call: leadOf(words(row.call)),
    ...(row.confidence ? { confidence: words(row.confidence).toLowerCase() } : {}),
    ...(row.provesWrong ? { wrongIf: words(row.provesWrong) } : {}),
    href: `/research/events/${event.id}`,
  };
}

interface WithSymbols {
  readonly symbols: readonly string[];
}

/** Every single-ticker row with its next report's forecast; a basket or a no-ticker row is left as
 *  it is. One read per ticker per request, however many strategies share it. */
export function withForecasts<
  Row extends WithSymbols,
  Card extends { readonly pairs: readonly Row[] },
>(strategies: readonly Card[], asOfIso: string, root?: string): Card[] {
  const memo = new Map<string, PairForecast | undefined>();
  const read = (symbol: string) => {
    if (!memo.has(symbol)) memo.set(symbol, forecastFor(symbol, asOfIso, root));
    return memo.get(symbol);
  };
  return strategies.map((card) => ({
    ...card,
    pairs: card.pairs.map((row) => {
      const [only] = row.symbols;
      const forecast = only && row.symbols.length === 1 ? read(only) : undefined;
      return forecast ? { ...row, forecast } : row;
    }),
  }));
}
