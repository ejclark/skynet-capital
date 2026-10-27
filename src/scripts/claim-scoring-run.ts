import { readFileSync } from "node:fs";
import { join } from "node:path";
import { bars } from "../../scripts/research/market-data.mjs";
import { parseForwardTests } from "../../scripts/research-scorecard.mjs";
import {
  claimLabel,
  type ForwardLink,
  type ForwardRow,
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
 * claim is scored against its own dated falsifier: a study re-run feeds the `rerun` check, a price
 * check reads the symbol's cached tape, and a forward-test check reads the row its event lane
 * registered and scored. The scores are written beside the studies, in `conviction-scores.json`,
 * and the record attaches them to the claims.
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
    const check = claim.check;
    if (check?.kind === "closes-within" || check?.kind === "closes-reach")
      symbols.add(check.symbol);
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

const FRAGMENTS = join(process.cwd(), "docs", "research", "forward-tests");

/**
 * The row a link names in its event's fragment: by id for an `FT-…` ref, else the row whose text
 * cites the proposal token, as a whole token (`…/P1` is not `…/P10`) — the same answer
 * `scripts/conviction-proposals.mjs` reads. Pure; the verdict is the register's own reading.
 */
export function findForwardTest(fragment: string, ref: string): ForwardRow | undefined {
  const cites = new RegExp(`${ref.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?!\\d)`);
  for (const line of fragment.split("\n")) {
    const [row] = parseForwardTests(line);
    if (row === undefined) continue;
    if (ref.startsWith("FT-") ? row.id === ref : cites.test(line)) return row;
  }
  return undefined;
}

/** Each event's fragment, read once; an event with no fragment yet has registered nothing. */
function forwardTestsReader(): (link: ForwardLink) => ForwardRow | undefined {
  const fragments = new Map<string, string>();
  return (link) => {
    if (!fragments.has(link.event)) {
      let text = "";
      try {
        text = readFileSync(join(FRAGMENTS, `${link.event}.md`), "utf8");
      } catch {
        // No fragment: the lane has registered nothing for this event, so the claim stays pending.
      }
      fragments.set(link.event, text);
    }
    return findForwardTest(fragments.get(link.event) ?? "", link.ref);
  };
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
  const entries = scoreAll(studied.claims, {
    today,
    tape: (symbol) => tapes.get(symbol),
    forwardTest: forwardTestsReader(),
  });
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
