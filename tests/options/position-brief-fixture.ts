import type { BriefInputs, BriefQuote } from "../../src/options/position-brief-types.js";
import { priceOption } from "../../src/options/pricing.js";
import { daysToExpiryFrom } from "../../src/options/single-leg-odds.js";

/**
 * A frozen CRWV-shaped world for the Position Brief specs (#3729): spot $80, every contract priced
 * by our own Black-Scholes at 80% IV with a 6%-of-price spread, so every number a spec checks is
 * self-consistent and hand-verifiable. The calendar is the ledger's own: an estimate print window
 * of Nov 9–16, Fully Connected on 09-29 and MU on 09-30.
 */

export const NOW = "2026-09-25T18:00:00Z"; // 14:00 ET, a Friday
export const SPOT = 80;
export const IV = 0.8;

export const EXPIRATIONS = [
  "2026-10-02",
  "2026-10-09",
  "2026-10-16",
  "2026-10-23",
  "2026-10-30",
  "2026-11-06",
  "2026-11-13",
  "2026-11-20",
];

const STRIKES = [60, 65, 70, 75, 80, 85, 90, 95, 100, 105, 110];

export function quoteAt(
  expiration: string,
  strike: number,
  type: "call" | "put",
  now = NOW,
  spot = SPOT,
): BriefQuote {
  const days = daysToExpiryFrom(expiration, new Date(now)) ?? 1;
  const v = priceOption({ spot, strike, daysToExpiry: days, volatility: IV, type });
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

export const CHAIN: readonly BriefQuote[] = EXPIRATIONS.flatMap((e) =>
  STRIKES.flatMap((k) => [quoteAt(e, k, "call"), quoteAt(e, k, "put")]),
);

export function inputs(overrides: Partial<BriefInputs> = {}): BriefInputs {
  return {
    symbol: "CRWV",
    now: NOW,
    spot: SPOT,
    sessionOpen: true,
    stake: { shares: 400, costBasis: 70, cash: 40_000, goal: "income" },
    chain: CHAIN,
    realizedVol: 0.6,
    earnings: {
      start: "2026-11-09",
      end: "2026-11-16",
      status: "estimate",
      source: "8-K cadence; ledger window Nov 9–16",
    },
    printEvidence:
      "its options have underpriced its print moves — Q2 implied ~15.5% vs ~18.6% realized (FT-15)",
    catalysts: [
      { date: "2026-09-29", label: "Fully Connected opens", source: "IR" },
      { date: "2026-09-30", label: "MU prints", source: "IR" },
    ],
    ledger: {
      buySignal: false,
      buyConfidence: "none",
      stance: "Stand aside · S2 · E1 — no buy signal exists",
      source: "docs/research/events/crwv-2026-11-10-print.md",
    },
    pulse: [
      {
        id: "spot",
        source: "Alpaca IEX last trade",
        asOf: NOW,
        status: "fresh",
        note: "matches parity",
      },
      { id: "chain", source: "Alpaca indicative", asOf: NOW, status: "fresh", note: "1 min old" },
      { id: "research", source: "ledger", asOf: "2026-09-24", status: "fresh", note: "1 day old" },
    ],
    ...overrides,
  };
}
