import { normalizeInputs } from "./position-guidance-inputs.js";
import { buildLadder } from "./position-guidance-ladder.js";
import { cashSecuredPutCall, coveredCallCall } from "./position-guidance-levers.js";
import {
  atmIv,
  capConfidence,
  dteStrip,
  etDateOf,
  GUIDANCE_DISCLOSURE,
  LEVER_NAME,
  pulseOf,
  richnessOf,
} from "./position-guidance-rules.js";
import { decisionDate, sharesCall } from "./position-guidance-shares.js";
import type {
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
function applyPulse(calls: readonly LeverCall[], input: GuidanceInputs): LeverCall[] {
  const spot = pulseOf(input.pulse, "spot");
  const chain = pulseOf(input.pulse, "chain");
  const research = pulseOf(input.pulse, "research");
  const filings = pulseOf(input.pulse, "filings");
  return calls.map((c) => {
    if (spot?.status === "stale") {
      const { until: _dropped, ...rest } = c;
      return {
        ...rest,
        call: "NO ANSWER",
        confidence: "none",
        reasons: [{ rule: "PULSE", text: `No honest answer — spot unverified: ${spot.note}.` }],
      } satisfies LeverCall;
    }
    let next: LeverCall = c;
    const note = (text: string) => ({
      ...next,
      reasons: [{ rule: "PULSE" as const, text }, ...next.reasons].slice(0, 3),
    });
    if (chain?.status === "stale" && c.lever !== "shares" && c.call !== "NOT AVAILABLE") {
      next = {
        ...note(`Quotes are stale — ${chain.note}. Refresh before acting.`),
        call: "WAIT",
        confidence: "none",
      };
    }
    if (spot?.status === "aging") {
      next = {
        ...note(`Spot is only partly verified — ${spot.note}. Confidence capped medium.`),
        confidence: capConfidence(next.confidence, "medium"),
      };
    }
    if (research?.status === "stale") {
      next = {
        ...note(`Research is stale — ${research.note}. Confidence capped low.`),
        confidence: capConfidence(next.confidence, "low"),
      };
    } else if (filings?.status === "stale") {
      next = {
        ...note(`${filings.note} — read before acting.`),
        confidence: capConfidence(next.confidence, "medium"),
      };
    }
    if (next.confidence === "low" || next.confidence === "none") {
      if (next.call === "WRITE") next = { ...next, call: "WAIT" };
      if (next.call === "BUY") next = { ...next, call: "STAND ASIDE" };
    }
    const acting = next.call === "WRITE" || next.call === "BUY" || next.call === "SELL";
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
      label: "Hold-through-the-print decision falls due (S2)",
      source: "house rule",
    });
  }
  if (e && e.start >= today) {
    items.push({
      date: e.start,
      label: `Print window opens${e.status === "estimate" ? " — date unconfirmed, watch IR" : ""}`,
      source: e.source,
    });
  } else if (e && e.end >= today) {
    items.push({
      date: e.end,
      label: "Print window closes — refresh the guidance on the new tape",
      source: e.source,
    });
  }
  return items.sort((a, b) => a.date.localeCompare(b.date) || a.label.localeCompare(b.label));
}

function assumptionLines(input: GuidanceInputs, retiredWindow: string | undefined): string[] {
  return [
    "Premiums are priced at the bid (what a seller receives); the mid is shown for reference only.",
    "Odds are a lognormal model at each contract's own IV — no jumps, no early assignment, no dividends.",
    input.printEvidence
      ? `Across an earnings print the model understates the move: ${input.printEvidence}.`
      : "Across an earnings print the model can understate the move — a gap is a jump it does not price.",
    "Sessions exclude weekends only; exchange holidays are not modelled.",
    ...(retiredWindow
      ? [
          `The print window ${retiredWindow} has passed — no next print was supplied, so no expiry is cut for one.`,
        ]
      : []),
  ];
}

export function positionGuidance(raw: GuidanceInputs): PositionGuidance {
  const today = etDateOf(raw.now);
  const { input, retiredWindow } = normalizeInputs(raw, today);
  const expirations = input.expirations ?? input.chain.map((q) => q.expiration);
  const strip = dteStrip(expirations, today, input.earnings, input.catalysts, input.stake.goal);
  const firstIn = strip.find((m) => m.verdict === "in")?.expiration;
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
    // Stale quotes never render as a ladder: a row priced off them would read as current.
    ladder: pulseOf(input.pulse, "chain")?.status === "stale" ? [] : [...calls.rows, ...puts.rows],
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
      `Spot ${move > 0 ? "+" : ""}${(move * 100).toFixed(1)}% since ${previous.asOf.slice(0, 10)}.`,
    );
  }
  for (const now of guidance.calls) {
    const was = previous.calls.find((c) => c.lever === now.lever);
    if (!was) continue;
    if (was.call !== now.call || was.confidence !== now.confidence) {
      lines.push(
        `${LEVER_NAME[now.lever]}: ${was.call} (${was.confidence}) → ${now.call} (${now.confidence}).`,
      );
    }
  }
  if (previous.richness !== guidance.richness.verdict) {
    lines.push(`Premium: ${previous.richness} → ${guidance.richness.verdict}.`);
  }
  return lines;
}
