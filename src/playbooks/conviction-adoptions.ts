import { isCalendarDay } from "../subscriptions/subscription-state.js";
import { claimLabel, outcomeOf } from "./claim-score.js";
import ledger from "./conviction-adoptions.json";
import type { Conviction } from "./conviction-record.js";
import {
  FENCE_CALLS,
  type FenceCall,
  fenceCall,
  PAIR_RULE_KINDS,
  type PairRule,
} from "./fence-studies.js";

/**
 * A SCORED CLAIM'S PROPOSAL, ADOPTED (#5482 criterion 6, its second half). The scoring pass writes
 * what a decided claim proposes for the pair it fences (`claim-proposals.ts`, a file in the scoring
 * PR, text only). Adopting one is this ledger: one line per proposal key ("view/claim/pair"),
 * written by `npm run research:refine -- <key>` on its own branch and opened as a HELD pull request,
 * so the change reaches a pair only through Eric's merge. Deleting the line undoes it.
 *
 * A FAILED CLAIM'S LINE. `stop-new-entries`, option 1 of a failed claim's proposal: the view
 * keeps steering the pair, and the pair opens nothing new under it; every exit still runs. It is the
 * narrower of the two ways out a fail offers (retiring the pair from the view is the other), and on
 * a ◆ pair, the only kind a record steers, both leave the pair exits-only. The hold rides the one
 * refusal path a pointed pair already has (`steeredBy` → exits-only), so the bots, the roll call and
 * the owner's row all say why with the same sentence.
 *
 * A PASSED CLAIM'S LINE (#6598 slice 3). `pair-rule`: a fence a passed claim backed becomes the
 * pair's own rule, for every subscription to the pair, pointed or not. Only a study whose call is
 * *adopt* can write one (`fence-studies.ts`), and only as a date-free `PairRule`; `steeredBy` reads
 * it through the same narrow-only resolver a view's narrowings pass, so a rule that would widen a
 * bound refuses the pair whole and it runs exits-only. No study says adopt today, so no line can.
 *
 * WHAT IT NEVER SAYS. Nothing here widens a bound, sizes a trade or places an order. Paper only, SIM.
 */

export const ADOPTED_CHANGES = ["stop-new-entries", "pair-rule"] as const;
export type AdoptedChange = (typeof ADOPTED_CHANGES)[number];

interface AdoptionBase {
  /** The day the adoption was written (its PR's merge makes it live). */
  readonly adoptedOn: string;
  /** The score's basis, copied for the reader of the ledger and the PR. */
  readonly basis: string;
}

export type Adoption =
  | (AdoptionBase & { readonly change: "stop-new-entries" })
  | (AdoptionBase & {
      readonly change: "pair-rule";
      /** The rules the study's *adopt* call states, one per fence kind. */
      readonly rules: readonly PairRule[];
    });

/** The outcome a claim must read for its line to stand: a hold rests on a fail, a rule on a pass. */
export const restsOn = (change: AdoptedChange): "fail" | "pass" =>
  change === "pair-rule" ? "pass" : "fail";

/** Adopted proposals by key: "ai-dip-2026-10/2a/CRWV-WHEEL". */
export type AdoptionLedger = Readonly<Record<string, Adoption>>;

export const ADOPTIONS = ledger as unknown as AdoptionLedger;

/** A proposal key's three parts, or undefined when it is not one. */
export function splitKey(
  key: string,
): { readonly conviction: string; readonly claim: string; readonly pair: string } | undefined {
  const parts = key.split("/");
  if (parts.length !== 3 || parts.some((p) => p === "")) return undefined;
  const [conviction = "", claim = "", pair = ""] = parts;
  return { conviction, claim, pair };
}

/** A pair a view holds shut by an adopted change: the claim that failed and the day it was adopted. */
export interface AdoptedHold {
  readonly claim: string;
  readonly adoptedOn: string;
}

export type HoldLookup = (convictionId: string, pairId: string) => AdoptedHold | undefined;

/** The hold a ledger puts on one view's pair, or undefined. A line naming any other change holds
 *  nothing (`adoptionProblems` keeps such a line out of the build). Read once into a map. */
export function holdIn(ledger: AdoptionLedger): HoldLookup {
  const holds = new Map<string, AdoptedHold>();
  for (const [key, adoption] of Object.entries(ledger)) {
    const parts = splitKey(key);
    if (!parts || adoption.change !== "stop-new-entries") continue;
    holds.set(`${parts.conviction}/${parts.pair}`, {
      claim: parts.claim,
      adoptedOn: adoption.adoptedOn,
    });
  }
  return (convictionId, pairId) => holds.get(`${convictionId}/${pairId}`);
}

/** The build's holds: the committed ledger. */
export const adoptedHold: HoldLookup = holdIn(ADOPTIONS);

export type RuleLookup = (pairId: string) => readonly PairRule[];

/** The rules a ledger makes a pair's own, one per kind (several passed claims can back one fence,
 *  and each writes the study's same rule; the first line, by key, stands). Read once into a map. */
export function rulesIn(ledger: AdoptionLedger): RuleLookup {
  const rules = new Map<string, Map<string, PairRule>>();
  for (const [key, adoption] of Object.entries(ledger)) {
    const parts = splitKey(key);
    if (!parts || adoption.change !== "pair-rule") continue;
    const byKind = rules.get(parts.pair) ?? new Map<string, PairRule>();
    for (const rule of adoption.rules) if (!byKind.has(rule.kind)) byKind.set(rule.kind, rule);
    rules.set(parts.pair, byKind);
  }
  return (pairId) => [...(rules.get(pairId)?.values() ?? [])];
}

/** The build's pair rules: the committed ledger. */
export const adoptedRules: RuleLookup = rulesIn(ADOPTIONS);

/** How every adopted hold's reason begins, so the owner's row can say it as its own sentence. */
export const ADOPTED_HOLD = "an adopted change holds it";

/**
 * Why a held pair opens nothing new, for the boot log, the roll call and the owner's row. Worded
 * as what happened (the claim failed, the change was adopted that day), so it stays true if a later
 * full pass re-reads the claim; `staleAdoptions` is what flags that case for a person.
 */
export const adoptedHoldReason = (record: Conviction, hold: AdoptedHold): string =>
  `${ADOPTED_HOLD} (${hold.adoptedOn}) after claim ${hold.claim} of "${record.title ?? record.id}" failed`;

/**
 * What is wrong with a ledger against the records it names: a key that is not view/claim/pair, a
 * view or claim the records do not hold, a pair the view does not steer, a change this build cannot
 * read, or a day that is not one. The shipped ledger must read clean (its spec). Whether the claim
 * still reads failed is `staleAdoptions`' question, not this one: scores move in lane PRs, and a
 * spec that read them would turn a scoring PR red (#6403).
 */
export function adoptionProblems(
  ledger: AdoptionLedger,
  convictions: readonly Conviction[],
  calls: readonly FenceCall[] = FENCE_CALLS,
): string[] {
  const problems: string[] = [];
  for (const [key, adoption] of Object.entries(ledger)) {
    const parts = splitKey(key);
    if (!parts) {
      problems.push(`${key}: not a view/claim/pair key`);
      continue;
    }
    const record = convictions.find((c) => c.id === parts.conviction);
    if (!record) problems.push(`${key}: no conviction "${parts.conviction}"`);
    else if (!claimOf(record, parts.claim)) {
      problems.push(`${key}: "${parts.conviction}" has no claim ${parts.claim}`);
    }
    if (record && !record.steers.includes(parts.pair)) {
      problems.push(`${key}: "${parts.conviction}" does not steer ${parts.pair}`);
    }
    if (!(ADOPTED_CHANGES as readonly string[]).includes(adoption.change)) {
      problems.push(`${key}: unknown change "${adoption.change}"`);
    }
    if (adoption.change === "pair-rule")
      problems.push(...ruleProblems(key, parts.pair, adoption, calls));
    if (!isCalendarDay(adoption.adoptedOn)) problems.push(`${key}: adoptedOn is not a day`);
  }
  return problems;
}

/** A rule line's rules must each be a date-free kind, and the very rule a study's *adopt* states. */
function ruleProblems(
  key: string,
  pair: string,
  adoption: Extract<Adoption, { change: "pair-rule" }>,
  calls: readonly FenceCall[],
): string[] {
  if (!Array.isArray(adoption.rules) || adoption.rules.length === 0) {
    return [`${key}: a pair rule states no rules`];
  }
  return adoption.rules.flatMap((rule) => {
    if (!(PAIR_RULE_KINDS as readonly string[]).includes(rule.kind)) {
      return [`${key}: "${rule.kind}" cannot be a pair's own rule`];
    }
    const call = fenceCall(pair, rule.kind, calls);
    if (call?.call !== "adopt") return [`${key}: no study's call adopts ${rule.kind} on ${pair}`];
    return JSON.stringify(call.rule) === JSON.stringify(rule)
      ? []
      : [`${key}: its ${rule.kind} rule is not the one \`${call.study}\` adopts`];
  });
}

/** A record's claim by its label ("2a"), the way the record numbers it. */
export const claimOf = (record: Conviction, label: string) =>
  record.claims.find((c, i) => claimLabel(c.statement, i + 1) === label);

/**
 * Adopted lines whose claim no longer reads the outcome the line rests on (`restsOn`: a full scoring
 * pass re-ran its study), with the outcome it reads now. The line stays until a person reads this
 * and removes it; `npm run research:refine` lists them.
 */
export function staleAdoptions(
  ledger: AdoptionLedger,
  convictions: readonly Conviction[],
): readonly { readonly key: string; readonly outcome: string }[] {
  return Object.entries(ledger).flatMap(([key, adoption]) => {
    const parts = splitKey(key);
    const record = convictions.find((c) => c.id === parts?.conviction);
    const claim = record && parts ? claimOf(record, parts.claim) : undefined;
    const outcome = claim ? outcomeOf(claim) : "missing";
    return outcome === restsOn(adoption.change) ? [] : [{ key, outcome }];
  });
}
