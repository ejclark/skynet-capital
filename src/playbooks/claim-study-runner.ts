import {
  type ClaimPlan,
  contextSymbolOf,
  judgeClaim,
  knownSymbols,
  planClaim,
  runKeyOf,
  type StudyLedgerEntry,
} from "./claim-studies.js";
import type { ClaimInstrument, StudiedClaim } from "./claim-study.js";
import type { Conviction, ConvictionClaim } from "./conviction-record.js";

/**
 * RUNNING A CONVICTION'S CLAIMS THROUGH THE RESEARCH BUDGET (#5482 slice 3). The orchestration is
 * pure: the instruments and the data-date read arrive as `RunnerDeps`, so what runs, what is skipped
 * and what is refused is specced without a network, a clock or a child process.
 *
 * Three guarantees, each a spec:
 *
 *  - ONCE. A claim with a verdict for the same instrument, symbol and DATA DATE is not re-run. The
 *    study only re-runs when the data it could see has moved on, so asking twice costs nothing.
 *  - BOUNDED. A run is one instrument on one symbol, and claims that read the same one share it (the
 *    swing study answers the floor, the recovery and the pre-print put in a single run). The runs
 *    are charged against `cap`, the number of research runs one pass may start: the research
 *    lane's dial (`research-dispatch-budget.json` at normal, `work-mode.json` at the other
 *    positions). Past it the rest are DEFERRED, in claim order, and picked up on a later pass; a
 *    cap of zero (halt) starts nothing. Stating a conviction never starts unbounded research.
 *  - NOTHING INVENTED. An instrument that fails, or whose output a judge cannot read, leaves the
 *    claim unstudied (its earlier study, if any, stays). A failed run still counts against the cap.
 *
 * Offers and untestable labels cost no run: they are pure functions of the claim.
 */

export interface StudyRunRequest {
  readonly instrument: ClaimInstrument;
  readonly symbol: string;
  readonly dataDate: string;
}

export interface StudyRunOutput {
  /** What the instrument produced; each judge knows its own shape. */
  readonly output: unknown;
  /** The data's own timestamp when it has one (an option chain's quote time). */
  readonly dataAsOf?: string;
}

export interface RunnerDeps {
  /** The last session the symbol's cached tape holds. Cheap: a cache read. */
  readonly dataDate: (symbol: string) => Promise<string>;
  /** Run one instrument on one symbol. The expensive step the cap counts. */
  readonly execute: (request: StudyRunRequest) => Promise<StudyRunOutput>;
}

export type RunOutcome = "ran" | "fresh" | "deferred" | "failed" | "planned";

export interface RunReport {
  readonly instrument: ClaimInstrument;
  readonly symbol: string;
  readonly dataDate: string | null;
  /** 1-based claim numbers (their position in the record) this run answers. */
  readonly claims: readonly number[];
  readonly outcome: RunOutcome;
  readonly error?: string;
}

export interface RunnerResult {
  /** One entry per claim that has a study, in claim order: what to write to the ledger. */
  readonly entries: readonly StudyLedgerEntry[];
  readonly runs: readonly RunReport[];
  readonly budget: { readonly cap: number; readonly used: number; readonly deferred: number };
}

export interface RunnerOptions {
  /** The most research runs this pass may start. Zero starts none. */
  readonly cap: number;
  readonly universe?: ReadonlySet<string>;
  readonly contextSymbol?: string;
  /** Plan only: runs that would start are reported `planned` (and charged to the cap), none execute. */
  readonly dry?: boolean;
}

type StudyPlan = Extract<ClaimPlan, { kind: "study" }>;

interface Group {
  readonly instrument: ClaimInstrument;
  readonly symbol: string;
  readonly members: {
    readonly index: number;
    readonly claim: ConvictionClaim;
    readonly plan: StudyPlan;
  }[];
}

type Member = Group["members"][number];

/** True when the claim already holds a verdict from this instrument on this symbol for this day. */
function isFresh(claim: ConvictionClaim, plan: StudyPlan, dataDate: string): boolean {
  const s = claim.study;
  return (
    s?.disposition === "studied" &&
    s.instrument === plan.instrument &&
    s.symbol === plan.symbol &&
    s.dataDate === dataDate
  );
}

const message = (e: unknown): string => (e instanceof Error ? e.message : String(e));

const reportOf = (
  group: Group,
  dataDate: string | null,
  outcome: RunOutcome,
  error?: string,
): RunReport => ({
  instrument: group.instrument,
  symbol: group.symbol,
  dataDate,
  claims: group.members.map((m) => m.index + 1),
  outcome,
  ...(error === undefined ? {} : { error }),
});

/** Claims that read the same instrument on the same symbol share one run, in claim order. */
function groupByRun(conviction: Conviction, plans: readonly ClaimPlan[]): Group[] {
  const groups = new Map<string, Group>();
  plans.forEach((plan, index) => {
    if (plan.kind !== "study") return;
    const key = runKeyOf(plan);
    const group = groups.get(key) ?? {
      instrument: plan.instrument,
      symbol: plan.symbol,
      members: [],
    };
    group.members.push({ index, claim: conviction.claims[index] as ConvictionClaim, plan });
    groups.set(key, group);
  });
  return [...groups.values()];
}

/** Run the group's instrument once and judge every stale claim it answers. */
async function executeGroup(
  group: Group,
  stale: readonly Member[],
  dataDate: string,
  deps: RunnerDeps,
): Promise<{ report: RunReport; studied: Map<number, StudiedClaim> }> {
  const studied = new Map<number, StudiedClaim>();
  try {
    const { output, dataAsOf } = await deps.execute({
      instrument: group.instrument,
      symbol: group.symbol,
      dataDate,
    });
    const unread: number[] = [];
    for (const m of stale) {
      const verdict = judgeClaim(m.plan, m.claim, output);
      if (!verdict) {
        unread.push(m.index + 1);
        continue;
      }
      studied.set(m.index, {
        disposition: "studied",
        instrument: m.plan.instrument,
        measures: m.plan.measures,
        symbol: m.plan.symbol,
        dataDate,
        ...(dataAsOf ? { dataAsOf } : {}),
        verdict,
      });
    }
    const error =
      unread.length === 0 ? undefined : `output not readable for claim ${unread.join(", ")}`;
    return { report: reportOf(group, dataDate, error ? "failed" : "ran", error), studied };
  } catch (e) {
    return { report: reportOf(group, dataDate, "failed", message(e)), studied };
  }
}

/**
 * One entry per claim that has a study, in claim order. A new verdict wins; a study claim otherwise
 * keeps what it had IF that is still a study by the same instrument on the same symbol (a stale or
 * deferred one stays visible, dated by its own data date); offers and untestable labels are the
 * plan's.
 */
function entriesFor(
  conviction: Conviction,
  plans: readonly ClaimPlan[],
  studied: ReadonlyMap<number, StudiedClaim>,
): StudyLedgerEntry[] {
  const entries: StudyLedgerEntry[] = [];
  plans.forEach((plan, index) => {
    const claim = conviction.claims[index] as ConvictionClaim;
    if (plan.kind !== "study") {
      entries.push({ statement: claim.statement, study: plan.study });
      return;
    }
    const had = claim.study;
    const kept =
      had?.disposition === "studied" &&
      had.instrument === plan.instrument &&
      had.symbol === plan.symbol
        ? had
        : undefined;
    const study = studied.get(index) ?? kept;
    if (study) entries.push({ statement: claim.statement, study });
  });
  return entries;
}

export async function runClaimStudies(
  conviction: Conviction,
  deps: RunnerDeps,
  options: RunnerOptions,
): Promise<RunnerResult> {
  if (!Number.isInteger(options.cap) || options.cap < 0) {
    throw new Error(
      `claim studies: the research cap must be a whole number of runs, got ${options.cap}`,
    );
  }
  const plans = conviction.claims.map((claim) =>
    planClaim(claim, {
      universe: options.universe ?? knownSymbols(),
      contextSymbol: options.contextSymbol ?? contextSymbolOf(conviction),
    }),
  );

  const studied = new Map<number, StudiedClaim>();
  const runs: RunReport[] = [];
  let used = 0;
  let deferred = 0;

  for (const group of groupByRun(conviction, plans)) {
    let dataDate: string;
    try {
      dataDate = await deps.dataDate(group.symbol);
    } catch (e) {
      runs.push(reportOf(group, null, "failed", message(e)));
      continue;
    }
    const stale = group.members.filter((m) => !isFresh(m.claim, m.plan, dataDate));
    if (stale.length === 0) {
      runs.push(reportOf(group, dataDate, "fresh"));
    } else if (used >= options.cap) {
      deferred += 1;
      runs.push(reportOf(group, dataDate, "deferred"));
    } else if (options.dry) {
      used += 1;
      runs.push(reportOf(group, dataDate, "planned"));
    } else {
      used += 1;
      const done = await executeGroup(group, stale, dataDate, deps);
      runs.push(done.report);
      for (const [index, study] of done.studied) studied.set(index, study);
    }
  }

  return {
    entries: entriesFor(conviction, plans, studied),
    runs,
    budget: { cap: options.cap, used, deferred },
  };
}
