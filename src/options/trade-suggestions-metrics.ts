import { pct, usd } from "./position-guidance-rules.js";
import { priceOption } from "./pricing.js";
import { probabilityAbove, probabilityBelow } from "./terminal-odds.js";
import type { SuggestionStrategy } from "./trade-suggestions-rules.js";

/**
 * The numbers each suggested trade cites (#7547) — every value the engine used, each with the
 * sentence a member reads. Every chance is labelled the MODEL's (lognormal, the contract's own IV,
 * no jumps — `GUIDANCE_DISCLOSURE`), so no line says or implies a gain is likelier than its own
 * number. PURE.
 */

type MetricId =
  | "delta"
  | "chance-of-profit"
  | "chance-assigned"
  | "theta-per-day"
  | "iv"
  | "iv-rank"
  | "premium"
  | "max-loss"
  | "account-at-risk";

/** One cited number: the value the engine used, and the sentence a member reads. */
export interface SuggestionMetric {
  readonly id: MetricId;
  readonly value: number;
  readonly text: string;
}

/** One picked contract, sized and priced — everything a citation needs. */
export interface CitedTrade {
  readonly strategy: SuggestionStrategy;
  readonly spot: number;
  readonly strike: number;
  readonly type: "call" | "put";
  /** The contract's own IV, annualized decimal. */
  readonly iv: number;
  readonly absDelta: number;
  /** Fractional calendar days to the 4 pm ET expiry. */
  readonly days: number;
  /** Limit per share. */
  readonly limit: number;
  readonly contracts: number;
  readonly equity: number;
  readonly ivRank?: number;
  readonly rate?: number;
}

export function metricsFor(t: CitedTrade): SuggestionMetric[] {
  const call = t.strategy === "covered-call";
  const shares = t.contracts * 100;
  const rate = t.rate ?? 0;
  const odds = { spot: t.spot, daysForward: t.days, volatility: t.iv, rate };
  // Profit is measured from today's price for a covered call (the shares are already held), from
  // nothing for a put: break-even is today's price less the premium, or the strike less it. The
  // same figure, × shares, is the loss if the stock went to zero.
  const breakEven = call ? t.spot - t.limit : t.strike - t.limit;
  const profit = probabilityAbove({ ...odds, target: breakEven }) ?? 0;
  const assigned = (call ? probabilityAbove : probabilityBelow)({ ...odds, target: t.strike }) ?? 0;
  const valuation = priceOption({
    spot: t.spot,
    strike: t.strike,
    daysToExpiry: t.days,
    volatility: t.iv,
    rate,
    type: t.type,
  });
  // A seller earns the decay a holder pays: the model's theta, sign flipped, for the whole size.
  const decay = -(valuation?.theta ?? 0) * shares;
  const maxLoss = breakEven * shares;
  const atRisk = t.equity > 0 ? maxLoss / t.equity : 0;
  const metrics: SuggestionMetric[] = [
    {
      id: "delta",
      value: t.absDelta,
      text: `Delta ${t.absDelta.toFixed(2)}: the option moves about ${usd(t.absDelta)} per $1 the stock moves.`,
    },
    {
      id: "chance-of-profit",
      value: profit,
      text: `${pct(profit)} model chance of a profit at expiry (break-even ${usd(breakEven)}).`,
    },
    {
      id: "chance-assigned",
      value: assigned,
      text: call
        ? `${pct(assigned)} model chance the shares are called away at ${usd(t.strike)}.`
        : `${pct(assigned)} model chance you are assigned and buy ${shares} shares at ${usd(t.strike)}.`,
    },
    {
      id: "theta-per-day",
      value: decay,
      text: `About ${usd(decay)} a day from time decay today, if nothing else moves (model).`,
    },
    { id: "iv", value: t.iv, text: `Implied volatility ${pct(t.iv)} on this contract.` },
  ];
  if (t.ivRank !== undefined && Number.isFinite(t.ivRank)) {
    metrics.push({
      id: "iv-rank",
      value: t.ivRank,
      text: `IV rank ${Math.round(t.ivRank)} of 100 over the past year.`,
    });
  }
  metrics.push(
    {
      id: "premium",
      value: t.limit * shares,
      text: `${usd(t.limit * shares)} premium collected if filled at the limit.`,
    },
    {
      id: "max-loss",
      value: maxLoss,
      text: call
        ? `${usd(maxLoss)} if the stock went to zero: the shares' risk, less the premium. The call adds no downside to shares you already hold.`
        : `${usd(maxLoss)} if assigned and the stock went to zero (strike less the premium).`,
    },
    {
      id: "account-at-risk",
      value: atRisk,
      text: `${pct(atRisk, 1)} of your account at that max loss.`,
    },
  );
  return metrics;
}
