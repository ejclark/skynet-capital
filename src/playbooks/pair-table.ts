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
import { DIP_BOUNCE_STUDY } from "./dip-bounce-play.js";

/** A strategy is the playbook with its ticker taken out: what it does, not what it trades. */
export type StrategyId =
  | "pre-print-run-up"
  | "wheel"
  | "call-spread"
  | "long-call"
  | "event"
  | "persona-rules"
  | "forced-pick"
  | "shadow-scan"
  | "dip-bounce";

export interface Strategy {
  readonly id: StrategyId;
  /** Read as "<name> on <TICKER>" wherever a pair is named to its owner (criterion 14). */
  readonly name: string;
  /** What it does, in one line a phone shows under the card's name — said of the strategy, never of
   *  one ticker (the pair's own `call` carries the ticker's claim). */
  readonly summary: string;
  /** The name in plain words, ≤ 50 characters, under it on R&D → Playbooks' list and card head
   *  (#5445; Eric, 2026-10-14: "Sauron - i can only guess what this eludes too"). The name is the
   *  lore and stays; this line is the mechanic said plainly beside it. */
  readonly line: string;
  /** What it does on one ticker, the start of the member's call sentence, `<SYM>` for the ticker
   *  ("Buy <SYM>'s run-up before its earnings report"); the row adds its until-date (#5444).
   *  Absent on a strategy that never trades one chosen ticker (a basket, a pick on the day). */
  readonly act?: string;
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
  /** Its rules never read a study, so an owner's labelled, dated conviction may run it where the
   *  study says stand aside (criterion 2; #4642 settled the wheel on CRWV this way). A strategy
   *  without this flag acts on its study, so a stand-aside is a refusal there. */
  readonly runsOnConviction?: true;
  /** It sends no order to a broker, so subscribing asks for no budget and shows no money at risk
   *  (#4535 slice 3a). The Store hides the capital and compounding fields on its card and says so
   *  in words; the server stores no budget for it whatever a client sends. */
  readonly movesNoCapital?: true;
}

/** Each strategy declares its screen (slice 1: one run costs 0.74 s and zero tokens). */
export const STRATEGIES: Readonly<Record<StrategyId, Strategy>> = {
  "pre-print-run-up": {
    id: "pre-print-run-up",
    name: "the pre-print run-up",
    line: "Buys before an earnings report, sells before it",
    act: "Buy <SYM>'s run-up before its earnings report",
    summary:
      "Buys shares in the weeks before a confirmed earnings report and sells by it; each ticker has its own measured exit.",
    instrument: "shares",
    dateKeyed: true,
    screen: "node scripts/research/earnings-cycle.mjs <SYM>",
  },
  wheel: {
    id: "wheel",
    name: "the wheel",
    line: "Sells puts, then calls on shares it's assigned",
    act: "Sell cash-secured puts on <SYM>, then covered calls on any shares assigned",
    summary:
      "Sells cash-secured puts two to six weeks out, then covered calls on any shares it is assigned.",
    instrument: "options",
    runsOnConviction: true,
    screen: "node scripts/research/premium-fit.mjs <SYM>",
  },
  "call-spread": {
    id: "call-spread",
    name: "the call spread",
    line: "The run-up, traded with a call spread",
    act: "Buy a call spread on <SYM>'s run-up before its earnings report",
    summary: "The run-up as a call debit spread: out before the report, on the run-up's evidence.",
    instrument: "options",
    dateKeyed: true,
    // The spread trades the run-up's window, so the run-up's screen is its fit test; its own P/L
    // is a separate question no screen answers yet.
    screen: "node scripts/research/earnings-cycle.mjs <SYM>",
  },
  "long-call": {
    id: "long-call",
    name: "the long call",
    line: "Buys calls months out, holds through earnings",
    act: "Buy <SYM> calls four to six months out and hold them through earnings",
    summary:
      "Buys calls four to six months out and holds them through earnings; sells at double the cost or with 45 days left.",
    instrument: "options",
    runsOnConviction: true,
    noScreen:
      "No study measures long calls held through prints yet; it runs only on its owner's dated conviction.",
  },
  event: {
    id: "event",
    name: "the TACO event play",
    line: "Trades a news-driven pump story",
    act: "Buy <SYM> on a news-driven pump story",
    summary: "Trades a news-driven pump story; dark until a news feed is wired to it.",
    instrument: "shares",
    noScreen: "Its trigger is a news story, and no news feed is wired to it yet.",
  },
  "persona-rules": {
    id: "persona-rules",
    name: "Sauron's own rules",
    line: "Sells euphoria, buys panic, across ten stocks",
    summary:
      "Sauron's own rules over the bots' ten names: sell euphoria that has rolled over, buy panic that has stopped falling.",
    instrument: "shares",
    noScreen: "It is a persona's whole rule set, not a fit test for one ticker.",
  },
  "forced-pick": {
    id: "forced-pick",
    name: "the forced daily pick",
    line: "A small buy on a quiet day, to test orders",
    summary:
      "A few small picks on a quiet session, sold the next trading day, to test the order path.",
    instrument: "shares",
    noScreen: "It tests the order path on a quiet day; no ticker is chosen for fit.",
  },
  "shadow-scan": {
    id: "shadow-scan",
    name: "the shadow scout",
    line: "Reads market conditions, places no orders",
    summary:
      "Reads each name's conditions on every check and records one hypothesis per name as a simulated probe; it places no orders.",
    instrument: "shares",
    movesNoCapital: true,
    noScreen: "It scans the bots' ten names; no ticker is chosen for fit.",
  },
  "dip-bounce": {
    id: "dip-bounce",
    name: "the dip-to-bounce",
    // Dark for now (#5489): the line and the call say so, and the PR that lights it rewords both.
    line: "Buys dips, sells the bounce — observe-only",
    act: "Watch <SYM> for dips below its average price for the day and record each bounce",
    summary:
      "Buys small tranches when a stock dips well below its average price for the day and sells each one a small bounce higher; observe-only for now.",
    instrument: "shares",
    screen: "node scripts/research/dip-bounce.mjs <SYM>",
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
  /** The study's record in plain words, for the member's "past reports" row (#5444, #5448): a
   *  sentence, and the count it rests on when it is one ("went up before 13 of its last 14"), drawn
   *  as one dot per report. Never a p-value; never "rose" (Eric, round 15: "clarity in
   *  communication to educate/steer/guide is paramount"). */
  readonly past?: PastRecord;
}

/** What a study measured, said plainly. `up`/`of` only when the record is a count. */
interface PastRecord {
  readonly line: string;
  readonly up?: number;
  readonly of?: number;
  /** The years the sample spans, "2023–26", when the study says. */
  readonly era?: string;
}

export interface Pair {
  /** The id every record keys on. Opaque: look it up, never build or split it. */
  readonly id: string;
  readonly strategy: StrategyId;
  /** One ticker per pair; SAURON's ten-name basket is the exception, kept as it is
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
      // The first stretch of the hold, from the study's F2 table — the same 13 of 14 the run-up's
      // picture draws (registry `stretches`, held equal by the pair-table spec).
      past: {
        line: "NVDA's price went up in the first two weeks of the hold before 13 of its last 14 reports.",
        up: 13,
        of: 14,
        era: "2023–26",
      },
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
      past: {
        line: "GOOG's price went up from four weeks before to the close of report day before 37 of its last 43 reports.",
        up: 37,
        of: 43,
      },
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
    id: "CRWV-WHEEL",
    strategy: "wheel",
    symbols: ["CRWV"],
    evidence: {
      status: "conviction",
      call: "Runs as its owner's conviction against the study's stand-aside (#4642): cash-secured puts 14 to 45 days out at about 0.15 delta, as many as the budget secures, then covered calls once assigned.",
      confidence: "medium",
      number:
        "implied volatility at the 63rd percentile of what CRWV went on to move (re-run 2026-10-16; 6th on 10-02)",
      verdictOn: "2026-10-16",
      checkOn: "2027-01-29",
      study: "docs/research/crwv-premium-fit.md",
      past: {
        line: "CRWV's options paid for smaller moves than it went on to make, so the study says stand aside; its owner runs it anyway.",
      },
    },
  },
  {
    id: "CRWV-LONG-CALL",
    strategy: "long-call",
    symbols: ["CRWV"],
    evidence: {
      status: "conviction",
      call: "Runs as its owner's conviction (#5482): CRWV recovers well above today's price over the next 3 to 6 months, through earnings; options have priced CRWV's print moves smaller than they turned out.",
      confidence: "low",
      number: "CRWV's print moves have run larger than the options priced them",
      verdictOn: "2026-10-16",
      checkOn: "2027-01-29",
      study: "docs/research/events/crwv-2026-11-10-print.md",
      past: {
        line: "CRWV's moves on its earnings reports have run larger than its options priced them. No study has measured holding calls through them.",
      },
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
      past: {
        line: "The run-up's record, borrowed: NVDA's price went up in the first two weeks before 13 of its last 14 reports. The spread's own results are untested.",
        up: 13,
        of: 14,
        era: "2023–26",
      },
    },
  },
  {
    // A persona's rules over the bots' ten names (#4651), a basket; its claims live in
    // docs/BOTS-SAURON.md, not in a per-ticker study.
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
  {
    // The condition scanner (#4535 slice 3a): subscribable so an owner arms it and picks its names
    // in the Store; it records simulated probes only and moves no capital. No study stands behind
    // it yet — it exists to gather the evidence for one (#3651).
    id: "COND-SCOUT",
    strategy: "shadow-scan",
    symbols: [],
    evidence: {
      status: "not-studied",
      call: "Read each name's conditions on every check and record one hypothesis per name as a simulated probe. It places no orders; the probes are the evidence a later study scores.",
    },
  },
  {
    // #5489 slice 2: both dip-to-bounce pairs run observe-only (`observeOnly`); the re-run on fresh
    // bars on or after 2027-01-15 is the study's falsifier, so it is the shelf date too.
    id: "MU-DIP-BOUNCE",
    strategy: "dip-bounce",
    symbols: ["MU"],
    evidence: {
      status: "researched",
      call: "Observe only, size zero: buy a $1,000 tranche when a 5-minute bar after 10:00 ET closes two ranges below the session's average price, sell one range higher. The one setting that cleared costs, over one 58-session stretch.",
      confidence: "low",
      measuredExit: "one 5-minute range above the buy",
      number: "+0.39% per buy after 5 bps a side, t 5.3 (the bar for 45 tests is about 3.5)",
      verdictOn: "2026-10-16",
      shelfOn: "2027-01-15",
      study: DIP_BOUNCE_STUDY,
      past: {
        line: "117 dip buys of MU over 58 trading days made 0.39% each after costs; 99% sold within five days.",
      },
    },
  },
  {
    id: "NBIS-DIP-BOUNCE",
    strategy: "dip-bounce",
    symbols: ["NBIS"],
    evidence: {
      status: "researched",
      qualifier: "weakened",
      call: "Observe beside MU, size zero: the same rule made money on NBIS but missed the bar for 45 tests, and its stuck buys came on the same days as CRWV's.",
      confidence: "low",
      measuredExit: "one 5-minute range above the buy",
      number: "+0.62% per buy after 5 bps a side, t 2.2 (the bar for 45 tests is about 3.5)",
      verdictOn: "2026-10-16",
      shelfOn: "2027-01-15",
      study: DIP_BOUNCE_STUDY,
      past: {
        line: "157 dip buys of NBIS over 58 trading days made 0.62% each after costs; 96% sold within five days.",
      },
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

/** Whether a playbook sends no order to a broker (#4535 slice 3a), so subscribing to it carries no
 *  budget. An id the table does not know moves capital, the safe default. */
export function movesNoCapital(playbookId: string, lookup = findPair): boolean {
  const pair = lookup(playbookId);
  return pair !== undefined && STRATEGIES[pair.strategy].movesNoCapital === true;
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
  // A ✓ that misses the house bar never wears the ✓ (#5444): an open triangle, and the miss in words.
  if (evidence.qualifier === "weakened") return `△ ${word}, below the house bar`;
  return evidence.qualifier ? `${glyph} ${word}, ${evidence.qualifier}` : `${glyph} ${word}`;
}
