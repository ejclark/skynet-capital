// The Outlook pane's answer, as the real route would send it (#3407 slice 4) — a bullish, moderate,
// 30-day view on NVDA against a chain that can carry two of the three bullish structures and not the
// third. Every number here is shaped exactly like `rankStructures`' own output so the frame proves
// the real component's layout, not a simplified stand-in:
//
//  - `maxProfit: { kind: "unbounded" }` on the long call, so the frame shows the UNLIMITED wording
//    rather than a sampled dollar figure — the honesty rule the card exists to enforce.
//  - `targetReturn` absent on that same row (an uncapped loss has no denominator… here it is the
//    uncapped PROFIT, so `rewardToRisk` is the absent one), so the frame shows the stated reason.
//  - one `absent` row, so the frame proves nothing is dropped in silence.
//  - `volRegime` absent with `no-iv-history`, which is what the live route actually returns today:
//    `assembleChain` carries no IV history, so there is no rank to read and the pane says so.

const leg = (kind, quantity, strike, entryPrice) => ({
  kind,
  quantity,
  strike,
  daysToExpiry: 32,
  volatility: 0.44,
  entryPrice,
});

export const outlookAnswer = {
  asOf: "2026-10-02T17:42:00.000Z",
  spot: 181.24,
  recommendation: {
    outlook: { symbol: "NVDA", direction: "bullish", magnitude: "moderate", horizonDays: 30 },
    volRegime: { kind: "absent", reason: "no-iv-history" },
    target: 193.6,
    ranked: [
      {
        kind: "bull-call-spread",
        legs: [leg("call", 1, 180, 9.35), leg("call", -1, 195, 3.1)],
        daysToExpiry: 32,
        expiration: "2026-11-06",
        risk: {
          entryCost: 625,
          maxProfit: { kind: "amount", amount: 875 },
          maxLoss: { kind: "amount", amount: 625 },
          breakEvens: [186.25],
          capitalAtRisk: 625,
        },
        score: {
          composite: 0.61,
          probabilityOfProfit: 0.47,
          targetProfit: 110,
          targetReturn: 0.176,
          rewardToRisk: 1.4,
          volFit: { reading: { kind: "absent", reason: "no-iv-history" } },
        },
        mechanics:
          "Pays its most, $875, if NVDA is at or above $195.00 on 2026-11-06. Loses its whole $625 if NVDA is at or below $180.00. Break-even at $186.25.",
      },
      {
        kind: "long-call",
        legs: [leg("call", 1, 180, 9.35)],
        daysToExpiry: 32,
        expiration: "2026-11-06",
        risk: {
          entryCost: 935,
          maxProfit: { kind: "unbounded" },
          maxLoss: { kind: "amount", amount: 935 },
          breakEvens: [189.35],
          capitalAtRisk: 935,
        },
        score: {
          composite: 0.48,
          probabilityOfProfit: 0.38,
          targetProfit: 425,
          targetReturn: 0.455,
          volFit: { reading: { kind: "absent", reason: "no-iv-history" } },
        },
        mechanics:
          "Profits if NVDA is above $189.35 on 2026-11-06, with no ceiling above it. Loses its whole $935 if NVDA is at or below $180.00.",
      },
    ],
    absent: [{ kind: "short-put-spread", reason: "strike-out-of-reach" }],
    disclosure:
      "Educational · paper trading only · modelled mechanics, not financial advice. Every number here is a model mark under constant volatility — never a quote, a fill, or a realised P/L.",
  },
};
