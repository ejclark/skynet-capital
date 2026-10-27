import {
  CONVICTION_ID,
  CONVICTION_ID_MAX,
  isCalendarDay,
} from "../subscriptions/subscription-state.js";
import { blank } from "./claim-blank.js";
import { type ClaimScore, checkProblems, type FalsifierCheck } from "./claim-score.js";
import type { ClaimStudy } from "./claim-study.js";
import { narrowingProblems, type PairNarrowings, type SteerBounds } from "./conviction-steering.js";
import { findPair, type Pair } from "./pair-table.js";

/**
 * A CONVICTION, AS ITS OWN RECORD (#5482 slice 2, shape B). Until now a conviction was one
 * sentence and a check date on one subscription (`SubscriptionConviction`, #4469). That could not
 * say which belief it rested on, could not be checked claim by claim, and could not steer more
 * than one pair, so one view (the AI dip) was copied onto every pair it touched and the copies
 * could drift. A record holds the view once: its owner, the day it was stated, the day it is
 * checked, the claims it rests on, and the pairs it steers. A subscription points at it by id
 * (`PlaybookSubscription.convictionId`); the record's check date then gates every pair it steers.
 *
 * EXPAND ONLY. `SubscriptionConviction` keeps working exactly as before; removing it is a later
 * slice (contract), once every pointer is in place. The format comes from the first instance,
 * `docs/research/convictions/ai-dip-2026-10.md`, and the rules below are what that doc taught it:
 * one falsifier per claim, a claim may cut against its owner, a claim that is already a playbook's
 * study steers nothing new.
 *
 * Paper only, members only (#5482 criterion 8): a record is read behind the invite gate and never
 * places an order. It may NARROW a steered pair's bounds (slice 4, `narrowings`, resolved by
 * `conviction-steering.ts`); a narrowing that would widen one is refused whole, and the playbook
 * still picks the timing.
 */

/** What the claim says the market gets wrong. */
export type ClaimTag = "missing" | "underrated" | "overrated";
export const CLAIM_TAGS: readonly ClaimTag[] = ["missing", "underrated", "overrated"];

/**
 * How the claim is checked: `tested` (a study already answers it, cited in `evidence`), `forward`
 * (a prediction scored on `scoreBy`), `untestable` (nothing here can check it; it carries no size).
 */
export type ClaimBucket = "tested" | "forward" | "untestable";
export const CLAIM_BUCKETS: readonly ClaimBucket[] = ["tested", "forward", "untestable"];

export interface ConvictionClaim {
  readonly tag: ClaimTag;
  /** The claim, in one sentence. */
  readonly statement: string;
  readonly bucket: ClaimBucket;
  /** The study, number or source it rests on. An untestable claim says why nothing here reads it. */
  readonly evidence: string;
  /** The one dated observation that proves it wrong. */
  readonly falsifier: string;
  /** `YYYY-MM-DD`: the day it is scored. Required on a forward test. */
  readonly scoreBy?: string;
  /**
   * What the system found when it looked at the claim (#5482 slice 3): a verdict from the matching
   * research instrument, an offer to register a forward test, or a label that nothing here can
   * check it. Attached from the studies ledger (`conviction-studies.json`), never typed by hand.
   */
  readonly study?: ClaimStudy;
  /**
   * How the falsifier is read mechanically, where it can be (#5482 slice 5): the study re-run, or a
   * band or level on a symbol's closes. A claim without one is scored by recording the reading.
   */
  readonly check?: FalsifierCheck;
  /**
   * Pass, fail or pending against the claim's own dated falsifier (#5482 slice 5), recorded by
   * `npm run research:claims` and attached from the scores ledger, never typed by hand. It records
   * how the claim fared; it sizes nothing and changes no pair's settings.
   */
  readonly score?: ClaimScore;
}

export interface Conviction {
  /** Kebab-case, unique; what a subscription points at. */
  readonly id: string;
  /** What members call the view ("AI-dip view"), shown beside the pairs it steers. */
  readonly title?: string;
  /** Whose view it is, as members know them. */
  readonly owner: string;
  /** `YYYY-MM-DD`: the day the view was stated. */
  readonly statedOn: string;
  /** `YYYY-MM-DD`: the day every pair it steers is checked (#4469 criterion 12). */
  readonly checkOn: string;
  readonly claims: readonly ConvictionClaim[];
  /** The pair ids it steers. Each must be a ◆ conviction pair, except on a view stated on its one
   *  pair (`scope`). */
  readonly steers: readonly string[];
  /**
   * What it narrows on the pairs it steers, as data (#5482 slice 4, criterion 3): per pair, a list
   * of narrowings (days to expiry, expiry floor, strike ceiling, quiet period, contract cap). Only
   * ever tightens a bound the playbook already has. A pair with no entry is steered for its check
   * date alone.
   */
  readonly narrowings?: readonly PairNarrowings[];
  /** `docs/research/convictions/…` — the call sheet it was written from, when there is one. */
  readonly source?: string;
  /**
   * The owner accepts being assigned the shares as an outcome, not a failure (Eric, 2026-10-18:
   * "Misjudging the timing and Owning stock is fine"). The record's check then judges its pairs on
   * net P/L alone — assigned shares marked at the last price — and skips a strategy's
   * assignment-count retire test (the wheel's 1 in 3), which would count that outcome against it.
   */
  readonly acceptsAssignment?: boolean;
  /**
   * `"pair"`: a view stated on the one pair it steers, by the subscribe or conviction form, in place
   * of the subscription's inline conviction (#5482 contract piece 3). It is that inline conviction
   * as a record: one claim (the owner's reason, scored on the check day), one pair, no narrowings,
   * and its strategy's retire test kept (no `acceptsAssignment`).
   * It is the one view that may steer a pair that is not ◆ — #4469 criterion 2 already lets an
   * owner take a stand-aside pair on their own labelled conviction, so this adds no power, and with
   * one claim and nothing narrowed there is no study to count twice (`pairScopeProblems`). Only the
   * server sets it; a member's draft can never carry it (`parseConvictionDraft` does not read it).
   */
  readonly scope?: "pair";
}

const DAY_IN_TEXT = /\d{4}-\d{2}-\d{2}/g;

/** True when the falsifier names a real calendar day in its own words. */
function namesADay(text: string): boolean {
  return (text.match(DAY_IN_TEXT) ?? []).some(isCalendarDay);
}

function claimProblems(claim: ConvictionClaim, n: number, statedOn: string): string[] {
  const at = `claim ${n}`;
  const problems: string[] = [];
  if (!CLAIM_TAGS.includes(claim.tag)) problems.push(`${at}: tag must be ${CLAIM_TAGS.join(", ")}`);
  if (!CLAIM_BUCKETS.includes(claim.bucket)) {
    problems.push(`${at}: bucket must be ${CLAIM_BUCKETS.join(", ")}`);
  }
  if (blank(claim.statement)) problems.push(`${at}: statement is empty`);
  if (blank(claim.evidence)) problems.push(`${at}: evidence is empty`);
  if (blank(claim.falsifier)) problems.push(`${at}: falsifier is empty`);
  if (claim.scoreBy !== undefined) {
    if (!isCalendarDay(claim.scoreBy)) problems.push(`${at}: scoreBy is not a calendar day`);
    else if (claim.scoreBy < statedOn) problems.push(`${at}: scored before it was stated`);
  }
  if (claim.check) {
    problems.push(...checkProblems(claim.check, claim.scoreBy).map((p) => `${at}: ${p}`));
  }
  if (claim.bucket === "forward" && claim.scoreBy === undefined) {
    problems.push(`${at}: a forward test needs a scoreBy day`);
  }
  if (claim.scoreBy === undefined && !namesADay(claim.falsifier)) {
    problems.push(`${at}: the falsifier is not dated (name a day, or set scoreBy)`);
  }
  return problems;
}

function steerProblems(
  steers: readonly string[],
  lookup: (id: string) => Pair | undefined,
  pairScoped: boolean,
) {
  const problems: string[] = [];
  if (steers.length === 0) problems.push("steers no pair");
  if (new Set(steers).size !== steers.length) problems.push("steers a pair twice");
  for (const id of steers) {
    const pair = lookup(id);
    if (!pair) problems.push(`steers ${id}, which no pair row holds`);
    // A ✓ pair runs on its study; a conviction steering it would count the same result twice
    // (the doc's claim 5 and S1-NVDA). Such a claim cites the pair; it does not steer it. A view
    // stated on its one pair is the exception: it is the owner's own day, not a second study.
    else if (!pairScoped && pair.evidence.status !== "conviction") {
      problems.push(`steers ${id}, which is not a ◆ conviction pair (cite its study instead)`);
    }
  }
  return problems;
}

/** The shape a view stated on its one pair must keep (`Conviction.scope`): exactly what the inline
 *  conviction it replaces could say — one reason, one pair, a day — and nothing that narrows or
 *  loosens its check. */
function pairScopeProblems(conviction: Conviction): readonly string[] {
  if (conviction.scope !== "pair") return [];
  const problems: string[] = [];
  if (conviction.claims.length > 1) problems.push("a view stated on a pair holds one claim");
  if (conviction.steers.length > 1) problems.push("a view stated on a pair steers only that pair");
  if ((conviction.narrowings?.length ?? 0) > 0) {
    problems.push("a view stated on a pair narrows nothing");
  }
  // Accepting assignment skips a strategy's retire test, which an inline conviction never could.
  if (conviction.acceptsAssignment) {
    problems.push("a view stated on a pair keeps its strategy's retire test");
  }
  return problems;
}

/** The rules one pair's narrowings break: the pair must be steered, narrowed once, and inside the
 *  playbook's bounds (judged when `boundsOf` knows them; the store always supplies them). */
function narrowedProblems(
  conviction: Conviction,
  entry: PairNarrowings,
  boundsOf: (pairId: string) => SteerBounds | undefined,
): readonly string[] {
  if (!conviction.steers.includes(entry.pair)) {
    return [`narrows ${entry.pair}, which it does not steer`];
  }
  if (conviction.narrowings?.filter((n) => n.pair === entry.pair).length !== 1) {
    return [`narrows ${entry.pair} in more than one entry`];
  }
  return narrowingProblems(entry, conviction.claims, boundsOf(entry.pair));
}

/**
 * Every rule a record breaks, in words; empty means it may be stored. A conviction needs at least
 * one claim (#5482 criterion 1), each tagged, bucketed, evidenced and falsifiable on a day; it is
 * checked after the day it was stated; and it steers at least one ◆ pair, each once — or, stated on
 * its one pair (`scope`), that pair whatever its row, on one claim and with nothing narrowed.
 */
export function convictionProblems(
  conviction: Conviction,
  lookup: (id: string) => Pair | undefined = findPair,
  boundsOf: (pairId: string) => SteerBounds | undefined = () => undefined,
): readonly string[] {
  const problems: string[] = [];
  if (!(CONVICTION_ID.test(conviction.id) && conviction.id.length <= CONVICTION_ID_MAX)) {
    problems.push("id must be kebab-case, 64 characters at most");
  }
  if (blank(conviction.owner)) problems.push("owner is empty");
  const statedOk = isCalendarDay(conviction.statedOn);
  if (!statedOk) problems.push("statedOn is not a calendar day");
  if (!isCalendarDay(conviction.checkOn)) problems.push("checkOn is not a calendar day");
  else if (statedOk && conviction.checkOn <= conviction.statedOn) {
    problems.push("checkOn must come after statedOn");
  }
  if (conviction.claims.length === 0) problems.push("a conviction needs at least one claim");
  conviction.claims.forEach((claim, i) => {
    problems.push(...claimProblems(claim, i + 1, conviction.statedOn));
  });
  problems.push(...steerProblems(conviction.steers, lookup, conviction.scope === "pair"));
  problems.push(...pairScopeProblems(conviction));
  problems.push(
    ...(conviction.narrowings?.flatMap((n) => narrowedProblems(conviction, n, boundsOf)) ?? []),
  );
  return problems;
}
