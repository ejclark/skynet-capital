import { fixedPct } from "../domain/percent.js";
import type { ClaimVerdict, StudyConfidence, StudyReading } from "./claim-study.js";
import type { ConvictionClaim } from "./conviction-record.js";

/**
 * READING AN INSTRUMENT'S OUTPUT AS A VERDICT ON ONE CLAIM (#5482 slice 3). Each judge takes the
 * instrument's raw output (the object `premiumFit` returns, the `--json` file `cycle-phase.mjs`
 * writes, the text `earnings-cycle.mjs` prints) and says how it bears on the claim it was mapped to.
 * A judge returns `null` when the output is not the shape it expects: a verdict is never invented
 * from a half-read instrument, so a drifted output leaves the claim unstudied rather than wrong.
 *
 * Three rules hold for every judge:
 *  - The call is the data's reading of the claim, in a line. It names no size and places no order;
 *    a conviction only narrows a playbook, and the playbook picks its own size (criteria 3 and 4).
 *  - Confidence is `low` or `medium`, never `high`: the instruments overlap their windows, so a
 *    dozen independent episodes cannot earn it (premium-fit's own rule, applied to all three).
 *    `medium` needs a clear reading AND at least 30 independent units; everything else is `low`.
 *  - The falsifier is the CLAIM's, dated, carried onto the verdict: the tape adjudicates, not the
 *    study. No judge reads past the instrument's data date (no look-ahead: each uses closes up to
 *    the day it was run and nothing after).
 */

type Obj = Record<string, unknown>;
const obj = (v: unknown): Obj | null =>
  typeof v === "object" && v !== null && !Array.isArray(v) ? (v as Obj) : null;
const finiteNumberOrNull = (v: unknown): number | null =>
  typeof v === "number" && Number.isFinite(v) ? v : null;

/** The independent units a medium grade needs: clusters pooled, episodes own-history. */
export const MEDIUM_UNITS = 30;

const signedPct = (x: number, digits = 0): string =>
  `${x >= 0 ? "+" : "-"}${fixedPct(Math.abs(x), digits)}`;
const usdNoCommas = (x: number): string => `$${x.toFixed(2)}`;

const confidenceOf = (reading: StudyReading, units: number | null): StudyConfidence =>
  reading !== "mixed" && units !== null && units >= MEDIUM_UNITS ? "medium" : "low";

function verdict(
  claim: ConvictionClaim,
  v: {
    reading: StudyReading;
    call: string;
    confidence: StudyConfidence;
    why: string;
    numbers: Record<string, number | string>;
  },
): ClaimVerdict {
  return {
    ...v,
    falsifier: claim.falsifier,
    ...(claim.scoreBy === undefined ? {} : { scoreBy: claim.scoreBy }),
  };
}

// ---------- premium-fit: is the premium actually rich? ----------

/**
 * "Premiums are rich": the fit test's own verdict. Implied vol for the next 30 days against the
 * distribution of what the name then realized over 30 days. `fits` backs the claim, `thin` splits
 * it, and `stand aside` cuts against it, split into fair (implied at or above the median outcome
 * but paying nothing over the mean) and cheap (implied under most outcomes).
 */
export function judgePremiumRichness(claim: ConvictionClaim, output: unknown): ClaimVerdict | null {
  const o = obj(output);
  const fit = obj(o?.fit);
  const rank = finiteNumberOrNull(fit?.rank);
  const gap = finiteNumberOrNull(fit?.gap);
  const iv30 = finiteNumberOrNull(o?.iv30);
  const fitVerdict = fit?.verdict;
  if (!(o && fit) || rank === null || gap === null || iv30 === null) return null;
  if (fitVerdict !== "fits" && fitVerdict !== "thin" && fitVerdict !== "stand aside") return null;
  const symbol = typeof o.symbol === "string" ? o.symbol : "the name";
  const reading: StudyReading =
    fitVerdict === "fits" ? "supports" : fitVerdict === "thin" ? "mixed" : "against";
  const where = `implied ${fixedPct(iv30)} sits at the ${ordinal(Math.round(rank * 100))} pct of ${symbol}'s own next-30-day outcomes, ${(gap * 100).toFixed(1)} vol pts over the mean`;
  return verdict(claim, {
    reading,
    call: premiumCall(reading, rank, where),
    confidence: fit.confidence === "medium" ? "medium" : "low",
    why: "premium-fit: today's 30-day implied against what the name then realized over 30 days, one year of its own tape.",
    numbers: {
      iv30,
      percentRank: rank,
      volPointsOverMean: gap * 100,
      instrumentVerdict: fitVerdict,
      ...wheelRungOdds(o.ladder),
    },
  });
}

const ordinal = (n: number): string => {
  const tens = n % 100;
  if (tens >= 11 && tens <= 13) return `${n}th`;
  return `${n}${["th", "st", "nd", "rd"][n % 10] ?? "th"}`;
};

function premiumCall(reading: StudyReading, rank: number, where: string): string {
  if (reading === "supports") return `Rich enough to sell: ${where}.`;
  if (reading === "mixed") return `Thin, not rich: ${where}.`;
  return rank >= 0.5
    ? `Stand aside, the premium is fair, not rich: ${where}.`
    : `Stand aside, the premium is cheap: ${where}.`;
}

/** The wheel rung's priced and historical assignment odds, when the ladder has that rung. */
function wheelRungOdds(ladder: unknown): Record<string, number> {
  for (const rung of Array.isArray(ladder) ? ladder : []) {
    const r = obj(rung);
    const priced = finiteNumberOrNull(r?.pricedAssignment);
    const historical = finiteNumberOrNull(r?.historicalAssignment);
    if (r?.rung === WHEEL_DELTA && priced !== null && historical !== null) {
      return { d20PricedAssignment: priced, d20HistoricalAssignment: historical };
    }
  }
  return {};
}

// ---------- cycle-phase: where is the name in its swing, and what did the same weather lead to? ----------

interface CycleReading {
  readonly close: number;
  readonly date: string;
  readonly putExpiry: string | null;
  readonly headline: Obj | null;
}

function cycleReading(output: unknown): CycleReading | null {
  const first = Array.isArray(output) ? output[0] : output;
  const today = obj(obj(first)?.today);
  const close = finiteNumberOrNull(today?.close);
  if (!today || close === null || typeof today.date !== "string") return null;
  return {
    close,
    date: today.date,
    putExpiry: typeof today.putExpiry === "string" ? today.putExpiry : null,
    headline: obj(obj(first)?.headline),
  };
}

const unitsOf = (h: Obj): number | null =>
  finiteNumberOrNull(h.sample === "own" ? h.episodes : h.clusters);

const noSample = (claim: ConvictionClaim): ClaimVerdict =>
  verdict(claim, {
    reading: "mixed",
    call: "No call: no sample reaches 8 independent episodes in today's weather, so every band is anecdote.",
    confidence: "low",
    why: "cycle-phase: the headline needs at least 8 independent units at some level; none does.",
    numbers: {},
  });

/** The band a sample row prints, or null if any of its quantiles is missing. */
function quantiles(v: unknown): { p25: number; p50: number; p75: number } | null {
  const b = obj(v);
  const [p25, p50, p75] = [
    finiteNumberOrNull(b?.p25),
    finiteNumberOrNull(b?.p50),
    finiteNumberOrNull(b?.p75),
  ];
  return p25 === null || p50 === null || p75 === null ? null : { p25, p50, p75 };
}

/**
 * "More pullback first": the further drawdown after the same weather. Backs the claim when the
 * median like-weather episode fell at least 5% more, cuts against it under 2%, splits between.
 */
export function judgeFloor(claim: ConvictionClaim, output: unknown): ClaimVerdict | null {
  const c = cycleReading(output);
  if (!c) return null;
  const h = c.headline;
  if (!h) return noSample(claim);
  const further = quantiles(h.further);
  const scaled = quantiles(h.furtherScaled);
  const units = unitsOf(h);
  const toLow = Array.isArray(h.toLow) ? finiteNumberOrNull(h.toLow[2]) : null;
  if (!(further && scaled) || units === null || toLow === null) return null;
  const reading: StudyReading =
    further.p50 <= -0.05 ? "supports" : further.p50 > -0.02 ? "against" : "mixed";
  const lead =
    reading === "supports"
      ? "More pullback first"
      : reading === "against"
        ? "The low may already be in"
        : "Some more pullback";
  return verdict(claim, {
    reading,
    call: `${lead}: the median like-weather episode fell a further ${fixedPct(-further.p50)} (about ${usdNoCommas(c.close * (1 + further.p50))}), ${fixedPct(-scaled.p50)} vol-scaled (about ${usdNoCommas(c.close * (1 + scaled.p50))}); the low came about ${toLow} sessions in.`,
    confidence: confidenceOf(reading, units),
    why: `cycle-phase on ${c.date}: ${units} independent ${h.sample === "own" ? "episodes" : "clusters"} (${h.sample} history, ${h.level}); closes, not intraday lows.`,
    numbers: {
      closeAtStudy: c.close,
      furtherP25: further.p25,
      furtherP50: further.p50,
      furtherP75: further.p75,
      floorAtMedian: c.close * (1 + further.p50),
      floorAtMedianScaled: c.close * (1 + scaled.p50),
      sessionsToLow: toLow,
      independentUnits: units,
      sample: String(h.sample),
      level: String(h.level),
    },
  });
}

/**
 * "Back above today's price in 3 to 6 months is the base case": the sessions until a close at or
 * above the entry, after the low. Backs the claim when at least half the like-weather episodes were
 * back within 63 sessions; splits when the median recovery is still inside 126; cuts against it
 * when the median episode had not recovered by then.
 */
export function judgeRecovery(claim: ConvictionClaim, output: unknown): ClaimVerdict | null {
  const c = cycleReading(output);
  if (!c) return null;
  const h = c.headline;
  if (!h) return noSample(claim);
  const within63 = finiteNumberOrNull(h.entryIn63);
  const oldHigh = finiteNumberOrNull(h.highIn126);
  const units = unitsOf(h);
  const medianBack = Array.isArray(h.backToEntry) ? h.backToEntry[2] : undefined;
  if (within63 === null || oldHigh === null || units === null || medianBack === undefined) {
    return null;
  }
  // A censored recovery (not back within the horizon) is printed as ">126", never a number.
  const medianSessions = finiteNumberOrNull(medianBack);
  const reading: StudyReading =
    within63 >= 0.5 ? "supports" : medianSessions !== null ? "mixed" : "against";
  const lead =
    reading === "supports"
      ? "Back to entry is the base case"
      : reading === "mixed"
        ? "Back to entry is slower than the claim"
        : "Back to entry is not the base case";
  return verdict(claim, {
    reading,
    call: `${lead}: ${fixedPct(within63)} of like-weather episodes closed back above ${usdNoCommas(c.close)} within 63 sessions (median ${medianSessions ?? String(medianBack)}), and ${fixedPct(oldHigh)} regained the old high within 126.`,
    confidence: confidenceOf(reading, units),
    why: `cycle-phase on ${c.date}: ${units} independent ${h.sample === "own" ? "episodes" : "clusters"} (${h.sample} history, ${h.level}); a recovery past 126 sessions counts as not recovered.`,
    numbers: {
      closeAtStudy: c.close,
      backToEntryWithin63: within63,
      medianSessionsBackToEntry: medianSessions ?? String(medianBack),
      oldHighWithin126: oldHigh,
      independentUnits: units,
      sample: String(h.sample),
      level: String(h.level),
    },
  });
}

/** The wheel's target rung: the delta a pre-print put is judged at. */
export const WHEEL_DELTA = 0.2;
/** Points of assignment odds the market must overpay (or underpay) by before the call leans. */
export const FAIR_BAND = 0.05;

/**
 * "The pre-print put is worth selling": the odds the market charges for (the put's delta) against
 * how often the like-weather episodes finished under that strike at the last expiry before the
 * print. Raw and vol-scaled history are both read; the put is rich only if it beats BOTH by
 * `FAIR_BAND`, cheap only if it loses to both, and fair when the two disagree or sit inside it.
 */
export function judgePrePrintPut(claim: ConvictionClaim, output: unknown): ClaimVerdict | null {
  const c = cycleReading(output);
  if (!c) return null;
  const h = c.headline;
  if (!h) return noSample(claim);
  const units = unitsOf(h);
  const rung = (Array.isArray(h.rungs) ? h.rungs : [])
    .map(obj)
    .find((r) => r !== null && r.delta === WHEEL_DELTA);
  const raw = finiteNumberOrNull(rung?.raw);
  const scaled = finiteNumberOrNull(rung?.scaled);
  const strike = finiteNumberOrNull(rung?.strike);
  if (!rung || raw === null || scaled === null || strike === null || units === null) return null;
  const priced = WHEEL_DELTA;
  const worst = Math.max(raw, scaled);
  const best = Math.min(raw, scaled);
  const reading: StudyReading =
    priced - worst >= FAIR_BAND ? "supports" : priced - best <= -FAIR_BAND ? "against" : "mixed";
  const lead =
    reading === "supports"
      ? "Worth selling"
      : reading === "against"
        ? "Underpaid"
        : "Fair, not rich";
  const history =
    fixedPct(raw) === fixedPct(scaled)
      ? fixedPct(raw)
      : `${fixedPct(best)} to ${fixedPct(worst)} (raw and vol-scaled)`;
  return verdict(claim, {
    reading,
    call: `${lead}: the ${usdNoCommas(strike)} put${c.putExpiry ? ` expiring ${c.putExpiry}` : ""} is priced at ${fixedPct(priced)} odds of assignment; like-weather episodes finished under that strike ${history}.`,
    confidence: confidenceOf(reading, units),
    why: `cycle-phase on ${c.date}: the close at the last expiry before the print, ${units} independent ${h.sample === "own" ? "episodes" : "clusters"} (${h.sample} history, ${h.level}); priced odds are the put's delta.`,
    numbers: {
      strike,
      pricedAssignment: priced,
      historicalAssignmentRaw: raw,
      historicalAssignmentScaled: scaled,
      independentUnits: units,
      ...(c.putExpiry ? { expiry: c.putExpiry } : {}),
    },
  });
}

// ---------- earnings-cycle: what does the stock do around its prints? ----------

/** The modern-era row of one RUN-UP table, parsed from the instrument's printed text. */
export interface RunUpRow {
  readonly n: number;
  readonly win: number;
  readonly mean: number;
  readonly excess: number;
}

const ERA_ROW = "2023-2026";

/**
 * Pull the modern-era row of the `[RUN-UP] close D-<window> -> close D` table out of
 * `earnings-cycle.mjs`'s printed report. That script prints text only; this reads exactly one row
 * and returns `null` if the table, the row or any column is missing, so a format change leaves the
 * claim unstudied rather than mis-read.
 */
export function parseRunUpRow(report: string, window = 20): RunUpRow | null {
  const lines = report.split("\n");
  const at = lines.findIndex((l) => l.startsWith(`[RUN-UP] close D-${window} -> close D `));
  if (at === -1) return null;
  for (const line of lines.slice(at + 1)) {
    if (line.trim() === "") return null;
    const cells = line.trim().split(/\s+/);
    if (cells[0] !== ERA_ROW) continue;
    const [n, mean, , win, , , excess] = cells.slice(1).map(Number);
    if (
      [n, mean, win, excess].some((x) => x === undefined || !Number.isFinite(x)) ||
      cells.length !== 8
    ) {
      return null;
    }
    return { n: n as number, mean: mean as number, win: win as number, excess: excess as number };
  }
  return null;
}

/**
 * "Runs up into its print": the 20-session run-up (close D-20 to the close of the print day), the
 * window the house's pre-print playbook trades. Backs the claim when at least 80% of the modern
 * era's prints ran up AND the mean beat the same-length return from windows touching no print;
 * cuts against it when under half did or the excess is negative; splits between. Fewer than 10
 * prints is `mixed` whatever they show.
 */
export function judgeRunUp(
  claim: ConvictionClaim,
  output: unknown,
  symbol: string,
): ClaimVerdict | null {
  const row = typeof output === "string" ? parseRunUpRow(output) : null;
  if (!row) return null;
  const enough = row.n >= 10;
  const reading: StudyReading = !enough
    ? "mixed"
    : row.win >= 80 && row.excess > 0
      ? "supports"
      : row.win < 50 || row.excess < 0
        ? "against"
        : "mixed";
  const wins = Math.round((row.win / 100) * row.n);
  const lead =
    reading === "supports"
      ? "Runs up into its print"
      : reading === "against"
        ? "Does not reliably run up"
        : enough
          ? "Run-up is not clean"
          : "Too few prints to call";
  return verdict(claim, {
    reading,
    call: `${lead}: ${symbol}'s close rose from D-20 to print day before ${wins} of its last ${row.n} prints (${ERA_ROW}), ${signedPct(row.excess / 100, 1)} over a print-free stretch of the same length.`,
    confidence: reading !== "mixed" && enough ? "medium" : "low",
    why: `earnings-cycle: ${ERA_ROW} era, SEC 8-K Item 2.02 dates, excess over windows that touch no print.`,
    numbers: {
      prints: row.n,
      sharePositive: row.win / 100,
      meanReturn: row.mean / 100,
      excessOverBaseline: row.excess / 100,
    },
  });
}
