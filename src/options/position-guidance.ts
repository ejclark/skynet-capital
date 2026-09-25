import { normalizeInputs } from "./position-guidance-inputs.js";
import { buildLadder } from "./position-guidance-ladder.js";
import { cashSecuredPutCall, coveredCallCall } from "./position-guidance-levers.js";
import {
  atmIv,
  CALL_WORDS,
  capConfidence,
  dteStrip,
  etDateOf,
  GUIDANCE_DISCLOSURE,
  LEVER_NAME,
  pulseOf,
  RICHNESS_WORDS,
  richnessExpiry,
  richnessOf,
} from "./position-guidance-rules.js";
import { decisionDate, sharesCall } from "./position-guidance-shares.js";
import type {
  Confidence,
  GuidanceInputs,
  GuidanceSnapshot,
  LeverCall,
  PositionGuidance,
  StakeView,
  WaitingOn,
} from "./position-guidance-types.js";

/**
 * THE POSITION BRIEF ENGINE (#3729) — one pure function from a member's stake plus the live-checked
 * market inputs to the fixed-order template. Deterministic by design, not by thrift: templated,
 * rule-cited lines are auditable in a way generated prose is not, and they cost zero model tokens
 * per request. PURE: no I/O, no clock — the caller supplies `now` and each input's pulse status.
 */

/**
 * PULSE — the demotions a stale input carries (Eric, 2026-09-25: "a sanity/pulse check against live
 * information sources to ensure we're not acting on cached/stale information"). A stale input is
 * never shown as if current; it lowers the calls that depend on it.
 */
/** The lever a pulse makes unanswerable outright — it says only why, nothing priced. */
function overridden(c: LeverCall, input: GuidanceInputs): LeverCall | undefined {
  const spot = pulseOf(input.pulse, "spot");
  const chain = pulseOf(input.pulse, "chain");
  const { until: _dropped, ...rest } = c;
  if (spot?.status === "stale") {
    const text = `No answer — the stock price couldn't be verified: ${spot.note}.`;
    return { ...rest, call: "NO ANSWER", confidence: "none", reasons: [{ rule: "PULSE", text }] };
  }
  const option = c.lever !== "shares" && c.call !== "NOT AVAILABLE";
  const blocker = input.pulse.find((p) => p.blocksPricing);
  if (!(option && (blocker || chain?.status === "stale"))) return undefined;
  // A lever the prices can't support says ONLY that — never beside a "sell 1 call … you receive
  // $165" line priced off the very data it just said not to trust (#3734 review).
  const text = blocker
    ? `Prices can't be trusted until the market opens — ${blocker.note}.`
    : `Option prices are out of date — ${chain?.note}. Refresh before acting.`;
  return {
    ...rest,
    call: "WAIT",
    confidence: "none",
    reasons: [{ rule: "PULSE", text }],
    atOpen: false,
  };
}

/** Every cap a partly-trustworthy input puts on this lever, most important first. */
function demotions(c: LeverCall, input: GuidanceInputs): { text: string; cap: Confidence }[] {
  const spot = pulseOf(input.pulse, "spot");
  const chain = pulseOf(input.pulse, "chain");
  const research = pulseOf(input.pulse, "research");
  const filings = pulseOf(input.pulse, "filings");
  const out: { text: string; cap: Confidence }[] = [];
  if (c.lever !== "shares" && c.call !== "NOT AVAILABLE" && chain?.status === "aging") {
    out.push({
      text: `Option prices are ${chain.note}. Confidence capped at medium.`,
      cap: "medium",
    });
  }
  if (spot?.status === "aging") {
    out.push({
      text: `The stock price is only partly verified — ${spot.note}. Confidence capped at medium.`,
      cap: "medium",
    });
  }
  if (research?.status === "stale") {
    out.push({
      text: `The research is out of date — ${research.note}. Confidence capped at low.`,
      cap: "low",
    });
  } else if (filings?.status === "stale") {
    out.push({ text: `${filings.note} — read them before acting.`, cap: "medium" });
  }
  return out;
}

function applyPulse(calls: readonly LeverCall[], input: GuidanceInputs): LeverCall[] {
  return calls.map((c) => {
    const forced = overridden(c, input);
    if (forced) return forced;
    let next: LeverCall = c;
    for (const d of demotions(c, input)) {
      next = {
        ...next,
        reasons: [{ rule: "PULSE" as const, text: d.text }, ...next.reasons].slice(0, 3),
        confidence: capConfidence(next.confidence, d.cap),
      };
    }
    if (next.confidence === "low" || next.confidence === "none") {
      if (next.call === "WRITE") next = { ...next, call: "WAIT" };
      if (next.call === "BUY") next = { ...next, call: "STAND ASIDE" };
    }
    const acting = ["WRITE", "BUY", "SELL", "DECIDE"].includes(next.call);
    return { ...next, atOpen: !input.sessionOpen && acting };
  });
}

function stakeView(input: GuidanceInputs): StakeView {
  const { stake, spot } = input;
  const shares = stake.shares ?? 0;
  const basis = stake.costBasis;
  const value = shares * spot;
  return {
    ...stake,
    ...(shares > 0 && basis !== undefined
      ? { unrealizedPnl: (spot - basis) * shares, unrealizedPct: (spot - basis) / basis }
      : {}),
    ...(stake.portfolioValue && stake.portfolioValue > 0
      ? { concentration: value / stake.portfolioValue }
      : {}),
  };
}

function waitingOn(input: GuidanceInputs, today: string): WaitingOn[] {
  const items: WaitingOn[] = input.catalysts
    .filter((c) => c.date >= today)
    .map((c) => ({ date: c.date, label: c.label, source: c.source }));
  const decision = decisionDate(input);
  const e = input.earnings;
  if (decision && decision >= today) {
    items.push({
      date: decision,
      label: "Decide whether to hold through earnings",
      source: "house rule",
    });
  }
  if (e && e.start >= today) {
    items.push({
      date: e.start,
      label: `Earnings window opens${e.status === "estimate" ? " — date not yet confirmed by the company" : ""}`,
      source: e.source,
    });
  } else if (e && e.end >= today) {
    items.push({
      date: e.end,
      label: "Earnings window closes — refresh the guidance on the new prices",
      source: e.source,
    });
  }
  return items.sort((a, b) => a.date.localeCompare(b.date) || a.label.localeCompare(b.label));
}

function assumptionLines(input: GuidanceInputs, retiredWindow: string | undefined): string[] {
  return [
    "Every amount you'd receive uses the bid — the price a seller actually gets, not the midpoint.",
    "Chances come from a standard pricing model at each option's own price — it assumes no sudden jumps, no early exercise and no dividends.",
    input.printEvidence
      ? `Across an earnings report the model understates the move: ${input.printEvidence}.`
      : "Across an earnings report the model can understate the move — an overnight gap is a jump it does not price.",
    "Trading days skip weekends only; market holidays aren't counted.",
    ...(retiredWindow
      ? [
          `The earnings window ${retiredWindow} has passed and no next date is on the calendar, so no expiry is excluded for one.`,
        ]
      : []),
  ];
}

export function positionGuidance(raw: GuidanceInputs): PositionGuidance {
  const today = etDateOf(raw.now);
  const { input, retiredWindow } = normalizeInputs(raw, today);
  const expirations = input.expirations ?? input.chain.map((q) => q.expiration);
  const strip = dteStrip(expirations, today, input.earnings, input.catalysts, input.stake.goal);
  const firstIn = richnessExpiry(strip.filter((m) => m.verdict === "in"));
  const richness = richnessOf(
    input.ivRank,
    atmIv(input.chain, input.spot, firstIn),
    input.realizedVol,
  );
  const ctx = { input, today, strip, richness };
  const calls = buildLadder("covered-calls", input, strip);
  const puts = buildLadder("cash-secured-puts", input, strip);
  const [shares, cc, csp] = applyPulse(
    [sharesCall(ctx), coveredCallCall(ctx, calls), cashSecuredPutCall(ctx, puts)],
    input,
  );
  return {
    symbol: input.symbol,
    asOf: input.now,
    spot: input.spot,
    sessionOpen: input.sessionOpen,
    pulse: input.pulse,
    stake: stakeView(input),
    calls: [shares as LeverCall, cc as LeverCall, csp as LeverCall],
    waitingOn: waitingOn(input, today),
    richness,
    dteStrip: strip,
    // Stale quotes, or prices unfit to solve from, never render as a ladder: a row priced off them
    // would read as current.
    ladder:
      pulseOf(input.pulse, "chain")?.status === "stale" || input.pulse.some((p) => p.blocksPricing)
        ? []
        : [...calls.rows, ...puts.rows],
    assumptions: assumptionLines(input, retiredWindow),
    disclosure: GUIDANCE_DISCLOSURE,
  };
}

/** The slice of a guidance read a viewer keeps, to diff against next time. */
export function snapshotOf(guidance: PositionGuidance): GuidanceSnapshot {
  return {
    asOf: guidance.asOf,
    spot: guidance.spot,
    calls: guidance.calls.map((c) => ({ lever: c.lever, call: c.call, confidence: c.confidence })),
    richness: guidance.richness.verdict,
  };
}

/** "What changed since you last looked" — plain lines, empty when nothing moved. */
export function diffGuidance(
  previous: GuidanceSnapshot | undefined,
  guidance: PositionGuidance,
): string[] {
  if (!previous) return [];
  const lines: string[] = [];
  const move = (guidance.spot - previous.spot) / previous.spot;
  if (Math.abs(move) >= 0.005) {
    lines.push(
      `Stock price ${move > 0 ? "+" : ""}${(move * 100).toFixed(1)}% since ${previous.asOf.slice(0, 10)}.`,
    );
  }
  for (const now of guidance.calls) {
    const was = previous.calls.find((c) => c.lever === now.lever);
    if (!was) continue;
    if (was.call !== now.call || was.confidence !== now.confidence) {
      lines.push(
        `${LEVER_NAME[now.lever]}: ${CALL_WORDS[was.call] ?? was.call} (${was.confidence}) → ${CALL_WORDS[now.call] ?? now.call} (${now.confidence}).`,
      );
    }
  }
  if (previous.richness !== guidance.richness.verdict) {
    lines.push(
      `Option prices for sellers: ${RICHNESS_WORDS[previous.richness]} → ${RICHNESS_WORDS[guidance.richness.verdict]}.`,
    );
  }
  return lines;
}
