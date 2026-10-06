// The two option trades a bot made on 2026-10-07 — one cash-secured CRWV put (CRWV-WHEEL) and one
// NVDA $185/$200 call debit spread (NVDA-CALL-SPREAD) — as ONE decision record, shared by
// `option-fill.mjs` (the fill, its why, its late settlement) and `activity-filters.mjs` (the
// account's Activity paged and narrowed, #4650), so both harnesses photograph the same trades. Only
// the bot's own sentences (reason, expectation, invalidator) are fixture text, written in each
// playbook's own templates; everything a frame shows about them is computed by the real server code.

export const PUT = "CRWV261113P00085000";
export const LOW = "NVDA261113C00185000";
export const HIGH = "NVDA261113C00200000";
const RETIRE =
  "the play retires if its net P/L is below 0 on 2027-01-29 or more than 1 in 3 sold puts finish in the money";

export const sold = {
  symbol: "CRWV",
  side: "sell",
  quantity: 1,
  type: "limit",
  playbookId: "CRWV-WHEEL",
  playbookMode: "standard",
  clientOrderId: "sk1-sauron-CRWV-mgf2a-0",
  reason:
    "Selling one cash-secured CRWV $85 PUT · 13 NOV 26 for about $2.10 a share ($210 for the contract): $8,500 stays set aside in case CRWV finishes below $85 and the shares are put to the bot. Run on its owner's conviction — our study found CRWV's option premium underpays its moves.",
  expectation:
    "CRWV stays above $85 to 2026-11-13: the put expires and the premium is kept. Below it, the bot buys 100 shares at $85 and sells covered calls on them next.",
  forecast: {
    direction: "up",
    invalidator: `CRWV settles below $85 on 2026-11-13 — the wheel buys 100 shares at $85; ${RETIRE}`,
  },
  option: {
    effect: "open",
    structure: "cash-secured-put",
    legs: [{ occSymbol: PUT, side: "sell", ratio: 1 }],
    limitPrice: 2.1,
    band: { low: 2.0, high: 2.2, at: "2026-10-07T14:30:00Z" },
  },
};

export const spread = {
  symbol: "NVDA",
  side: "buy",
  quantity: 1,
  type: "limit",
  playbookId: "NVDA-CALL-SPREAD",
  playbookMode: "standard",
  clientOrderId: "sk1-sauron-NVDA-mgf2a-1",
  strategy: "nvda-spread-open",
  reason:
    "Buying one NVDA $185/$200 CALL SPREAD · 13 NOV 26 for about $3.40 a share — the options form of the pre-earnings run-up. The most it can lose is that $340 debit.",
  expectation:
    "NVDA keeps rising into the print: above $200 at expiry the spread is worth $1,500. It is sold back five sessions before the print whatever it is worth then.",
  forecast: {
    direction: "up",
    invalidator:
      "NVDA's D-20→D-5 return ≤ 0 on 2 of the next 3 prints, or this spread exits below its cost",
  },
  option: {
    effect: "open",
    structure: "call-debit-spread",
    legs: [
      { occSymbol: LOW, side: "buy", ratio: 1 },
      { occSymbol: HIGH, side: "sell", ratio: 1 },
    ],
    limitPrice: 3.4,
    band: { low: 3.2, high: 3.6, at: "2026-10-07T14:30:00Z" },
  },
};

export const AT = Date.parse("2026-10-07T14:30:00Z");
export const filledRecord = {
  at: AT,
  personaId: "bot-sauron",
  mode: "live",
  rawIntents: [sold, spread],
  guardedIntents: [sold, spread],
  outcomes: [
    {
      intent: sold,
      action: "placed",
      result: {
        intent: sold,
        status: "filled",
        orderId: "opt-put-1",
        filledQuantity: 1,
        filledPrice: 2.12,
        legFills: [{ occSymbol: PUT, filledQuantity: 1, filledPrice: 2.12 }],
      },
    },
    {
      intent: spread,
      action: "placed",
      result: {
        intent: spread,
        status: "filled",
        orderId: "opt-spread-1",
        filledQuantity: 1,
        filledPrice: 3.35,
        legFills: [
          { occSymbol: LOW, filledQuantity: 1, filledPrice: 5.1 },
          { occSymbol: HIGH, filledQuantity: 1, filledPrice: 1.75 },
        ],
        // Each leg's own broker order id — what the account's two fills carry.
        legOrders: [
          { occSymbol: LOW, orderId: "opt-spread-leg-185" },
          { occSymbol: HIGH, orderId: "opt-spread-leg-200" },
        ],
      },
    },
  ],
};
