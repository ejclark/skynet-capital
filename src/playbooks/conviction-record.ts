import {
  CONVICTION_ID,
  CONVICTION_ID_MAX,
  isCalendarDay,
} from "../subscriptions/subscription-state.js";
import type { ClaimStudy } from "./claim-study.js";
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
 * places an order. It narrows nothing yet either: narrowing a pair's bounds is slice 4.
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
}

export interface Conviction {
  /** Kebab-case, unique; what a subscription points at. */
  readonly id: string;
  /** Whose view it is, as members know them. */
  readonly owner: string;
  /** `YYYY-MM-DD`: the day the view was stated. */
  readonly statedOn: string;
  /** `YYYY-MM-DD`: the day every pair it steers is checked (#4469 criterion 12). */
  readonly checkOn: string;
  readonly claims: readonly ConvictionClaim[];
  /** The pair ids it steers. Each must be a ◆ conviction pair. */
  readonly steers: readonly string[];
  /** `docs/research/convictions/…` — the call sheet it was written from, when there is one. */
  readonly source?: string;
}

const DAY_IN_TEXT = /\d{4}-\d{2}-\d{2}/g;

const blank = (value: string): boolean => value.trim().length === 0;

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
  if (claim.bucket === "forward" && claim.scoreBy === undefined) {
    problems.push(`${at}: a forward test needs a scoreBy day`);
  }
  if (claim.scoreBy === undefined && !namesADay(claim.falsifier)) {
    problems.push(`${at}: the falsifier is not dated (name a day, or set scoreBy)`);
  }
  return problems;
}

function steerProblems(steers: readonly string[], lookup: (id: string) => Pair | undefined) {
  const problems: string[] = [];
  if (steers.length === 0) problems.push("steers no pair");
  if (new Set(steers).size !== steers.length) problems.push("steers a pair twice");
  for (const id of steers) {
    const pair = lookup(id);
    if (!pair) problems.push(`steers ${id}, which no pair row holds`);
    // A ✓ pair runs on its study; a conviction steering it would count the same result twice
    // (the doc's claim 5 and S1-NVDA). Such a claim cites the pair; it does not steer it.
    else if (pair.evidence.status !== "conviction") {
      problems.push(`steers ${id}, which is not a ◆ conviction pair (cite its study instead)`);
    }
  }
  return problems;
}

/**
 * Every rule a record breaks, in words; empty means it may be stored. A conviction needs at least
 * one claim (#5482 criterion 1), each tagged, bucketed, evidenced and falsifiable on a day; it is
 * checked after the day it was stated; and it steers at least one ◆ pair, each once.
 */
export function convictionProblems(
  conviction: Conviction,
  lookup: (id: string) => Pair | undefined = findPair,
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
  problems.push(...steerProblems(conviction.steers, lookup));
  return problems;
}
