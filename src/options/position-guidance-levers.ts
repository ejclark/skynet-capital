import { headlineRow, type LadderDrop, type LadderResult } from "./position-guidance-ladder.js";
import {
  actionable,
  capConfidence,
  optionsCutoff,
  pct,
  richnessCap,
  usd,
} from "./position-guidance-rules.js";
import type {
  Confidence,
  DteMark,
  GuidanceInputs,
  GuidanceReason,
  LeverCall,
  Richness,
} from "./position-guidance-types.js";

/**
 * THE THREE LEVER CALLS — shares, covered calls, cash-secured puts (#3729). Each call is graded,
 * explained in at most three rule-cited lines, and carries a dated falsifier plus an "until" (the
 * date the next decision falls due and what we are waiting to see). The house rule applies to every
 * lever: a grade below medium is a stand-aside, never a small bet. PURE: no I/O, no clock.
 */

export interface LeverContext {
  readonly input: GuidanceInputs;
  readonly today: string;
  readonly strip: readonly DteMark[];
  readonly richness: Richness;
}

export const why = (rule: GuidanceReason["rule"], text: string): GuidanceReason => ({ rule, text });

export function windowText(input: GuidanceInputs): string {
  const e = input.earnings;
  if (!e) return "no print on the calendar";
  const span = e.start === e.end ? e.start : `${e.start}–${e.end}`;
  return `${span}${e.status === "estimate" ? " (estimate)" : ""}`;
}

export function lever(call: Omit<LeverCall, "atOpen">): LeverCall {
  return { ...call, reasons: call.reasons.slice(0, 3), atOpen: false };
}

const DROP_TEXT: Readonly<Record<LadderDrop, string>> = {
  quote: "untradable quotes (bid under $0.10, spread over 15% of mid, or no IV)",
  otm: "at or in the money",
  basis: "below your cost basis",
  delta: "delta over 0.30",
  own: "above your happy-to-own price",
  cash: "not covered by your cash",
};

function dropWhy(result: LadderResult): GuidanceReason {
  const top = (Object.entries(result.dropped) as [LadderDrop, number][])
    .filter(([, n]) => n > 0)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 2)
    .map(([k, n]) => `${n} ${DROP_TEXT[k]}`);
  return why(
    "PRICE-AT-BID",
    `No strike survives the rules: ${top.join("; ") || "no quotes in band"}.`,
  );
}

function bandWhy(ctx: LeverContext): GuidanceReason | undefined {
  const inBand = ctx.strip.filter((m) => m.verdict === "in");
  const last = inBand.at(-1);
  if (!last) return undefined;
  const span = `Expiries ${inBand[0]?.dte}–${last.dte} DTE (through ${last.expiration})`;
  if (!ctx.input.earnings) {
    return why("DTE-FLOOR", `${span} — no print on the calendar; under 7 DTE is excluded.`);
  }
  const evidence = ctx.input.printEvidence ?? "an earnings gap can outrun what options price";
  const cutoff = optionsCutoff(ctx.input.earnings, ctx.input.stake.goal);
  if (cutoff?.kind === "decision") {
    return why(
      "DTE-PRINT",
      `${span} only: nothing may still be open on ${cutoff.date}, when you decide whether to hold through the earnings window ${windowText(ctx.input)}.`,
    );
  }
  return why(
    "DTE-PRINT",
    `${span} only: later ones span the earnings window ${windowText(ctx.input)} — ${evidence}.`,
  );
}

function richWhy(r: Richness): GuidanceReason {
  if (r.basis === "iv-rank")
    return why("RICHNESS", `IV rank ${r.ivRank?.toFixed(0)} — premium is ${r.verdict}.`);
  if (r.basis === "iv-vs-realized" && r.atmIv !== undefined && r.realizedVol !== undefined) {
    return why(
      "RICHNESS",
      `Implied ${pct(r.atmIv)} vs realized ${pct(r.realizedVol)} (×${(r.atmIv / r.realizedVol).toFixed(2)}) — premium is ${r.verdict} for how much it moves.`,
    );
  }
  return why("RICHNESS", "No read on whether premium is rich — no IV history and no realized vol.");
}

function noBand(ctx: LeverContext, which: LeverCall["lever"]): LeverCall {
  const end = ctx.input.earnings?.end;
  return lever({
    lever: which,
    call: "WAIT",
    confidence: "medium",
    reasons: [
      why(
        "DTE-PRINT",
        `Every listed expiry is under 7 days, runs past your hold-or-sell date, or spans the earnings window ${windowText(ctx.input)}.`,
      ),
    ],
    provesWrong: "A new weekly lists inside the clean band.",
    ...(end ? { until: { date: end, why: "the print passes and a clean cycle opens" } } : {}),
  });
}

export function coveredCallCall(ctx: LeverContext, ladder: LadderResult): LeverCall {
  const { stake } = ctx.input;
  const shares = stake.shares ?? 0;
  if (shares < 100) {
    return lever({
      lever: "covered-calls",
      call: "NOT AVAILABLE",
      confidence: "none",
      reasons: [
        why("COVERAGE", `Covered calls need 100 shares per contract — you hold ${shares}.`),
      ],
      provesWrong: "—",
    });
  }
  const band = bandWhy(ctx);
  if (!band) return noBand(ctx, "covered-calls");
  const best = headlineRow(ladder.rows);
  const last = ctx.strip.filter((m) => m.verdict === "in").at(-1)?.expiration ?? "";
  const falsifier =
    ctx.input.earnings?.status === "estimate"
      ? `IR confirms the print on or before ${last}, or implied falls below realized before you open.`
      : "Implied falls below realized before you open.";
  if (!best) {
    return lever({
      lever: "covered-calls",
      call: "WAIT",
      confidence: "medium",
      reasons: [dropWhy(ladder), band],
      provesWrong: falsifier,
    });
  }
  if (ctx.richness.verdict === "cheap") {
    return lever({
      lever: "covered-calls",
      call: "WAIT",
      confidence: "medium",
      reasons: [richWhy(ctx.richness), band],
      provesWrong: "Implied rises to 1.2× realized or better.",
    });
  }
  const grade: Confidence = capConfidence("high", richnessCap(ctx.richness));
  const bestWhy = why(
    "PRICE-AT-BID",
    `Best: ${usd(best.strike)} call ${best.expiration} — bid ${usd(best.bid)}, ${pct(best.annualizedYield)} annualized, ${pct(best.probAssigned)} model odds of assignment.`,
  );
  const goalWhy =
    stake.goal === "keep-shares"
      ? [why("GOAL", "Assignment sells your shares — favour the lowest-odds rows.")]
      : ladder.dropped.basis > 0
        ? [
            why(
              "STRIKE-BASIS",
              `No strike below your ${usd(stake.costBasis ?? 0)} basis — assignment would lock in a loss.`,
            ),
          ]
        : [];
  return lever({
    lever: "covered-calls",
    call: actionable(grade) ? "WRITE" : "WAIT",
    confidence: grade,
    reasons: [bestWhy, band, ...goalWhy, richWhy(ctx.richness)],
    provesWrong: falsifier,
    until: ctx.input.earnings
      ? {
          date: last,
          why: "last usable expiry — stop selling calls until the earnings report passes",
        }
      : { date: last, why: "longest in-band expiry — refresh the guidance before rolling" },
  });
}

export function cashSecuredPutCall(ctx: LeverContext, ladder: LadderResult): LeverCall {
  const { stake, ledger, earnings } = ctx.input;
  if (!(stake.cash && stake.cash > 0)) {
    return lever({
      lever: "cash-secured-puts",
      call: "NOT AVAILABLE",
      confidence: "none",
      reasons: [why("COVERAGE", "No cash entered — a put must be fully cash-secured.")],
      provesWrong: "—",
    });
  }
  const band = bandWhy(ctx);
  if (!band) return noBand(ctx, "cash-secured-puts");
  const after = earnings
    ? {
        until: {
          date: earnings.end,
          why: "the print resolves the biggest known unknown — refresh the guidance after it",
        },
      }
    : {};
  const buyWhy = ledger?.buySignal
    ? why("LEDGER", `Research licenses a buy (${ledger.buyConfidence}).`)
    : why("LEDGER", "A put you'd be assigned on is a buy — and no research licenses a buy here.");
  const falsifier = ledger?.buySignal
    ? `The research ledger withdraws its buy signal (its kill switch fires)${earnings ? ` before ${earnings.start}` : ""}.`
    : `The research ledger registers a buy signal${earnings ? ` before ${earnings.start}` : ""}.`;
  const best = headlineRow(ladder.rows);
  if (!best) {
    return lever({
      lever: "cash-secured-puts",
      call: "WAIT",
      confidence: "medium",
      reasons: [dropWhy(ladder), buyWhy],
      provesWrong: falsifier,
      ...after,
    });
  }
  let grade: Confidence = capConfidence("high", richnessCap(ctx.richness));
  if (ctx.richness.verdict !== "rich") grade = capConfidence(grade, "medium");
  grade = capConfidence(grade, ledger?.buySignal ? ledger.buyConfidence : "low");
  const held = stake.shares ?? 0;
  const concentration =
    held > 0
      ? [
          why(
            "CONCENTRATION",
            `Assignment adds ${best.contracts * 100} shares to the ${held} you hold — the same exposure, larger.`,
          ),
        ]
      : [];
  if (stake.happyToOwnAt === undefined) grade = capConfidence(grade, "medium");
  const bestWhy = why(
    "PRICE-AT-BID",
    `Best: ${usd(best.strike)} put ${best.expiration} — bid ${usd(best.bid)}, ${pct(best.annualizedYield)} annualized, you'd own at ${usd(best.effectiveEntry ?? best.strike)}.`,
  );
  const writing = actionable(grade);
  return lever({
    lever: "cash-secured-puts",
    call: writing ? "WRITE" : "WAIT",
    confidence: grade,
    reasons: writing
      ? [bestWhy, buyWhy, ...concentration, band]
      : [buyWhy, ...concentration, bestWhy],
    provesWrong: falsifier,
    ...(writing
      ? {
          until: {
            date: best.expiration,
            why: "expiry — decide then whether to roll or take the shares",
          },
        }
      : after),
  });
}
