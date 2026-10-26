import { type EarningsPrint, printSpan } from "../domain/earnings-calendar.js";
import { nextSession } from "../domain/market-calendar.js";
import type { PlaybookMode } from "../domain/types.js";
import { isCalendarDay } from "../subscriptions/subscription-state.js";
import type { ClaimStudy } from "./claim-study.js";
import { money } from "./format-money.js";

/**
 * STEERING: A CONVICTION NARROWS THE SETTINGS OF THE PAIRS IT STEERS (#5482 slice 4, criteria 3 and
 * 4). A conviction record carries, per steered pair, a list of narrowings written as data. This file
 * is the one narrow-only resolution they pass through, the same rule a subscription's play target
 * follows (`resolvePlayTarget`) and a pair's setting follows (`wheel`'s `minDte`, `putDelta`):
 * a value inside the playbook's bounds is kept, a value outside them is REFUSED WHOLE with the
 * reason, never clamped. Refusing whole means a half-applied conviction can never run: either every
 * narrowing it states for the pair holds, or none does.
 *
 * WHAT THE PLAYBOOK STILL OWNS (criterion 4). A narrowing is a fence, not a trigger. Nothing here
 * returns an order or an intent, and a playbook decides entry and exit timing exactly as before:
 * inside the fence it opens when its own window, delta and print rules say so, and a fence that
 * leaves nothing to open turns a sale into a stand-aside, never into a different sale.
 *
 * EXITS ARE NEVER NARROWED AWAY. A narrowing applies to what a playbook OPENS (a put sold, a call
 * bought). Closes, a covered call on assigned shares, the time and profit exits all run as before.
 *
 * THE KINDS, and the bound each can only tighten:
 *  - `dte`            days to expiry: the playbook's window, `min` up and `max` down.
 *  - `expiry-from`    no expiry before this day. The playbook has no such floor, so any day narrows.
 *  - `strike-ceiling` no strike above a price, or above a claim's floor band (the cycle-phase
 *                     study's median floor, read from the claim at the moment the playbook is built).
 *  - `quiet`          no new opens from the print's blackout until N sessions after the print.
 *  - `contracts`      a cap on contracts, never above the largest the playbook asks for in any mode.
 * Direction is not a kind: both steerable playbooks have one direction (up), so a narrowing could
 * only restate it, and a flip would be a widening.
 */

export type FloorOfClaim = { readonly floorOfClaim: string };

export type Narrowing =
  | { readonly kind: "dte"; readonly min?: number; readonly max?: number }
  | { readonly kind: "expiry-from"; readonly day: string }
  | { readonly kind: "strike-ceiling"; readonly ceiling: number | FloorOfClaim }
  | { readonly kind: "quiet"; readonly sessionsAfterPrint: number }
  | { readonly kind: "contracts"; readonly max: number };

export const NARROWING_KINDS = [
  "dte",
  "expiry-from",
  "strike-ceiling",
  "quiet",
  "contracts",
] as const;

/** One steered pair's narrowings, and the claims (by their number in the record) they come from. */
export interface PairNarrowings {
  /** A pair id the record steers. */
  readonly pair: string;
  /** Claim labels as the record numbers them ("1", "2a", "7"), for the reader; each must exist. */
  readonly fromClaims: readonly string[];
  readonly narrow: readonly Narrowing[];
}

/** What a playbook allows: the widest settings a narrowing may sit inside. */
export interface SteerBounds {
  /** Days to expiry it opens in. */
  readonly dte: { readonly min: number; readonly max: number };
  /** The most contracts it asks for in each mode. */
  readonly contracts: Readonly<Record<PlaybookMode, number>>;
}

/** Narrowings resolved against bounds: what a playbook is built with. Plain data, no behaviour. */
export interface Steering {
  readonly dte?: { readonly min: number; readonly max: number };
  readonly expiryFrom?: string;
  readonly strikeMax?: number;
  readonly quietSessionsAfterPrint?: number;
  readonly contractsMax?: number;
}

/** A playbook that a conviction may steer: its bounds, and how to rebuild it inside a steering. */
export interface Steerable<P> {
  readonly bounds: SteerBounds;
  readonly steer: (steering: Steering) => P;
}

export type SteeringResolution =
  | { readonly ok: true; readonly steering: Steering; readonly says: readonly string[] }
  | { readonly ok: false; readonly reason: string };

/** The part of a claim steering reads: its text, and the study the system attached. */
export interface ClaimRead {
  readonly statement: string;
  readonly study?: ClaimStudy;
}

const MAX_QUIET_SESSIONS = 60;
const refuse = (reason: string): SteeringResolution => ({ ok: false, reason });
const isCount = (n: number): boolean => Number.isInteger(n) && n >= 0;

/** The claim a label names ("7" is the claim whose statement opens "7. "), or undefined. */
export function claimByLabel<C extends ClaimRead>(
  claims: readonly C[],
  label: string,
): C | undefined {
  return claims.find((c) => c.statement.startsWith(`${label}. `));
}

type Floor = { readonly price: number } | { readonly missing: string };

/** The cycle-phase floor band's median a claim carries, or why it carries none. */
function floorOf(claims: readonly ClaimRead[], label: string): Floor {
  const claim = claimByLabel(claims, label);
  if (!claim) return { missing: `claim ${label} is not in this record` };
  const study = claim.study;
  if (study?.disposition !== "studied" || study.instrument !== "cycle-phase") {
    return { missing: `claim ${label} has no cycle-phase study attached` };
  }
  const price = study.verdict.numbers.floorAtMedian;
  return typeof price === "number" && price > 0
    ? { price }
    : { missing: `claim ${label}'s cycle-phase study states no floor band` };
}

interface Draft {
  steering: { -readonly [K in keyof Steering]: Steering[K] };
  says: string[];
}

type Step = string | undefined;

function applyDte(n: Extract<Narrowing, { kind: "dte" }>, bounds: SteerBounds, d: Draft): Step {
  const min = n.min ?? bounds.dte.min;
  const max = n.max ?? bounds.dte.max;
  if (n.min === undefined && n.max === undefined) return "a days-to-expiry narrowing names no days";
  if (![min, max].every(isCount) || min > max) {
    return `${min}-${max} days to expiry is not a window`;
  }
  if (min < bounds.dte.min || max > bounds.dte.max) {
    return `${min}-${max} days to expiry is wider than this playbook's ${bounds.dte.min}-${bounds.dte.max}`;
  }
  d.steering.dte = { min, max };
  d.says.push(`expiries ${min}-${max} days out`);
  return undefined;
}

function applyCeiling(
  n: Extract<Narrowing, { kind: "strike-ceiling" }>,
  claims: readonly ClaimRead[],
  strict: boolean,
  d: Draft,
): Step {
  if (typeof n.ceiling !== "number") {
    const floor = floorOf(claims, n.ceiling.floorOfClaim);
    if ("missing" in floor) {
      // A reference the record cannot be checked without is a refusal when a playbook is built; the
      // record itself is judged on what it states (the claim exists), not on a study still to run.
      const unwritten = claimByLabel(claims, n.ceiling.floorOfClaim) === undefined;
      return strict || unwritten
        ? `the strike ceiling cannot be read: ${floor.missing}`
        : undefined;
    }
    d.steering.strikeMax = floor.price;
    d.says.push(
      `strikes at or under ${money(floor.price)} (claim ${n.ceiling.floorOfClaim}'s floor band)`,
    );
    return undefined;
  }
  if (!(Number.isFinite(n.ceiling) && n.ceiling > 0)) {
    return `a strike ceiling of ${n.ceiling} is not a price`;
  }
  d.steering.strikeMax = n.ceiling;
  d.says.push(`strikes at or under ${money(n.ceiling)}`);
  return undefined;
}

function applyOne(
  n: Narrowing,
  bounds: SteerBounds,
  claims: readonly ClaimRead[],
  strict: boolean,
  d: Draft,
): Step {
  switch (n.kind) {
    case "dte":
      return applyDte(n, bounds, d);
    case "expiry-from":
      if (!isCalendarDay(n.day)) return `${n.day} is not a calendar day`;
      d.steering.expiryFrom = n.day;
      d.says.push(`expiries on or after ${n.day}`);
      return undefined;
    case "strike-ceiling":
      return applyCeiling(n, claims, strict, d);
    case "quiet":
      if (!isCount(n.sessionsAfterPrint) || n.sessionsAfterPrint > MAX_QUIET_SESSIONS) {
        return `${n.sessionsAfterPrint} sessions after the print is not a quiet period (0-${MAX_QUIET_SESSIONS})`;
      }
      d.steering.quietSessionsAfterPrint = n.sessionsAfterPrint;
      d.says.push(
        `no new opens from the print's blackout until ${n.sessionsAfterPrint} sessions after it`,
      );
      return undefined;
    case "contracts": {
      const widest = Math.max(...Object.values(bounds.contracts));
      if (!(Number.isInteger(n.max) && n.max >= 1)) return `${n.max} contracts is not a cap`;
      if (n.max > widest) {
        return `a cap of ${n.max} contracts is above this playbook's most, ${widest}`;
      }
      d.steering.contractsMax = n.max;
      d.says.push(`at most ${n.max} contracts`);
      return undefined;
    }
    default:
      return `unknown narrowing kind "${(n as { kind: string }).kind}"`;
  }
}

/**
 * The narrowings, resolved against the playbook's bounds, or the first reason one is refused (the
 * whole set with it). A kind may appear once. `strict` is the playbook-build reading: a strike
 * ceiling that points at a study not attached is refused, so a pair never runs on a fence it
 * cannot see. The record store reads it not strict, so a study re-run in flight cannot make the
 * record vanish and take its check date with it.
 */
export function resolveSteering(
  narrowings: readonly Narrowing[],
  bounds: SteerBounds,
  claims: readonly ClaimRead[],
  strict = true,
): SteeringResolution {
  const draft: Draft = { steering: {}, says: [] };
  const seen = new Set<string>();
  for (const n of narrowings) {
    if (seen.has(n.kind)) return refuse(`it narrows ${n.kind} twice`);
    seen.add(n.kind);
    const problem = applyOne(n, bounds, claims, strict, draft);
    if (problem) return refuse(problem);
  }
  return { ok: true, steering: draft.steering, says: draft.says };
}

/** Every rule a pair's narrowings break, in words. With no bounds only their shape is judged. */
export function narrowingProblems(
  entry: PairNarrowings,
  claims: readonly ClaimRead[],
  bounds?: SteerBounds,
): readonly string[] {
  const at = `narrowing of ${entry.pair}`;
  const problems: string[] = [];
  if (entry.narrow.length === 0) problems.push(`${at} states nothing`);
  for (const label of entry.fromClaims) {
    if (!claimByLabel(claims, label))
      problems.push(`${at} cites claim ${label}, which is not here`);
  }
  for (const n of entry.narrow) {
    if (!(NARROWING_KINDS as readonly string[]).includes(n.kind)) {
      problems.push(`${at}: unknown kind "${(n as { kind: string }).kind}"`);
    }
  }
  if (problems.length > 0) return problems;
  if (bounds) {
    const resolved = resolveSteering(entry.narrow, bounds, claims, false);
    if (!resolved.ok) problems.push(`${at}: ${resolved.reason}`);
  }
  return problems;
}

/**
 * Whether today sits in the quiet period of one of the symbol's prints: from the first day the print
 * could land (an estimate's whole window) through `sessionsAfter` sessions after the last. An
 * estimate is measured from the END of its window, so a print that lands early only lengthens the
 * quiet, and a confirmed date shortens it to exactly that date.
 */
export function inQuietPeriod(
  symbol: string,
  today: string,
  sessionsAfter: number,
  calendar: readonly EarningsPrint[],
): boolean {
  return calendar
    .filter((p) => p.symbol === symbol)
    .some((print) => {
      const span = printSpan(print);
      let until = span.end;
      for (let i = 0; i < sessionsAfter; i += 1) until = nextSession(until);
      return span.start <= today && today <= until;
    });
}

/** Whether an expiry sits inside a steering's days-to-expiry window and expiry floor. */
export function expiryInside(
  steering: Steering | undefined,
  expiration: string,
  dte: number,
): boolean {
  if (!steering) return true;
  if (steering.expiryFrom !== undefined && expiration < steering.expiryFrom) return false;
  return !(steering.dte && (dte < steering.dte.min || dte > steering.dte.max));
}
