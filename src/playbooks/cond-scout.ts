/**
 * COND-SCOUT — the condition scanner (#3651 slice 1). Tests Eric's theory that "a profitable trade
 * exists for every market condition": read each configured symbol's current conditions, name the
 * condition, and emit the one hypothesis the scout holds for that condition as an explicit,
 * falsifiable thesis. This module only SCANS — it places nothing. Slice 2 turns a hypothesis into a
 * shadow-ledger probe (simulated fill at the far side of the quote, no broker order — Eric,
 * 2026-09-30: "keeps the information contained to the health dashboard").
 *
 * WHY NAMED HYPOTHESES, NOT A SCORE. `beta-scout.ts` ranks `|sentiment| + |momentum|` because its
 * job is proving the pipes work. This one exists to generate evidence, and evidence needs a claim
 * that can be wrong: each hypothesis states its condition, its direction, its horizon and the
 * observation that falsifies it, in the same `OrderForecast` shape Sauron's intents carry (#2287
 * PR 1). A retro can then score "oversold rebound, 5 days" separately from "trend continuation,
 * 10 days" instead of averaging two different bets into one meaningless number.
 *
 * LONG-ONLY. There is no short instrument (`trade-playbooks.md`), so a condition whose honest bet
 * is "down" (a breakdown under the average on bad news) is reported as a reading with no
 * hypothesis — absence, never a long bet dressed up to fill the slot.
 *
 * ABSENCE OVER PLACEHOLDERS. An indicator the history can't support yet stays `undefined`, and a
 * hypothesis that needs it doesn't fire (the `src/indicators/` doctrine, restated in its header).
 */
import type { MarketContext, OrderForecast } from "../domain/types.js";
import { rsi, sma } from "../indicators/index.js";

export const COND_SCOUT_ID = "COND-SCOUT";

const DAY_MS = 86_400_000;

/**
 * `SKYNET_COND_SCOUT_UNIVERSE` — a comma list of tickers, dark (empty) by default, the same shape
 * `SKYNET_PLAYBOOKS` uses. Tokens that aren't plausible tickers are dropped rather than guessed at;
 * duplicates collapse.
 */
export function parseCondScoutUniverse(raw: string | undefined): readonly string[] {
  const seen = new Set<string>();
  for (const token of (raw ?? "").split(",")) {
    const symbol = token.trim().toUpperCase();
    if (/^[A-Z][A-Z.]{0,5}$/.test(symbol)) seen.add(symbol);
  }
  return [...seen];
}

/** What the scanner saw for one symbol, each field present only when it was actually computable. */
export interface ConditionReading {
  readonly symbol: string;
  readonly price: number;
  readonly sentiment?: number;
  readonly momentum?: number;
  /** RSI(14) of the daily closes, simple windowed form (`indicators/rsi.ts`). */
  readonly rsi?: number;
  /** SMA(20) of the daily closes. */
  readonly sma?: number;
  /** (price − SMA20) / SMA20, as a fraction. */
  readonly distanceFromSma?: number;
}

/** The named conditions the v1 scanner recognizes. `unclassified` is a real answer: the reading
 *  didn't match any condition the scout holds a view on. */
export type ScoutCondition = "oversold" | "uptrend" | "downtrend" | "unclassified";
export const SCOUT_CONDITIONS: readonly ScoutCondition[] = [
  "oversold",
  "uptrend",
  "downtrend",
  "unclassified",
];

export type ScoutHypothesisId = "oversold-rebound" | "trend-continuation";
export const SCOUT_HYPOTHESES: readonly ScoutHypothesisId[] = [
  "oversold-rebound",
  "trend-continuation",
];

export interface ConditionHypothesis {
  readonly symbol: string;
  readonly condition: ScoutCondition;
  readonly hypothesis: ScoutHypothesisId;
  readonly reading: ConditionReading;
  /** Which thresholds crossed, in plain words — the "why" a retro and a member both read. */
  readonly triggers: readonly string[];
  /** Ranks hypotheses when there are more than `maxPicks`: how far past its thresholds it is. */
  readonly strength: number;
  readonly forecast: OrderForecast;
}

export interface CondScoutConfig {
  readonly rsiOversold?: number;
  /** Minimum distance above the 20-day average that counts as an uptrend (fraction). */
  readonly trendMinDistance?: number;
  /** Momentum a continuation bet needs behind it (fraction, same units as `MarketContext`). */
  readonly trendMinMomentum?: number;
  /** Adverse move that falsifies a thesis, as a fraction of entry. */
  readonly stopPct?: number;
  readonly maxPicks?: number;
}

const DEFAULTS = {
  rsiOversold: 30,
  trendMinDistance: 0.01,
  trendMinMomentum: 0.002,
  stopPct: 0.05,
  maxPicks: 2,
} as const;

/** Horizons in calendar days — the hold each thesis is sized for, and what the retro's checkpoint
 *  ladder scales from. A rebound is a days-long claim; a trend is a weeks-long one. */
const HORIZON_DAYS: Record<ScoutHypothesisId, number> = {
  "oversold-rebound": 5,
  "trend-continuation": 14,
};

const last = (series: readonly (number | undefined)[]): number | undefined => series.at(-1);

/**
 * Read one symbol's conditions. `dailyCloses` is oldest first and should end at the latest
 * completed session; the live quote supplies `price`. Returns undefined when there is no usable
 * quote at all — nothing to read, nothing to claim.
 */
export function readConditions(
  context: MarketContext,
  symbol: string,
  dailyCloses: readonly number[],
): ConditionReading | undefined {
  const quote = context.quotes[symbol];
  if (!quote) return undefined;
  const price = quote.last > 0 ? quote.last : quote.ask;
  if (!(price > 0)) return undefined;
  const rsiNow = last(rsi(dailyCloses, 14));
  const smaNow = last(sma(dailyCloses, 20));
  const sentiment = context.newsSentiment?.[symbol];
  const momentum = context.momentum?.[symbol];
  return {
    symbol,
    price,
    ...(sentiment !== undefined ? { sentiment } : {}),
    ...(momentum !== undefined ? { momentum } : {}),
    ...(rsiNow !== undefined ? { rsi: rsiNow } : {}),
    ...(smaNow !== undefined ? { sma: smaNow, distanceFromSma: (price - smaNow) / smaNow } : {}),
  };
}

/** Name the condition. Oversold wins over a trend read: a stretched RSI is the sharper claim. */
export function classifyCondition(
  reading: ConditionReading,
  config: CondScoutConfig = {},
): ScoutCondition {
  const c = { ...DEFAULTS, ...config };
  if (reading.rsi !== undefined && reading.rsi <= c.rsiOversold) return "oversold";
  if (reading.distanceFromSma === undefined) return "unclassified";
  if (reading.distanceFromSma >= c.trendMinDistance) return "uptrend";
  if (reading.distanceFromSma <= -c.trendMinDistance) return "downtrend";
  return "unclassified";
}

function stopLevel(price: number, stopPct: number): string {
  return (price * (1 - stopPct)).toFixed(2);
}

/** The scout's one view per condition, or undefined when it holds none (downtrend: long-only). */
function hypothesisFor(
  reading: ConditionReading,
  condition: ScoutCondition,
  c: Required<CondScoutConfig>,
): Omit<ConditionHypothesis, "symbol" | "reading" | "condition"> | undefined {
  const stopPctText = `${Math.round(c.stopPct * 100)}%`;
  if (condition === "oversold" && reading.rsi !== undefined) {
    // Bad news behind the selloff makes it information, not an overreaction — stand aside.
    if (reading.sentiment !== undefined && reading.sentiment < 0) return undefined;
    const days = HORIZON_DAYS["oversold-rebound"];
    return {
      hypothesis: "oversold-rebound",
      triggers: [
        `RSI ${reading.rsi.toFixed(1)} ≤ ${c.rsiOversold}`,
        reading.sentiment === undefined
          ? "no news read"
          : `sentiment ${reading.sentiment.toFixed(2)} not negative`,
      ],
      strength: (c.rsiOversold - reading.rsi) / c.rsiOversold,
      forecast: {
        direction: "up",
        horizonMs: days * DAY_MS,
        invalidator: `trades below ${stopLevel(reading.price, c.stopPct)} (−${stopPctText}) before ${days} days pass`,
      },
    };
  }
  if (
    condition === "uptrend" &&
    reading.distanceFromSma !== undefined &&
    reading.momentum !== undefined &&
    reading.momentum >= c.trendMinMomentum &&
    (reading.sentiment === undefined || reading.sentiment >= 0)
  ) {
    const days = HORIZON_DAYS["trend-continuation"];
    return {
      hypothesis: "trend-continuation",
      triggers: [
        `${(reading.distanceFromSma * 100).toFixed(1)}% above the 20-day average`,
        `momentum ${(reading.momentum * 100).toFixed(2)}% ≥ ${(c.trendMinMomentum * 100).toFixed(2)}%`,
      ],
      strength: reading.distanceFromSma / c.trendMinDistance / 10 + reading.momentum,
      forecast: {
        direction: "up",
        horizonMs: days * DAY_MS,
        invalidator: `closes back under the 20-day average (${reading.sma?.toFixed(2)}) or below ${stopLevel(reading.price, c.stopPct)} (−${stopPctText}) within ${days} days`,
      },
    };
  }
  return undefined;
}

/**
 * Scan the universe and return the strongest hypotheses, at most `maxPicks`. Symbols in
 * `openSymbols` (a probe already running) are skipped — one open thesis per symbol, so each retro
 * scores exactly one claim.
 */
export function scanConditions(
  context: MarketContext,
  universe: readonly string[],
  closesBySymbol: Readonly<Record<string, readonly number[]>>,
  openSymbols: ReadonlySet<string> = new Set(),
  config: CondScoutConfig = {},
): readonly ConditionHypothesis[] {
  const c = { ...DEFAULTS, ...config };
  const found: ConditionHypothesis[] = [];
  for (const symbol of universe) {
    if (openSymbols.has(symbol)) continue;
    const reading = readConditions(context, symbol, closesBySymbol[symbol] ?? []);
    if (!reading) continue;
    const condition = classifyCondition(reading, c);
    const view = hypothesisFor(reading, condition, c);
    if (view) found.push({ symbol, condition, reading, ...view });
  }
  return found.sort((a, b) => b.strength - a.strength).slice(0, c.maxPicks);
}
