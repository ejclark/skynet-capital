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
  LadderRow,
  LeverCall,
  Richness,
} from "./position-guidance-types.js";

/**
 * THE OPTION LEVERS — covered calls and cash-secured puts (#3729). Each call is graded, explained in
 * at most three plain lines, and carries a "come back if" line plus an "until" (the date the next
 * decision falls due). A grade below medium is a stand-aside, never a small bet.
 *
 * THE COPY IS WRITTEN FOR SOMEONE NEW TO OPTIONS (#3729 persona review): money first ("you receive
 * $145 now"), both sides of every outcome ("you keep $X, but miss any rise above $95"), no jargon a
 * member would have to look up ("earnings report", not "print"; "days", not "DTE"), and annualized
 * yield only as a qualified aside — it is not what anyone earns. PURE: no I/O, no clock.
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
  if (!e) return "no earnings report on the calendar";
  const span = e.start === e.end ? e.start : `${e.start}–${e.end}`;
  return `${span}${e.status === "estimate" ? ", estimated" : ""}`;
}

export function lever(call: Omit<LeverCall, "atOpen">): LeverCall {
  return { ...call, reasons: call.reasons.slice(0, 3), atOpen: false };
}

const DROP_TEXT: Readonly<Record<LadderDrop, string>> = {
  quote:
    "prices too thin to sell at (bid under $0.10, a wide gap between bid and ask, or no volatility read)",
  stale: "prices older than 15 minutes",
  thin: "too few contracts open (under 100)",
  otm: "at or past today's price",
  basis: "below what you paid",
  delta: "more than a 30% chance of being exercised",
  own: "above the price you'd be happy to own at",
  cash: "not covered by your cash",
};

const MANAGING =
  "Managing it: once you've kept about half the premium, buying the option back early is a common way to lock that in.";

function dropWhy(result: LadderResult): GuidanceReason {
  const top = (Object.entries(result.dropped) as [LadderDrop, number][])
    .filter(([, n]) => n > 0)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 2)
    .map(([k, n]) => `${n} ${DROP_TEXT[k]}`);
  return why(
    "PRICE-AT-BID",
    `No strike passes our checks: ${top.join("; ") || "no prices available in range"}.`,
  );
}

function bandWhy(ctx: LeverContext): GuidanceReason | undefined {
  const inBand = ctx.strip.filter((m) => m.verdict === "in");
  const last = inBand.at(-1);
  if (!last) return undefined;
  const span = `Only expiries ${inBand[0]?.dte}–${last.dte} days out (through ${last.expiration})`;
  if (!ctx.input.earnings) {
    return why("DTE-FLOOR", `${span}. Under 7 days, the premium isn't worth the risk.`);
  }
  const evidence = ctx.input.printEvidence ?? "the stock can gap further than option prices expect";
  const cutoff = optionsCutoff(ctx.input.earnings, ctx.input.stake.goal);
  if (cutoff?.kind === "decision") {
    return why(
      "DTE-PRINT",
      `${span}: nothing should still be open on ${cutoff.date}, when you decide whether to hold through earnings (${windowText(ctx.input)}).`,
    );
  }
  return why(
    "DTE-PRINT",
    `${span}: later ones cross the earnings report (${windowText(ctx.input)}) — ${evidence}.`,
  );
}

function richWhy(r: Richness): GuidanceReason {
  if (r.basis === "iv-rank") {
    return why(
      "RICHNESS",
      `Option prices sit at ${r.ivRank?.toFixed(0)} on a 0–100 scale of their past year — ${r.verdict === "rich" ? "sellers are paid well" : r.verdict === "cheap" ? "sellers are underpaid" : "about average"}.`,
    );
  }
  if (r.basis === "iv-vs-realized" && r.atmIv !== undefined && r.realizedVol !== undefined) {
    const priced = `Options are pricing moves of about ${pct(r.atmIv)} a year; the stock has actually moved about ${pct(r.realizedVol)}`;
    const verdict =
      r.verdict === "rich"
        ? "sellers are being paid well for the risk"
        : r.verdict === "cheap"
          ? "sellers are underpaid for the risk"
          : "only a little extra — not enough to be worth selling yet";
    return why("RICHNESS", `${priced} — ${verdict}.`);
  }
  return why("RICHNESS", "We can't yet tell whether option prices are high or low for this stock.");
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
        `Every listed expiry is under 7 days away, runs past your hold-or-sell date, or crosses the earnings report (${windowText(ctx.input)}).`,
      ),
    ],
    provesWrong: "If a new expiry is listed inside the safe range → come back here.",
    ...(end
      ? {
          until: { date: end, why: "the earnings report passes and a clean set of expiries opens" },
        }
      : {}),
  });
}

const receive = (row: LadderRow, kind: "call" | "put"): GuidanceReason =>
  why(
    "PRICE-AT-BID",
    `Sell 1 ${kind}: ${usd(row.strike)} strike, expires ${row.expiration}. You receive ${usd(row.bid * 100)} now — yours whatever happens (≈${pct(row.annualizedYield)} a year only if you could repeat it every time).`,
  );

function notAvailable(
  which: LeverCall["lever"],
  rule: GuidanceReason["rule"],
  text: string,
): LeverCall {
  return lever({
    lever: which,
    call: "NOT AVAILABLE",
    confidence: "none",
    reasons: [why(rule, text)],
    provesWrong: "—",
  });
}

export function coveredCallCall(ctx: LeverContext, ladder: LadderResult): LeverCall {
  const { stake, symbol } = ctx.input;
  const shares = stake.shares ?? 0;
  if (shares < 100) {
    return notAvailable(
      "covered-calls",
      "COVERAGE",
      `Covered calls need 100 shares per contract — you hold ${shares}.`,
    );
  }
  if (stake.goal === undefined) {
    return notAvailable(
      "covered-calls",
      "GOAL",
      "Pick a goal first — keep the shares, earn income, or exit. It decides which strikes fit.",
    );
  }
  if (stake.costBasis === undefined && stake.goal !== "exit") {
    return notAvailable(
      "covered-calls",
      "STRIKE-BASIS",
      "Enter what you paid per share first — without it, a strike could sell your shares for less than you paid.",
    );
  }
  const band = bandWhy(ctx);
  if (!band) return noBand(ctx, "covered-calls");
  const best = headlineRow(ladder.rows);
  const last = ctx.strip.filter((m) => m.verdict === "in").at(-1)?.expiration ?? "";
  const falsifier =
    ctx.input.earnings?.status === "estimate"
      ? `If the company announces its earnings date for on or before ${last} → come back here; that expiry would then cross the report.`
      : "If option prices fall below how much the stock actually moves → come back here.";
  if (!best) {
    return lever({
      lever: "covered-calls",
      call: "WAIT",
      confidence: "medium",
      reasons: [dropWhy(ladder), band],
      provesWrong: falsifier,
    });
  }
  const grade: Confidence = capConfidence("high", richnessCap(ctx.richness));
  if (!actionable(grade)) {
    return lever({
      lever: "covered-calls",
      call: "WAIT",
      confidence: grade,
      reasons: [richWhy(ctx.richness), band],
      provesWrong:
        "If option prices rise to at least 1.2× what the stock actually moves → come back here.",
    });
  }
  const keep = best.bid * 100;
  const net =
    stake.costBasis !== undefined ? (best.strike - stake.costBasis) * 100 + keep : undefined;
  const basisGain =
    net === undefined
      ? ""
      : net >= 0
        ? ` That's ${usd(net)} more than you paid for those 100.`
        : ` That's ${usd(-net)} less than you paid for those 100 — a loss, which your exit goal accepts.`;
  const outcome = why(
    stake.goal === "keep-shares" ? "GOAL" : "STRIKE-BASIS",
    `If ${symbol} closes above ${usd(best.strike)} on ${best.expiration} (about a ${pct(best.probAssigned)} chance), 100 of your ${shares} shares are sold at ${usd(best.strike)} — you keep the ${usd(keep)} but miss any rise above it.${basisGain}${stake.goal === "keep-shares" ? " You want to keep the shares, so favour the rows with the lowest chance." : ""}`,
  );
  return lever({
    lever: "covered-calls",
    call: "WRITE",
    confidence: grade,
    reasons: [receive(best, "call"), outcome, band],
    provesWrong: falsifier,
    until: {
      date: last,
      why: ctx.input.earnings
        ? `last usable expiry — stop selling calls until earnings pass. ${MANAGING}`
        : `the longest usable expiry — refresh the guidance before selling another. ${MANAGING}`,
    },
  });
}

export function cashSecuredPutCall(ctx: LeverContext, ladder: LadderResult): LeverCall {
  const { stake, ledger, earnings, symbol } = ctx.input;
  if (!(stake.cash && stake.cash > 0)) {
    return notAvailable(
      "cash-secured-puts",
      "COVERAGE",
      "Enter your cash — a put must be fully covered by cash you set aside.",
    );
  }
  const band = bandWhy(ctx);
  if (!band) return noBand(ctx, "cash-secured-puts");
  const after = earnings
    ? {
        until: {
          date: earnings.end,
          why: "the earnings report settles the biggest unknown — refresh the guidance after it",
        },
      }
    : {};
  const buyWhy = ledger?.buySignal
    ? why("LEDGER", `The research supports buying (confidence: ${ledger.buyConfidence}).`)
    : why(
        "LEDGER",
        "Selling a put means agreeing to buy the stock — and the research doesn't support buying it right now.",
      );
  const falsifier = ledger?.buySignal
    ? `If the research withdraws its buy signal${earnings ? ` before ${earnings.start}` : ""} → come back here.`
    : `If the research starts supporting a buy${earnings ? ` before ${earnings.start}` : ""} → come back here.`;
  const best = headlineRow(ladder.rows);
  const held = stake.shares ?? 0;
  const concentration =
    held > 0
      ? [
          why(
            "CONCENTRATION",
            `Being assigned adds 100 shares to the ${held} you already hold — the same bet, bigger.`,
          ),
        ]
      : [];
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
  grade = capConfidence(grade, ledger?.buySignal ? ledger.buyConfidence : "low");
  if (stake.happyToOwnAt === undefined) grade = capConfidence(grade, "medium");
  if (!actionable(grade)) {
    return lever({
      lever: "cash-secured-puts",
      call: "WAIT",
      confidence: grade,
      reasons: [buyWhy, ...concentration, richWhy(ctx.richness)],
      provesWrong: falsifier,
      ...after,
    });
  }
  const outcome = why(
    "STRIKE-OWN",
    `If ${symbol} closes below ${usd(best.strike)} on ${best.expiration} (about a ${pct(best.probAssigned)} chance), you must buy 100 shares for ${usd(best.strike * 100)} — even if it's far lower then. Your cost would be ${usd(best.effectiveEntry ?? best.strike)} a share after the premium.`,
  );
  return lever({
    lever: "cash-secured-puts",
    call: "WRITE",
    confidence: grade,
    reasons: [receive(best, "put"), outcome, ...concentration, buyWhy],
    provesWrong: falsifier,
    until: {
      date: best.expiration,
      why: `expiry — decide then whether to sell another put or take the shares. ${MANAGING}`,
    },
  });
}
