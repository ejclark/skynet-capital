// The fixed answers `trade.mjs` stubs for the account side of /app/trade (#3407): the desk, working
// orders, the reviewed option order and held-option positions (alerts live in
// `trade-alerts-fixture.mjs`). Split out of `trade.mjs` (scripts/arch-scan.mjs's code-line cap),
// moved verbatim — pure data. The mutable `current*` pointers the route handlers read stay in
// `trade.mjs`, which swaps these in.

export const desk = {
  generatedAt: "2026-09-05T00:00:00Z",
  desk: {
    id: "human-eric",
    name: "Eric",
    kind: "human",
    positions: [],
    tiles: {
      openPositions: 0,
      invested: "$0.00",
      dayPl: "$0.00",
      dayTone: "flat",
      unrealized: "$0.00",
      unrealizedNote: "no positions",
      unrealizedTone: "flat",
      cash: "$1,000,000.00",
    },
  },
};

// Working orders (#3407 P1 slice 2): the list a Limit was missing. Every scene but the one that
// proves it starts with nothing working — the honest empty line is itself part of every ticket
// frame now. The proving scene swaps in one GTC limit, one partial fill and two settled rows.
export const noOrders = { available: true, asOf: "2026-09-21T14:00:00Z", working: [], recent: [] };
export const workingOrders = {
  available: true,
  asOf: "2026-09-21T14:00:00Z",
  working: [
    {
      id: "wo-1",
      symbol: "NVDA",
      display: "NVDA",
      unit: "shares",
      side: "buy",
      orderType: "limit",
      quantity: 5,
      filledQuantity: 0,
      limitPrice: 176.5,
      timeInForce: "gtc",
      submittedAt: "2026-09-21T13:58:00Z",
      state: "working",
      cancelable: true,
      replaceable: true,
    },
    // An option order (P1 1b follow-up): the row names the contract, the drawer asks for Contracts.
    {
      id: "wo-5",
      symbol: "NVDA260925C00180000",
      display: "NVDA $180 CALL · Sep 25",
      unit: "contracts",
      side: "sell",
      orderType: "limit",
      quantity: 2,
      filledQuantity: 0,
      limitPrice: 4.1,
      timeInForce: "day",
      submittedAt: "2026-09-21T13:50:00Z",
      state: "working",
      cancelable: true,
      replaceable: true,
    },
    {
      id: "wo-2",
      symbol: "AAPL",
      display: "AAPL",
      unit: "shares",
      side: "sell",
      orderType: "limit",
      quantity: 10,
      filledQuantity: 4,
      limitPrice: 231.1,
      timeInForce: "day",
      submittedAt: "2026-09-21T13:41:00Z",
      state: "partial",
      cancelable: true,
      replaceable: true,
    },
  ],
  recent: [
    {
      id: "wo-3",
      symbol: "MU",
      side: "buy",
      orderType: "market",
      quantity: 20,
      filledQuantity: 20,
      avgFillPrice: 118.4,
      timeInForce: "day",
      submittedAt: "2026-09-21T13:20:00Z",
      settledAt: "2026-09-21T13:20:01Z",
      state: "filled",
      cancelable: false,
    },
    {
      id: "wo-4",
      symbol: "NVDA",
      side: "buy",
      orderType: "stop",
      quantity: 5,
      filledQuantity: 0,
      stopPrice: 190,
      timeInForce: "gtc",
      submittedAt: "2026-09-21T12:02:00Z",
      settledAt: "2026-09-21T13:05:00Z",
      state: "cancelled",
      cancelable: false,
    },
  ],
};
export const currentOptionReview = {
  preview: {
    code: "201",
    underlying: "NVDA",
    occSymbol: "NVDA261016P00175000",
    optionType: "put",
    side: "sell",
    positionIntent: "sell_to_open",
    contracts: 1,
    strike: 175,
    expiration: "2026-10-16",
    orderType: "limit",
    limitPrice: 1.5,
    timeInForce: "day",
    ok: true,
    estPremium: 1.5,
    estNotional: 150,
    collateral: 17_500,
    maxProfit: 150,
    maxLoss: 17_350,
    breakeven: 173.5,
    greeks: { delta: -0.31, gamma: 0.021, theta: -0.06, vega: 0.14 },
    impliedVol: 0.42,
    chanceOfProfit: 0.72,
    expectedValue: 18.4,
    // The at-expiration curve (#3407, the single-leg payoff diagram): a sold 175 put at $1.50 —
    // flat at the $150 credit above the strike, falling below the $173.50 breakeven, still
    // falling at the window's low edge (the chart says so; the max loss is the grid's $17,350).
    payoff: {
      from: 140,
      to: 210,
      breakevens: [173.5],
      points: [
        { price: 140, pnl: -3350 },
        { price: 150, pnl: -2350 },
        { price: 160, pnl: -1350 },
        { price: 170, pnl: -350 },
        { price: 173.5, pnl: 0 },
        { price: 175, pnl: 150 },
        { price: 190, pnl: 150 },
        { price: 210, pnl: 150 },
      ],
      // The T+0 and halfway lines the model draws at the reviewed IV (42%, 24 days): the put
      // still carries time value near the strike, so both sit under the expiration credit.
      dated: [
        {
          label: "today",
          daysForward: 0,
          points: [
            { price: 140, pnl: -3362 },
            { price: 150, pnl: -2420 },
            { price: 160, pnl: -1560 },
            { price: 170, pnl: -880 },
            { price: 173.5, pnl: -700 },
            { price: 175, pnl: -600 },
            { price: 190, pnl: -90 },
            { price: 210, pnl: 112 },
          ],
        },
        {
          label: "halfway",
          daysForward: 12,
          points: [
            { price: 140, pnl: -3351 },
            { price: 150, pnl: -2380 },
            { price: 160, pnl: -1440 },
            { price: 170, pnl: -680 },
            { price: 173.5, pnl: -490 },
            { price: 175, pnl: -380 },
            { price: 190, pnl: 60 },
            { price: 210, pnl: 146 },
          ],
        },
      ],
    },
    refusals: [],
    warnings: [],
  },
};
// Limit close (#3407 P1 slice 3): one held long put so the option positions card renders with
// its Market / Limit choice. Every other scene keeps the empty desk.
export const deskWithOption = {
  ...desk,
  desk: {
    ...desk.desk,
    positions: [
      {
        symbol: "MSFT260918P00420000",
        display: "MSFT $420 put · Sep 18",
        detail: "2 contracts",
        isOption: true,
        quantity: "2",
        costPerShare: "$10.70",
        price: "$12.00",
        costBasis: "$2,140.00",
        value: "$2,400.00",
        dayPl: "+$60.00",
        dayPct: "+2.5%",
        dayTone: "pos",
        totalPl: "+$260.00",
        totalPlRaw: 260,
        returnPct: "+12.1%",
        totalTone: "pos",
        weightPct: 3,
      },
    ],
  },
};
export const optionPositions = {
  available: true,
  asOf: "2026-09-21T14:00:00Z",
  representative: true,
  rows: [
    {
      symbol: "MSFT260918P00420000",
      display: "MSFT $420 put · Sep 18",
      underlying: "MSFT",
      type: "put",
      strike: 420,
      expiration: "2026-09-18",
      daysToExpiry: 17.25,
      contracts: 2,
      inTheMoney: true,
      spot: 410.2,
      greeks: { delta: -0.62, gamma: 0.018, theta: -0.21, vega: 0.34 },
      positionGreeks: { delta: -124, gamma: 3.6, theta: -42, vega: 68 },
      impliedVol: 0.29,
      bid: 11.9,
      ask: 12.1,
    },
  ],
  book: { delta: -124, gamma: 3.6, theta: -42, vega: 68, covered: 1, total: 1, uncovered: [] },
  // The book's delta weighted to SPY (#4327): MSFT's measured beta × its price ÷ SPY's.
  betaWeighted: {
    benchmark: "SPY",
    benchmarkPrice: 598.4,
    delta: -91.8, // −124 × 1.08 × $410.20 = −$54,934 ÷ $598.40
    dollarDelta: -54_934,
    weighted: { MSFT: { beta: 1.08, asOf: "2026-09-29" } },
    unweighted: {},
  },
};
