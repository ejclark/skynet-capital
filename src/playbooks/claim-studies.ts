import {
  type ClaimInstrument,
  type ClaimStudy,
  type ClaimVerdict,
  studyProblems,
} from "./claim-study.js";
import {
  judgeFloor,
  judgePremiumRichness,
  judgePrePrintPut,
  judgeRecovery,
  judgeRunUp,
} from "./claim-verdicts.js";
import type { Conviction, ConvictionClaim } from "./conviction-record.js";
import { findPair, type Pair, pairTable } from "./pair-table.js";

/**
 * CLAIMS → STUDIES (#5482 slice 3, criterion 2): WHEN a claim names a symbol and a study exists for
 * that claim, run the study once and attach its verdict; ELSE offer to register a forward test; a
 * claim with neither is labelled untestable and carries no size.
 *
 * This file is the pure half: it decides, from the claim's own words, which existing research
 * instrument (if any) measures what the claim ASSERTS. A claim maps only when an instrument measures
 * that assertion. Naming a symbol is not enough, and neither is sharing a topic: "hold through
 * earnings" shares CRWV and a print with the print-moves table but asserts that options UNDER-priced
 * the move, which no instrument can read because no implied-move history is recorded. Such a claim
 * goes down the forward-test path rather than borrowing a number that measures something else.
 *
 * The mapping reads the claim's STATEMENT (the sentence the member owns), never its evidence: the
 * evidence is what a person already cited for it, and mapping on that would let the citation pick
 * the test. When more than one assertion matches, or none, the claim does not map.
 *
 * Running is the other half (`claim-study-runner.ts`, through the research budget). Nothing here
 * reads a file, a network or a clock.
 */

/** What an instrument is asked about a claim. One instrument can answer several. */
export type ClaimReads = "premium-richness" | "pre-print-put" | "floor" | "recovery" | "run-up";

type Judge = (claim: ConvictionClaim, output: unknown, symbol: string) => ClaimVerdict | null;

interface Assertion {
  readonly reads: ClaimReads;
  readonly instrument: ClaimInstrument;
  /** What the instrument measures, in the words a member would use. */
  readonly measures: string;
  /** The claim sentences it answers. Each is checked against an example and a near miss in the spec. */
  readonly pattern: RegExp;
  readonly judge: Judge;
}

/**
 * The assertions a house instrument measures today. Adding one means an instrument that answers it,
 * a judge that reads its output, and a spec with the claim that maps and the near miss that must not.
 */
export const ASSERTIONS: readonly Assertion[] = [
  {
    reads: "premium-richness",
    instrument: "premium-fit",
    measures:
      "whether the option premium is rich: 30-day implied volatility against what the name then realized over 30 days",
    pattern: /\bpremiums?\b[^.:]*\b(rich|expensive|overpriced?|fat)\b|\boverprice[sd]?\b/i,
    judge: judgePremiumRichness,
  },
  {
    reads: "pre-print-put",
    instrument: "cycle-phase",
    measures:
      "whether a put sold now for the last expiry before the print is paid more than the odds it finished under its strike in the same weather",
    pattern: /\bsell(?:ing)?\b[^.:]*\bputs?\b[^.:]*\bbefore\b[^.:]*\b(?:prints?|earnings)\b/i,
    judge: judgePrePrintPut,
  },
  {
    reads: "floor",
    instrument: "cycle-phase",
    measures:
      "how much further a name fell after past sessions in today's weather, and when the low came",
    pattern:
      /\bfloor\b|\bmore (?:pullback|downside)\b|\bfurther (?:pullback|decline|drop|drawdown|downside)\b/i,
    judge: judgeFloor,
  },
  {
    reads: "recovery",
    instrument: "cycle-phase",
    measures:
      "how many sessions until a close back above the entry price, after past sessions in today's weather",
    pattern: /\bback (?:above|to) (?:today's|the entry|its entry)\b|\bhow long the drop lasts\b/i,
    judge: judgeRecovery,
  },
  {
    reads: "run-up",
    instrument: "earnings-cycle",
    measures:
      "the 20-session run-up before each print, net of what the stock does in windows that touch no print",
    pattern:
      /\bruns?[ -]?ups?\b[^.:]*\b(?:prints?|earnings)\b|\b(?:rises?|rallies|rally|climbs?)\b[^.:]*\b(?:into|ahead of|before)\b[^.:]*\b(?:prints?|earnings)\b/i,
    judge: (claim, output, symbol) => judgeRunUp(claim, output, symbol),
  },
];

/** The symbols a claim may name: the swing study's basket and every pair the playbook table holds. */
export function knownSymbols(pairs: readonly Pair[] = pairTable()): ReadonlySet<string> {
  return new Set([...SWING_BASKET, ...pairs.flatMap((p) => p.symbols)]);
}
const SWING_BASKET = ["NVDA", "CRWV", "NBIS", "MU", "AVGO", "AMD"];

const TICKER = /\b[A-Z]{2,5}\b/g;

function tickersIn(text: string, universe: ReadonlySet<string>): string[] {
  return [...new Set((text.match(TICKER) ?? []).filter((t) => universe.has(t)))];
}

/**
 * The symbol a claim is about. Its own words first (statement, then evidence, then falsifier), and
 * only when exactly one known ticker appears in the first of those that names any; a claim naming
 * two names asserts about a basket, which the per-name instruments cannot read. Failing that, the
 * symbol its conviction's steered pairs share, when they share exactly one.
 */
export function claimSymbol(
  claim: ConvictionClaim,
  universe: ReadonlySet<string>,
  contextSymbol?: string,
): string | null {
  for (const text of [claim.statement, claim.evidence, claim.falsifier]) {
    const found = tickersIn(text, universe);
    if (found.length > 0) return found.length === 1 ? (found[0] as string) : null;
  }
  return contextSymbol ?? null;
}

/** The one symbol a conviction's steered pairs share, or undefined when they span several. */
export function contextSymbolOf(
  conviction: Conviction,
  lookup: (id: string) => Pair | undefined = findPair,
): string | undefined {
  const symbols = new Set(conviction.steers.flatMap((id) => lookup(id)?.symbols ?? []));
  return symbols.size === 1 ? [...symbols][0] : undefined;
}

export type ClaimPlan =
  | {
      readonly kind: "study";
      readonly reads: ClaimReads;
      readonly instrument: ClaimInstrument;
      readonly measures: string;
      readonly symbol: string;
    }
  | { readonly kind: "offer"; readonly study: ClaimStudy }
  | { readonly kind: "untestable"; readonly study: ClaimStudy };

export interface PlanContext {
  readonly universe: ReadonlySet<string>;
  readonly contextSymbol?: string;
}

/** The assertion this claim makes that an instrument measures, if exactly one does. */
export function assertionOf(claim: ConvictionClaim): Assertion | null {
  const hits = ASSERTIONS.filter((a) => a.pattern.test(claim.statement));
  return hits.length === 1 ? (hits[0] as Assertion) : null;
}

/**
 * Where a claim goes: a study to run, an offer to register a forward test, or untestable.
 *
 *  1. An instrument measures its assertion AND it names a symbol  → study.
 *  2. The record marks it untestable                              → untestable (size zero).
 *  3. It has a day it can be scored on                            → offer to register a forward test.
 *  4. Otherwise                                                   → untestable (size zero).
 *
 * Rule 2 sits above rule 3 on purpose: a member who marked a claim untestable (a backlog figure with
 * no feed, a worldview) is not argued out of it by a date on its falsifier.
 */
export function planClaim(claim: ConvictionClaim, ctx: PlanContext): ClaimPlan {
  const assertion = assertionOf(claim);
  const symbol = assertion ? claimSymbol(claim, ctx.universe, ctx.contextSymbol) : null;
  if (assertion && symbol) {
    return {
      kind: "study",
      reads: assertion.reads,
      instrument: assertion.instrument,
      measures: assertion.measures,
      symbol,
    };
  }
  const why = assertion
    ? `${assertion.instrument} measures this, but the claim names no single symbol to run it on`
    : "no research instrument measures what this claim asserts";
  if (claim.bucket === "untestable") {
    return {
      kind: "untestable",
      study: {
        disposition: "untestable",
        size: 0,
        reason: `${why}, and the record marks it untestable here. Size zero. ${claim.evidence}`,
      },
    };
  }
  if (claim.scoreBy !== undefined) {
    return {
      kind: "offer",
      study: {
        disposition: "offer",
        size: 0,
        reason: `${why}; it can be scored on ${claim.scoreBy}, so the event lane may register a forward test. Size zero until it is scored.`,
        forwardTest: {
          hypothesis: claim.statement,
          falsifier: claim.falsifier,
          scoreBy: claim.scoreBy,
        },
      },
    };
  }
  return {
    kind: "untestable",
    study: {
      disposition: "untestable",
      size: 0,
      reason: `${why}, and it has no day to be scored on, so there is nothing to forward-test. Size zero.`,
    },
  };
}

/** The shared run behind a claim: claims on one instrument and symbol are answered by one run. */
export const runKeyOf = (plan: Extract<ClaimPlan, { kind: "study" }>): string =>
  `${plan.instrument}:${plan.symbol}`;

/** The verdict for a claim from its run's raw output, or null when the output is not readable. */
export function judgeClaim(
  plan: Extract<ClaimPlan, { kind: "study" }>,
  claim: ConvictionClaim,
  output: unknown,
): ClaimVerdict | null {
  const assertion = ASSERTIONS.find((a) => a.reads === plan.reads);
  return assertion ? assertion.judge(claim, output, plan.symbol) : null;
}

// ---------- the ledger: what the runner found, attached to the record ----------

export interface StudyLedgerEntry {
  /** The claim's statement. A study attaches only to the claim that still says exactly this. */
  readonly statement: string;
  readonly study: ClaimStudy;
}
export type StudyLedger = Readonly<Record<string, readonly StudyLedgerEntry[]>>;

/**
 * The conviction with its studies attached, claim by claim. An entry attaches only when its
 * statement still equals the claim's (a re-read of a claim is a new claim and must be studied
 * again), and only when it passes the call-sheet contract; a broken or stale entry is dropped, never
 * served. A claim with no entry keeps no study.
 */
export function withStudies(
  conviction: Conviction,
  entries: readonly StudyLedgerEntry[],
): Conviction {
  const byStatement = new Map(entries.map((e) => [e.statement, e.study]));
  return {
    ...conviction,
    claims: conviction.claims.map((claim) => {
      const study = byStatement.get(claim.statement);
      return study && studyProblems(study).length === 0 ? { ...claim, study } : claim;
    }),
  };
}
