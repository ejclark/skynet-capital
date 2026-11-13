import type { GuidanceMarket, GuidanceQuote } from "../../options/position-guidance-types.js";
import { priceOption } from "../../options/pricing.js";
import { daysToExpiryFrom } from "../../options/single-leg-odds.js";

/**
 * A FIXTURE NVDA WORLD for the "stage a trade" eval (#7547): spot $180, every contract priced by
 * our own Black-Scholes at 45% IV with a 6%-of-price spread, weekly Fridays out to eight weeks on the
 * eval's frozen clock. Self-consistent and hand-checkable, never a quote: it exists so the eval can
 * judge whether Moneypenny calls the sizing tool and repeats its numbers faithfully.
 */

const SPOT = 180;
const IV = 0.45;
const STRIKES = [140, 145, 150, 155, 160, 165, 170, 175, 180, 185, 190, 195, 200];

/** Fridays after `now`, one a week, eight of them, as ISO dates. */
function fridaysAfter(now: Date): string[] {
  const out: string[] = [];
  const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  while (out.length < 8) {
    d.setUTCDate(d.getUTCDate() + 1);
    if (d.getUTCDay() === 5) out.push(d.toISOString().slice(0, 10));
  }
  return out;
}

function quote(now: Date, expiration: string, strike: number, type: "call" | "put"): GuidanceQuote {
  const days = daysToExpiryFrom(expiration, now) ?? 1;
  const v = priceOption({ spot: SPOT, strike, daysToExpiry: days, volatility: IV, type });
  const price = v?.price ?? 0;
  return {
    expiration,
    strike,
    type,
    bid: Math.round(price * 0.97 * 100) / 100,
    ask: Math.round(price * 1.03 * 100) / 100,
    iv: IV,
    ...(v ? { feedDelta: v.delta } : {}),
  };
}

/** The market `suggestMarketFor` returns in the eval: NVDA, session open, on `now`. */
export function stageTradeMarket(now: Date): GuidanceMarket {
  const chain = fridaysAfter(now).flatMap((e) =>
    STRIKES.flatMap((k) => [quote(now, e, k, "call"), quote(now, e, k, "put")]),
  );
  return {
    symbol: "NVDA",
    now: now.toISOString(),
    spot: SPOT,
    sessionOpen: true,
    chain,
  } as unknown as GuidanceMarket;
}
