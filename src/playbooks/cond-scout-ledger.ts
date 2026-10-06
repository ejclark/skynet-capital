/**
 * COND-SCOUT's shadow ledger (#3651 slice 2a) — where a scanned hypothesis becomes a probe
 * WITHOUT an order ever reaching a broker. Eric, 2026-09-30, choosing simulated fills over riding
 * a bot's account or giving the scout its own: "It keeps the information contained to the health
 * dashboard which enables us to keep the top level information identical to all other non-bot
 * accounts." No account's net worth, positions, activity or leaderboard rank moves because of a
 * probe; its results surface only in the bot's Heartbeat section, labelled simulated.
 *
 * THE FILL RULE — the honest answer to "simulated fills flatter the ROI". A fill at the mid-price
 * would quietly hand every probe half the spread. So a probe OPENS at the ask and CLOSES at the
 * bid of the quote in hand at that moment, and records the whole quote beside the fill, so a
 * retro can see exactly what spread the probe paid. (Alpaca's paper fills are simulated too — the
 * gap between this and a "real" paper fill is the spread, which this rule already charges.)
 *
 * Pure and clock-free: every function takes the quote and the time it acts on. Persistence and
 * the live-cycle wiring are slice 2b's; guards run there, on the intent `probeIntent` builds.
 */
import type { OrderIntent, Quote } from "../domain/types.js";
import { COND_SCOUT_ID, type ConditionHypothesis, type ConditionReading } from "./cond-scout.js";

const DAY_MS = 86_400_000;

/** Shadow capital per probe, in dollars — small and fixed, so one probe's ROI is comparable with
 *  the next and none can dominate the book. */
export const COND_SCOUT_PROBE_NOTIONAL = 5_000;

/** The quote a fill was taken against, kept whole so the spread paid is auditable. */
export interface FillQuote {
  readonly bid: number;
  readonly ask: number;
  readonly last: number;
  readonly asOf: string;
}

export interface ShadowProbe {
  /** `<symbol>@<openedAt>` — unique per symbol, since one symbol holds at most one open probe. */
  readonly id: string;
  readonly symbol: string;
  readonly hypothesis: ConditionHypothesis["hypothesis"];
  readonly condition: ConditionHypothesis["condition"];
  readonly triggers: readonly string[];
  readonly forecast: ConditionHypothesis["forecast"];
  readonly openedAt: number;
  readonly entryPrice: number;
  readonly entryQuote: FillQuote;
  readonly quantity: number;
  /** entryPrice × quantity — the capital the probe tied up. */
  readonly notional: number;
  /** The price at or under which the thesis is falsified. */
  readonly stopPrice: number;
  /** Epoch ms the thesis's horizon runs out. */
  readonly expiresAt: number;
}

export type ShadowExitReason = "invalidated" | "horizon";

export interface ShadowClose {
  readonly probe: ShadowProbe;
  readonly closedAt: number;
  readonly reason: ShadowExitReason;
  readonly exitPrice: number;
  readonly exitQuote: FillQuote;
  /** (exitPrice − entryPrice) × quantity. */
  readonly realized: number;
  /** realized / notional. */
  readonly roi: number;
  readonly daysHeld: number;
  /** roi / daysHeld (days floored at one hour's worth, so a same-hour close can't divide by ~0).
   *  The capital-time view the retro compares exit timings on: a smaller, faster win can beat a
   *  bigger, slower one. */
  readonly roiPerDay: number;
}

function fillQuote(quote: Quote): FillQuote {
  return { bid: quote.bid, ask: quote.ask, last: quote.last, asOf: quote.asOf };
}

/**
 * Open a probe at the ask. Returns undefined when there is no usable ask or the notional can't buy
 * one whole share — say nothing rather than record a 0-share probe.
 */
export function openShadowProbe(
  hypothesis: ConditionHypothesis,
  quote: Quote,
  at: number,
  stopPct: number,
  notional = COND_SCOUT_PROBE_NOTIONAL,
): ShadowProbe | undefined {
  if (!(quote.ask > 0)) return undefined;
  const quantity = Math.floor(notional / quote.ask);
  if (quantity < 1) return undefined;
  return {
    id: `${hypothesis.symbol}@${at}`,
    symbol: hypothesis.symbol,
    hypothesis: hypothesis.hypothesis,
    condition: hypothesis.condition,
    triggers: hypothesis.triggers,
    forecast: hypothesis.forecast,
    openedAt: at,
    entryPrice: quote.ask,
    entryQuote: fillQuote(quote),
    quantity,
    notional: quote.ask * quantity,
    stopPrice: quote.ask * (1 - stopPct),
    expiresAt: at + (hypothesis.forecast.horizonMs ?? 0),
  };
}

/**
 * Should the probe close now, and at what? The stop is checked against the BID (what the probe
 * could actually sell at), and wins over the horizon when both are true — a thesis that broke is
 * recorded as broken, not as having merely run out of time. Undefined = stays open.
 */
export function checkShadowExit(
  probe: ShadowProbe,
  quote: Quote,
  at: number,
): ShadowClose | undefined {
  if (!(quote.bid > 0)) return undefined; // no bid, no honest exit price — look again next pass
  const reason: ShadowExitReason | undefined =
    quote.bid <= probe.stopPrice ? "invalidated" : at >= probe.expiresAt ? "horizon" : undefined;
  if (!reason) return undefined;
  const realized = (quote.bid - probe.entryPrice) * probe.quantity;
  const roi = realized / probe.notional;
  const daysHeld = (at - probe.openedAt) / DAY_MS;
  return {
    probe,
    closedAt: at,
    reason,
    exitPrice: quote.bid,
    exitQuote: fillQuote(quote),
    realized,
    roi,
    daysHeld,
    roiPerDay: roi / Math.max(daysHeld, 1 / 24),
  };
}

/**
 * The buy the probe stands for, so slice 2b can run it through `applyGuards` exactly like a real
 * order (the plan's criterion: the probe SHALL NOT bypass the guards). Its reason says plainly
 * that nothing was sent.
 */
export function probeIntent(hypothesis: ConditionHypothesis, quantity: number): OrderIntent {
  return {
    symbol: hypothesis.symbol,
    side: "buy",
    quantity,
    type: "market",
    playbookId: COND_SCOUT_ID,
    playbookMode: "conservative",
    forecast: hypothesis.forecast,
    reason:
      `COND-SCOUT SHADOW PROBE — simulated fill at the ask, no order sent. ` +
      `${hypothesis.condition} → ${hypothesis.hypothesis}: ${hypothesis.triggers.join("; ")}.`,
  };
}

/**
 * One in-flight reading of an open probe (#3651 slice 3): what the conditions and the mark looked
 * like at a moment between open and close. The retro reads the series to see how the thesis
 * evolved — and the earlier-exit sweep prices "what if we'd closed here" off each one's bid.
 */
export interface ShadowSnapshot {
  readonly probeId: string;
  readonly symbol: string;
  readonly at: number;
  readonly quote: FillQuote;
  /** The scanner's reading at this moment — fields present only where computable. */
  readonly reading?: ConditionReading;
  /** Return if closed now, at the bid — the same fill rule a real exit uses. */
  readonly markRoi: number;
}

export function snapshotProbe(
  probe: ShadowProbe,
  quote: Quote,
  at: number,
  reading?: ConditionReading,
): ShadowSnapshot {
  return {
    probeId: probe.id,
    symbol: probe.symbol,
    at,
    quote: fillQuote(quote),
    ...(reading ? { reading } : {}),
    markRoi: (quote.bid - probe.entryPrice) / probe.entryPrice,
  };
}
