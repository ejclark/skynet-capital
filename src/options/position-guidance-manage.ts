import { buildLadder, headlineRow } from "./position-guidance-ladder.js";
import { type LeverContext, why, windowText } from "./position-guidance-levers.js";
import {
  capConfidence,
  daysBetween,
  dayText,
  pct,
  pulseOf,
  usd,
} from "./position-guidance-rules.js";
import type {
  Confidence,
  GuidanceReason,
  LadderRow,
  ManageCall,
  ManageVerdict,
  OpenCall,
} from "./position-guidance-types.js";

/**
 * CALLS YOU'VE SOLD — what to do with a covered call that is already open (#3729, the "Manage"
 * lever the plan deferred until the guidance could see open short calls). One call per contract,
 * first matching rule wins:
 *
 *   1. No live price to buy it back at → no answer (a verdict priced off nothing is a guess).
 *   2. The stock price can't be trusted → no answer, the same demotion every other lever gets.
 *   3. Still open through the earnings report → roll it to an expiry that ends before, or buy it
 *      back. The same rule that keeps new calls out of the window (DTE-PRINT) — CRWV's options
 *      have underpriced its earnings moves, so a call across the report caps the upside cheaply.
 *   4. In the money with a week or less left → let it go if the member wants out; otherwise roll
 *      up and out for a net credit, or buy it back. Mirrors the position-watch assignment alert.
 *   5. Half or more of the premium already kept → buy it back: what's left is small pay for the
 *      risk still carried (the MANAGING line the covered-call lever already states).
 *   6. Otherwise keep it — time does the rest.
 *
 * PURE: no I/O, no clock. Quotes come from the member's own account in the browser.
 */

/** A week: the window where an in-the-money short call is likely to be exercised (position-watch). */
const ASSIGNMENT_WINDOW_DAYS = 7;
/** Half the premium kept — the common point to buy back and stop carrying the risk. */
const TAKE_PROFIT = 0.5;

const netText = (net: number): string =>
  net >= 0
    ? `a net credit of ${usd(net * 100)} a contract`
    : `a net cost of ${usd(-net * 100)} a contract`;

function keptLine(c: OpenCall, ask: number, kept: number): GuidanceReason {
  return why(
    "MANAGE",
    kept >= 0
      ? `Buying it back costs ${usd(ask * 100)} a contract now — you've kept ${pct(kept)} of the ${usd(c.premium * 100)} you took in.`
      : `Buying it back costs ${usd(ask * 100)} a contract — more than the ${usd(c.premium * 100)} you took in, because the stock has risen toward the strike.`,
  );
}

/** The call to sell in its place: the headline row of a covered-call ladder with THIS call's lots
 *  treated as free, at or above the current strike — optionally later than it, and paying ≥ 0. */
function rollTarget(
  ctx: LeverContext,
  c: OpenCall,
  ask: number,
  opts: { readonly later: boolean; readonly credit: boolean },
): LadderRow | undefined {
  const { stake } = ctx.input;
  const open = (stake.openCalls ?? []).reduce((n, o) => n + o.contracts, 0);
  const freed = {
    ...stake,
    callsSold: Math.max(0, Math.max(stake.callsSold ?? 0, open) - c.contracts),
    openCalls: [],
  };
  const rows = buildLadder("covered-calls", { ...ctx.input, stake: freed }, ctx.strip).rows.filter(
    (r) =>
      r.strike >= c.strike &&
      (!opts.later || r.expiration > c.expiration) &&
      (!opts.credit || r.bid - ask >= 0),
  );
  return headlineRow(rows);
}

interface Verdict {
  readonly call: ManageVerdict;
  readonly reasons: readonly GuidanceReason[];
  readonly provesWrong: string;
  readonly until?: { readonly date: string; readonly why: string };
  readonly rollTo?: ManageCall["rollTo"];
}

function rollOrBuyBack(target: LadderRow | undefined, ask: number, lead: GuidanceReason): Verdict {
  if (target) {
    const net = target.bid - ask;
    return {
      call: "ROLL",
      reasons: [
        lead,
        why(
          "MANAGE",
          `Roll it: buy it back and sell the ${usd(target.strike)} call for ${dayText(target.expiration)} — ${netText(net)}.`,
        ),
      ],
      provesWrong: "",
      rollTo: { strike: target.strike, expiration: target.expiration, net },
    };
  }
  return {
    call: "BUY BACK",
    reasons: [
      lead,
      why("MANAGE", `No call to roll into fits the rules right now, so buy this one back.`),
    ],
    provesWrong: "",
  };
}

function throughEarnings(ctx: LeverContext, c: OpenCall, ask: number): Verdict {
  const lead = why(
    "DTE-PRINT",
    `It's still open through the earnings report (${windowText(ctx.input)}) — the stock can jump past ${usd(c.strike)} overnight, and this call caps what you keep.`,
  );
  const v = rollOrBuyBack(rollTarget(ctx, c, ask, { later: false, credit: false }), ask, lead);
  return {
    ...v,
    provesWrong: `If the company announces its earnings date for after ${dayText(c.expiration)} → this call no longer crosses the report.`,
  };
}

function nearAssignment(ctx: LeverContext, c: OpenCall, ask: number, dte: number): Verdict {
  const { symbol, spot, stake } = ctx.input;
  const lead = why(
    "MANAGE",
    `${symbol} is at ${usd(spot)}, above your ${usd(c.strike)} strike, with ${dte} day${dte === 1 ? "" : "s"} left — the shares will likely be called away.`,
  );
  const provesWrong = `If ${symbol} falls back below ${usd(c.strike)} before ${dayText(c.expiration)} → the call expires worthless and you keep the shares.`;
  if (stake.goal === "exit") {
    return {
      call: "LET IT GO",
      reasons: [
        lead,
        why(
          "GOAL",
          `Let it go: ${c.contracts * 100} shares sell at ${usd(c.strike)} — the exit you asked for.`,
        ),
      ],
      provesWrong,
    };
  }
  const v = rollOrBuyBack(rollTarget(ctx, c, ask, { later: true, credit: true }), ask, lead);
  return { ...v, provesWrong };
}

function verdictFor(ctx: LeverContext, c: OpenCall, ask: number, dte: number): Verdict {
  const { symbol, spot, stake, earnings } = ctx.input;
  const kept = (c.premium - ask) / c.premium;
  if (earnings && c.expiration >= earnings.start && stake.goal !== "exit") {
    return throughEarnings(ctx, c, ask);
  }
  if (spot > c.strike && dte <= ASSIGNMENT_WINDOW_DAYS) return nearAssignment(ctx, c, ask, dte);
  if (kept >= TAKE_PROFIT) {
    return {
      call: "BUY BACK",
      reasons: [
        keptLine(c, ask, kept),
        why(
          "MANAGE",
          `What's left is small pay for ${dte} more day${dte === 1 ? "" : "s"} of capping your shares — buying it back locks in the rest.`,
        ),
      ],
      provesWrong: `If ${symbol} keeps falling, holding would keep a little more — the trade-off is the risk you carry until ${dayText(c.expiration)}.`,
    };
  }
  return {
    call: "KEEP",
    reasons: [
      keptLine(c, ask, kept),
      why("MANAGE", `Time does the rest if ${symbol} stays below ${usd(c.strike)}.`),
    ],
    provesWrong: `If ${symbol} climbs toward ${usd(c.strike)} → come back; rolling or buying back may fit.`,
    until: {
      date: c.expiration,
      why: "it expires — or come back once about half the premium is kept",
    },
  };
}

function noAnswer(c: OpenCall, dte: number, text: string): ManageCall {
  return {
    occ: c.occ,
    strike: c.strike,
    expiration: c.expiration,
    contracts: c.contracts,
    dte,
    call: "NO ANSWER",
    confidence: "none",
    reasons: [why("PULSE", text)],
    provesWrong: "",
    atOpen: false,
  };
}

export function manageCalls(ctx: LeverContext): ManageCall[] {
  const { input, today } = ctx;
  const spot = pulseOf(input.pulse, "spot");
  const blocker = input.pulse.find((p) => p.blocksPricing);
  return (input.stake.openCalls ?? []).map((c) => {
    const dte = daysBetween(today, c.expiration);
    if (c.ask === undefined) {
      return noAnswer(
        c,
        dte,
        "No live price to buy it back at — refresh, or check it on your positions.",
      );
    }
    if (spot?.status === "stale") {
      return noAnswer(c, dte, `No answer — the stock price couldn't be verified: ${spot.note}.`);
    }
    if (blocker) {
      return noAnswer(c, dte, `Prices can't be trusted until the market opens — ${blocker.note}.`);
    }
    const v = verdictFor(ctx, c, c.ask, dte);
    const cap: Confidence = spot?.status === "aging" ? "medium" : "high";
    const acting = v.call === "BUY BACK" || v.call === "ROLL";
    return {
      occ: c.occ,
      strike: c.strike,
      expiration: c.expiration,
      contracts: c.contracts,
      dte,
      call: v.call,
      confidence: capConfidence("medium", cap),
      reasons: v.reasons.slice(0, 3),
      provesWrong: v.provesWrong,
      ...(v.until ? { until: v.until } : {}),
      atOpen: !input.sessionOpen && acting,
      kept: (c.premium - c.ask) / c.premium,
      ...(v.rollTo ? { rollTo: v.rollTo } : {}),
    };
  });
}
