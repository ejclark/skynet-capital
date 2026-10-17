import { bars } from "../../scripts/research/market-data.mjs";
import {
  claimLabel,
  type ScoreLedgerEntry,
  scoreAll,
  scorecardOf,
  type TapeBar,
  withScores,
} from "../playbooks/claim-score.js";
import { type StudyLedgerEntry, withStudies } from "../playbooks/claim-studies.js";
import type { Conviction } from "../playbooks/conviction-record.js";

/**
 * The scoring half of `npm run research:claims` (#5482 slice 5). After the studies are (re)run, each
 * claim is scored against its own dated falsifier: a study re-run feeds the `rerun` check, and a
 * price check reads the symbol's cached tape. The scores are written beside the studies, in
 * `conviction-scores.json`, and the record attaches them to the claims.
 *
 * Reads only the instruments' own cached tape; places no order, sizes no trade, and changes no
 * pair's settings. Paper only, educational.
 */

/** Today as the scoring sees it: the UTC calendar day. */
export const todayUtc = (): string => new Date().toISOString().slice(0, 10);

/** The closes a price check reads: the quoted close, not the dividend-adjusted one. */
async function tapeOf(symbol: string): Promise<readonly TapeBar[]> {
  return (await bars(symbol)).map((b) => ({ date: b.date, close: b.rawClose }));
}

/** The tape of every symbol a conviction's price checks name, read once each. */
async function tapesFor(conviction: Conviction): Promise<Map<string, readonly TapeBar[]>> {
  const symbols = new Set<string>();
  for (const claim of conviction.claims) {
    if (claim.check && claim.check.kind !== "rerun") symbols.add(claim.check.symbol);
  }
  const tapes = new Map<string, readonly TapeBar[]>();
  for (const symbol of symbols) {
    try {
      tapes.set(symbol, await tapeOf(symbol));
    } catch {
      // An unreadable tape leaves its claims pending, never invented.
    }
  }
  return tapes;
}

export interface ConvictionScoring {
  readonly entries: readonly ScoreLedgerEntry[];
  readonly lines: readonly string[];
}

/** Score a conviction with the studies just run attached, and say what each claim got. */
export async function scoreConviction(
  conviction: Conviction,
  studies: readonly StudyLedgerEntry[],
  today: string = todayUtc(),
): Promise<ConvictionScoring> {
  const studied = withStudies(conviction, studies);
  const tapes = await tapesFor(studied);
  const entries = scoreAll(studied.claims, { today, tape: (symbol) => tapes.get(symbol) });
  const lines = entries.map((e, i) => {
    const label = claimLabel(e.statement, i + 1);
    return `  claim ${label}: ${e.score.outcome} — ${e.score.basis}`;
  });
  const card = scorecardOf(withScores(studied, entries).claims);
  lines.push(
    `  scorecard: ${card.pass} pass / ${card.fail} fail / ${card.pending} pending / ${card.untestable} untestable`,
  );
  return { entries, lines };
}
