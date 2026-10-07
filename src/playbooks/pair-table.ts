/**
 * THE PAIR TABLE (#4469 slice 2a) — one row per strategy × ticker, carrying the evidence that says
 * whether that ticker fits that strategy. A playbook id names a PAIR, not a strategy: `CRWV-WHEEL`
 * is the wheel on CRWV, `S1-NVDA` the pre-print run-up on NVDA. Today's six ids stay the ids of
 * their pairs, so every subscription, verdict, guard and compounding record keyed on them keeps
 * its key (the plan's call 1: nothing migrates).
 *
 * The templates read it for their settings (2b–2d); the Store draws one card per strategy from it
 * and refuses a new subscription a row says cannot run, including a ✓ row past its shelf date (3a,
 * `subscriptions/subscribe-eligibility.ts`). A spec holds the table to the registry, so a playbook
 * added without a row (or a row whose tickers drift from its playbook's) fails the build.
 *
 * AN ID IS LOOKED UP, NEVER BUILT (criterion 8). `S1-NVDA` puts the strategy first and
 * `NVDA-CALL-SPREAD` puts the ticker first; no rule composes both, and splitting either on `-`
 * breaks `NVDA-CALL-SPREAD`. So the only way from (strategy, ticker) to an id is `pairFor`, and the
 * only way back is `findPair`.
 *
 * Evidence is data, never engine text — a claim true of NVDA must not read as a claim about the
 * strategy (the same rule as `src/research/print-evidence.ts`). Every row cites its study.
 */

import { marketDayKey } from "../domain/market-day.js";

/** A strategy is the playbook with its ticker taken out: what it does, not what it trades. */
export type StrategyId =
  | "pre-print-run-up"
  | "wheel"
  | "call-spread"
  | "event"
  | "tactical"
  | "persona-rules"
  | "forced-pick";

export interface Strategy {
  readonly id: StrategyId;
  /** Read as "<name> on <TICKER>" wherever a pair is named to its owner (criterion 14). */
  readonly name: string;
  /** The free screen that answers "does this ticker fit", with `<SYM>` for the ticker. */
  readonly screen?: string;
  /** Why there is no screen, when there is none — said, never left blank. */
  readonly noScreen?: string;
  /** What its orders buy. Two option pairs on one ticker never share a bot; an option pair over a
   *  share pair takes the ticker and the share pair yields it (#4645's hand-off, criterion 9). A
   *  spec holds this to each registry playbook's `options`. */
  readonly instrument: "shares" | "options";
  /** Its window counts toward an earnings print, so a pair needs that ticker's next print on file
   *  and a window a study measured before it takes a new subscription (criterion 9). */
  readonly dateKeyed?: true;
}

/** Each strategy declares its screen (slice 1: one run costs 0.74 s and zero tokens). */
export const STRATEGIES: Readonly<Record<StrategyId, Strategy>> = {
  "pre-print-run-up": {
    id: "pre-print-run-up",
    name: "the pre-print run-up",
    instrument: "shares",
    dateKeyed: true,
    screen: "node scripts/research/earnings-cycle.mjs <SYM>",
  },
  wheel: {
    id: "wheel",
    name: "the wheel",
    instrument: "options",
    screen: "node scripts/research/premium-fit.mjs <SYM>",
  },
  "call-spread": {
    id: "call-spread",
    name: "the call spread",
    instrument: "options",
    dateKeyed: true,
    // The spread trades the run-up's window, so the run-up's screen is its fit test; its own P/L
    // is a separate question no screen answers yet.
    screen: "node scripts/research/earnings-cycle.mjs <SYM>",
  },
  event: {
    id: "event",
    name: "the TACO event play",
    instrument: "shares",
    noScreen: "Its trigger is a news story, and no news feed is wired to it yet.",
  },
  tactical: {
    id: "tactical",
    name: "hardcore Sauron's tactics",
    instrument: "shares",
    noScreen: "It trades as research, measured by trade volume, not by a backtest.",
  },
  "persona-rules": {
    id: "persona-rules",
    name: "Sauron's own rules",
    instrument: "shares",
    noScreen: "It is a persona's whole rule set, not a fit test for one ticker.",
  },
  "forced-pick": {
    id: "forced-pick",
    name: "the forced daily pick",
    instrument: "shares",
    noScreen: "It tests the order path on a quiet day; no ticker is chosen for fit.",
  },
};

/** What the evidence says about one pair, as a glyph plus a word (criterion 10: hue never carries
 *  it alone, and neither does a glyph). */
export type EvidenceStatus =
  | "researched"
  | "conviction"
  | "screened"
  | "stand-aside"
  | "not-studied"
  | "cant-run";

export const EVIDENCE_STATUS: Readonly<
  Record<EvidenceStatus, { readonly glyph: string; readonly word: string }>
> = {
  researched: { glyph: "✓", word: "researched" },
  conviction: { glyph: "◆", word: "conviction" },
  screened: { glyph: "~", word: "screened" },
  "stand-aside": { glyph: "✗", word: "stand aside" },
  "not-studied": { glyph: "?", word: "not studied" },
  "cant-run": { glyph: "–", word: "can't run" },
};

export interface PairEvidence {
  readonly status: EvidenceStatus;
  /** A ✓ that is not a clean ✓: `weakened` (it misses the house bar), `borrowed` (another pair's
   *  verdict, this pair's own P/L untested). */
  readonly qualifier?: "weakened" | "borrowed";
  /** The call, in one sentence. */
  readonly call: string;
  readonly confidence?: "high" | "medium" | "low";
  /** The exit the study measured — a verdict holds for that exit and no other. */
  readonly measuredExit?: string;
  /** The one number the verdict rests on. */
  readonly number?: string;
  /** ISO date the verdict was written. */
  readonly verdictOn?: string;
  /** ✓ only: past this date with no new verdict the pair is stale and takes no new entries
   *  (criterion 4 — enforced from slice 3a). */
  readonly shelfOn?: string;
  /** ◆ only: the date the owner's conviction is checked (criterion 12, from slice 3c). */
  readonly checkOn?: string;
  /** `docs/research/…` — the study this row cites. */
  readonly study?: string;
  /** – only: why the pair cannot run. */
  readonly reason?: string;
}

export interface Pair {
  /** The id every record keys on. Opaque: look it up, never build or split it. */
  readonly id: string;
  readonly strategy: StrategyId;
  /** One ticker per pair; HC-SAURON's and SAURON's ten-name baskets are the exceptions, kept as they are
   *  (a subscriber's chips narrow it), and BETA-SCOUT names none — it picks among the bots' ten
   *  names on the day. Must equal the registry playbook's `symbols`. */
  readonly symbols: readonly string[];
  readonly evidence: PairEvidence;
}

const NVDA_STUDY = "docs/research/events/nvda-2026-11-18-print.md";

const PAIRS: readonly Pair[] = [
  {
    id: "S1-NVDA",
    strategy: "pre-print-run-up",
    symbols: ["NVDA"],
    evidence: {
      status: "researched",
      qualifier: "weakened",
      call: "Long from 20 trading sessions before a confirmed print to 6 before; flat from 5.",
      confidence: "medium",
      measuredExit: "D-5",
      number: "15 of 15 run-ups positive, p=0.0032 (the house bar is ~0.001)",
      verdictOn: "2026-10-05",
      // Re-research after the 2027-02-24 print.
      shelfOn: "2027-03-31",
      study: NVDA_STUDY,
    },
  },
  {
    id: "G1-GOOG",
    strategy: "pre-print-run-up",
    symbols: ["GOOG"],
    evidence: {
      status: "researched",
      call: "Long from 20 trading sessions before a confirmed print to the close of print day; sized small, never stacked with another pre-print long.",
      confidence: "medium",
      measuredExit: "print-day close",
      number: "37 of 43 prints positive, p=0.0008",
      verdictOn: "2026-08-12",
      // Re-research after GOOG's Q4 print.
      shelfOn: "2027-03-31",
      study: "docs/research/multi-symbol-sweep.md",
    },
  },
  {
    id: "TACO-DJT",
    strategy: "event",
    symbols: ["DJT"],
    evidence: {
      status: "cant-run",
      call: "Dark: it waits for a Trump-linked pump story that never arrives.",
      reason: "no news feed, no dated falsifier",
    },
  },
  {
    id: "HC-SAURON",
    strategy: "tactical",
    symbols: ["AAPL", "MSFT", "NVDA", "GOOGL", "AMZN", "META", "AVGO", "TSLA", "CRWV", "MRVL"],
    evidence: {
      status: "not-studied",
      call: "Small tranches at every extreme and every run; the trades are the research, not the P/L.",
    },
  },
  {
    id: "CRWV-WHEEL",
    strategy: "wheel",
    symbols: ["CRWV"],
    evidence: {
      status: "conviction",
      call: "Runs as its owner's conviction against the study's stand-aside (#4642): one cash-secured put about a month out, covered calls once assigned.",
      confidence: "medium",
      number: "implied volatility at the 6th percentile of what CRWV went on to move",
      verdictOn: "2026-10-02",
      checkOn: "2027-01-29",
      study: "docs/research/crwv-premium-fit.md",
    },
  },
  {
    id: "NVDA-CALL-SPREAD",
    strategy: "call-spread",
    symbols: ["NVDA"],
    evidence: {
      status: "researched",
      qualifier: "borrowed",
      call: "The run-up on NVDA as a call debit spread: long from D-20 to D-6, out from D-5. The verdict is the run-up's; the spread's own P/L is untested.",
      confidence: "medium",
      measuredExit: "D-5",
      number: "the run-up's 15 of 15, p=0.0032",
      verdictOn: "2026-10-05",
      shelfOn: "2027-03-31",
      study: NVDA_STUDY,
    },
  },
  {
    // A persona's rules over the bots' ten names (#4651), like HC-SAURON's basket; its claims live
    // in docs/BOTS-SAURON.md, not in a per-ticker study.
    id: "SAURON",
    strategy: "persona-rules",
    symbols: ["AAPL", "MSFT", "NVDA", "GOOGL", "AMZN", "META", "AVGO", "TSLA", "CRWV", "MRVL"],
    evidence: {
      status: "not-studied",
      call: "Sauron's own rules, unchanged: sell euphoria that has rolled over, buy panic that has stopped falling.",
    },
  },
  {
    // The forced daily pick (#4642 slice 10): subscribable, but a probe of the order path, never a
    // strategy with a ticker to fit; its results are kept apart from every playbook's record.
    id: "BETA-SCOUT",
    strategy: "forced-pick",
    symbols: [],
    evidence: {
      status: "not-studied",
      call: "The first time in a session no bot has traded yet, a few small picks ranked on whatever signal exists, sold the next trading day. A test of the order path, not a call on any name.",
    },
  },
];

/** Every pair, in the registry's roster order. */
export function pairTable(): readonly Pair[] {
  return PAIRS;
}

/** The pair an id names — the only way from an id to its strategy and ticker. */
export function findPair(id: string): Pair | undefined {
  return PAIRS.find((pair) => pair.id === id);
}

/** The pair for a strategy on a ticker — the only way to an id from its parts. Undefined means no
 *  such pair exists yet; never fall back to building one. */
export function pairFor(strategy: StrategyId, symbol: string): Pair | undefined {
  const ticker = symbol.toUpperCase();
  return PAIRS.find((pair) => pair.strategy === strategy && pair.symbols.includes(ticker));
}

/**
 * A ✓ verdict past its shelf date with no new one (criterion 4): the pair takes no new entries until
 * it is re-researched. Read on the ET market day, so the shelf date is the last day it still counts.
 * A conviction is never stale — it carries a check date instead (criterion 12, slice 3c).
 */
export function isStale(evidence: PairEvidence, asOfIso: string): boolean {
  return (
    evidence.status === "researched" &&
    evidence.shelfOn !== undefined &&
    marketDayKey(asOfIso) > evidence.shelfOn
  );
}

/** "the wheel on CRWV" — how a pair is named to its owner, never by its id (criterion 14). A basket
 *  reads as its strategy alone: ten tickers are not a name. */
export function pairName(pair: Pair): string {
  const { name } = STRATEGIES[pair.strategy];
  return pair.symbols.length === 1 ? `${name} on ${pair.symbols[0]}` : name;
}

/** "✓ researched, weakened" — the status as a glyph plus words. */
export function statusLabel(evidence: PairEvidence): string {
  const { glyph, word } = EVIDENCE_STATUS[evidence.status];
  return evidence.qualifier ? `${glyph} ${word}, ${evidence.qualifier}` : `${glyph} ${word}`;
}
