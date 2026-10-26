/**
 * THE FIT FINDER (#4469 slice 4) — start from a ticker, see which strategies it fits, each with its
 * reason. The funnel's front door: the Store's strategy cards are the same list read from the other
 * end (Eric, 2026-10-02: "funnel symbols towards strategies that match the characteristics of a
 * stock"). It invents nothing — every row is the pair table's own row for that strategy × ticker,
 * so the finder and the card cannot disagree about a verdict; a strategy with no row for the ticker
 * says so and says what the free screen is. Adding the ticker is the card's Subscribe (or, with no
 * row yet, the card's "ask for its research" filing), so both doors write the same rows and run the
 * same checks.
 *
 * PURE over the pair table and the earnings calendar: no broker, no clock (the caller passes
 * `asOfIso`), no member data — the same posture as `/api/research/outlook`, so it serves any authed
 * member and costs nothing per read. Paper only.
 *
 * A strategy that never trades one chosen ticker (Sauron's basket, the forced pick, the scout) has
 * no `act` line and is not a candidate here. The order is the answer: current ✓ first, then ◆ (an
 * owner's own conviction), then ~, then the tickers the house has not studied yet (askable), then ✗
 * and ⊘ — a refusal is a call, so it stays on the list with its reason, never silently dropped.
 */

import { nextPrint } from "../domain/earnings-calendar.js";
import {
  EVIDENCE_STATUS,
  type EvidenceStatus,
  isStale,
  type Pair,
  pairFor,
  STRATEGIES,
  type Strategy,
  type StrategyId,
} from "./pair-table.js";

/** Where a strategy stands on one ticker. `stale` is a ✓ past its shelf date; the rest are the
 *  pair table's own statuses, and `not-studied` also covers a strategy with no row for the ticker. */
export type FitStatus = EvidenceStatus | "stale";

export interface FitRow {
  readonly strategy: StrategyId;
  /** Read as "<name> on <TICKER>": lower-case, with its article ("the wheel"). */
  readonly name: string;
  /** What it does, in plain words, said of the strategy. */
  readonly line: string;
  /** What it does on THIS ticker — the strategy's `act` with the ticker filled in. */
  readonly act: string;
  readonly status: FitStatus;
  readonly glyph: string;
  readonly word: string;
  /** The reason, in one or two sentences: the row's own call, or why there is no verdict. */
  readonly reason: string;
  readonly confidence?: "high" | "medium" | "low";
  /** The one number the verdict rests on. */
  readonly number?: string;
  readonly measuredExit?: string;
  /** `docs/research/…` — the study the row cites. */
  readonly study?: string;
  /** The date the verdict stops counting (✓) or the owner's conviction is checked (◆). */
  readonly until?: string;
  /** The free screen's command, when the house can run one on this ticker and has not. */
  readonly screen?: string;
  /** The house has no row for this ticker on a strategy that has a screen: the Store card's
   *  "ask for its research" filing is the next step. */
  readonly askable?: true;
}

export interface FitAnswer {
  readonly symbol: string;
  readonly fits: readonly FitRow[];
}

/** Lower is shown first. */
const FIT_STATUS_RANK: Readonly<Record<FitStatus, number>> = {
  researched: 0,
  conviction: 1,
  screened: 2,
  "not-studied": 3,
  stale: 4,
  "stand-aside": 5,
  "cant-run": 6,
};

const fill = (text: string, symbol: string): string => text.replaceAll("<SYM>", symbol);

/** The row a strategy has no pair for on this ticker. */
function unstudied(
  strategy: Strategy,
  symbol: string,
  asOfIso: string,
): Pick<FitRow, "reason" | "screen" | "askable"> & { readonly status: EvidenceStatus } {
  if (!strategy.screen) {
    // No screen means nothing the house can run: say why, never offer an ask that cannot be built.
    // A strategy whose rules read no study can still run on its owner's conviction, so it stays a
    // "not studied"; one that can neither be screened nor run on conviction is "can't run".
    return {
      status: strategy.runsOnConviction ? "not-studied" : "cant-run",
      reason: strategy.noScreen ?? "No study measures it yet.",
    };
  }
  if (strategy.dateKeyed && !nextPrint(symbol, asOfIso)) {
    return {
      status: "cant-run",
      reason: `${symbol}'s next earnings date is not on the calendar, and ${strategy.name} counts its window toward that report.`,
    };
  }
  return {
    status: "not-studied",
    reason: `The house has not run ${strategy.name} on ${symbol} yet. Its free screen takes under a second and no tokens; ask for it and the verdict lands as a row on the Store's card.`,
    screen: fill(strategy.screen, symbol),
    askable: true,
  };
}

type Base = Pick<FitRow, "strategy" | "name" | "line" | "act">;

/** The row a pair-table entry makes: its own call and numbers, said as the Store's card says them. */
function rowOf(base: Base, pair: Pair, asOfIso: string): FitRow {
  const { evidence } = pair;
  const stale = isStale(evidence, asOfIso);
  const status: FitStatus = stale ? "stale" : evidence.status;
  const label = EVIDENCE_STATUS[evidence.status];
  const word = stale ? "stale, due for re-research" : label.word;
  const until = evidence.status === "conviction" ? evidence.checkOn : evidence.shelfOn;
  return {
    ...base,
    status,
    glyph: stale ? "△" : label.glyph,
    word: evidence.qualifier && status === "researched" ? `${word}, ${evidence.qualifier}` : word,
    reason:
      evidence.status === "cant-run" && evidence.reason
        ? `${evidence.call} ${evidence.reason}.`
        : evidence.call,
    ...(evidence.confidence ? { confidence: evidence.confidence } : {}),
    ...(evidence.number ? { number: evidence.number } : {}),
    ...(evidence.measuredExit ? { measuredExit: evidence.measuredExit } : {}),
    ...(evidence.study ? { study: evidence.study } : {}),
    ...(until ? { until } : {}),
  };
}

/** Which strategies a ticker fits, best first. */
export function fitFor(symbol: string, asOfIso: string): FitAnswer {
  const sym = symbol.toUpperCase();
  const fits = (Object.values(STRATEGIES) as Strategy[])
    .filter((strategy) => strategy.act !== undefined)
    .map((strategy): FitRow => {
      const base: Base = {
        strategy: strategy.id,
        name: strategy.name,
        line: strategy.line,
        act: fill(strategy.act ?? "", sym),
      };
      const pair = pairFor(strategy.id, sym);
      if (pair) return rowOf(base, pair, asOfIso);
      const row = unstudied(strategy, sym, asOfIso);
      return { ...base, ...row, ...EVIDENCE_STATUS[row.status] };
    });
  return {
    symbol: sym,
    fits: fits.sort((a, b) => FIT_STATUS_RANK[a.status] - FIT_STATUS_RANK[b.status]),
  };
}
