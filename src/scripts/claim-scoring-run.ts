import { readFileSync } from "node:fs";
import { join } from "node:path";
import { citesToken } from "../../scripts/conviction-proposals.mjs";
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

/** One fragment's forward-test rows, each with the line it was read from. */
type FragmentRows = readonly (ForwardRow & { readonly line: string })[];

/** Parse a fragment once; the verdict is the research scorecard's own reading of each row. */
export function fragmentRows(fragment: string): FragmentRows {
  return fragment
    .split("\n")
    .flatMap((line) => parseForwardTests(line).map((r) => ({ ...r, line })));
}

/**
 * The row a link names in its event's fragment: by id for an `FT-…` ref. For a proposal token, the
 * rows citing it as a whole token (`citesToken`, the same test that answers the proposal), narrowed
 * to the ones registered FROM it when any say so (a row that only cross-references another
 * proposal is not its registration), then past any retired one (void), and the newest of those,
 * since rows append only. Pure.
 */
export function findForwardTest(rows: FragmentRows, ref: string): ForwardRow | undefined {
  if (ref.startsWith("FT-")) return strip(rows.find((r) => r.id === ref));
  const citing = rows.filter((r) => citesToken(ref, r.line));
  const registered = citing.filter((r) => citesToken(`proposal ${ref}`, r.line));
  const own = registered.length > 0 ? registered : citing;
  const live = own.filter((r) => r.verdict !== "void");
  return strip((live.length > 0 ? live : own).at(-1));
}

const strip = (row: FragmentRows[number] | undefined): ForwardRow | undefined =>
  row && { id: row.id, verdict: row.verdict };

/** Each event's fragment, read and parsed once; an event with no fragment has registered nothing. */
function forwardTestsReader(): (link: ForwardLink) => ForwardRow | undefined {
  const fragments = new Map<string, FragmentRows>();
  return (link) => {
    if (!fragments.has(link.event)) {
      let text = "";
      try {
        text = readFileSync(join(FRAGMENTS, `${link.event}.md`), "utf8");
      } catch {
        // No fragment: the lane has registered nothing for this event, so the claim stays pending.
      }
      fragments.set(link.event, fragmentRows(text));
    }
    return findForwardTest(fragments.get(link.event) ?? [], link.ref);
  };
}

/**
 * Whether any of a conviction's claims scores from `event`'s forward tests. Pure. This is how the
 * event lane finds the convictions its own scoring just moved (`npm run research:claims -- --event
 * <id>`): the link on the claim's check, never the conviction doc's proposals table, because the
 * check is what the scorer reads.
 */
export const readsEvent = (conviction: Conviction, event: string): boolean =>
  conviction.claims.some(
    (c) => c.check?.kind === "forward-tests" && c.check.tests.some((t) => t.event === event),
  );

const decidedScore = (e: ScoreLedgerEntry | undefined): boolean =>
  e?.score.outcome === "pass" || e?.score.outcome === "fail";

/**
 * The event lane's write: the scores on file, with only the claims this pass newly DECIDES taken
 * from it (pending → pass or fail). A decided score is final, and a pending one keeps its line, so
 * a lane's PR changes one claim's entry once, the day its falsifier is read. Pure.
 *
 * Why not the whole fresh array: the scores file is one file every lane that scores a linked row
 * writes, against the event lane's one-file-per-owner rule (#1449). Rewriting every entry would
 * restamp `scoredOn` on claims decided days ago, roll back a score a full pass merged after the
 * lane's branch was cut, and turn two sibling lanes into a merge conflict over pending wording.
 * Changing only what this pass decides keeps two lanes on disjoint lines, as appends are.
 */
export function laneScores(
  onFile: readonly ScoreLedgerEntry[],
  fresh: readonly ScoreLedgerEntry[],
): readonly ScoreLedgerEntry[] {
  const kept = new Map(onFile.map((e) => [e.statement, e]));
  return fresh.map((e) => {
    const old = kept.get(e.statement);
    return old && (decidedScore(old) || !decidedScore(e)) ? old : e;
  });
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
