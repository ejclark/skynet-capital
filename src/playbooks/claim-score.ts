import { isCalendarDay } from "../subscriptions/subscription-state.js";
import { blank } from "./claim-blank.js";
import type { ConvictionClaim } from "./conviction-record.js";
import { money } from "./format-money.js";

/**
 * SCORING A CLAIM AGAINST ITS OWN DATED FALSIFIER (#5482 slice 5, criterion 6). A claim carries the
 * one dated observation that proves it wrong (`falsifier`) and the day it is read (`scoreBy`). When
 * that day arrives, or the study that backs it is re-run, the claim is scored:
 *
 *   pass         the day came, the falsifier did not land: the claim held.
 *   fail         the day came and the falsifier landed: the claim did not hold.
 *   pending      not due yet, or due and nothing has decided it yet (a forward test the event lane
 *                has not registered, or has not scored).
 *   untestable   nothing here can check it; it carries no size and is never counted as pending.
 *
 * WHAT A SCORE IS NOT. A pass is one claim surviving one falsifier on one tape. It is not an edge,
 * not a size, and not a reason to widen anything: the proposal a pass implies (`claim-proposals.ts`)
 * says so in its own words. A score is recorded, never acted on; no order comes from it and no
 * pair's live settings change. Paper only, educational.
 *
 * HOW A CLAIM IS READ. Free-text falsifiers cannot be parsed honestly, so a claim names its own
 * mechanical check as data (`check`) where one exists, and only then: the study re-run, a stated
 * band or level on a symbol's closes, or the forward test an event lane registered for it. A claim
 * with no check is scored by recording the reading, not by guessing it from the sentence.
 */

export type ClaimOutcome = "pass" | "fail" | "pending" | "untestable";
export const CLAIM_OUTCOMES: readonly ClaimOutcome[] = ["pass", "fail", "pending", "untestable"];

/**
 * The mechanical reading of a claim's falsifier, where there is one.
 *  - `rerun`: the claim's study, re-run on data from `scoreBy` on, decides. It backs the claim
 *    (pass), cuts against it (fail), or splits (pending: neither side).
 *  - `closes-within`: the lowest close from `from` to `to`, both inclusive, must land inside
 *    [low, high]; outside is the falsifier landing.
 *  - `closes-reach`: some close after `after` and up to `by` must reach `level`; none is the
 *    falsifier landing.
 *  - `forward-tests`: the forward tests an event lane registered and scored decide (below).
 */
export type FalsifierCheck =
  | { readonly kind: "rerun" }
  | {
      readonly kind: "closes-within";
      readonly symbol: string;
      readonly from: string;
      readonly to: string;
      readonly low: number;
      readonly high: number;
    }
  | {
      readonly kind: "closes-reach";
      readonly symbol: string;
      readonly after: string;
      readonly by: string;
      readonly level: number;
    }
  | { readonly kind: "forward-tests"; readonly tests: readonly ForwardLink[] };

/**
 * A FORWARD TEST THAT SCORES A CLAIM (#5482 criterion 6, slice 5's deferral). A conviction may not
 * write an event's forward-test rows; it proposes them, and the event lane registers one citing the
 * proposal's token (`scripts/conviction-proposals.mjs`) and later scores it. The link names that row
 * and says what each of its verdicts means for THIS claim, read against the claim's own falsifier,
 * because the two are not always the same sentence: a test's prediction can be the claim's falsifier
 * (a passing test fails the claim), and a test can be one of several readings the falsifier needs
 * (a killed test leaves the claim pending). Void, unscoreable and open tests decide nothing.
 */
export interface ForwardLink {
  /** The event whose fragment holds the row: `docs/research/forward-tests/<event>.md`. */
  readonly event: string;
  /** The row's own id (`FT-…`), or the proposal token its registration cites (`ai-dip-2026-10/P6`). */
  readonly ref: string;
  /** What the claim scores when the test passes, and when it is killed. */
  readonly onPass: LinkOutcome;
  readonly onKill: LinkOutcome;
}

type LinkOutcome = "pass" | "fail" | "pending";

/** A forward test's verdict as its lane recorded it (`scripts/research-scorecard.mjs` → verdictOf). */
export type ForwardVerdict = "pass" | "kill" | "void" | "unscoreable" | "open" | "unread";

/** The row a link resolves to, as the scoring run read it from the event's fragment. */
export interface ForwardRow {
  readonly id: string;
  readonly verdict: ForwardVerdict;
}

/** A proposal token: `<conviction-slug>/P<n>`. */
const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const PROPOSAL_TOKEN = /^[a-z0-9]+(?:-[a-z0-9]+)*\/P\d+$/;

export interface ClaimScore {
  readonly outcome: ClaimOutcome;
  /** What was read and what it showed, in one sentence a member can check. */
  readonly basis: string;
  /** `YYYY-MM-DD`: the day the claim is due. */
  readonly dueOn?: string;
  /** `YYYY-MM-DD`: the day a pass or fail was recorded. */
  readonly scoredOn?: string;
}

export interface TapeBar {
  readonly date: string;
  readonly close: number;
}

export interface ScoreContext {
  /** `YYYY-MM-DD`: the day the scoring runs. */
  readonly today: string;
  /** A symbol's daily closes, oldest first, or nothing when the tape cannot be read. */
  readonly tape?: (symbol: string) => readonly TapeBar[] | undefined;
  /** The forward-test row a link names, or nothing when the lane has not registered it. */
  readonly forwardTest?: (link: ForwardLink) => ForwardRow | undefined;
}

const pending = (basis: string, dueOn?: string): ClaimScore => ({
  outcome: "pending",
  basis,
  ...(dueOn === undefined ? {} : { dueOn }),
});

const decided = (
  outcome: "pass" | "fail",
  basis: string,
  dueOn: string,
  today: string,
): ClaimScore => ({ outcome, basis, dueOn, scoredOn: today });

function scoreRerun(claim: ConvictionClaim, dueOn: string, today: string): ClaimScore {
  const study = claim.study;
  if (study?.disposition !== "studied" || study.dataDate < dueOn) {
    return pending(
      `Due ${dueOn}; the study has not been re-run on data from that day (npm run research:claims).`,
      dueOn,
    );
  }
  const { reading } = study.verdict;
  const read = `The ${study.instrument} re-run on ${study.dataDate} reads ${reading}`;
  if (reading === "mixed") return pending(`${read}: neither side, so no score.`, dueOn);
  return decided(
    reading === "supports" ? "pass" : "fail",
    `${read}: ${study.verdict.call}`,
    dueOn,
    today,
  );
}

/** The window's bars, or the reason the tape cannot decide it yet. */
function windowOf(
  tape: readonly TapeBar[] | undefined,
  symbol: string,
  through: string,
  keep: (bar: TapeBar) => boolean,
): { readonly bars: readonly TapeBar[] } | { readonly wait: string } {
  const last = tape?.at(-1)?.date;
  if (last === undefined) return { wait: `No ${symbol} price history to read.` };
  if (last < through) {
    return { wait: `The ${symbol} tape ends ${last}; the window runs to ${through}.` };
  }
  return { bars: (tape ?? []).filter(keep) };
}

function scoreWithin(
  check: Extract<FalsifierCheck, { kind: "closes-within" }>,
  dueOn: string,
  ctx: ScoreContext,
): ClaimScore {
  const w = windowOf(
    ctx.tape?.(check.symbol),
    check.symbol,
    check.to,
    (b) => b.date >= check.from && b.date <= check.to,
  );
  if ("wait" in w || w.bars.length === 0) {
    return pending("wait" in w ? w.wait : `No ${check.symbol} closes in the window.`, dueOn);
  }
  const low = w.bars.reduce((a, b) => (b.close < a.close ? b : a));
  const band = `${money(check.low)} to ${money(check.high)}`;
  const read = `${check.symbol}'s lowest close ${check.from} to ${check.to} was ${money(low.close)} on ${low.date}`;
  const inside = low.close >= check.low && low.close <= check.high;
  return inside
    ? decided("pass", `${read}, inside ${band}.`, dueOn, ctx.today)
    : decided("fail", `${read}, outside ${band}.`, dueOn, ctx.today);
}

function scoreReach(
  check: Extract<FalsifierCheck, { kind: "closes-reach" }>,
  dueOn: string,
  ctx: ScoreContext,
): ClaimScore {
  const w = windowOf(
    ctx.tape?.(check.symbol),
    check.symbol,
    check.by,
    (b) => b.date > check.after && b.date <= check.by,
  );
  if ("wait" in w) return pending(w.wait, dueOn);
  const hit = w.bars.find((b) => b.close >= check.level);
  return hit
    ? decided(
        "pass",
        `${check.symbol} closed at ${money(hit.close)} on ${hit.date}, at or above ${money(check.level)}.`,
        dueOn,
        ctx.today,
      )
    : decided(
        "fail",
        `No ${check.symbol} close from ${check.after} to ${check.by} reached ${money(check.level)}.`,
        dueOn,
        ctx.today,
      );
}

/** One link's reading: what its row says, and what that means for the claim. */
function readLink(
  link: ForwardLink,
  ctx: ScoreContext,
): { readonly outcome: LinkOutcome; readonly says: string } {
  if (ctx.forwardTest === undefined) {
    return { outcome: "pending", says: `${link.ref}: this pass read no forward tests.` };
  }
  const row = ctx.forwardTest(link);
  if (row === undefined) {
    return {
      outcome: "pending",
      says: `${link.ref} is not registered in ${link.event}'s forward tests yet.`,
    };
  }
  const name = row.id === link.ref ? row.id : `${row.id} (registered from ${link.ref})`;
  if (row.verdict !== "pass" && row.verdict !== "kill") {
    return { outcome: "pending", says: `${name} reads ${row.verdict}.` };
  }
  const outcome = row.verdict === "pass" ? link.onPass : link.onKill;
  const means =
    outcome === "pass"
      ? "this claim held"
      : outcome === "fail"
        ? "this claim's falsifier landed"
        : "that alone does not decide this claim";
  return {
    outcome,
    says: `${name} ${row.verdict === "pass" ? "passed" : "was killed"}: ${means}.`,
  };
}

/** Any link that fails the claim fails it; it passes only when every link passes it. */
function scoreForward(
  check: Extract<FalsifierCheck, { kind: "forward-tests" }>,
  dueOn: string,
  ctx: ScoreContext,
): ClaimScore {
  const reads = check.tests.map((link) => readLink(link, ctx));
  const says = (outcome?: LinkOutcome): string =>
    reads
      .filter((r) => outcome === undefined || r.outcome === outcome)
      .map((r) => r.says)
      .join(" ");
  if (reads.some((r) => r.outcome === "fail")) {
    return decided("fail", says("fail"), dueOn, ctx.today);
  }
  if (reads.length > 0 && reads.every((r) => r.outcome === "pass")) {
    return decided("pass", says(), dueOn, ctx.today);
  }
  return pending(`Due ${dueOn}. ${says()}`, dueOn);
}

/**
 * The claim's score as of `ctx.today`. Pure: the tape arrives through the context, so a hit, a
 * miss, a day not yet due and a study that flips on its re-run are each specced without a network.
 */
export function scoreClaim(claim: ConvictionClaim, ctx: ScoreContext): ClaimScore {
  if (claim.bucket === "untestable") {
    return { outcome: "untestable", basis: "Nothing here can check it. Size zero." };
  }
  const dueOn = claim.scoreBy;
  if (dueOn === undefined) return pending("No day is set to score it.");
  if (ctx.today < dueOn) return pending(`Not due: scored on ${dueOn}.`, dueOn);
  const { check } = claim;
  if (check === undefined) {
    return pending(
      `Due ${dueOn}; no reading recorded yet. It names no check this pass can read.`,
      dueOn,
    );
  }
  switch (check.kind) {
    case "rerun":
      return scoreRerun(claim, dueOn, ctx.today);
    case "closes-within":
      return scoreWithin(check, dueOn, ctx);
    case "closes-reach":
      return scoreReach(check, dueOn, ctx);
    case "forward-tests":
      return scoreForward(check, dueOn, ctx);
  }
}

/** The claim's label in its call sheet ("2a"), else its 1-based position. */
export const claimLabel = (statement: string, position: number): string =>
  statement.match(/^(\d+[a-z]?)\./)?.[1] ?? String(position);

/** A claim's outcome as the record holds it: a scored claim keeps its score; one never scored is
 *  pending, or untestable when nothing can check it. */
export function outcomeOf(claim: ConvictionClaim): ClaimOutcome {
  if (claim.score) return claim.score.outcome;
  return claim.bucket === "untestable" ? "untestable" : "pending";
}

export interface Scorecard {
  readonly pass: number;
  readonly fail: number;
  readonly pending: number;
  readonly untestable: number;
}

/** The counts a pair row shows: "3 pass / 1 fail / 3 pending". */
export function scorecardOf(claims: readonly ConvictionClaim[]): Scorecard {
  const count = (o: ClaimOutcome): number => claims.filter((c) => outcomeOf(c) === o).length;
  return {
    pass: count("pass"),
    fail: count("fail"),
    pending: count("pending"),
    untestable: count("untestable"),
  };
}

// ---------------------------------------------------------------------------------------------
// The scores ledger: written by `npm run research:claims`, attached to the record like a study.

export interface ScoreLedgerEntry {
  readonly statement: string;
  readonly score: ClaimScore;
}
export type ScoreLedger = Readonly<Record<string, readonly ScoreLedgerEntry[]>>;

/** Every rule a stored score breaks, in words; empty means it may be attached. */
export function scoreProblems(score: ClaimScore): readonly string[] {
  const problems: string[] = [];
  if (!CLAIM_OUTCOMES.includes(score.outcome)) problems.push("outcome is not graded");
  if (blank(score.basis)) problems.push("basis is empty");
  if (score.dueOn !== undefined && !isCalendarDay(score.dueOn)) {
    problems.push("dueOn is not a calendar day");
  }
  const settled = score.outcome === "pass" || score.outcome === "fail";
  if (settled && !(score.scoredOn !== undefined && isCalendarDay(score.scoredOn))) {
    problems.push("a pass or fail records the day it was scored");
  }
  if (!settled && score.scoredOn !== undefined) {
    problems.push("only a pass or fail carries a scored-on day");
  }
  return problems;
}

/**
 * The claims with their recorded scores attached. A score attaches only while the claim still says
 * exactly what it said when it was scored, and only when it passes `scoreProblems`; a stale or
 * broken one is dropped, never served. A claim with no entry keeps no score.
 */
export function withScores<T extends { readonly claims: readonly ConvictionClaim[] }>(
  conviction: T,
  entries: readonly ScoreLedgerEntry[],
): T {
  const byStatement = new Map(entries.map((e) => [e.statement, e.score]));
  return {
    ...conviction,
    claims: conviction.claims.map((claim) => {
      const score = byStatement.get(claim.statement);
      return score && scoreProblems(score).length === 0 ? { ...claim, score } : claim;
    }),
  };
}

/** The ledger entry for every claim of a conviction, scored as of `ctx.today`. */
export function scoreAll(
  claims: readonly ConvictionClaim[],
  ctx: ScoreContext,
): readonly ScoreLedgerEntry[] {
  return claims.map((claim) => ({ statement: claim.statement, score: scoreClaim(claim, ctx) }));
}

/** Every rule a forward-test check's links break, in words. */
function forwardProblems(tests: readonly ForwardLink[]): string[] {
  const problems: string[] = [];
  if (tests.length === 0) problems.push("check names no forward test");
  for (const link of tests) {
    if (!SLUG.test(link.event)) problems.push(`${link.ref}: its event is not an event id`);
    if (!(link.ref.startsWith("FT-") || PROPOSAL_TOKEN.test(link.ref))) {
      problems.push(`${link.ref || "a forward test"} is neither an FT id nor a proposal token`);
    }
    if (link.onPass === link.onKill) {
      problems.push(`${link.ref} scores the claim the same whichever way it goes`);
    }
  }
  return problems;
}

/** Every rule a claim's check breaks, in words. */
export function checkProblems(check: FalsifierCheck, scoreBy: string | undefined): string[] {
  const problems: string[] = [];
  if (scoreBy === undefined) problems.push("a check needs a scoreBy day");
  if (check.kind === "rerun") return problems;
  if (check.kind === "forward-tests") return [...problems, ...forwardProblems(check.tests)];
  if (blank(check.symbol)) problems.push("check names no symbol");
  const days = check.kind === "closes-within" ? [check.from, check.to] : [check.after, check.by];
  if (!days.every(isCalendarDay)) problems.push("check window is not calendar days");
  else if (days[0] !== undefined && days[1] !== undefined && days[1] <= days[0]) {
    problems.push("check window ends before it starts");
  }
  if (check.kind === "closes-within" && !(check.low < check.high)) {
    problems.push("check band must run low to high");
  }
  return problems;
}
