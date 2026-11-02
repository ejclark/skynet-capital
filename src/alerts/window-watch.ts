import { type EarningsPrint, nextPrint, UPCOMING_PRINTS } from "../domain/earnings-calendar.js";
import { windowOpenAt } from "../observatory/playbook-window.js";
import { findPair, isStale, type Pair, STRATEGIES } from "../playbooks/pair-table.js";
import type { Playbook } from "../playbooks/playbook.js";
import type { PairForecast } from "../server/pair-forecast.js";
import { capitalized } from "../ui/capitalized.js";
import type { Alert } from "./alert.js";

/**
 * WINDOW WATCH (#5719) — tells a member when a researched window opens on a name they hold or
 * watch, with the call, its confidence and what proves it wrong.
 *
 * Why it exists (the 2026-10-18 audit): nothing joined the book, the watchlist, the calendar and
 * research. The roll call (`bot-heartbeat-view.ts`) already knew "S1-NVDA's window opens on day X",
 * and the research shelf already held R&D's dated call for the report it keys on, but a member
 * holding or watching NVDA only learned either by going to look.
 *
 * Which windows: a RESEARCHED pair (`pair-table.ts`, evidence status `researched` and not past its
 * shelf date, the rule that stops new subscriptions to it) on one ticker, whose playbook is keyed
 * on earnings — the windows a print date opens. One ticker, so the print the window keys on is that
 * ticker's own; every such pair is one today, and a basket would need its own wording. Whether one
 * is open is asked of the playbook through `windowOpenAt`, the read the Overview's idea cards use
 * too, never re-derived here.
 *
 * Honesty rules:
 *  - A window open only on an ESTIMATED print date is said to be so, with the rule that only a
 *    confirmed date opens a position. One open on the calendar as it stands, but counted from an
 *    estimated date, says the date is an estimate too.
 *  - The call, its confidence and its falsifier are R&D's forecast for the coming report
 *    (`pair-forecast.ts`), verbatim. With no forecast call on file, the pair's own study call stands
 *    in and is named as the study's; a missing falsifier is said, never invented.
 *  - A heads-up, never an order: nothing here places anything, and the body says so.
 *
 * Pure: the clock, the calendar, the playbooks and the forecast read are all passed in.
 *
 * DEDUPE. One alert per pair, ticker, print date and date status — so a dismissed window stays
 * dismissed while it is open, the next quarter's window is new news, and an estimate the company
 * then confirms is new news as well (it is the moment a playbook may actually trade it).
 */

export const WINDOW_WATCH_SOURCE = "window-watch";

/** What the watch reads for one member. */
export interface WindowWatchInput {
  /** Every house playbook; the watch picks the researched, earnings-keyed ones. */
  readonly playbooks: readonly Playbook[];
  /** Underlying tickers the account holds, shares or options. */
  readonly held: ReadonlySet<string>;
  /** Tickers on the member's watchlist. */
  readonly watched: ReadonlySet<string>;
  /** R&D's forecast for a ticker's next report (`forecastFor`), or undefined when none is on file. */
  readonly forecast: (symbol: string) => PairForecast | undefined;
  readonly calendar?: readonly EarningsPrint[];
  readonly pairOf?: (playbookId: string) => Pair | undefined;
}

/** A ledger cell as a sentence: the forecast keeps the author's words, which may end bare. */
const sentence = (text: string): string => (/[.!?]$/.test(text) ? text : `${text}.`);

/** The call, confidence and falsifier lines: the forecast's, else the study's, absences said. */
function callLines(pair: Pair, forecast: PairForecast | undefined, reportOn?: string): string[] {
  const report = reportOn ? `the ${reportOn} report` : "the next report";
  if (forecast?.call) {
    const confidence = forecast.confidence ? ` (confidence: ${forecast.confidence})` : "";
    return [
      `R&D's call for ${report}: ${forecast.call}${confidence}.`,
      forecast.wrongIf
        ? `What proves it wrong: ${sentence(forecast.wrongIf)}`
        : `No dated observation that would prove it wrong is on file for ${report} yet.`,
    ];
  }
  return [
    `No call for ${report} is on file yet. The study's call: ${sentence(pair.evidence.call)}`,
    ...(pair.evidence.confidence ? [`Confidence: ${pair.evidence.confidence}.`] : []),
    `No dated observation that would prove it wrong is on file for ${report} yet.`,
  ];
}

function estimateLine(onEstimate: boolean, date: string): string {
  return onEstimate
    ? `The ${date} report date is an estimate the company has not confirmed. A playbook opens a position on a confirmed date only, so nothing trades this window until it is.`
    : `The ${date} report date this window counts from is an estimate the company has not confirmed; if it moves, the window moves with it.`;
}

function windowAlert(
  playbook: Playbook,
  pair: Pair,
  symbol: string,
  onEstimate: boolean,
  input: WindowWatchInput,
  now: number,
): Alert {
  const print = nextPrint(symbol, new Date(now).toISOString(), input.calendar ?? UPCOMING_PRINTS);
  const estimated = onEstimate || (print !== undefined && print.status !== "confirmed");
  const forecast = input.forecast(symbol);
  const name = capitalized(STRATEGIES[pair.strategy].name);
  const why = input.held.has(symbol) ? `You hold ${symbol}.` : `${symbol} is on your watchlist.`;
  const dateKey = print?.date ?? "undated";
  return {
    id: `${WINDOW_WATCH_SOURCE}:${playbook.id}:${symbol}@${dateKey}:${estimated ? "estimate" : "confirmed"}`,
    at: now,
    source: WINDOW_WATCH_SOURCE,
    priority: "info",
    symbol,
    title: onEstimate
      ? `${name} window on ${symbol} is due, on an estimated report date`
      : `${name} window is open on ${symbol}`,
    body: [
      why,
      ...callLines(pair, forecast, print?.date),
      ...(estimated && print ? [estimateLine(onEstimate, print.date)] : []),
      "A heads-up only: nothing is placed on your account.",
    ].join(" "),
    dedupeKey: `window:${playbook.id}:${symbol}:${dateKey}:${estimated ? "estimate" : "confirmed"}`,
    data: {
      playbookId: playbook.id,
      ...(print ? { reportOn: print.date } : {}),
      dateSet: print?.status === "confirmed" && !onEstimate,
      ...(forecast?.call ? { call: forecast.call } : {}),
      ...(forecast?.confidence ? { confidence: forecast.confidence } : {}),
      ...(forecast?.wrongIf ? { wrongIf: forecast.wrongIf } : {}),
      ...(forecast?.href ? { href: forecast.href } : {}),
    },
  };
}

/** Every open researched window on a held or watched name, one alert per pair and ticker, in the
 *  playbooks' order. Sorting by loudness is the consumer's job (`sortAlerts`). */
export function windowAlerts(input: WindowWatchInput, now: number): Alert[] {
  const interested = new Set([...input.held, ...input.watched]);
  if (interested.size === 0) return [];
  const pairOf = input.pairOf ?? findPair;
  const at = new Date(now);
  const alerts: Alert[] = [];
  for (const playbook of input.playbooks) {
    if (playbook.keyedOn !== "earnings") continue;
    const pair = pairOf(playbook.id);
    if (pair?.evidence.status !== "researched" || isStale(pair.evidence, at.toISOString()))
      continue;
    if (playbook.symbols.length !== 1) continue;
    const symbols = playbook.symbols.filter((symbol) => interested.has(symbol));
    if (symbols.length === 0) continue;
    const read = windowOpenAt(playbook, at, input.calendar ?? UPCOMING_PRINTS);
    if (read !== "open" && read !== "open-on-estimate") continue;
    for (const symbol of symbols) {
      alerts.push(windowAlert(playbook, pair, symbol, read === "open-on-estimate", input, now));
    }
  }
  return alerts;
}
