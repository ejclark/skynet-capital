// The /app/trade scene fixtures for the option lifecycle card and the multi-leg draft route
// (#3407) — split out of `trade.mjs` (scripts/arch-scan.mjs's code-line cap), moved verbatim:
// the expiry/assignment rows, the 2-lot NVDA credit spread's add → validate → review → confirm
// script, and the MSFT put roll. Pure data and builders; the mutable `current*` stub slots the
// route handlers read stay in `trade.mjs`, which assigns these into them.
import { lifecycleRows } from "../../src/server/option-lifecycle-view.ts";

// Expiries and assignments (#3407 slice 4) — the events that end a contract with no order behind
// them. The ROWS are built by the server's own view function rather than hand-written, so the
// frame proves the real sentences a member reads, including every "not counted in your realized
// P/L, because…" — the whole point of the card. One of each type: an expiry (counted), an
// assignment (counted for the contract, the shares called out), an exercise (never counted) and
// the share settlement that pairs with it (never counted).
const LIFECYCLE_AS_OF = "2026-09-21T14:00:00.000Z";
export const lifecycleAnswer = {
  available: true,
  asOf: LIFECYCLE_AS_OF,
  rows: lifecycleRows(
    [
      {
        id: "lc-1",
        type: "OPASN",
        symbol: "NVDA260918P00175000",
        quantity: 1,
        at: "2026-09-18T23:59:59.999Z",
      },
      {
        id: "lc-2",
        type: "OPTRD",
        symbol: "NVDA",
        quantity: 100,
        at: "2026-09-18T20:12:04.000Z",
        price: 175,
      },
      {
        id: "lc-3",
        type: "OPEXC",
        symbol: "MU260911C00120000",
        quantity: 2,
        at: "2026-09-11T23:59:59.999Z",
      },
      {
        id: "lc-4",
        type: "OPEXP",
        symbol: "NVDA260904C00200000",
        quantity: 3,
        at: "2026-09-04T23:59:59.999Z",
      },
    ],
    20,
  ),
  more: false,
};
export const noLifecycle = { available: true, asOf: LIFECYCLE_AS_OF, rows: [], more: false };

// A 2-lot NVDA 180/200 call credit spread walked add → validate → review → confirm, exactly the
// states `draft-order.ts` produces; the confirm answer is the route's own shape with the
// broker's echo (`executed: true`, order id, status, the working-orders note).
// The expiration is the one the `chain` fixture above is OPEN on (2026-09-09) — these legs are
// what tapping that chain produces, and the chain-reprice scene below needs the contract the stub
// claims to hold to be the contract a tap actually names (found 2026-10-01: the fixture said
// 2026-09-18, so a second tap on the same row read as a different contract).
const spreadLegs = [
  {
    id: "leg-1",
    underlying: "NVDA",
    optionType: "call",
    strike: 180,
    expiration: "2026-09-09",
    action: "sell",
    contracts: 2,
    limitPrice: 4.2,
  },
  {
    id: "leg-2",
    underlying: "NVDA",
    optionType: "call",
    strike: 200,
    expiration: "2026-09-09",
    action: "buy",
    contracts: 2,
    limitPrice: 1.1,
  },
];
const spreadPreview = {
  legCount: 2,
  pricedFully: true,
  netPremium: 620,
  maxGain: 620,
  maxLoss: 3380,
  unlimitedLoss: false,
  undefinedRiskLegIds: [],
  // The server-sampled at-expiration curve (#3407 payoff diagram): the credit below 180, the
  // capped loss above 200, breakeven at 183.10 — the same numbers the grid above it shows.
  payoff: {
    from: 144,
    to: 240,
    breakevens: [183.1],
    points: [
      { price: 144, pnl: 620 },
      { price: 180, pnl: 620 },
      { price: 183.1, pnl: 0 },
      { price: 200, pnl: -3380 },
      { price: 240, pnl: -3380 },
    ],
    // Today and halfway model lines (#3407 P4): each leg's IV solved from its own premium, so
    // the credit spread's T+0 line sits under the full credit near the short strike and above
    // the capped loss near the long one.
    dated: [
      {
        label: "today",
        daysForward: 0,
        points: [
          { price: 144, pnl: 560 },
          { price: 165, pnl: 380 },
          { price: 180, pnl: -160 },
          { price: 183.1, pnl: -340 },
          { price: 200, pnl: -1420 },
          { price: 220, pnl: -2560 },
          { price: 240, pnl: -3100 },
        ],
      },
      {
        label: "halfway",
        daysForward: 12,
        points: [
          { price: 144, pnl: 610 },
          { price: 165, pnl: 520 },
          { price: 180, pnl: 60 },
          { price: 183.1, pnl: -260 },
          { price: 200, pnl: -1980 },
          { price: 220, pnl: -3080 },
          { price: 240, pnl: -3340 },
        ],
      },
    ],
  },
};
const spreadVerdict = { ok: true, refusals: [], warnings: [] };
const spreadDraft = (phase, extra = {}) => ({
  draft: { phase, legs: spreadLegs, refusals: [], nextLegId: 3, ...extra },
  preview: spreadPreview,
});
export const draftSent = {
  ...spreadDraft("submitted", { verdict: spreadVerdict }),
  executed: true,
  orderId: "7c1e2b9a-mleg",
  status: "accepted",
  timeInForce: "gtc",
  note: "Order 7c1e2b9a-mleg accepted — one net limit, filled together or not at all. Working orders picks it up on the next read.",
};
// The roll (#3407 P3 slice 3): the MSFT $420 put rolled out to Oct 16 — two legs, one draft,
// answered through the same route in the same order the roll row calls it.
export const rollLegs = [
  {
    id: "leg-1",
    underlying: "MSFT",
    optionType: "put",
    strike: 420,
    expiration: "2026-09-18",
    action: "sell",
    contracts: 2,
    limitPrice: 12,
  },
  {
    id: "leg-2",
    underlying: "MSFT",
    optionType: "put",
    strike: 420,
    expiration: "2026-10-16",
    action: "buy",
    contracts: 2,
    limitPrice: 14.1,
  },
];
const rollPreview = {
  legCount: 2,
  pricedFully: true,
  netPremium: -420,
  maxGain: "uncapped",
  maxLoss: 420,
  unlimitedLoss: false,
  undefinedRiskLegIds: [],
};
export const rollDraft = (phase, legs = rollLegs, extra = {}) => ({
  draft: { phase, legs, refusals: [], nextLegId: legs.length + 1, ...extra },
  preview: rollPreview,
});
export const rollScript = [
  rollDraft("drafting", rollLegs.slice(0, 1)),
  rollDraft("drafting"),
  rollDraft("validated", rollLegs, { verdict: { ok: true, refusals: [], warnings: [] } }),
  rollDraft("reviewed", rollLegs, { verdict: { ok: true, refusals: [], warnings: [] } }),
];
export const draftScript = [
  { draft: { phase: "drafting", legs: spreadLegs.slice(0, 1), refusals: [], nextLegId: 2 } },
  // The reprice (#3407 P3 slice 4): the first leg typed over to $4.35, echoed by the server.
  {
    draft: {
      phase: "drafting",
      legs: [{ ...spreadLegs[0], limitPrice: 4.35 }],
      refusals: [],
      nextLegId: 2,
    },
  },
  // Reprice FROM THE CHAIN (#3407, the banked "reprice from a chain row"): the 180 bid tapped a
  // second time puts leg-1 on the chain's own bid ($2.52, the fixture's 180 row) — a `reprice-leg`
  // post, not the duplicate add the state machine used to refuse where nobody could see the refusal.
  {
    draft: {
      phase: "drafting",
      legs: [{ ...spreadLegs[0], limitPrice: 2.52 }],
      refusals: [],
      nextLegId: 2,
    },
  },
  spreadDraft("drafting"),
  spreadDraft("validated", { verdict: spreadVerdict }),
  spreadDraft("reviewed", { verdict: spreadVerdict }),
  draftSent,
];
